import { Router, Request, Response } from 'express';
import { processBotMessage } from '../services/botService';

export const webhookRouter = Router();

/**
 * Send a simple text message via WAHA
 */
async function sendWhatsAppMessage(chatId: string, text: string) {
  const wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
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
    if (payload.event === 'message' || payload.event === 'message.any') {
      const message = payload.payload;
      if (!message) return;
      
      // Ignore messages from ourselves or from groups
      if (message.fromMe || (message.from && message.from.includes('@g.us'))) return;

      const chatId = message.from;
      const incomingText = (message.body || '').trim();
      if (!incomingText) return;

      const replyResult = await processBotMessage(incomingText);
      if (replyResult && replyResult.text) {
        await sendWhatsAppMessage(chatId, replyResult.text);
      }
    }
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
  }
});
