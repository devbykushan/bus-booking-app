import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';

export const validateRouter = Router();

// ─── POST /api/validate-ticket ────────────────────────────────────────────────
// Body: { pnr: string } — used by Conductor QR Scanner
validateRouter.post('/', async (req: Request, res: Response) => {
  const pool = getPool();
  const { pnr } = req.body as { pnr: string };

  if (!pnr) {
    res.status(400).json({ success: false, message: 'PNR code is required.' });
    return;
  }

  const rawPnr = pnr.trim();
  const matchPnr = rawPnr.match(/PNR[=:]?\s*([A-Z0-9-]+)/i) || rawPnr.match(/(OMNI-[A-Z0-9-]+)/i);
  const cleanPnr = matchPnr ? matchPnr[1].toUpperCase() : rawPnr.toUpperCase();

  try {
    // Match by PNR or by embedded PNR inside QR code data
    const bookingRes = await pool.query(
      'SELECT * FROM bookings WHERE UPPER("pnr") = $1 OR "qrCodeData" LIKE $2 OR UPPER("pnr") LIKE $2',
      [cleanPnr, `%${cleanPnr}%`]
    );

    const booking = bookingRes.rows[0];

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Invalid PNR Code! No matching booking found in our system.',
      });
      return;
    }

    if (booking.bookingStatus === 'cancelled') {
      const formatted = await formatValidation(booking, pool);
      res.status(400).json({
        success: false,
        booking: formatted,
        message: 'This ticket has been cancelled. Refund was processed.',
      });
      return;
    }

    if (booking.bookingStatus === 'boarded') {
      const formatted = await formatValidation(booking, pool);
      res.json({
        success: true,
        alreadyBoarded: true,
        booking: formatted,
        message: 'Passenger has already been scanned and boarded.',
      });
      return;
    }

    // Mark as boarded
    await pool.query('UPDATE bookings SET "bookingStatus" = \'boarded\' WHERE "pnr" = $1', [booking.pnr]);
    const updatedRes = await pool.query('SELECT * FROM bookings WHERE "pnr" = $1', [booking.pnr]);
    const updated = updatedRes.rows[0];
    const formatted = await formatValidation(updated, pool);

    res.json({
      success: true,
      alreadyBoarded: false,
      booking: formatted,
      message: 'Ticket Validated Successfully! Passenger approved for boarding. ✅',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

async function formatValidation(b: any, pool = getPool()) {
  const seatIds: string[] = typeof b.seatIds === 'string' ? JSON.parse(b.seatIds || '[]') : (b.seatIds || []);
  let boardingPoint: any = null;
  if (b.boardingPointId) {
    const bpRes = await pool.query('SELECT * FROM boarding_points WHERE "id" = $1', [b.boardingPointId]);
    boardingPoint = bpRes.rows[0];
  }

  return {
    pnr: b.pnr,
    bookingStatus: b.bookingStatus,
    passenger: {
      fullName: b.passengerName,
      phone: b.passengerPhone,
      gender: b.passengerGender,
    },
    seats: seatIds,
    route: `${b.origin} → ${b.destination}`,
    departureDate: b.departureDate,
    departureTime: b.departureTime,
    boardingPoint: boardingPoint?.name || 'Unknown',
    totalFare: b.totalFare,
  };
}
