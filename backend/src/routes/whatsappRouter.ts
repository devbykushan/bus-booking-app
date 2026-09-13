import { Router, Request, Response } from 'express';
import {
  getWhatsAppStatus,
  restartWhatsAppSession,
  sendWhatsAppMessage,
} from '../services/whatsappService';

export const whatsappRouter = Router();

// GET /api/whatsapp/status - Returns current connection status, QR code, and connected bot user
whatsappRouter.get('/status', (req: Request, res: Response) => {
  try {
    const status = getWhatsAppStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get WhatsApp status' });
  }
});

// POST /api/whatsapp/restart - Restarts WhatsApp session and generates fresh QR
whatsappRouter.post('/restart', async (req: Request, res: Response) => {
  try {
    const success = await restartWhatsAppSession();
    res.json({ success, message: 'WhatsApp session restarted. Scan new QR code.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to restart WhatsApp session' });
  }
});

// POST /api/whatsapp/test-send - Test sending a message to any phone number
whatsappRouter.post('/test-send', async (req: Request, res: Response) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    res.status(400).json({ error: 'Phone number and message text are required' });
    return;
  }

  try {
    const sent = await sendWhatsAppMessage(phone, message);
    if (sent) {
      res.json({ success: true, message: `Test WhatsApp message sent to ${phone}` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send WhatsApp message. Ensure WhatsApp is connected.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to send message' });
  }
});
