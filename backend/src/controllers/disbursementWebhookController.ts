import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { sendWahaNotification } from '../services/wahaService';

export const handleDisbursementWebhook = async (req: Request, res: Response) => {
  try {
    const {
      merchantOrderId,
      amount,
      status,
      statusMessage,
      bankCode,
      accountNumber,
      accountHolder,
    } = req.body;

    console.log(`[Webhook Duitku] Disbursement notification received for #${merchantOrderId}, Status: ${status}`);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { withdrawalNo: merchantOrderId },
      include: {
        store: true,
        user: true,
      },
    });

    if (!withdrawal) {
      console.warn(`[Webhook Duitku] Withdrawal #${merchantOrderId} not found in DB`);
      return res.status(200).json({ status: 'OK', message: 'Withdrawal not found but acknowledged' });
    }

    if (withdrawal.status !== 'PENDING') {
      console.log(`[Webhook Duitku] Withdrawal #${merchantOrderId} is already in state ${withdrawal.status}. Skipping.`);
      return res.status(200).json({ status: 'OK', message: 'Already processed' });
    }

    const isSuccess = status === '00' || status === 'SUCCESS' || status === 'success';

    if (isSuccess) {
      // Update Withdrawal Status to SUCCESS
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'SUCCESS',
          failureReason: null,
        },
      });

      // Phone for WA notification (check user phone or store phone)
      const recipientPhone = withdrawal.user?.phone || withdrawal.store?.phone || '08123456789';
      const recipientName = withdrawal.user?.name || withdrawal.store?.name || 'Mitra Penjual';
      const formattedNet = withdrawal.netAmount.toLocaleString('id-ID');
      const formattedFee = withdrawal.disbursementFee.toLocaleString('id-ID');

      const waMessage = `🎉 *PENARIKAN DANA BERHASIL!*\n\nHalo ${recipientName},\nDana penarikan sebesar *Rp ${formattedNet}* telah sukses ditransfer ke rekening ${withdrawal.bankCode} (${withdrawal.accountNumber} a.n ${withdrawal.accountHolder}).\n\n- No Ref: ${merchantOrderId}\n- Nominal Kotor: Rp ${withdrawal.amount.toLocaleString('id-ID')}\n- Biaya Admin Duitku: Rp ${formattedFee}\n\nTerima kasih telah berjualan di Waroengkita! 🌾`;

      // Trigger WAHA WhatsApp notification directly
      sendWahaNotification({
        phone: recipientPhone,
        message: waMessage,
      }).catch((err) => console.error('[Webhook WAHA Error]:', err));

    } else {
      // FAILED: Update Status, Restore Balance, Record REFUND Mutation
      const reason = statusMessage || 'Bank tujuan menolak atau nomor rekening tidak valid.';

      await prisma.$transaction(async (tx) => {
        // 1. Mark Withdrawal as FAILED
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'FAILED',
            failureReason: reason,
          },
        });

        // 2. Restore Store Balance
        let updatedStore: any = null;
        if (withdrawal.storeId) {
          updatedStore = await tx.store.update({
            where: { id: withdrawal.storeId },
            data: { activeBalance: { increment: withdrawal.amount } },
          });
        }

        // 3. Restore User Balance
        if (withdrawal.userId) {
          await tx.user.update({
            where: { id: withdrawal.userId },
            data: { activeBalance: { increment: withdrawal.amount } },
          });
        }

        // 4. Record REFUND Mutation
        await tx.balanceMutation.create({
          data: {
            userId: withdrawal.userId || null,
            storeId: withdrawal.storeId || null,
            type: 'REFUND',
            amount: withdrawal.amount,
            balanceAfter: updatedStore ? updatedStore.activeBalance : withdrawal.amount,
            description: `Pengembalian dana akibat penarikan #${withdrawal.withdrawalNo} gagal (${reason})`,
          },
        });
      });

      const recipientPhone = withdrawal.user?.phone || withdrawal.store?.phone || '08123456789';
      const recipientName = withdrawal.user?.name || withdrawal.store?.name || 'Mitra Penjual';
      const formattedAmount = withdrawal.amount.toLocaleString('id-ID');

      const waFailedMessage = `⚠️ *PENARIKAN DANA GAGAL*\n\nHalo ${recipientName},\nPenarikan dana #${merchantOrderId} sebesar Rp ${formattedAmount} gagal diproses.\nAlasan: ${reason}\n\n*Saldo sebesar Rp ${formattedAmount} telah dikembalikan secara utuh ke Dompet Penjual Anda.* Silakan periksa kembali nomor rekening Anda.`;

      sendWahaNotification({
        phone: recipientPhone,
        message: waFailedMessage,
      }).catch((err) => console.error('[Webhook WAHA Error]:', err));
    }

    return res.status(200).json({ status: 'OK', message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('[Webhook Duitku Error]:', error);
    return res.status(500).json({ status: 'ERROR', message: error.message });
  }
};
