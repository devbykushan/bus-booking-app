import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';
import { isSeatLockedBySession, unlockSeats } from '../locks/seatLocks';
import { sendWhatsAppETicket } from '../services/wahaService';
import { v4 as uuidv4 } from 'uuid';

export const bookingsRouter = Router();

// ─── Helper: build booking response shape ─────────────────────────────────────
async function formatBooking(b: any, pool = getPool()) {
  if (!b) return null;

  const seatIds: string[] = typeof b.seatIds === 'string' ? JSON.parse(b.seatIds || '[]') : (b.seatIds || []);

  let seats: any[] = [];
  if (seatIds.length > 0) {
    const seatsRes = await pool.query('SELECT * FROM seats WHERE "id" = ANY($1::text[])', [seatIds]);
    seats = seatsRes.rows;
  }

  const [bpRes, dpRes] = await Promise.all([
    b.boardingPointId ? pool.query('SELECT * FROM boarding_points WHERE "id" = $1', [b.boardingPointId]) : { rows: [] },
    b.dropPointId ? pool.query('SELECT * FROM boarding_points WHERE "id" = $1', [b.dropPointId]) : { rows: [] },
  ]);

  const boardingPoint = bpRes.rows[0] || null;
  const dropPoint = dpRes.rows[0] || null;

  return {
    ...b,
    seatIds,
    seats,
    boardingPoint,
    dropPoint,
    passenger: {
      fullName: b.passengerName,
      email: b.passengerEmail,
      phone: b.passengerPhone,
      gender: b.passengerGender,
      age: b.passengerAge,
    },
  };
}

