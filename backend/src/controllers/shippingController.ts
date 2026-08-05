import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import {
  getRates,
  createCourierOrder,
  trackCourierOrder,
  isBiteshipConfigured,
} from '../services/biteshipService';
import {
  calculateInternalShippingFee,
  calculateHaversineDistance,
  isWithinCodZone,
  generatePickupCode,
  validatePickupCode,
  generateCodOtp,
  verifyCodOtp,
  getAvailableSlots,
  sendShippingNotification,
} from '../services/shippingService';

// ============================================================
// Shipping Controller — All shipping-related endpoints
// ============================================================

/**
 * POST /api/shipping/rates
 * Cek ongkir: Biteship (GoSend/Grab) + Internal kurir
 * Request body: { storeId, userLat, userLon, items[] }
 */
export const getShippingRates = async (req: Request, res: Response) => {
  try {
    const { storeId, userLat, userLon, items } = req.body;

    if (!storeId || userLat === undefined || userLon === undefined) {
      return res.status(400).json({
        success: false,
        message: 'storeId, userLat, dan userLon wajib diisi.',
      });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Toko tidak ditemukan.' });
    }

    const distanceKm = calculateHaversineDistance(
      store.latitude, store.longitude,
      parseFloat(userLat), parseFloat(userLon)
    );

    // Get all active shipping options for this store
    const shippingOptions = await prisma.shippingOption.findMany({
      where: {
        OR: [{ storeId }, { storeId: null }],
        isActive: true,
      },
      include: {
        scheduleSlots: { where: { isActive: true } },
      },
    });

    const results: any[] = [];

    for (const option of shippingOptions) {
      const baseResult = {
        id: option.id,
        code: option.code,
        name: option.name,
        type: option.type,
        courier: option.courier,
        estimatedTime: option.estimatedTime,
        isActive: option.isActive,
        distanceKm,
      };

      switch (option.type) {
        case 'instant': {
          // Calculate internal fee
          const internalFee = calculateInternalShippingFee(
            store.latitude, store.longitude,
            parseFloat(userLat), parseFloat(userLon),
            option.baseFee, option.feePerKm
          );

          // Calculate total package weight in grams
          const totalWeightInGrams = (items || []).reduce(
            (sum: number, i: any) => sum + (parseInt(i.weightInGrams || i.weight || 500) * parseInt(i.quantity || 1)),
            0
          );

          // Fetch active Biteship courier configurations
          let activeBiteshipCouriers = await prisma.biteshipCourier.findMany({
            where: { isActive: true },
          });

          if (activeBiteshipCouriers.length === 0) {
            const hasAny = await prisma.biteshipCourier.count();
            if (hasAny === 0) {
              for (const item of DEFAULT_BITESHIP_COURIERS) {
                await prisma.biteshipCourier.upsert({
                  where: {
                    courierCode_serviceCode: {
                      courierCode: item.courierCode,
                      serviceCode: item.serviceCode,
                    },
                  },
                  update: item,
                  create: item,
                });
              }
              activeBiteshipCouriers = await prisma.biteshipCourier.findMany({ where: { isActive: true } });
            }
          }

          const maxAllowedWeightGrams = Math.max(
            ...activeBiteshipCouriers.map((c) => c.maxWeightKg * 1000),
            5000
          );

          const result: any = {
            ...baseResult,
            internalFee: internalFee.fee,
            baseFee: option.baseFee,
            feePerKm: option.feePerKm,
            totalWeightInGrams,
            exceedsWeightLimit: totalWeightInGrams > maxAllowedWeightGrams,
            biteshipRates: [],
          };

          if (isBiteshipConfigured() && activeBiteshipCouriers.length > 0) {
            try {
              const biteshipItems = (items || []).map((i: any) => ({
                name: String(i.name || 'Produk').substring(0, 50),
                value: Math.round(i.price || i.value || 10000),
                weight: parseInt(i.weightInGrams || i.weight || 500),
                quantity: parseInt(i.quantity || 1),
              }));

              if (biteshipItems.length === 0) {
                biteshipItems.push({
                  name: 'Paket Belanja',
                  value: 50000,
                  weight: 1000,
                  quantity: 1,
                });
              }

              const ratesResult = await getRates({
                origin_latitude: store.latitude,
                origin_longitude: store.longitude,
                destination_latitude: parseFloat(userLat),
                destination_longitude: parseFloat(userLon),
                couriers: 'gosend,grab',
                items: biteshipItems,
              });

              const rawRates = ratesResult?.pricing || ratesResult?.couriers || [];
              const filteredRates: any[] = [];

              for (const c of rawRates) {
                const rawC = c as any;
                const courierCode = (rawC.courier_code || rawC.company || '').toLowerCase();
                const serviceCode = (rawC.courier_service_code || rawC.type || '').toLowerCase();

                const matchedActiveConfig = activeBiteshipCouriers.find(
                  (ac) =>
                    ac.courierCode.toLowerCase() === courierCode &&
                    ac.serviceCode.toLowerCase() === serviceCode
                );

                if (matchedActiveConfig) {
                  const maxWeightGrams = matchedActiveConfig.maxWeightKg * 1000;
                  if (totalWeightInGrams <= maxWeightGrams) {
                    filteredRates.push({
                      courierName: matchedActiveConfig.courierName,
                      courierCode: matchedActiveConfig.courierCode,
                      serviceName: matchedActiveConfig.serviceName,
                      serviceCode: matchedActiveConfig.serviceCode,
                      description: matchedActiveConfig.description || rawC.description,
                      price: rawC.price || rawC.shipping_fee || 0,
                      duration: matchedActiveConfig.shipmentDuration || rawC.shipment_duration_range || '1-3 jam',
                      durationUnit: rawC.shipment_duration_unit || 'hours',
                      type: rawC.type || serviceCode,
                      availableCashOnDelivery: matchedActiveConfig.availableCashOnDelivery,
                      maxWeightKg: matchedActiveConfig.maxWeightKg,
                    });
                  }
                }
              }

              result.biteshipRates = filteredRates;
            } catch (err: any) {
              console.warn('[Shipping] Biteship rates fetch failed:', err.message);
            }
          }

          results.push(result);
          break;
        }

        case 'pickup': {
          // Get pickup locations for this store
          const pickupLocations = await prisma.pickupLocation.findMany({
            where: { storeId, isActive: true },
          });

          results.push({
            ...baseResult,
            fee: option.pickupFee,
            pickupLocations,
          });
          break;
        }

        case 'scheduled': {
          const fee = calculateInternalShippingFee(
            store.latitude, store.longitude,
            parseFloat(userLat), parseFloat(userLon),
            option.baseFee, option.feePerKm
          );

          results.push({
            ...baseResult,
            fee: fee.fee,
            baseFee: option.baseFee,
            feePerKm: option.feePerKm,
            scheduleMode: option.scheduleMode,
            scheduleSlots: option.scheduleSlots,
          });
          break;
        }

        case 'cod': {
          const codCheck = isWithinCodZone(
            store.latitude, store.longitude,
            parseFloat(userLat), parseFloat(userLon),
            option.maxRadiusKm
          );

          const fee = calculateInternalShippingFee(
            store.latitude, store.longitude,
            parseFloat(userLat), parseFloat(userLon),
            option.baseFee, option.feePerKm
          );

          results.push({
            ...baseResult,
            fee: fee.fee,
            baseFee: option.baseFee,
            feePerKm: option.feePerKm,
            maxRadiusKm: option.maxRadiusKm,
            withinCodZone: codCheck.withinZone,
          });
          break;
        }

        default:
          results.push({ ...baseResult, fee: option.baseFee });
      }
    }

    return res.json({
      success: true,
      data: {
        distanceKm,
        storeLat: store.latitude,
        storeLon: store.longitude,
        options: results,
      },
    });
  } catch (error: any) {
    console.error('[Shipping] getShippingRates error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/shipping/book
 * Book courier via Biteship (for instant delivery)
 */
export const bookCourier = async (req: AuthRequest, res: Response) => {
  try {
    const {
      orderId,
      courierCompany,
      courierType,
    } = req.body;

    if (!orderId || !courierCompany) {
      return res.status(400).json({
        success: false,
        message: 'orderId dan courierCompany wajib diisi.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (!isBiteshipConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Biteship API belum dikonfigurasi.',
      });
    }

    let itemsParsed: any[] = [];
    try { itemsParsed = JSON.parse(order.itemsJson || '[]'); } catch {}

    const biteshipItems = itemsParsed.map((i: any) => ({
      name: String(i.productName || i.name || 'Produk').substring(0, 50),
      value: Math.round(i.price || 10000),
      weight: i.weight || 500,
      quantity: i.quantity || 1,
    }));

    if (biteshipItems.length === 0) {
      biteshipItems.push({ name: 'Paket Belanja', value: 50000, weight: 1000, quantity: 1 });
    }

    // Parse destination coordinates from address or use default
    const addressParts = order.shippingAddress.split(',');

    const result = await createCourierOrder({
      origin_contact_name: order.store?.name || 'OrganikStore',
      origin_contact_phone: order.store?.phone || '081234567890',
      origin_address: order.store?.address || '',
      origin_coordinate: {
        latitude: order.store?.latitude || -6.225,
        longitude: order.store?.longitude || 106.8,
      },
      destination_contact_name: order.customerName,
      destination_contact_phone: order.customerPhone,
      destination_address: order.shippingAddress,
      destination_coordinate: {
        latitude: -6.225, // Will be replaced with actual coords
        longitude: 106.8,
      },
      courier_company: courierCompany,
      courier_type: courierType || 'instant',
      delivery_type: 'now',
      order_note: `Pesanan #${order.orderNo}`,
      items: biteshipItems,
    });

    // Update order with Biteship data
    await prisma.order.update({
      where: { id: orderId },
      data: {
        biteshipOrderId: result.id,
        biteshipTrackingUrl: result.courier?.link || null,
        biteshipWaybillId: result.courier?.waybill_id || null,
        driverName: result.courier?.driver_name || null,
        driverPhone: result.courier?.driver_phone || null,
        driverPlate: result.courier?.driver_plate_number || null,
        orderStatus: 'delivering',
      },
    });

    return res.json({
      success: true,
      message: 'Kurir berhasil di-booking via Biteship!',
      data: {
        biteshipOrderId: result.id,
        trackingUrl: result.courier?.link,
        waybillId: result.courier?.waybill_id,
        driverName: result.courier?.driver_name,
        driverPhone: result.courier?.driver_phone,
        price: result.price,
        status: result.status,
      },
    });
  } catch (error: any) {
    console.error('[Shipping] bookCourier error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/shipping/track/:orderId
 * Get tracking info (from Biteship or internal)
 */
export const getTracking = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const trackingData: any = {
      orderNo: order.orderNo,
      orderStatus: order.orderStatus,
      shippingType: order.shippingType,
      driverName: order.driverName,
      driverPhone: order.driverPhone,
      driverPlate: order.driverPlate,
      trackingUrl: order.biteshipTrackingUrl,
      waybillId: order.biteshipWaybillId,
    };

    // If Biteship order exists, fetch live tracking
    if (order.biteshipOrderId && isBiteshipConfigured()) {
      try {
        const biteshipData = await trackCourierOrder(order.biteshipOrderId);
        trackingData.biteshipStatus = biteshipData.status;
        trackingData.biteshipHistory = biteshipData.courier?.history || [];
        trackingData.driverName = biteshipData.courier?.driver_name || order.driverName;
        trackingData.driverPhone = biteshipData.courier?.driver_phone || order.driverPhone;
      } catch (err: any) {
        console.warn('[Shipping] Biteship tracking failed, using cached data:', err.message);
      }
    }

    // Self-pickup specific data
    if (order.shippingType === 'pickup') {
      trackingData.pickupCode = order.pickupCode;
      trackingData.pickupStatus = order.pickupStatus;
      trackingData.pickupLocationId = order.pickupLocationId;
    }

    // Scheduled specific data
    if (order.shippingType === 'scheduled') {
      trackingData.scheduledDate = order.scheduledDate;
      trackingData.scheduledSlot = order.scheduledSlot;
    }

    return res.json({ success: true, data: trackingData });
  } catch (error: any) {
    console.error('[Shipping] getTracking error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/shipping/pickup/validate
 * Validate pickup code (staff scans/enters code)
 */
export const validatePickup = async (req: Request, res: Response) => {
  try {
    const { orderId, code } = req.body;

    if (!orderId || !code) {
      return res.status(400).json({
        success: false,
        message: 'orderId dan code wajib diisi.',
      });
    }

    const isValid = await validatePickupCode(orderId, code);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Kode pengambilan tidak valid.',
      });
    }

    // Update order to completed
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        pickupStatus: 'picked_up',
        orderStatus: 'completed',
      },
    });

    return res.json({
      success: true,
      message: `Pesanan #${order.orderNo} berhasil diambil!`,
      data: order,
    });
  } catch (error: any) {
    console.error('[Shipping] validatePickup error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/shipping/pickup/:orderId/ready
 * Mark order as ready for pickup
 */
export const markPickupReady = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        pickupStatus: 'ready',
        orderStatus: 'ready',
      },
    });

    // Send WhatsApp notification
    if (order.customerPhone) {
      const pickupLocation = order.pickupLocationId
        ? await prisma.pickupLocation.findUnique({ where: { id: order.pickupLocationId } })
        : null;

      await sendShippingNotification(order.customerPhone, 'pickup_ready', {
        orderNo: order.orderNo,
        pickupCode: order.pickupCode,
        locationName: pickupLocation?.name || 'Toko',
      });
    }

    return res.json({
      success: true,
      message: `Pesanan #${order.orderNo} siap diambil! Notifikasi telah dikirim.`,
      data: order,
    });
  } catch (error: any) {
    console.error('[Shipping] markPickupReady error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/shipping/schedule/slots?shippingOptionId=xxx&date=2026-08-10
 */
export const getScheduleSlots = async (req: Request, res: Response) => {
  try {
    const { shippingOptionId, date } = req.query;
    if (!shippingOptionId) {
      return res.status(400).json({
        success: false,
        message: 'shippingOptionId wajib diisi.',
      });
    }

    const slots = await getAvailableSlots(
      String(shippingOptionId),
      date ? String(date) : undefined
    );

    return res.json({ success: true, data: slots });
  } catch (error: any) {
    console.error('[Shipping] getScheduleSlots error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/shipping/cod/send-otp
 * Send COD OTP verification to WhatsApp
 */
export const sendCodOtp = async (req: Request, res: Response) => {
  try {
    const { orderId, phone } = req.body;
    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'orderId dan phone wajib diisi.',
      });
    }

    const otpCode = await generateCodOtp(orderId, phone);

    return res.json({
      success: true,
      message: 'OTP telah dikirim ke WhatsApp Anda.',
      data: { sent: true },
    });
  } catch (error: any) {
    console.error('[Shipping] sendCodOtp error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/shipping/cod/verify-otp
 */
export const verifyCodOtpEndpoint = async (req: Request, res: Response) => {
  try {
    const { orderId, otp } = req.body;
    if (!orderId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'orderId dan otp wajib diisi.',
      });
    }

    const isValid = await verifyCodOtp(orderId, otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Kode OTP tidak valid atau sudah kadaluarsa.',
      });
    }

    return res.json({
      success: true,
      message: 'Verifikasi COD berhasil!',
      data: { verified: true },
    });
  } catch (error: any) {
    console.error('[Shipping] verifyCodOtp error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/shipping/cod/cash-records?storeId=xxx
 * Get courier cash records for COD orders
 */
export const getCodCashRecords = async (req: Request, res: Response) => {
  try {
    const { storeId, status } = req.query;

    const where: any = {};
    if (storeId) where.storeId = String(storeId);
    if (status) where.status = String(status);

    const records = await prisma.courierCashRecord.findMany({
      where,
      include: {
        order: {
          select: { orderNo: true, totalPrice: true, customerName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const holdingTotal = records
      .filter(r => r.status === 'HOLDING')
      .reduce((sum, r) => sum + r.cashAmount, 0);
    const depositedTotal = records
      .filter(r => r.status === 'DEPOSITED')
      .reduce((sum, r) => sum + r.cashAmount, 0);

    return res.json({
      success: true,
      data: {
        records,
        summary: { holdingTotal, depositedTotal, totalRecords: records.length },
      },
    });
  } catch (error: any) {
    console.error('[Shipping] getCodCashRecords error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/shipping/cod/deposit
 * Record courier cash deposit
 */
export const recordCodDeposit = async (req: Request, res: Response) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: 'recordId wajib diisi.',
      });
    }

    const record = await prisma.courierCashRecord.update({
      where: { id: recordId },
      data: {
        status: 'DEPOSITED',
        depositedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Setoran kurir berhasil dicatat.',
      data: record,
    });
  } catch (error: any) {
    console.error('[Shipping] recordCodDeposit error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Biteship Webhook Handler
// ============================================================

/**
 * POST /api/webhook/biteship
 * Handle Biteship order status updates
 */
export const handleBiteshipWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;

    console.log('[Biteship Webhook] Received:', JSON.stringify(event).substring(0, 500));

    if (event.event === 'order.status') {
      const { id: biteshipOrderId, status, courier_waybill_id } = event;

      // Find our order by biteshipOrderId
      const order = await prisma.order.findFirst({
        where: { biteshipOrderId },
      });

      if (!order) {
        console.warn('[Biteship Webhook] Order not found for biteship ID:', biteshipOrderId);
        return res.status(200).send('OK');
      }

      // Map Biteship status to our order status
      const statusMap: Record<string, string> = {
        confirmed: 'processing',
        allocated: 'processing',
        picking_up: 'processing',
        picked: 'delivering',
        dropping_off: 'delivering',
        delivered: 'completed',
        rejected: 'cancelled',
        cancelled: 'cancelled',
        courier_not_found: 'ready',
        returned: 'cancelled',
        on_hold: 'processing',
      };

      const newStatus = statusMap[status] || order.orderStatus;

      const updateData: any = { orderStatus: newStatus };
      if (courier_waybill_id) updateData.biteshipWaybillId = courier_waybill_id;
      if (event.courier?.driver_name) updateData.driverName = event.courier.driver_name;
      if (event.courier?.driver_phone) updateData.driverPhone = event.courier.driver_phone;
      if (event.courier?.driver_plate_number) updateData.driverPlate = event.courier.driver_plate_number;

      await prisma.order.update({ where: { id: order.id }, data: updateData });

      // Send WhatsApp notification on key events
      if (status === 'picked' || status === 'dropping_off') {
        await sendShippingNotification(order.customerPhone, 'delivering', {
          orderNo: order.orderNo,
          driverName: event.courier?.driver_name,
          driverPhone: event.courier?.driver_phone,
          trackingUrl: order.biteshipTrackingUrl,
        });
      } else if (status === 'delivered') {
        await sendShippingNotification(order.customerPhone, 'delivered', {
          orderNo: order.orderNo,
        });
      }

      console.log(`[Biteship Webhook] Order ${order.orderNo} updated: ${status} -> ${newStatus}`);
    }

    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('[Biteship Webhook] Error:', error.message);
    return res.status(200).send('OK'); // Always 200 for webhooks
  }
};

// ============================================================
// Pickup Locations CRUD (for admin)
// ============================================================

export const getPickupLocations = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const where: any = {};
    if (storeId) where.storeId = String(storeId);

    const locations = await prisma.pickupLocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: locations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPickupLocation = async (req: Request, res: Response) => {
  try {
    const { storeId, name, address, latitude, longitude, operatingHours, pickupFee } = req.body;

    if (!storeId || !name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'storeId, name, address, latitude, dan longitude wajib diisi.',
      });
    }

    const location = await prisma.pickupLocation.create({
      data: {
        storeId,
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        operatingHours: operatingHours || null,
        pickupFee: parseFloat(pickupFee || 0),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Titik pengambilan berhasil ditambahkan!',
      data: location,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePickupLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, operatingHours, pickupFee, isActive } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (latitude !== undefined) data.latitude = parseFloat(latitude);
    if (longitude !== undefined) data.longitude = parseFloat(longitude);
    if (operatingHours !== undefined) data.operatingHours = operatingHours;
    if (pickupFee !== undefined) data.pickupFee = parseFloat(pickupFee);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const location = await prisma.pickupLocation.update({ where: { id }, data });

    return res.json({
      success: true,
      message: 'Titik pengambilan diperbarui!',
      data: location,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePickupLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.pickupLocation.delete({ where: { id } });
    return res.json({ success: true, message: 'Titik pengambilan berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Schedule Slots CRUD (for admin)
// ============================================================

export const createScheduleSlot = async (req: Request, res: Response) => {
  try {
    const { shippingOptionId, label, dayOfWeek, startTime, endTime, maxOrders } = req.body;

    if (!shippingOptionId || !label || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'shippingOptionId, label, startTime, dan endTime wajib diisi.',
      });
    }

    const slot = await prisma.scheduleSlot.create({
      data: {
        shippingOptionId,
        label,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
        startTime,
        endTime,
        maxOrders: parseInt(maxOrders || 10),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Slot jadwal berhasil ditambahkan!',
      data: slot,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateScheduleSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, dayOfWeek, startTime, endTime, maxOrders, isActive } = req.body;

    const data: any = {};
    if (label !== undefined) data.label = label;
    if (dayOfWeek !== undefined) data.dayOfWeek = dayOfWeek === null ? null : parseInt(dayOfWeek);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (maxOrders !== undefined) data.maxOrders = parseInt(maxOrders);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const slot = await prisma.scheduleSlot.update({ where: { id }, data });

    return res.json({
      success: true,
      message: 'Slot jadwal diperbarui!',
      data: slot,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteScheduleSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.scheduleSlot.delete({ where: { id } });
    return res.json({ success: true, message: 'Slot jadwal berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Biteship Couriers Management (Admin)
// ============================================================

export const DEFAULT_BITESHIP_COURIERS = [
  {
    courierCode: 'gojek',
    courierName: 'Gojek',
    serviceCode: 'instant',
    serviceName: 'Instant',
    description: 'On Demand Instant (bike)',
    shipmentDuration: '0 - 2 jam',
    availableCashOnDelivery: false,
    isActive: true,
    maxWeightKg: 5.0,
  },
  {
    courierCode: 'gojek',
    courierName: 'Gojek',
    serviceCode: 'same_day',
    serviceName: 'Same Day',
    description: 'On Demand within 8 hours (bike)',
    shipmentDuration: '0 - 6 jam',
    availableCashOnDelivery: false,
    isActive: true,
    maxWeightKg: 5.0,
  },
  {
    courierCode: 'grab',
    courierName: 'Grab',
    serviceCode: 'instant',
    serviceName: 'Instant',
    description: 'On Demand Instant (bike)',
    shipmentDuration: '0 - 4 jam',
    availableCashOnDelivery: false,
    isActive: true,
    maxWeightKg: 20.0,
  },
  {
    courierCode: 'grab',
    courierName: 'Grab',
    serviceCode: 'same_day',
    serviceName: 'Same Day',
    description: 'On Demand within 8 hours (bike)',
    shipmentDuration: '0 - 6 jam',
    availableCashOnDelivery: false,
    isActive: true,
    maxWeightKg: 7.0,
  },
  {
    courierCode: 'grab',
    courierName: 'Grab',
    serviceCode: 'instant_car',
    serviceName: 'Instant Car',
    description: 'Grab Car Express',
    shipmentDuration: '0 - 4 jam',
    availableCashOnDelivery: false,
    isActive: true,
    maxWeightKg: 150.0,
  },
];

export const getBiteshipCouriers = async (req: Request, res: Response) => {
  try {
    let couriers = await prisma.biteshipCourier.findMany({
      orderBy: [{ courierCode: 'asc' }, { serviceCode: 'asc' }],
    });

    if (couriers.length === 0) {
      for (const item of DEFAULT_BITESHIP_COURIERS) {
        await prisma.biteshipCourier.upsert({
          where: {
            courierCode_serviceCode: {
              courierCode: item.courierCode,
              serviceCode: item.serviceCode,
            },
          },
          update: item,
          create: item,
        });
      }
      couriers = await prisma.biteshipCourier.findMany({
        orderBy: [{ courierCode: 'asc' }, { serviceCode: 'asc' }],
      });
    }

    return res.json({ success: true, data: couriers });
  } catch (error: any) {
    console.error('[Shipping] getBiteshipCouriers error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBiteshipCourier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.biteshipCourier.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kurir tidak ditemukan.' });
    }

    const updated = await prisma.biteshipCourier.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return res.json({
      success: true,
      message: `Status kurir ${updated.courierName} ${updated.serviceName} berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('[Shipping] toggleBiteshipCourier error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

