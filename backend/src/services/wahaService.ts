interface SendWahaTextOptions {
  phone: string;
  message: string;
}

export const sendWahaNotification = async ({ phone, message }: SendWahaTextOptions): Promise<boolean> => {
  try {
    const wahaUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
    const wahaSession = process.env.WAHA_SESSION || 'default';

    // Format phone number to international format e.g. 08123456789 -> 628123456789@c.us
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const chatId = `${cleanPhone}@c.us`;

    const response = await fetch(`${wahaUrl}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        text: message,
        session: wahaSession,
      }),
    });

    if (response.ok) {
      console.log(`[WAHA] WhatsApp notification sent to ${phone}`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`[WAHA Error] Failed to send WhatsApp to ${phone}:`, error?.message);
    return false;
  }
};
