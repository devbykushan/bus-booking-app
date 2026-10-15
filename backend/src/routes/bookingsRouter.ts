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
    isCounterBooking,
  } = req.body as {
    routeId: string;
    boardingPointId: string;
    dropPointId: string;
    seatIds: string[];
    sessionId?: string;
    passenger: { fullName: string; email?: string; phone: string; gender?: string; age?: number };
    paymentMethod: string;
    promoCode?: string;
    insuranceSelected?: boolean;
    searchDate?: string;
    isCounterBooking?: boolean;
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

    const effectiveDate = searchDate || route.departureDate;
    if (effectiveDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(effectiveDate);
      bookingDate.setHours(0, 0, 0, 0);
      const maxAllowed = new Date(today);
      maxAllowed.setDate(maxAllowed.getDate() + 7);
      if (bookingDate < today || bookingDate > maxAllowed) {
        res.status(400).json({ error: 'Bookings are only permitted up to 1 week (7 days) in advance.' });
        return;
      }

      // If booking is for today, verify departure time has not passed
      if (bookingDate.getTime() === today.getTime() && route.departureTime) {
        const match = route.departureTime.trim().match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = match[2] ? parseInt(match[2], 10) : 0;
          const meridian = match[3]?.toLowerCase();
          if (meridian === 'pm' && hours < 12) hours += 12;
          if (meridian === 'am' && hours === 12) hours = 0;

          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const tripMinutes = hours * 60 + minutes;
          if (tripMinutes <= currentMinutes) {
            res.status(400).json({ error: 'This bus departure time has already passed for today. Please select a future trip.' });
            return;
          }
        }
      }
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
      `, [sId, routeId, seatNum, route.priceStarting || 1157]);
    }

    // Verify seats belong to the chosen route
    const seatsRes = await pool.query('SELECT * FROM seats WHERE "id" = ANY($1::text[])', [canonicalSeatIds]);
    const seats = seatsRes.rows;

    const invalidSeats = seats.filter((seat: any) => seat.routeId !== routeId);
    if (invalidSeats.length > 0) {
      res.status(400).json({ error: 'All selected seats must belong to the chosen route.' });
      return;
    }

    if (!isCounterBooking) {
      if (!sessionId || canonicalSeatIds.some((seatId: string) => !isSeatLockedBySession(seatId, sessionId) && !isSeatLockedBySession(seatIds[0], sessionId))) {
        res.status(409).json({ error: 'Your seat hold has expired. Please select your seats again.' });
        return;
      }
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      `, [
        bookingId, pnr, routeId, route.operatorName, route.busNumber, route.busType,
        route.origin, route.destination, departureDate, route.departureTime,
        boardingPointId, dropPointId, JSON.stringify(seatIds),
        passenger.fullName, passenger.email || '', passenger.phone, passenger.gender || 'unspecified', passenger.age || 0,
        baseFare, taxAmount, insuranceAmount, discountAmount, totalFare,
        promo || null, paymentMethod || 'card',
        paymentMethod === 'bank_transfer' ? 'pending' : 'paid',
        paymentMethod === 'bank_transfer' ? 'pending_payment' : 'confirmed',
        qrCodeData, new Date().toISOString(),
      ]);

      // Mark seats as booked in DB
      const seatNewStatus = (paymentMethod || 'card') === 'bank_transfer' ? 'reserved' : 'booked';
      await client.query(`UPDATE seats SET "status" = '${seatNewStatus}' WHERE "id" = ANY($1::text[]) OR "id" = ANY($2::text[])`, [canonicalSeatIds, seatIds]);

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
    if ((paymentMethod || 'card') !== 'bank_transfer') {
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
    }

    res.status(201).json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/bookings/round-trip — Create Combined Round-Trip Booking ─────
