import dotenv from 'dotenv';
dotenv.config();

/**
 * Helper to normalize Indonesian WhatsApp numbers
 * e.g., "0812-3456-7890" -> "6281234567890"
 */
export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, ''); // remove non-digits
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

export interface SendWAMessageResult {
  success: boolean;
  formattedPhone: string;
  waMeUrl: string;
  magicLinkUrl: string;
  gatewayResponse?: any;
  provider?: 'waha' | 'fonnte' | 'simulation';
}

/**
 * Auto-detect active WORKING session in WAHA if available
 */
async function getActiveWAHASession(baseUrl: string, apiKey?: string): Promise<string> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers['X-Api-Key'] = apiKey;

    const res = await fetch(`${baseUrl}/api/sessions`, { headers });
    const sessions = await res.json();

    if (Array.isArray(sessions) && sessions.length > 0) {
      const workingSession = sessions.find((s: any) => s.status === 'WORKING');
      if (workingSession) {
        return workingSession.name;
      }
      return sessions[0].name;
    }
  } catch (err: any) {
    console.warn('⚠️ Could not fetch WAHA sessions list:', err.message);
  }

  return process.env.WAHA_SESSION || 'default';
}

/**
 * Send WhatsApp Magic Link Access message to user
 * Supports WAHA (WhatsApp HTTP API), Fonnte/Generic Gateways, and Simulation Mode
 */
export async function sendWhatsAppAccessLink(
  phone: string,
  name: string,
  magicLinkUrl: string
): Promise<SendWAMessageResult> {
  const formattedPhone = formatWhatsAppNumber(phone);
  
  const message = `Halo ${name}! 👋\n\n` +
    `Berikut adalah Link Akses resmi untuk masuk ke akun OrganikStore Anda:\n\n` +
    `🔗 ${magicLinkUrl}\n\n` +
    `⚠️ *Penting:* Link ini hanya berlaku selama 15 menit dan hanya dapat digunakan 1 kali. Jangan bagikan link ini kepada siapapun demi keamanan akun Anda.\n\n` +
    `Terima kasih telah berbelanja di OrganikStore! 🌿`;

  // Fallback wa.me URL for browser testing
  const waMeUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  console.log('====================================================');
  console.log(`📲 SENDING WHATSAPP ACCESS LINK TO: ${formattedPhone} (${name})`);
  console.log(`🔗 ACCESS LINK: ${magicLinkUrl}`);
  console.log('====================================================');

  const wahaUrl = process.env.WAHA_URL;
  const wahaApiKey = process.env.WAHA_API_KEY;

  // 1. Try WAHA (WhatsApp HTTP API) if configured
  if (wahaUrl) {
    try {
      const cleanWahaUrl = wahaUrl.replace(/\/+$/, '');
      const endpoint = `${cleanWahaUrl}/api/sendText`;
      const chatId = `${formattedPhone}@c.us`;

      // Auto-detect working session if process.env.WAHA_SESSION is 'default' or empty
      let sessionName = process.env.WAHA_SESSION;
      if (!sessionName || sessionName === 'default') {
        sessionName = await getActiveWAHASession(cleanWahaUrl, wahaApiKey);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (wahaApiKey) {
        headers['X-Api-Key'] = wahaApiKey;
      }

      console.log(`🌐 Calling WAHA API Endpoint: ${endpoint} (chatId: ${chatId}, session: ${sessionName})...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatId: chatId,
          text: message,
          session: sessionName,
        }),
      });

      const data = await response.json();
      console.log('✅ WAHA API Response:', data);

      return {
        success: true,
        formattedPhone,
        waMeUrl,
        magicLinkUrl,
        gatewayResponse: data,
        provider: 'waha',
      };
    } catch (err: any) {
      console.error('⚠️ WAHA API Connection Error:', err.message);
    }
  }

  // 2. Try Generic / Fonnte API Gateway if WA_GATEWAY_API_KEY is present
  const apiKey = process.env.WA_GATEWAY_API_KEY;
  const gatewayUrl = process.env.WA_GATEWAY_URL || 'https://api.fonnte.com/send';

  if (apiKey) {
    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: formattedPhone,
          message: message,
        }),
      });
      const data = await response.json();
      console.log('✅ WA Gateway API Response:', data);
      return {
        success: true,
        formattedPhone,
        waMeUrl,
        magicLinkUrl,
        gatewayResponse: data,
        provider: 'fonnte',
      };
    } catch (err: any) {
      console.error('⚠️ WA Gateway API Error:', err.message);
    }
  }

  // 3. Default Fallback (Simulation Mode)
  return {
    success: true,
    formattedPhone,
    waMeUrl,
    magicLinkUrl,
    provider: 'simulation',
  };
}
