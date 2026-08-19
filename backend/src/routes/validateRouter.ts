import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

export const validateRouter = Router();

// ─── POST /api/validate-ticket ────────────────────────────────────────────────
// Body: { pnr: string } — used by Conductor QR Scanner
validateRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { pnr } = req.body as { pnr: string };

  if (!pnr) {
    res.status(400).json({ success: false, message: 'PNR code is required.' });
    return;
  }

  const cleanPnr = pnr.trim().toUpperCase();

  // Match by PNR or by embedded PNR inside QR code data
  const booking = db.prepare(`
    SELECT * FROM bookings
    WHERE UPPER(pnr) = ? OR qrCodeData LIKE ?
  `).get(cleanPnr, `%${cleanPnr}%`) as any;

  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Invalid PNR Code! No matching booking found in our system.',
    });
    return;
  }

  if (booking.bookingStatus === 'cancelled') {
    res.status(400).json({
      success: false,
      booking: formatValidation(booking),
      message: 'This ticket has been cancelled. Refund was processed.',
    });
    return;
  }

  if (booking.bookingStatus === 'boarded') {
    res.json({
      success: true,
      alreadyBoarded: true,
      booking: formatValidation(booking),
      message: 'Passenger has already been scanned and boarded.',
    });
    return;
  }

  // Mark as boarded
  db.prepare("UPDATE bookings SET bookingStatus = 'boarded' WHERE pnr = ?").run(booking.pnr);
  const updated = db.prepare('SELECT * FROM bookings WHERE pnr = ?').get(booking.pnr) as any;

  res.json({
    success: true,
    alreadyBoarded: false,
    booking: formatValidation(updated),
    message: 'Ticket Validated Successfully! Passenger approved for boarding. ✅',
  });
});

function formatValidation(b: any) {
  const db = getDb();
  const seatIds: string[] = JSON.parse(b.seatIds || '[]');
  const boardingPoint = db.prepare('SELECT * FROM boarding_points WHERE id = ?').get(b.boardingPointId) as any;

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