bookingsRouter.post('/round-trip', async (req: Request, res: Response) => {
  const pool = getPool();
  const {
    outbound,
    returnTrip,
    sessionId,
    passenger,
    paymentMethod,
    promoCode,
    insuranceSelected,
    isCounterBooking,
  } = req.body as {
    outbound: {
      routeId: string;
      boardingPointId: string;
      dropPointId: string;
      seatIds: string[];
      searchDate?: string;
    };
    returnTrip: {
      routeId: string;
      boardingPointId: string;
      dropPointId: string;
      seatIds: string[];
      searchDate?: string;
    };
    sessionId?: string;
    passenger: { fullName: string; email?: string; phone: string; gender?: string; age?: number };
    paymentMethod: string;
    promoCode?: string;
    insuranceSelected?: boolean;
    isCounterBooking?: boolean;
  };

  if (!outbound?.routeId || !outbound?.seatIds?.length || !returnTrip?.routeId || !returnTrip?.seatIds?.length || !passenger?.fullName) {
    res.status(400).json({ error: 'Outbound route, return route, seats, and passenger details are required for round-trip booking.' });
    return;
  }

  // Validate dates (within 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxAllowed = new Date(today);
  maxAllowed.setDate(maxAllowed.getDate() + 7);

  const outboundDate = new Date(outbound.searchDate || new Date());
  outboundDate.setHours(0, 0, 0, 0);
  const returnDate = new Date(returnTrip.searchDate || new Date());
  returnDate.setHours(0, 0, 0, 0);

  if (outboundDate < today || outboundDate > maxAllowed || returnDate < today || returnDate > maxAllowed) {
    res.status(400).json({ error: 'Bookings are only permitted up to 1 week (7 days) in advance.' });
    return;
  }

  if (returnDate < outboundDate) {
    res.status(400).json({ error: 'Return date must be equal to or after departure date.' });
    return;
  }

  try {
    // 1. Fetch both routes
    const [outboundRouteRes, returnRouteRes] = await Promise.all([
      pool.query('SELECT * FROM routes WHERE "id" = $1', [outbound.routeId]),
      pool.query('SELECT * FROM routes WHERE "id" = $1', [returnTrip.routeId]),
    ]);

    const outboundRoute = outboundRouteRes.rows[0];
    const returnRoute = returnRouteRes.rows[0];

    if (!outboundRoute || !returnRoute) {
      res.status(404).json({ error: 'One or both routes not found.' });
      return;
    }

    // Canonical seat IDs
    const canonicalOutboundSeatIds = outbound.seatIds.map((id: string) => {
      if (id.startsWith(`${outbound.routeId}-`)) return id;
      const num = id.replace(/^[^-]+-/, '').replace(/^seat-/, '').replace(/^0+/, '');
      return `${outbound.routeId}-${num}`;
    });

    const canonicalReturnSeatIds = returnTrip.seatIds.map((id: string) => {
      if (id.startsWith(`${returnTrip.routeId}-`)) return id;
      const num = id.replace(/^[^-]+-/, '').replace(/^seat-/, '').replace(/^0+/, '');
      return `${returnTrip.routeId}-${num}`;
    });

    // Ensure seats exist in DB
    for (const sId of canonicalOutboundSeatIds) {
      const seatNum = sId.replace(`${outbound.routeId}-`, '');
      await pool.query(`
        INSERT INTO seats ("id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly")
        VALUES ($1, $2, $3, 'lower', 1, 1, $4, 'available', 0, 0)
        ON CONFLICT ("id") DO NOTHING
      `, [sId, outbound.routeId, seatNum, outboundRoute.priceStarting || 1157]);
    }

    for (const sId of canonicalReturnSeatIds) {
      const seatNum = sId.replace(`${returnTrip.routeId}-`, '');
      await pool.query(`
        INSERT INTO seats ("id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly")
        VALUES ($1, $2, $3, 'lower', 1, 1, $4, 'available', 0, 0)
        ON CONFLICT ("id") DO NOTHING
      `, [sId, returnTrip.routeId, seatNum, returnRoute.priceStarting || 1157]);
    }

    // Verify seats
    const [outboundSeatsRes, returnSeatsRes] = await Promise.all([
      pool.query('SELECT * FROM seats WHERE "id" = ANY($1::text[])', [canonicalOutboundSeatIds]),
      pool.query('SELECT * FROM seats WHERE "id" = ANY($1::text[])', [canonicalReturnSeatIds]),
    ]);

    const outboundSeats = outboundSeatsRes.rows;
    const returnSeats = returnSeatsRes.rows;

    const bookedOutbound = outboundSeats.filter((s: any) => s.status === 'booked');
    const bookedReturn = returnSeats.filter((s: any) => s.status === 'booked');

    if (bookedOutbound.length > 0 || bookedReturn.length > 0) {
      res.status(409).json({
        error: 'Some seats are already booked.',
        bookedOutboundIds: bookedOutbound.map((s: any) => s.id),
        bookedReturnIds: bookedReturn.map((s: any) => s.id),
      });
      return;
    }

    // Calculate fares
    const outboundBase = outboundSeats.reduce((sum: number, s: any) => sum + Number(s.price), 0);
    const returnBase = returnSeats.reduce((sum: number, s: any) => sum + Number(s.price), 0);
    const combinedBase = outboundBase + returnBase;

    let discountRate = 0;
    const promo = promoCode?.trim().toUpperCase();
    if (promo === 'BUS2026') discountRate = 0.15;
    else if (promo === 'SAVE10') discountRate = 0.10;

    const totalDiscount = Number((combinedBase * discountRate).toFixed(2));
    const outboundDiscount = combinedBase > 0 ? Number(((outboundBase / combinedBase) * totalDiscount).toFixed(2)) : 0;
    const returnDiscount = Number((totalDiscount - outboundDiscount).toFixed(2));

    const outboundTotal = Number((outboundBase - outboundDiscount).toFixed(2));
    const returnTotal = Number((returnBase - returnDiscount).toFixed(2));
    const combinedTotal = Number((outboundTotal + returnTotal).toFixed(2));

    const groupId = `RT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const outboundPnr = `OMNI-${Math.floor(10000 + Math.random() * 90000)}`;
    let returnPnr = `OMNI-${Math.floor(10000 + Math.random() * 90000)}`;
    if (returnPnr === outboundPnr) {
      returnPnr = `OMNI-${Math.floor(10000 + Math.random() * 90000) + 1}`;
    }

    const outboundBookingId = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;
    const returnBookingId = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;

    const origin = req.headers.origin || 'http://localhost:5173';
    const outboundQr = `${origin}/#validate?pnr=${outboundPnr}&pass=${encodeURIComponent(passenger.fullName)}`;
    const returnQr = `${origin}/#validate?pnr=${returnPnr}&pass=${encodeURIComponent(passenger.fullName)}`;

    const outboundDateStr = outbound.searchDate || new Date().toISOString().split('T')[0];
    const returnDateStr = returnTrip.searchDate || new Date().toISOString().split('T')[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert Outbound Booking
      await client.query(`
        INSERT INTO bookings (
          "id", "pnr", "routeId", "operatorName", "busNumber", "busType", "origin", "destination",
          "departureDate", "departureTime", "boardingPointId", "dropPointId", "seatIds", "passengerName",
          "passengerEmail", "passengerPhone", "passengerGender", "passengerAge", "baseFare", "taxAmount",
          "insuranceAmount", "discountAmount", "totalFare", "promoCodeApplied", "paymentMethod", "paymentStatus",
          "bookingStatus", "qrCodeData", "createdAt", "roundTripGroupId", "legType", "linkedPnr"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      `, [
        outboundBookingId, outboundPnr, outbound.routeId, outboundRoute.operatorName, outboundRoute.busNumber, outboundRoute.busType,
        outboundRoute.origin, outboundRoute.destination, outboundDateStr, outboundRoute.departureTime,
        outbound.boardingPointId, outbound.dropPointId, JSON.stringify(outbound.seatIds),
        passenger.fullName, passenger.email || '', passenger.phone, passenger.gender || 'unspecified', passenger.age || 0,
        outboundBase, 0, 0, outboundDiscount, outboundTotal,
        promo || null, paymentMethod || 'card',
        paymentMethod === 'bank_transfer' ? 'pending' : 'paid',
        paymentMethod === 'bank_transfer' ? 'pending_payment' : 'confirmed',
        outboundQr, new Date().toISOString(),
        groupId, 'outbound', returnPnr,
      ]);

      // 2. Insert Return Booking
      await client.query(`
        INSERT INTO bookings (
          "id", "pnr", "routeId", "operatorName", "busNumber", "busType", "origin", "destination",
          "departureDate", "departureTime", "boardingPointId", "dropPointId", "seatIds", "passengerName",
          "passengerEmail", "passengerPhone", "passengerGender", "passengerAge", "baseFare", "taxAmount",
          "insuranceAmount", "discountAmount", "totalFare", "promoCodeApplied", "paymentMethod", "paymentStatus",
          "bookingStatus", "qrCodeData", "createdAt", "roundTripGroupId", "legType", "linkedPnr"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      `, [
        returnBookingId, returnPnr, returnTrip.routeId, returnRoute.operatorName, returnRoute.busNumber, returnRoute.busType,
        returnRoute.origin, returnRoute.destination, returnDateStr, returnRoute.departureTime,
        returnTrip.boardingPointId, returnTrip.dropPointId, JSON.stringify(returnTrip.seatIds),
        passenger.fullName, passenger.email || '', passenger.phone, passenger.gender || 'unspecified', passenger.age || 0,
        returnBase, 0, 0, returnDiscount, returnTotal,
        promo || null, paymentMethod || 'card',
        paymentMethod === 'bank_transfer' ? 'pending' : 'paid',
        paymentMethod === 'bank_transfer' ? 'pending_payment' : 'confirmed',
        returnQr, new Date().toISOString(),
        groupId, 'return', outboundPnr,
      ]);

      // 3. Mark seats in DB
      const seatStatus = (paymentMethod || 'card') === 'bank_transfer' ? 'reserved' : 'booked';
      await client.query(`UPDATE seats SET "status" = '${seatStatus}' WHERE "id" = ANY($1::text[]) OR "id" = ANY($2::text[])`, [canonicalOutboundSeatIds, outbound.seatIds]);
      await client.query(`UPDATE seats SET "status" = '${seatStatus}' WHERE "id" = ANY($1::text[]) OR "id" = ANY($2::text[])`, [canonicalReturnSeatIds, returnTrip.seatIds]);

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Release locks
    if (sessionId) {
      unlockSeats(outbound.seatIds, sessionId);
      unlockSeats(returnTrip.seatIds, sessionId);
    }

    const [newOutboundRes, newReturnRes] = await Promise.all([
      pool.query('SELECT * FROM bookings WHERE "id" = $1', [outboundBookingId]),
      pool.query('SELECT * FROM bookings WHERE "id" = $1', [returnBookingId]),
    ]);

    const formattedOutbound = await formatBooking(newOutboundRes.rows[0], pool);
    const formattedReturn = await formatBooking(newReturnRes.rows[0], pool);

    // Send WhatsApp E-Tickets asynchronously
    if ((paymentMethod || 'card') !== 'bank_transfer') {
      sendWhatsAppETicket({
        pnr: outboundPnr,
        passengerName: passenger.fullName,
        passengerPhone: passenger.phone,
        busNumber: outboundRoute.busNumber || 'ND-3223',
        busType: `${outboundRoute.busType} [Outbound]`,
        origin: outboundRoute.origin,
        destination: outboundRoute.destination,
        departureDate: outboundDateStr,
        departureTime: outboundRoute.departureTime,
        seatNumbers: outbound.seatIds.map((id: string) => id.replace(/^[^-]+-/, '').replace(/^seat-/, '')),
        totalFare: outboundTotal,
        paymentMethod: paymentMethod || 'card',
      }).catch(err => console.error('[WAHA Outbound Error]', err));

      setTimeout(() => {
        sendWhatsAppETicket({
          pnr: returnPnr,
          passengerName: passenger.fullName,
          passengerPhone: passenger.phone,
          busNumber: returnRoute.busNumber || 'ND-3223',
          busType: `${returnRoute.busType} [Return]`,
          origin: returnRoute.origin,
          destination: returnRoute.destination,
          departureDate: returnDateStr,
          departureTime: returnRoute.departureTime,
          seatNumbers: returnTrip.seatIds.map((id: string) => id.replace(/^[^-]+-/, '').replace(/^seat-/, '')),
          totalFare: returnTotal,
          paymentMethod: paymentMethod || 'card',
        }).catch(err => console.error('[WAHA Return Error]', err));
      }, 3000);
    }

    res.status(201).json({
      success: true,
      groupId,
      outbound: formattedOutbound,
      return: formattedReturn,
      combinedTotalFare: combinedTotal,
    });
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