// ─── GET /api/bookings ────────────────────────────────────────────────────────
bookingsRouter.get('/', async (_req: Request, res: Response) => {
  const pool = getPool();
  try {
    const bookingsRes = await pool.query('SELECT * FROM bookings ORDER BY "createdAt" DESC');
    const formatted = await Promise.all(bookingsRes.rows.map((b) => formatBooking(b, pool)));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/bookings/:pnr ───────────────────────────────────────────────────
bookingsRouter.get('/:pnr', async (req: Request, res: Response) => {
  const pool = getPool();
  try {
    const bookingRes = await pool.query('SELECT * FROM bookings WHERE "pnr" = $1', [req.params.pnr]);
    const booking = bookingRes.rows[0];
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const formatted = await formatBooking(booking, pool);
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/bookings — Create Booking ─────────────────────────────────────
bookingsRouter.post('/', async (req: Request, res: Response) => {
  const pool = getPool();
  const {
    routeId, boardingPointId, dropPointId, seatIds, sessionId,
    passenger, paymentMethod, promoCode, insuranceSelected, searchDate,
  } = req.body as {
    routeId: string;
    boardingPointId: string;
    dropPointId: string;
    seatIds: string[];
    sessionId: string;
    passenger: { fullName: string; email: string; phone: string; gender: string; age: number };
    paymentMethod: string;
    promoCode?: string;
    insuranceSelected?: boolean;
    searchDate?: string;
  };

  if (!routeId || !seatIds?.length || !passenger?.fullName) {
    res.status(400).json({ error: 'routeId, seatIds, and passenger details are required.' });
    return;
  }

  if (searchDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(searchDate);
    bookingDate.setHours(0, 0, 0, 0);
    const maxAllowed = new Date(today);
    maxAllowed.setDate(maxAllowed.getDate() + 7);
    if (bookingDate < today || bookingDate > maxAllowed) {
      res.status(400).json({ error: 'Bookings are only permitted up to 1 week (7 days) in advance.' });
      return;
    }
  }

  try {
    // Fetch route
    const routeRes = await pool.query('SELECT * FROM routes WHERE "id" = $1', [routeId]);
    const route = routeRes.rows[0];
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Normalize seat IDs to route-prefixed canonical format (e.g. "route-101-17")
    const canonicalSeatIds = seatIds.map((id: string) => {
      if (id.startsWith(`${routeId}-`)) return id;
      const num = id.replace(/^[^-]+-/, '').replace(/^seat-/, '').replace(/^0+/, '');
      return `${routeId}-${num}`;
    });

    // Ensure all canonical seats exist in DB seats table for this routeId
    for (const sId of canonicalSeatIds) {
      const seatNum = sId.replace(`${routeId}-`, '');
      await pool.query(`
        INSERT INTO seats ("id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly")
        VALUES ($1, $2, $3, 'lower', 1, 1, $4, 'available', 0, 0)
        ON CONFLICT ("id") DO NOTHING
      `, [sId, routeId, seatNum, route.priceStarting || 950]);
    }

    // Verify seats belong to the chosen route
    const seatsRes = await pool.query('SELECT * FROM seats WHERE "id" = ANY($1::text[])', [canonicalSeatIds]);
    const seats = seatsRes.rows;

    const invalidSeats = seats.filter((seat: any) => seat.routeId !== routeId);
    if (invalidSeats.length > 0) {
      res.status(400).json({ error: 'All selected seats must belong to the chosen route.' });
      return;
    }

    if (!sessionId || canonicalSeatIds.some((seatId: string) => !isSeatLockedBySession(seatId, sessionId) && !isSeatLockedBySession(seatIds[0], sessionId))) {
      res.status(409).json({ error: 'Your seat hold has expired. Please select your seats again.' });
      return;
    }

    const [bpRes, dpRes] = await Promise.all([
      pool.query("SELECT \"id\" FROM boarding_points WHERE \"id\" = $1 AND \"routeId\" = $2 AND \"type\" = 'boarding'", [boardingPointId, routeId]),
      pool.query("SELECT \"id\" FROM boarding_points WHERE \"id\" = $1 AND \"routeId\" = $2 AND \"type\" = 'drop'", [dropPointId, routeId]),
    ]);

    if (bpRes.rows.length === 0 || dpRes.rows.length === 0) {
      res.status(400).json({ error: 'Boarding and drop-off points must belong to the chosen route.' });
      return;
    }

    const bookedSeats = seats.filter((s: any) => s.status === 'booked');
    if (bookedSeats.length > 0) {
      res.status(409).json({
        error: 'Some seats are already booked.',
        bookedSeatIds: bookedSeats.map((s: any) => s.id),
      });
      return;
    }

    // Calculate fares
    const baseFare = seats.reduce((sum: number, s: any) => sum + Number(s.price), 0);
    const taxAmount = 0; // Removed extra tax surcharge (0% tax)
    const insuranceAmount = insuranceSelected ? 1.50 : 0;

    let discountRate = 0;
    const promo = promoCode?.trim().toUpperCase();
    if (promo === 'BUS2026') discountRate = 0.15;
    else if (promo === 'SAVE10') discountRate = 0.10;
    const discountAmount = Number((baseFare * discountRate).toFixed(2));

    const totalFare = Number((baseFare + insuranceAmount - discountAmount).toFixed(2));

    const pnr = `OMNI-${Math.floor(10000 + Math.random() * 90000)}`;
    const bookingId = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;
    const origin = req.headers.origin || 'http://localhost:5173';
    const qrCodeData = `${origin}/#validate?pnr=${pnr}&pass=${encodeURIComponent(passenger.fullName)}`;
    const departureDate = searchDate || new Date().toISOString().split('T')[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO bookings (
          "id", "pnr", "routeId", "operatorName", "busNumber", "busType", "origin", "destination",
          "departureDate", "departureTime", "boardingPointId", "dropPointId", "seatIds", "passengerName",
          "passengerEmail", "passengerPhone", "passengerGender", "passengerAge", "baseFare", "taxAmount",
          "insuranceAmount", "discountAmount", "totalFare", "promoCodeApplied", "paymentMethod", "paymentStatus",
          "bookingStatus", "qrCodeData", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'paid', 'confirmed', $26, $27)
      `, [
        bookingId, pnr, routeId, route.operatorName, route.busNumber, route.busType,
        route.origin, route.destination, departureDate, route.departureTime,
        boardingPointId, dropPointId, JSON.stringify(seatIds),
        passenger.fullName, passenger.email, passenger.phone, passenger.gender, passenger.age,
        baseFare, taxAmount, insuranceAmount, discountAmount, totalFare,
        promo || null, paymentMethod || 'card',
        qrCodeData, new Date().toISOString(),
      ]);

      // Mark seats as booked in DB
      await client.query('UPDATE seats SET "status" = \'booked\' WHERE "id" = ANY($1::text[]) OR "id" = ANY($2::text[])', [canonicalSeatIds, seatIds]);

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Release in-memory seat locks for this session
    if (sessionId) {
      unlockSeats(seatIds, sessionId);
    }

    const newBookingRes = await pool.query('SELECT * FROM bookings WHERE "id" = $1', [bookingId]);
    const formatted = await formatBooking(newBookingRes.rows[0], pool);

    // Non-blocking trigger for WhatsApp E-Ticket sending via WAHA
    sendWhatsAppETicket({
      pnr,
      passengerName: passenger.fullName,
      passengerPhone: passenger.phone,
      busNumber: route.busNumber || 'ND-3223',
      busType: route.busType || 'Normal Service',
      origin: route.origin || 'Monaragala',
      destination: route.destination || 'Colombo',
      departureDate,
      departureTime: route.departureTime || '05:00 AM',
      seatNumbers: seatIds.map((id: string) => id.replace(/^[^-]+-/, '').replace(/^seat-/, '')),
      totalFare,
      paymentMethod: paymentMethod || 'card',
    }).catch(err => console.error('[WAHA Async Error]', err));

    res.status(201).json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/bookings/:pnr/cancel ─────────────────────────────────────────
bookingsRouter.patch('/:pnr/cancel', async (req: Request, res: Response) => {
  const pool = getPool();
  const { pnr } = req.params;

  try {
    const bookingRes = await pool.query('SELECT * FROM bookings WHERE "pnr" = $1', [pnr]);
    const booking = bookingRes.rows[0];
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.bookingStatus === 'cancelled') {
      res.status(400).json({ error: 'Booking is already cancelled' });
      return;
    }

    // 4-Hour Cancellation Window Validation for Passengers
    const isAdmin = req.query.adminOverride === 'true';
    if (!isAdmin && booking.createdAt) {
      const createdTime = new Date(booking.createdAt).getTime();
      const now = Date.now();
      const hoursPassed = (now - createdTime) / (1000 * 60 * 60);
      if (hoursPassed > 4) {
        res.status(400).json({
          error: 'Cancellation window expired. Bookings can only be cancelled within 4 hours of booking.',
        });
        return;
      }
    }

    const seatIds: string[] = typeof booking.seatIds === 'string' ? JSON.parse(booking.seatIds || '[]') : (booking.seatIds || []);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE bookings SET \"bookingStatus\" = 'cancelled', \"paymentStatus\" = 'refunded' WHERE \"pnr\" = $1", [pnr]);

      if (seatIds.length > 0) {
        await client.query("UPDATE seats SET \"status\" = 'available' WHERE \"id\" = ANY($1::text[])", [seatIds]);
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    res.json({ success: true, pnr, message: 'Booking cancelled. Refund will be processed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
