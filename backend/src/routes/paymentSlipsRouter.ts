import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { sendWhatsAppPaymentUpdate } from '../services/wahaService';

export const paymentSlipsRouter = Router();

// ─── POST /api/payment-slips — Upload slip ────────────────────────────────────
paymentSlipsRouter.post('/', async (req: Request, res: Response) => {
  const pool = getPool();
  const { bookingId, pnr, imageData, imageMime, amount, passengerName, passengerPhone } = req.body;

  if (!bookingId || !pnr || !imageData || !amount) {
    res.status(400).json({ error: 'bookingId, pnr, imageData and amount are required.' });
    return;
  }

  try {
    // Verify booking exists and is in pending_payment state
    const bookingRes = await pool.query('SELECT * FROM bookings WHERE "id" = $1 OR "pnr" = $2', [bookingId, pnr]);
    const booking = bookingRes.rows[0];
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (booking.bookingStatus !== 'pending_payment') {
      res.status(400).json({ error: 'This booking does not require slip upload.' });
      return;
    }

    // Check if slip already uploaded
    const existingSlip = await pool.query('SELECT id FROM payment_slips WHERE "pnr" = $1 AND "status" = \'pending\'', [pnr]);
    if (existingSlip.rows.length > 0) {
      // Update the existing slip instead
      await pool.query(
        'UPDATE payment_slips SET "imageData" = $1, "imageMime" = $2, "uploadedAt" = $3 WHERE "pnr" = $4 AND "status" = \'pending\'',
        [imageData, imageMime || 'image/jpeg', new Date().toISOString(), pnr]
      );
      res.json({ success: true, message: 'Slip updated successfully. Awaiting admin review.' });
      return;
    }

    const slipId = `slip-${uuidv4().slice(0, 8).toUpperCase()}`;
    await pool.query(`
      INSERT INTO payment_slips ("id", "bookingId", "pnr", "imageData", "imageMime", "amount", "passengerName", "passengerPhone", "uploadedAt", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    `, [slipId, booking.id, pnr, imageData, imageMime || 'image/jpeg', amount, passengerName || booking.passengerName, passengerPhone || booking.passengerPhone, new Date().toISOString()]);

    res.status(201).json({ success: true, slipId, message: 'Slip uploaded successfully. Awaiting admin review.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/payment-slips — Get all slips (admin) ─────────────────────────
paymentSlipsRouter.get('/', async (_req: Request, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM payment_slips ORDER BY "uploadedAt" DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/payment-slips/:id/approve ───────────────────────────────────
paymentSlipsRouter.patch('/:id/approve', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;
  const { adminName } = req.body;

  try {
    const slipRes = await pool.query('SELECT * FROM payment_slips WHERE "id" = $1', [id]);
    const slip = slipRes.rows[0];
    if (!slip) {
      res.status(404).json({ error: 'Slip not found.' });
      return;
    }
    if (slip.status !== 'pending') {
      res.status(400).json({ error: 'This slip has already been reviewed.' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update slip status
      await client.query(
        'UPDATE payment_slips SET "status" = \'approved\', "reviewedAt" = $1, "reviewedBy" = $2 WHERE "id" = $3',
        [new Date().toISOString(), adminName || 'Admin', id]
      );

      // Update booking status to confirmed
      await client.query(
        'UPDATE bookings SET "bookingStatus" = \'confirmed\', "paymentStatus" = \'paid\' WHERE "pnr" = $1',
        [slip.pnr]
      );

      // Update seats from 'reserved' to 'booked'
      const bookingRes = await client.query('SELECT "seatIds" FROM bookings WHERE "pnr" = $1', [slip.pnr]);
      const booking = bookingRes.rows[0];
      if (booking) {
        const seatIds: string[] = typeof booking.seatIds === 'string' ? JSON.parse(booking.seatIds || '[]') : (booking.seatIds || []);
        if (seatIds.length > 0) {
          await client.query("UPDATE seats SET \"status\" = 'booked' WHERE \"id\" = ANY($1::text[])", [seatIds]);
        }
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Send WhatsApp notification to passenger (non-blocking)
    sendWhatsAppPaymentUpdate({
      pnr: slip.pnr,
      passengerName: slip.passengerName,
      passengerPhone: slip.passengerPhone,
      amount: slip.amount,
      status: 'approved',
    }).catch(err => console.error('[WAHA Slip Approval Error]', err));

    res.json({ success: true, message: 'Payment approved. Booking confirmed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/payment-slips/:id/reject ────────────────────────────────────
paymentSlipsRouter.patch('/:id/reject', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;
  const { adminName, reason } = req.body;

  try {
    const slipRes = await pool.query('SELECT * FROM payment_slips WHERE "id" = $1', [id]);
    const slip = slipRes.rows[0];
    if (!slip) {
      res.status(404).json({ error: 'Slip not found.' });
      return;
    }
    if (slip.status !== 'pending') {
      res.status(400).json({ error: 'This slip has already been reviewed.' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update slip status
      await client.query(
        'UPDATE payment_slips SET "status" = \'rejected\', "reviewedAt" = $1, "reviewedBy" = $2 WHERE "id" = $3',
        [new Date().toISOString(), adminName || 'Admin', id]
      );

      // Update booking to cancelled
      await client.query(
        'UPDATE bookings SET "bookingStatus" = \'cancelled\', "paymentStatus" = \'refunded\' WHERE "pnr" = $1',
        [slip.pnr]
      );

      // Release reserved seats back to available
      const bookingRes = await client.query('SELECT "seatIds" FROM bookings WHERE "pnr" = $1', [slip.pnr]);
      const booking = bookingRes.rows[0];
      if (booking) {
        const seatIds: string[] = typeof booking.seatIds === 'string' ? JSON.parse(booking.seatIds || '[]') : (booking.seatIds || []);
        if (seatIds.length > 0) {
          await client.query("UPDATE seats SET \"status\" = 'available' WHERE \"id\" = ANY($1::text[])", [seatIds]);
        }
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Send WhatsApp notification to passenger (non-blocking)
    sendWhatsAppPaymentUpdate({
      pnr: slip.pnr,
      passengerName: slip.passengerName,
      passengerPhone: slip.passengerPhone,
      amount: slip.amount,
      status: 'rejected',
      reason: reason || 'Payment could not be verified.',
    }).catch(err => console.error('[WAHA Slip Rejection Error]', err));

    res.json({ success: true, message: 'Payment rejected. Booking cancelled and seats released.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
