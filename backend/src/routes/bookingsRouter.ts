import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { isSeatLockedBySession, unlockSeats } from '../locks/seatLocks';
import { v4 as uuidv4 } from 'uuid';

export const bookingsRouter = Router();

// ─── Helper: build booking response shape ─────────────────────────────────────
function formatBooking(b: any) {
  const db = getDb();

  const seatIds: string[] = JSON.parse(b.seatIds || '[]');
  const seats = seatIds.map((id: string) => {
    return db.prepare('SELECT * FROM seats WHERE id = ?').get(id);
  }).filter(Boolean);

  const boardingPoint = db.prepare('SELECT * FROM boarding_points WHERE id = ?').get(b.boardingPointId);
  const dropPoint = db.prepare('SELECT * FROM boarding_points WHERE id = ?').get(b.dropPointId);

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
bookingsRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all() as any[];
  res.json(bookings.map(formatBooking));
});

// ─── GET /api/bookings/:pnr ───────────────────────────────────────────────────
bookingsRouter.get('/:pnr', (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE pnr = ?').get(req.params.pnr) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  res.json(formatBooking(booking));
});

// ─── POST /api/bookings — Create Booking ─────────────────────────────────────
bookingsRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
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

  // Fetch route
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId) as any;
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  // Verify seats are available (not booked by someone else)
  const seats = seatIds.map((id: string) =>
    db.prepare('SELECT * FROM seats WHERE id = ?').get(id)
  ).filter(Boolean) as any[];

  if (seats.length !== seatIds.length || seats.some((seat: any) => seat.routeId !== routeId)) {
    res.status(400).json({ error: 'All selected seats must belong to the chosen route.' });
    return;
  }

  if (!sessionId || seatIds.some((seatId: string) => !isSeatLockedBySession(seatId, sessionId))) {
    res.status(409).json({ error: 'Your seat hold has expired. Please select your seats again.' });
    return;
  }

  const boardingPoint = db.prepare(
    "SELECT id FROM boarding_points WHERE id = ? AND routeId = ? AND type = 'boarding'"
  ).get(boardingPointId, routeId);
  const dropPoint = db.prepare(
    "SELECT id FROM boarding_points WHERE id = ? AND routeId = ? AND type = 'drop'"
  ).get(dropPointId, routeId);
  if (!boardingPoint || !dropPoint) {
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
  const baseFare = seats.reduce((sum: number, s: any) => sum + s.price, 0);
  const taxAmount = Number((baseFare * 0.10).toFixed(2));
  const insuranceAmount = insuranceSelected ? 1.50 : 0;

  let discountRate = 0;
  const promo = promoCode?.trim().toUpperCase();
  if (promo === 'BUS2026') discountRate = 0.15;
  else if (promo === 'SAVE10') discountRate = 0.10;
  const discountAmount = Number((baseFare * discountRate).toFixed(2));

  const totalFare = Number((baseFare + taxAmount + insuranceAmount - discountAmount).toFixed(2));

  const pnr = `OMNI-${Math.floor(10000 + Math.random() * 90000)}`;
  const bookingId = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;
  const qrCodeData = `PNR:${pnr}|PASS:${passenger.fullName}|BUS:${route.busNumber}|SEATS:${seatIds.join(',')}`;
  const departureDate = searchDate || new Date().toISOString().split('T')[0];

  // Atomic transaction: create booking + mark seats booked
  const createBooking = db.transaction(() => {
    db.prepare(`
      INSERT INTO bookings (id, pnr, routeId, operatorName, busNumber, busType, origin, destination,
        departureDate, departureTime, boardingPointId, dropPointId, seatIds, passengerName,
        passengerEmail, passengerPhone, passengerGender, passengerAge, baseFare, taxAmount,
        insuranceAmount, discountAmount, totalFare, promoCodeApplied, paymentMethod, paymentStatus,
        bookingStatus, qrCodeData, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'confirmed', ?, ?)
    `).run(
      bookingId, pnr, routeId, route.operatorName, route.busNumber, route.busType,
      route.origin, route.destination, departureDate, route.departureTime,
      boardingPointId, dropPointId, JSON.stringify(seatIds),
      passenger.fullName, passenger.email, passenger.phone, passenger.gender, passenger.age,
      baseFare, taxAmount, insuranceAmount, discountAmount, totalFare,
      promo || null, paymentMethod || 'card',
      qrCodeData, new Date().toISOString(),
    );

    // Mark seats as booked in DB
    for (const seatId of seatIds) {
      db.prepare("UPDATE seats SET status = 'booked' WHERE id = ?").run(seatId);
    }
  });

  createBooking();

  // Release in-memory seat locks for this session
  if (sessionId) {
    unlockSeats(seatIds, sessionId);
  }

  const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  res.status(201).json(formatBooking(newBooking));
});

// ─── PATCH /api/bookings/:pnr/cancel ─────────────────────────────────────────
bookingsRouter.patch('/:pnr/cancel', (req: Request, res: Response) => {
  const db = getDb();
  const { pnr } = req.params;

  const booking = db.prepare('SELECT * FROM bookings WHERE pnr = ?').get(pnr) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  if (booking.bookingStatus === 'cancelled') {
    res.status(400).json({ error: 'Booking is already cancelled' });
    return;
  }

  const cancelBooking = db.transaction(() => {
    db.prepare("UPDATE bookings SET bookingStatus = 'cancelled', paymentStatus = 'refunded' WHERE pnr = ?").run(pnr);

    // Free up seats
    const seatIds: string[] = JSON.parse(booking.seatIds || '[]');
    for (const seatId of seatIds) {
      db.prepare("UPDATE seats SET status = 'available' WHERE id = ?").run(seatId);
    }
  });

  cancelBooking();

  res.json({ success: true, pnr, message: 'Booking cancelled. Refund will be processed.' });
});
