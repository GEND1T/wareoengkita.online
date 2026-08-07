import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { generatePickupCode } from '../services/shippingService';
import { notifyOrderStatusChanged, notifyOrderPaid } from '../services/wahaNotificationHelper';

// POST /api/orders (Create Order from Checkout)
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      shippingAddress,
      storeId,
      items,
      subtotal,
      shippingFee,
      discountAmount,
      totalPrice,
      paymentMethod,
      // Shipping system fields
      shippingType,
      pickupLocationId,
      scheduledDate,
      scheduledSlot,
      customerLat,
      customerLon,
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran wajib dipilih dan harus tersedia pada toko ini.',
      });
    }

    const orderNo = `ORG-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const orderTime = now.toTimeString().split(' ')[0].slice(0, 5) + ' WIB';
    const orderDate = now.toISOString().split('T')[0];

    // Generate pickup code if self-pickup
    let pickupCode: string | null = null;
    let pickupQrData: string | null = null;
    if (shippingType === 'pickup') {
      const pickup = generatePickupCode();
      pickupCode = pickup.pin;
      pickupQrData = pickup.qrData;
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNo,
        customerId: customerId || req.user?.id || null,
        customerName: customerName || 'Pembeli',
        customerPhone: customerPhone || '',
        shippingAddress: shippingType === 'pickup' ? 'Self-Pickup' : (shippingAddress || ''),
        storeId: storeId || 'store-1',
        itemsJson: JSON.stringify(items || []),
        subtotal: parseFloat(subtotal || 0),
        shippingFee: parseFloat(shippingFee || 0),
        discountAmount: parseFloat(discountAmount || 0),
        totalPrice: parseFloat(totalPrice || 0),
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'new',
        driverName: null,
        driverPhone: null,
        driverPlate: null,
        trackingNumber: null,
        orderTime,
        orderDate,
        // Shipping system fields
        shippingType: shippingType || 'instant',
        pickupCode,
        pickupQrData,
        pickupLocationId: pickupLocationId || null,
        pickupStatus: shippingType === 'pickup' ? 'preparing' : null,
        scheduledDate: scheduledDate || null,
        scheduledSlot: scheduledSlot || null,
        customerLat: customerLat ? parseFloat(customerLat) : null,
        customerLon: customerLon ? parseFloat(customerLon) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      data: newOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/my-orders (Customer Order History)
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userParam = req.query.user as string;
    const userIdParam = req.query.userId as string;
    const phoneParam = req.query.phone as string;

    let authUserId = req.user?.id;
    let authUserPhone = (req.user as any)?.phone;

    const targetUser = (userParam || userIdParam || authUserId || '').trim();
    const targetPhone = (phoneParam || authUserPhone || '').trim();

    // STRICT GUARD: If no user identifier or phone is provided, return empty array!
    // Never return all database orders to unauthenticated or unidentified requests.
    if (!targetUser && !targetPhone) {
      return res.json({ success: true, data: [] });
    }

    const orConditions: any[] = [];
    if (targetUser) {
      orConditions.push({ customerId: targetUser });
      orConditions.push({ customerPhone: targetUser });
    }
    if (targetPhone && targetPhone !== targetUser) {
      orConditions.push({ customerPhone: targetPhone });
      orConditions.push({ customerId: targetPhone });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        pickupLocation: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-cancel expired pending orders
    const now = new Date();
    for (const order of orders) {
      if ((order.paymentStatus === 'pending' || order.orderStatus === 'new') && order.payments && order.payments.length > 0) {
        const p = order.payments[0];
        const expiryMinutes = p.expiryPeriod || 1440;
        const expiryTime = p.linkExpiry
          ? new Date(p.linkExpiry).getTime()
          : new Date(p.createdAt).getTime() + expiryMinutes * 60 * 1000;

        if (now.getTime() > expiryTime) {
          order.orderStatus = 'cancelled';
          order.paymentStatus = 'expired';
          
          prisma.order.update({
            where: { id: order.id },
            data: { orderStatus: 'cancelled', paymentStatus: 'expired' },
          }).catch(err => console.error('[getMyOrders] Auto-cancel order err:', err.message));

          prisma.payment.update({
            where: { id: p.id },
            data: { statusCode: '02', statusMessage: 'EXPIRED' },
          }).catch(err => console.error('[getMyOrders] Auto-cancel payment err:', err.message));
        }
      }
    }

    return res.json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/track/:orderNo (Order Tracking payload for OrderTrackingModal)
export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { orderNo } = req.params;
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { store: true },
    });

    if (!order) {
      return res.status(444).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    return res.json({
      success: true,
      data: {
        orderNo: order.orderNo,
        orderDate: order.orderDate,
        orderTime: order.orderTime,
        status: order.orderStatus,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        courierName: 'OrganikStore Instant Courier',
        driverName: order.driverName || 'Pak Rahmat Express',
        driverPhone: order.driverPhone || '0812-9988-7766',
        driverPlate: order.driverPlate || 'B 4891 TKO',
        trackingNumber: order.trackingNumber,
        storeBranchName: order.store?.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/orders (Store Admin list orders)
export const getAdminOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, status } = req.query;

    const whereClause: any = {};
    if (storeId) whereClause.storeId = String(storeId);
    if (status && status !== 'all') whereClause.orderStatus = String(status);

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        pickupLocation: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/orders/:id/status (Advance status)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { orderStatus: status },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Trigger WAHA WhatsApp status notification asynchronously
    notifyOrderStatusChanged(updatedOrder.id, status).catch(err => console.error('[WAHA Notify Error]:', err));

    return res.json({
      success: true,
      message: `Status pesanan #${updatedOrder.orderNo} berhasil diperbarui!`,
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/confirm-receipt (Customer confirms order received)
export const confirmOrderReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.orderStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Pesanan ini sudah diselesaikan sebelumnya.' });
    }

    // Phase 1 Calculation: Net Seller Earnings = Subtotal - MDR Fee - Platform Commission (2%)
    const mdrFee = 4500; // Flat MDR fee
    const platformCommission = order.subtotal * 0.02; // 2% platform fee
    const netSellerEarning = Math.max(0, order.subtotal - mdrFee - platformCommission);

    // Find Store Admin User
    const storeAdmin = await prisma.user.findFirst({
      where: { assignedStoreId: order.storeId },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      await tx.order.update({
        where: { id },
        data: {
          orderStatus: 'completed',
          paymentStatus: 'paid',
        },
      });

      // 2. Update Store activeBalance
      const updatedStore = await tx.store.update({
        where: { id: order.storeId },
        data: {
          activeBalance: { increment: netSellerEarning },
        },
      });

      // 3. Update User activeBalance if admin exists
      if (storeAdmin) {
        await tx.user.update({
          where: { id: storeAdmin.id },
          data: {
            activeBalance: { increment: netSellerEarning },
          },
        });
      }

      // 4. Record BalanceMutation
      await tx.balanceMutation.create({
        data: {
          userId: storeAdmin?.id || null,
          storeId: order.storeId,
          orderId: order.id,
          type: 'CREDIT',
          amount: netSellerEarning,
          balanceAfter: updatedStore.activeBalance,
          description: `Penambahan saldo dari pesanan #${order.orderNo}`,
        },
      });
    });

    // Trigger WAHA WhatsApp completion notification
    notifyOrderStatusChanged(id, 'completed').catch(err => console.error('[WAHA Notify Error]:', err));

    return res.json({
      success: true,
      message: `Pesanan #${order.orderNo} telah dikonfirmasi selesai! Saldo Rp ${netSellerEarning.toLocaleString('id-ID')} telah diteruskan ke toko.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/cancel (Customer cancels order)
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Pesanan tidak dapat dibatalkan.' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: 'cancelled',
        cancelReason: reason || 'Dibatalkan oleh pembeli',
      },
    });

    return res.json({
      success: true,
      message: `Pesanan #${order.orderNo} berhasil dibatalkan.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
