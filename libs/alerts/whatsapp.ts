import twilio from 'twilio';
import { getSystemConfig } from '../database';

function cleanWhatsAppNumber(num: string) {
  // Remove 'whatsapp:' prefix and all spaces, then add prefix back
  return `whatsapp:${num.replace(/^whatsapp:/, '').replace(/\s+/g, '')}`;
}

interface WhatsAppMessageOptions {
  templateSid?: string;
  templateVars?: Record<string, string>;
}

export async function sendWhatsAppMessage(to: string, body: string, options?: WhatsAppMessageOptions) {
  const config = await getSystemConfig('whatsapp');
  if (!config) throw new Error('WhatsApp provider not configured');

  if (config.provider === 'twilio') {
    const client = twilio(config.accountSid, config.authToken);
    const from = cleanWhatsAppNumber(config.whatsappNumber);
    const toNumber = cleanWhatsAppNumber(to);
    console.log('[Twilio WhatsApp] Sending message', { from, to: toNumber, accountSid: config.accountSid, body, options });
    try {
      if (options?.templateSid && options?.templateVars) {
        // Send template message
        return await client.messages.create({
          from,
          to: toNumber,
          contentSid: options.templateSid,
          contentVariables: JSON.stringify(options.templateVars),
        });
      } else {
        // Send freeform message
        return await client.messages.create({
          from,
          to: toNumber,
          body,
        });
      }
    } catch (err) {
      console.error('[Twilio WhatsApp] Error sending message', { from, to: toNumber, error: err });
      throw err;
    }
  }
  throw new Error('Unsupported WhatsApp provider');
} 