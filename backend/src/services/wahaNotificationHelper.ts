import { prisma } from '../prisma/client';
import { sendWahaNotification, sendWahaImage } from './wahaService';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

/**
 * Send WhatsApp notification when order payment is confirmed paid
 */
export async function notifyOrderPaid(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        pickupLocation: true,
      },
    });

    if (!order || !order.customerPhone) {
      console.warn(`[WAHA Notify] Cannot notify paid order: Order #${orderId} or phone missing.`);
      return false;
    }

    let itemsParsed: any[] = [];
    try {
      itemsParsed = JSON.parse(order.itemsJson || '[]');
    } catch {
      itemsParsed = [];
    }

    const itemsText = itemsParsed
      .map((it: any) => `• *${it.productName || it.name}* x ${it.quantity} (${formatCurrency(it.price)})`)
      .join('\n');

    const shippingLabels: Record<string, string> = {
      pickup: 'Self-Pickup (Ambil di Toko)',
      instant: 'Kurir Instan Toko / Ekspedisi',
      scheduled: 'Pengiriman Terjadwal',
      cod: 'Cash on Delivery (COD)',
    };
    const deliveryLabel = shippingLabels[order.shippingType || 'instant'] || 'Pengiriman Instan';

    const message =
      `Halo Kak *${order.customerName}*! Terima kasih telah berbelanja di WaroengKita! 🛒\n\n` +
      `Pesanan Anda dengan nomor *#${order.orderNo}* telah berhasil dibayar. 🎉\n\n` +
      `📋 *Rincian Pesanan:*\n` +
      `- No. Pesanan: *#${order.orderNo}*\n` +
      `- Tanggal: ${order.orderDate}, ${order.orderTime}\n` +
      `- Metode Pembayaran: *${order.paymentMethod}*\n` +
      `- Total Pembayaran: *${formatCurrency(order.totalPrice)}*\n` +
      `- Jenis Pengiriman: *${deliveryLabel}*\n\n` +
      `📦 *Daftar Produk:*\n` +
      `${itemsText || '• Produk Pesanan'}\n\n` +
      `Tim kami sedang menyiapkan dan mengemas produk pesanan Anda. Terima kasih atas kepercayaan Anda! 🙏`;

    console.log(`[WAHA Notify] Triggering Paid Notification for Order #${order.orderNo} to ${order.customerPhone}`);
    return await sendWahaNotification({ phone: order.customerPhone, message });
  } catch (error: any) {
    console.error('[WAHA Notify Error] notifyOrderPaid failed:', error?.message);
    return false;
  }
}

/**
 * Send WhatsApp notification when order status changes (processing, ready, delivering, completed)
 */
export async function notifyOrderStatusChanged(orderId: string, newStatus: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        pickupLocation: true,
      },
    });

    if (!order || !order.customerPhone) {
      console.warn(`[WAHA Notify] Cannot notify status change: Order #${orderId} or phone missing.`);
      return false;
    }

    const phone = order.customerPhone;
    const status = newStatus.toLowerCase();

    // 1. Status: Processing / Ready
    if (status === 'processing' || status === 'dikemas' || status === 'ready') {
      const message =
        `Halo Kak *${order.customerName}*! 📦\n\n` +
        `Pesanan Anda *#${order.orderNo}* kini berstatus: *SIAP DIKIRIM / DIPROSES*.\n` +
        `Tim toko kami telah selesai mengemas produk pesanan Anda dengan segar dan rapi.\n\n` +
        `Terima kasih atas kesabaran Anda! 🌿`;

      return await sendWahaNotification({ phone, message });
    }

    // 2. Status: Delivering (Dalam Pengiriman / Siap Diambil)
    if (status === 'delivering' || status === 'dikirim') {
      if (order.shippingType === 'pickup') {
        const pickupLoc = order.pickupLocation;
        const storeName = pickupLoc?.name || order.store?.name || 'Toko Utama';
        const storeAddress = pickupLoc?.address || order.store?.address || 'Alamat Toko';
        const storePhone = pickupLoc?.phone || order.store?.phone || '';
        const operatingHours = pickupLoc?.operatingHours || '08:00 - 21:00';
        const storeLat = pickupLoc?.latitude || order.store?.latitude || -6.2088;
        const storeLon = pickupLoc?.longitude || order.store?.longitude || 106.8456;

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${storeLat},${storeLon}`;
        const pickupCode = order.pickupCode || `PKUP-${order.orderNo}`;
        const qrData = order.pickupQrData || pickupCode;

        const pickupMessage =
          `Halo Kak *${order.customerName}*! 🛍️\n\n` +
          `Pesanan Self-Pickup Anda *#${order.orderNo}* kini sudah *SIAP DIAMBIL* di lokasi toko! 🎉\n\n` +
          `📍 *Informasi Lokasi Pengambilan Toko:*\n` +
          `- Nama Toko: *${storeName}*\n` +
          `- Alamat Toko: ${storeAddress}\n` +
          `${storePhone ? `- No. WA Toko: ${storePhone}\n` : ''}` +
          `- Jam Operasional: ${operatingHours}\n\n` +
          `🗺️ *Navigasi Rute Google Maps:*\n` +
          `${googleMapsUrl}\n\n` +
          `🔑 *Kode Pickup:* *${pickupCode}*\n` +
          `Silakan tunjukkan Kode Pickup di atas atau QR Code yang dilampirkan kepada kasir/admin toko saat mengambil pesanan.\n\n` +
          `Terima kasih! Kami menantikan kedatangan Anda! 🌿`;

        // Send Text Notification
        await sendWahaNotification({ phone, message: pickupMessage });

        // Send QR Code Image Notification
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;
        console.log(`[WAHA Notify] Sending Pickup QR Code Image for Order #${order.orderNo} to ${phone}`);
        return await sendWahaImage({
          phone,
          imageUrl: qrImageUrl,
          caption: `QR Code Pickup Pesanan #${order.orderNo} (Kode: ${pickupCode})`,
        });
      } else {
        const message =
          `Halo Kak *${order.customerName}*! 🛵\n\n` +
          `Pesanan Anda *#${order.orderNo}* kini berstatus: *DALAM PENGIRIMAN*.\n` +
          `Kurir sedang dalam perjalanan menuju alamat pengiriman Anda.\n` +
          `${order.trackingNumber ? `No. Resi / Tracking: *${order.trackingNumber}*\n` : ''}\n` +
          `Mohon pastikan Anda dapat dihubungi saat kurir tiba. Terima kasih! 🌿`;

        return await sendWahaNotification({ phone, message });
      }
    }

    // 3. Status: Completed / Selesai
    if (status === 'completed' || status === 'selesai') {
      const message =
        `Halo Kak *${order.customerName}*! ✅\n\n` +
        `Pesanan Anda *#${order.orderNo}* telah *SELESAI*.\n` +
        `Terima kasih banyak telah berbelanja di WaroengKita. Semoga Anda puas dengan kualitas produk kami! 🛒😊`;

      return await sendWahaNotification({ phone, message });
    }

    return false;
  } catch (error: any) {
    console.error('[WAHA Notify Error] notifyOrderStatusChanged failed:', error?.message);
    return false;
  }
}
