import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import {
  getPaymentMethods as duitkuGetMethods,
  createTransaction as duitkuCreateTx,
  checkTransactionStatus as duitkuCheckTx,
  verifyCallbackSignature,
} from '../services/duitkuService';
import crypto from 'crypto';

// ============================================================
// Pembayaran Controller — Duitku Payment Gateway Integration
// ============================================================

/**
 * GET /api/pembayaran/methods?amount=10000
 * Ambil metode pembayaran aktif dari Duitku API
 */
export const getPaymentMethodsDuitku = async (req: Request, res: Response) => {
  try {
    const amount = parseInt(req.query.amount as string) || 10000;
    const result = await duitkuGetMethods(amount);

    if (result && result.responseCode === '00') {
      return res.json({
        success: true,
        data: result.paymentFee || [],
      });
    }

    return res.status(400).json({
      success: false,
      message: result?.responseMessage || 'Gagal mengambil metode pembayaran dari Duitku API',
    });
  } catch (error: any) {
    console.error('[Pembayaran] getPaymentMethods error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/pembayaran/create
 * Buat transaksi pembayaran baru → simpan di DB + call Duitku Inquiry
 */
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      orderId,
      paymentMethod,
      paymentAmount,
      customerName,
      customerEmail,
      customerPhone,
      productDetails,
      storeId,
      items,
      shippingAddress,
      expiryPeriod,
    } = req.body;

    if (!paymentMethod || !paymentAmount) {
      return res.status(400).json({
        success: false,
        message: 'paymentMethod dan paymentAmount wajib diisi.',
      });
    }

    // Generate unique merchantOrderId
    const merchantOrderId = `ORG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Build Duitku item details if exact match with paymentAmount
    let itemDetails: Array<{ name: string; price: number; quantity: number }> | undefined = undefined;
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsSum = items.reduce((acc: number, item: any) => acc + (Math.round(item.price || 0) * (item.quantity || 1)), 0);
      if (itemsSum === Math.round(paymentAmount)) {
        itemDetails = items.map((item: any) => ({
          name: String(item.name || 'Produk').substring(0, 50),
          price: Math.round(item.price || 0),
          quantity: item.quantity || 1,
        }));
      }
    }

    // Build customer detail for Duitku
    const firstName = (customerName || 'Pembeli').split(' ')[0].substring(0, 20);
    const lastName = (customerName || '').split(' ').slice(1).join(' ').substring(0, 20) || '';

    const addressObj = shippingAddress
      ? {
          firstName,
          lastName,
          address: shippingAddress.substring(0, 100),
          city: 'Jakarta',
          postalCode: '10000',
          phone: customerPhone || '081234567890',
          countryCode: 'ID',
        }
      : undefined;

    // Call Duitku Inquiry API with try-catch fallback
    let duitkuResult: any = null;
    try {
      duitkuResult = await duitkuCreateTx({
        merchantOrderId,
        paymentAmount: Math.round(paymentAmount),
        paymentMethod,
        productDetails: (productDetails || 'Pembayaran OrganikStore').substring(0, 255),
        email: customerEmail || 'customer@waroengkita.online',
        phoneNumber: customerPhone || '081234567890',
        customerVaName: (customerName || 'Pembeli').substring(0, 20),
        expiryPeriod: expiryPeriod || 1440,
        itemDetails,
        customerDetail: addressObj
          ? {
              firstName,
              lastName,
              email: customerEmail || 'customer@waroengkita.online',
              phoneNumber: customerPhone || '081234567890',
              billingAddress: addressObj,
              shippingAddress: addressObj,
            }
          : undefined,
      });
    } catch (apiErr: any) {
      console.error('[Pembayaran] Duitku createTransaction API error:', apiErr.message);
      return res.status(500).json({
        success: false,
        message: `Gagal membuat transaksi Duitku: ${apiErr.message}`,
      });
    }

    // Save payment record to DB with try-catch fallback
    let paymentId = merchantOrderId;
    let createdAt = new Date().toISOString();
    try {
      const payment = await prisma.payment.create({
        data: {
          orderId: orderId || null,
          merchantOrderId,
          reference: duitkuResult.reference || null,
          paymentMethod,
          paymentAmount: Math.round(paymentAmount),
          vaNumber: duitkuResult.vaNumber || null,
          qrString: duitkuResult.qrString || null,
          paymentUrl: duitkuResult.paymentUrl || null,
          statusCode: '01', // Always PENDING on creation
          statusMessage: 'PENDING',
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          productDetails: productDetails || null,
          storeId: storeId || null,
          expiryPeriod: expiryPeriod || 1440,
          itemsJson: items ? JSON.stringify(items) : null,
        },
      });
      paymentId = payment.id;
      createdAt = payment.createdAt.toISOString();
    } catch (dbErr: any) {
      console.warn('[Pembayaran] DB save warning (proceeding with Duitku response):', dbErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Transaksi pembayaran berhasil dibuat.',
      data: {
        id: paymentId,
        merchantOrderId,
        reference: duitkuResult.reference || null,
        paymentMethod,
        paymentAmount: Math.round(paymentAmount),
        vaNumber: duitkuResult.vaNumber || null,
        qrString: duitkuResult.qrString || null,
        paymentUrl: duitkuResult.paymentUrl || null,
        statusCode: '01',
        statusMessage: 'PENDING',
        expiryPeriod: expiryPeriod || 1440,
        createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Pembayaran] createPayment error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/pembayaran/callback
 * Menerima callback dari Duitku (server-to-server)
 * Content-Type: x-www-form-urlencoded
 */
export const handleCallback = async (req: Request, res: Response) => {
  try {
    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature,
      publisherOrderId,
      spUserHash,
      settlementDate,
      issuerCode,
      customerName,
    } = req.body;

    console.log('[Duitku Callback] Received:', {
      merchantOrderId,
      amount,
      resultCode,
      reference,
    });

    // Validate required fields
    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      console.error('[Duitku Callback] Bad Parameter — missing required fields');
      return res.status(400).send('Bad Parameter');
    }

    // Verify signature
    const isValid = verifyCallbackSignature(merchantCode, amount, merchantOrderId, signature);
    if (!isValid) {
      console.error('[Duitku Callback] Bad Signature');
      return res.status(400).send('Bad Signature');
    }

    // Update payment record in DB
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId },
    });

    if (!payment) {
      console.error('[Duitku Callback] Payment not found:', merchantOrderId);
      return res.status(404).send('Payment Not Found');
    }

    const updatedPayment = await prisma.payment.update({
      where: { merchantOrderId },
      data: {
        resultCode: resultCode || null,
        statusCode: resultCode === '00' ? '00' : resultCode === '01' ? '02' : '01',
        statusMessage: resultCode === '00' ? 'SUCCESS' : 'FAILED',
        reference: reference || payment.reference,
        publisherOrderId: publisherOrderId || null,
        settlementDate: settlementDate || null,
        callbackReceived: true,
        additionalParam: additionalParam || null,
      },
    });

    // If payment successful & linked to an order, update order status to paid & processing (dikemas)
    if (resultCode === '00' && updatedPayment.orderId) {
      await prisma.order.update({
        where: { id: updatedPayment.orderId },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'processing',
          paymentMethod: `duitku_${paymentCode || updatedPayment.paymentMethod}`,
        },
      });
    }

    console.log('[Duitku Callback] Processed successfully:', merchantOrderId);

    // Must return HTTP 200 for Duitku to acknowledge
    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('[Duitku Callback] Error:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * GET /api/pembayaran/status/:merchantOrderId
 * Cek status transaksi via Duitku API + DB
 */
export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { merchantOrderId } = req.params;

    // Get local payment data
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId },
      include: { order: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pembayaran tidak ditemukan.',
      });
    }

    // If confirmed by callback and status is 00, return cached directly
    if (payment.statusCode === '00' && payment.callbackReceived) {
      return res.json({
        success: true,
        data: {
          ...payment,
          fromCache: true,
        },
      });
    }

    // Check with Duitku API for live status
    try {
      const duitkuStatus = await duitkuCheckTx(merchantOrderId);

      // Update local record if status changed
      if (duitkuStatus.statusCode !== payment.statusCode) {
        await prisma.payment.update({
          where: { merchantOrderId },
          data: {
            statusCode: duitkuStatus.statusCode,
            statusMessage: duitkuStatus.statusMessage,
            reference: duitkuStatus.reference || payment.reference,
            paymentFee: duitkuStatus.fee ? Math.round(parseFloat(duitkuStatus.fee)) : payment.paymentFee,
          },
        });

        // If newly successful and linked to order
        if (duitkuStatus.statusCode === '00' && payment.orderId) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: 'paid',
              orderStatus: 'processing',
            },
          });
        }
      }

      return res.json({
        success: true,
        data: {
          ...payment,
          statusCode: duitkuStatus.statusCode,
          statusMessage: duitkuStatus.statusMessage,
          fee: duitkuStatus.fee,
          fromCache: false,
        },
      });
    } catch (apiError: any) {
      // If Duitku API fails, return cached data
      console.warn('[Pembayaran] Duitku check failed, returning cached:', apiError.message);
      return res.json({
        success: true,
        data: {
          ...payment,
          fromCache: true,
        },
      });
    }
  } catch (error: any) {
    console.error('[Pembayaran] checkStatus error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/pembayaran/invoice/:id
 * Ambil detail invoice/payment dari DB
 */
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id },
          { merchantOrderId: id },
        ],
      },
      include: {
        order: {
          include: {
            store: {
              select: { id: true, name: true, address: true, phone: true },
            },
          },
        },
        store: {
          select: { id: true, name: true, address: true, phone: true },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Invoice tidak ditemukan.',
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('[Pembayaran] getInvoice error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/pembayaran/create-link
 * Buat link pembayaran shareable
 */
export const createPaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const {
      paymentAmount,
      productDetails,
      customerName,
      customerEmail,
      customerPhone,
      storeId,
      items,
      expiryPeriod,
    } = req.body;

    if (!paymentAmount) {
      return res.status(400).json({
        success: false,
        message: 'paymentAmount wajib diisi.',
      });
    }

    // Generate unique link token
    const linkToken = crypto.randomBytes(16).toString('hex');
    const merchantOrderId = `LINK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiryMinutes = expiryPeriod || 1440; // default 24 hours

    const payment = await prisma.payment.create({
      data: {
        merchantOrderId,
        paymentMethod: 'LINK', // Will be selected by payer
        paymentAmount: Math.round(paymentAmount),
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        productDetails: productDetails || 'Link Pembayaran',
        storeId: storeId || null,
        isPaymentLink: true,
        linkToken,
        linkExpiry: new Date(Date.now() + expiryMinutes * 60 * 1000),
        expiryPeriod: expiryMinutes,
        itemsJson: items ? JSON.stringify(items) : null,
        statusCode: '01',
        statusMessage: 'PENDING',
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://waroengkita.online';
    const paymentLinkUrl = `${frontendUrl}/pay/${linkToken}`;

    return res.status(201).json({
      success: true,
      message: 'Link pembayaran berhasil dibuat.',
      data: {
        id: payment.id,
        merchantOrderId: payment.merchantOrderId,
        linkToken: payment.linkToken,
        linkUrl: paymentLinkUrl,
        paymentAmount: payment.paymentAmount,
        productDetails: payment.productDetails,
        linkExpiry: payment.linkExpiry,
        createdAt: payment.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Pembayaran] createPaymentLink error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/pembayaran/link/:token
 * Ambil detail payment link by token (public endpoint)
 */
export const getPaymentLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { linkToken: token },
      include: {
        store: {
          select: { id: true, name: true, address: true, phone: true, coverImage: true },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Link pembayaran tidak ditemukan.',
      });
    }

    // Check expiry
    if (payment.linkExpiry && new Date() > payment.linkExpiry) {
      return res.status(410).json({
        success: false,
        message: 'Link pembayaran sudah kadaluarsa.',
        data: { expired: true },
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('[Pembayaran] getPaymentLink error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
