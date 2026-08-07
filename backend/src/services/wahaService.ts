import dotenv from 'dotenv';
dotenv.config();

interface SendWahaTextOptions {
  phone: string;
  message: string;
}

interface SendWahaImageOptions {
  phone: string;
  imageUrl: string;
  caption?: string;
}

/**
 * Get WAHA Base URL, API Key, and Session Name from Environment Variables
 */
function getWahaConfig() {
  const wahaUrl = (process.env.WAHA_URL || process.env.WAHA_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const wahaApiKey = process.env.WAHA_API_KEY || '';
  const wahaSession = process.env.WAHA_SESSION || 'default';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (wahaApiKey) {
    headers['X-Api-Key'] = wahaApiKey;
  }

  return { wahaUrl, wahaApiKey, wahaSession, headers };
}

/**
 * Auto-detect active WORKING session in WAHA if default session fails
 */
async function autoDetectWahaSession(wahaUrl: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(`${wahaUrl}/api/sessions`, { headers });
    if (!res.ok) return null;
    const sessions = await res.json();
    if (Array.isArray(sessions) && sessions.length > 0) {
      const working = sessions.find((s: any) => s.status === 'WORKING' || s.status === 'STARTING');
      if (working) return working.name;
      return sessions[0].name;
    }
  } catch (err: any) {
    console.warn('[WAHA] Could not fetch sessions list:', err.message);
  }
  return null;
}

/**
 * Send text message via WAHA WhatsApp API (/api/sendText)
 */
export const sendWahaNotification = async ({ phone, message }: SendWahaTextOptions): Promise<boolean> => {
  try {
    const { wahaUrl, wahaSession, headers } = getWahaConfig();

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const chatId = `${cleanPhone}@c.us`;

    let activeSession = wahaSession;
    const endpoint = `${wahaUrl}/api/sendText`;

    console.log(`[WAHA] Sending text to ${chatId} via ${endpoint} (session: ${activeSession})...`);

    let response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId,
        text: message,
        session: activeSession,
      }),
    });

    // If initial session failed, try auto-detecting working session
    if (!response.ok && activeSession === 'default') {
      const detected = await autoDetectWahaSession(wahaUrl, headers);
      if (detected && detected !== activeSession) {
        console.log(`[WAHA] Retrying text send with detected session: ${detected}...`);
        activeSession = detected;
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            chatId,
            text: message,
            session: activeSession,
          }),
        });
      }
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(`✅ [WAHA] WhatsApp notification sent to ${phone}!`, data);
      return true;
    } else {
      const errText = await response.text().catch(() => '');
      console.error(`❌ [WAHA Error] HTTP ${response.status} sending to ${phone}:`, errText);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ [WAHA Error] Connection failed for ${phone}:`, error?.message);
    return false;
  }
};

/**
 * Send image via WAHA WhatsApp API (/api/sendImage)
 */
export const sendWahaImage = async ({ phone, imageUrl, caption }: SendWahaImageOptions): Promise<boolean> => {
  try {
    const { wahaUrl, wahaSession, headers } = getWahaConfig();

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const chatId = `${cleanPhone}@c.us`;

    let activeSession = wahaSession;
    const endpoint = `${wahaUrl}/api/sendImage`;

    console.log(`[WAHA] Sending image to ${chatId} via ${endpoint} (session: ${activeSession})...`);

    let response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId,
        file: {
          url: imageUrl,
          mimetype: 'image/png',
          filename: 'qrcode.png',
        },
        caption: caption || '',
        session: activeSession,
      }),
    });

    // Retry with detected session if initial fails
    if (!response.ok && activeSession === 'default') {
      const detected = await autoDetectWahaSession(wahaUrl, headers);
      if (detected && detected !== activeSession) {
        activeSession = detected;
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            chatId,
            file: {
              url: imageUrl,
              mimetype: 'image/png',
              filename: 'qrcode.png',
            },
            caption: caption || '',
            session: activeSession,
          }),
        });
      }
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(`✅ [WAHA] WhatsApp QR Code Image sent to ${phone}!`, data);
      return true;
    } else {
      const errText = await response.text().catch(() => '');
      console.error(`❌ [WAHA Error] HTTP ${response.status} sending image to ${phone}:`, errText);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ [WAHA Error] Connection failed sending image to ${phone}:`, error?.message);
    return false;
  }
};
