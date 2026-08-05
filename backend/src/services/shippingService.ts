import crypto from 'crypto';
import { prisma } from '../prisma/client';
import { sendWahaNotification } from './wahaService';

// ============================================================
// Shipping Service — Business logic for all shipping types
// ============================================================

// Haversine distance calculation (km)
export function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 2.5;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calculate internal shipping fee: baseFee + (distance × feePerKm)
export function calculateInternalShippingFee(
  storeLat: number, storeLon: number,
  userLat: number, userLon: number,
  baseFee: number, feePerKm: number
): { fee: number; distanceKm: number } {
  const distanceKm = calculateHaversineDistance(storeLat, storeLon, userLat, userLon);
  const fee = Math.round(baseFee + (distanceKm * feePerKm));
  return { fee, distanceKm };
}

// Check if user is within COD zone
export function isWithinCodZone(
  storeLat: number, storeLon: number,
  userLat: number, userLon: number,
  maxRadiusKm: number
): { withinZone: boolean; distanceKm: number } {
  const distanceKm = calculateHaversineDistance(storeLat, storeLon, userLat, userLon);
  return { withinZone: distanceKm <= maxRadiusKm, distanceKm };
}

// ============================================================
// Self-Pickup: Generate unique pickup code + QR data
// ============================================================

export function generatePickupCode(): { pin: string; qrData: string } {
  // 6-digit numeric PIN
  const pin = crypto.randomInt(100000, 999999).toString();
  // QR data: JSON string with verification info
  const qrData = JSON.stringify({
    type: 'pickup_verify',
    code: pin,
    ts: Date.now(),
  });
  return { pin, qrData };
}

export async function validatePickupCode(orderId: string, code: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.shippingType !== 'pickup') return false;
  return order.pickupCode === code;
}

// ============================================================
// COD: OTP Generation & Verification via WhatsApp
// ============================================================

export async function generateCodOtp(orderId: string, phone: string): Promise<string> {
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert verification record
  await prisma.codVerification.upsert({
    where: { orderId },
    create: { orderId, phone, otpCode, expiresAt },
    update: { otpCode, expiresAt, verified: false },
  });

  // Send OTP via WhatsApp
  const message =
    `🔐 *Kode Verifikasi COD*\n\n` +
    `Kode OTP Anda: *${otpCode}*\n\n` +
    `Kode ini berlaku selama 10 menit.\n` +
    `Jangan bagikan kode ini kepada siapapun.\n\n` +
    `— OrganikStore`;

  try {
    await sendWahaNotification({ phone, message });
  } catch (err: any) {
    console.warn('[ShippingService] Failed to send COD OTP via WhatsApp:', err.message);
  }

  return otpCode;
}

export async function verifyCodOtp(orderId: string, otpCode: string): Promise<boolean> {
  const verification = await prisma.codVerification.findUnique({ where: { orderId } });
  if (!verification) return false;
  if (verification.verified) return true; // Already verified
  if (new Date() > verification.expiresAt) return false; // Expired
  if (verification.otpCode !== otpCode) return false;

  // Mark as verified
  await prisma.codVerification.update({
    where: { orderId },
    data: { verified: true },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { codVerified: true },
  });

  return true;
}

// ============================================================
// Scheduled Delivery: Slot availability
// ============================================================

export async function getAvailableSlots(
  shippingOptionId: string,
  date?: string // YYYY-MM-DD
): Promise<any[]> {
  const shippingOption = await prisma.shippingOption.findUnique({
    where: { id: shippingOptionId },
    include: { scheduleSlots: { where: { isActive: true } } },
  });

  if (!shippingOption) return [];

  const slots = shippingOption.scheduleSlots;

  if (shippingOption.scheduleMode === 'admin_defined') {
    // Filter by day of week if date provided
    if (date) {
      const dayOfWeek = new Date(date).getDay(); // 0=Sun, 6=Sat
      return slots.filter(s => s.dayOfWeek === null || s.dayOfWeek === dayOfWeek);
    }
    return slots;
  }

  // user_request mode: return all active slots (user picks date, then slot)
  // Count existing orders for the slot on the given date
  if (date) {
    const slotsWithAvailability = await Promise.all(
      slots.map(async (slot) => {
        const orderCount = await prisma.order.count({
          where: {
            scheduledDate: date,
            scheduledSlot: `${slot.startTime}-${slot.endTime}`,
            orderStatus: { notIn: ['cancelled'] },
          },
        });
        return {
          ...slot,
          currentOrders: orderCount,
          available: orderCount < slot.maxOrders,
        };
      })
    );
    return slotsWithAvailability;
  }

  return slots;
}

// ============================================================
// WhatsApp Notifications for shipping events
// ============================================================

export async function sendShippingNotification(
  phone: string,
  type: 'pickup_ready' | 'scheduled_reminder' | 'delivering' | 'delivered',
  data: Record<string, any>
): Promise<void> {
  let message = '';

  switch (type) {
    case 'pickup_ready':
      message =
        `✅ *Pesanan Siap Diambil!*\n\n` +
        `Pesanan #${data.orderNo} sudah siap.\n` +
        `📍 Lokasi: ${data.locationName}\n` +
        `📋 Kode Pengambilan: *${data.pickupCode}*\n\n` +
        `Tunjukkan kode ini saat mengambil pesanan.\n` +
        `— OrganikStore`;
      break;

    case 'scheduled_reminder':
      message =
        `⏰ *Pengingat Pengiriman Terjadwal*\n\n` +
        `Pesanan #${data.orderNo} dijadwalkan dikirim:\n` +
        `📅 ${data.scheduledDate}\n` +
        `🕐 ${data.scheduledSlot}\n\n` +
        `Pastikan ada yang menerima di alamat pengiriman.\n` +
        `— OrganikStore`;
      break;

    case 'delivering':
      message =
        `🚚 *Pesanan Sedang Diantar!*\n\n` +
        `Pesanan #${data.orderNo} sedang dalam perjalanan.\n` +
        (data.driverName ? `👤 Kurir: ${data.driverName}\n` : '') +
        (data.driverPhone ? `📞 ${data.driverPhone}\n` : '') +
        (data.trackingUrl ? `📍 Lacak: ${data.trackingUrl}\n` : '') +
        `\n— OrganikStore`;
      break;

    case 'delivered':
      message =
        `🎉 *Pesanan Telah Diterima!*\n\n` +
        `Pesanan #${data.orderNo} telah selesai.\n` +
        `Terima kasih telah berbelanja di OrganikStore! 🌿\n` +
        `— OrganikStore`;
      break;
  }

  if (message) {
    try {
      await sendWahaNotification({ phone, message });
    } catch (err: any) {
      console.warn(`[ShippingService] Failed to send ${type} notification:`, err.message);
    }
  }
}
