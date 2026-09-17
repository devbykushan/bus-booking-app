import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';
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

// POST /api/whatsapp/broadcast - Broadcast emergency alert to all booked passengers of a route
whatsappRouter.post('/broadcast', async (req: Request, res: Response) => {
  const { routeId, message } = req.body;

  if (!routeId || !message) {
    res.status(400).json({ success: false, error: 'routeId and message are required.' });
    return;
  }

  const pool = getPool();

  try {
    // Get all confirmed / active bookings for this route
    const bookingsRes = await pool.query(`
      SELECT DISTINCT "passengerName", "passengerPhone", "pnr"
      FROM bookings
      WHERE "routeId" = $1 AND "bookingStatus" != 'cancelled'
    `, [routeId]);

    const passengers = bookingsRes.rows.filter(p => p.passengerPhone && p.passengerPhone.length >= 9);

    if (passengers.length === 0) {
      res.json({ success: true, count: 0, message: 'No booked passengers found for this route.' });
      return;
    }

    let sentCount = 0;
    for (const p of passengers) {
      const formattedText = 
`📢 *IMPORTANT SERVICE NOTICE*
*Dewmina Super Line*

Dear *${p.passengerName || 'Passenger'}*,
(Booking Reference: \`${p.pnr}\`)

${message}

📞 Hotline: 076 258 1841 / 072 417 3143`;

      try {
        const ok = await sendWhatsAppMessage(p.passengerPhone, formattedText);
        if (ok) sentCount++;
      } catch (e) {
        console.error(`Failed to send broadcast to ${p.passengerPhone}:`, e);
      }
    }

    res.json({
      success: true,
      totalPassengers: passengers.length,
      sentCount,
      message: `Announcement successfully broadcasted to ${sentCount} passenger(s)!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
