import { Router, Request, Response } from 'express';
import { sendWhatsAppETicket } from '../services/wahaService'; // we will just use the fetch part manually or export a simple send method
import { formatSriLankanPhone } from '../services/wahaService';

export const webhookRouter = Router();

/**
 * Send a simple text message via WAHA
 */
async function sendWhatsAppMessage(chatId: string, text: string) {
  const wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:9999';
  const session = process.env.WAHA_SESSION || 'default';
  
  try {
    const endpoint = `${wahaApiUrl.replace(/\/$/, '')}/api/sendText`;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, chatId, text }),
    });
  } catch (error) {
    console.error('[Webhook] Error sending reply:', error);
  }
}

// WAHA Webhook Endpoint
webhookRouter.post('/waha', async (req: Request, res: Response) => {
  // Always respond 200 immediately to WAHA to acknowledge receipt
  res.status(200).send('OK');

  try {
    const payload = req.body;
    
    // WAHA sends events in `event` field, we only care about 'message' or 'message.any'
    if (payload.event === 'message') {
      const message = payload.payload;
      
      // Ignore messages from ourselves or from groups
      if (message.fromMe || message.from.includes('@g.us')) return;

      const chatId = message.from;
      const incomingText = (message.body || '').trim().toLowerCase();
      
      let replyText = '';

      if (['1', '1.', 'one'].includes(incomingText)) {
        replyText = `🚌 *බස් කාලසටහන*\n\n1. මොනරාගල -> කොළඹ (05:00 AM)\n2. මොනරාගල -> කොළඹ (10:30 AM)\n3. කොළඹ -> මොනරාගල (08:00 PM)\n\nවෙබ් අඩවිය හරහා අදම ආසන වෙන්කරගන්න: https://dewminasuperline.com`;
      } 
      else if (['2', '2.', 'two'].includes(incomingText)) {
        replyText = `💵 *ටිකට් මිල ගණන්*\n\nසාමාන්‍ය සේවාව: LKR 1,157\nඅර්ධ සුඛෝපභෝගී: LKR 1,500\nසුඛෝපභෝගී (A/C): LKR 2,500\n\n(මිල ගණන් වෙනස් වීමට යටත් වේ).`;
      }
      else if (['3', '3.', 'three'].includes(incomingText)) {
        replyText = `📞 *අපව අමතන්න*\n\nප්‍රධාන කාර්යාලය: 077 123 4567\nවිද්‍යුත් තැපෑල: info@dewminasuperline.com`;
      }
      else {
        // Default Welcome Menu
        replyText = `👋 *Dewmina Super Line වෙත සාදරයෙන් පිළිගනිමු!*\n\nකරුණාකර ඔබට අවශ්‍ය සේවාවේ අංකය Reply කරන්න:\n\n*1.* බස් කාලසටහන බැලීමට\n*2.* ටිකට් මිල ගණන් බැලීමට\n*3.* අපව අමතන්න`;
      }

      // Send the reply
      await sendWhatsAppMessage(chatId, replyText);
    }
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
  }
});
