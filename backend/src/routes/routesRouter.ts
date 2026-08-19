import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { seatLocks } from '../locks/seatLocks';

export const routesRouter = Router();

// ─── GET /api/routes ──────────────────────────────────────────────────────────
routesRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();

  const rawRoutes = db.prepare('SELECT * FROM routes ORDER BY operatorName').all() as any[];

  const routes = rawRoutes.map((r) => {
    const seats = db
      .prepare('SELECT * FROM seats WHERE routeId = ? ORDER BY deck, row, col')
      .all(r.id) as any[];

    const boardingPoints = db
      .prepare("SELECT * FROM boarding_points WHERE routeId = ? AND type = 'boarding' ORDER BY time")
      .all(r.id) as any[];

    const dropPoints = db
      .prepare("SELECT * FROM boarding_points WHERE routeId = ? AND type = 'drop' ORDER BY time")
      .all(r.id) as any[];

    // Apply in-memory lock state to seats
    const now = Date.now();
    const seatsWithLocks = seats.map((seat: any) => {
      const lock = seatLocks.get(seat.id);
      const isLocked = lock && lock.expiresAt > now;
      return {
        ...seat,
        isSleeper: seat.isSleeper === 1,
        isFemaleOnly: seat.isFemaleOnly === 1,
        status: isLocked && seat.status !== 'booked' ? 'locked' : seat.status,
        lockedBySession: isLocked ? lock!.sessionId : undefined,
      };
    });

    const availableSeatsCount = seatsWithLocks.filter((s: any) => s.status === 'available').length;

    return {
      ...r,
      hasUpperDeck: r.hasUpperDeck === 1,
      amenities: JSON.parse(r.amenities || '[]'),
      seats: seatsWithLocks,
      boardingPoints,
      dropPoints,
      availableSeatsCount,
      totalSeatsCount: seats.length,
      gpsLocation: {
        lat: r.gpsLat,
        lng: r.gpsLng,
        speedKmH: r.gpsSpeedKmH,
        currentStopName: r.gpsCurrentStop,
        nextStopName: r.gpsNextStop,
        etaMinutes: r.gpsEtaMinutes,
        lastUpdated: 'Just now',
      },
    };
  });

  res.json(routes);
});

// ─── GET /api/routes/:id ──────────────────────────────────────────────────────
routesRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id) as any;
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  const seats = db
    .prepare('SELECT * FROM seats WHERE routeId = ? ORDER BY deck, row, col')
    .all(id) as any[];

  const boardingPoints = db
    .prepare("SELECT * FROM boarding_points WHERE routeId = ? AND type = 'boarding'")
    .all(id) as any[];

  const dropPoints = db
    .prepare("SELECT * FROM boarding_points WHERE routeId = ? AND type = 'drop'")
    .all(id) as any[];

  const now = Date.now();
  const seatsWithLocks = seats.map((seat: any) => {
    const lock = seatLocks.get(seat.id);
    const isLocked = lock && lock.expiresAt > now;
    return {
      ...seat,
      isSleeper: seat.isSleeper === 1,
      isFemaleOnly: seat.isFemaleOnly === 1,
      status: isLocked && seat.status !== 'booked' ? 'locked' : seat.status,
    };
  });

  res.json({
    ...route,
    hasUpperDeck: route.hasUpperDeck === 1,
    amenities: JSON.parse(route.amenities || '[]'),
    seats: seatsWithLocks,
    boardingPoints,
    dropPoints,
    availableSeatsCount: seatsWithLocks.filter((s: any) => s.status === 'available').length,
    totalSeatsCount: seats.length,
    gpsLocation: {
      lat: route.gpsLat,
      lng: route.gpsLng,
      speedKmH: route.gpsSpeedKmH,
      currentStopName: route.gpsCurrentStop,
      nextStopName: route.gpsNextStop,
      etaMinutes: route.gpsEtaMinutes,
      lastUpdated: 'Just now',
    },
  });
});

// ─── POST /api/routes — Add new route (Operator) ──────────────────────────────
routesRouter.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    id, operatorId, operatorName, operatorRating, busNumber, busType,
    origin, destination, departureTime, arrivalTime, duration, priceStarting, hasUpperDeck,
    amenities, seats: customSeats,
  } = req.body;

  try {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO routes (id, operatorId, operatorName, operatorRating, busNumber, busType,
          origin, destination, departureTime, arrivalTime, duration, priceStarting, hasUpperDeck,
          amenities, gpsLat, gpsLng, gpsSpeedKmH, gpsCurrentStop, gpsNextStop, gpsEtaMinutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 6.8722, 81.3507, 72, 'Main Terminal', 'En Route', 360)
      `).run(
        id, operatorId, operatorName, operatorRating || 4.9, busNumber, busType,
        origin, destination, departureTime, arrivalTime || '04:00 PM', duration || '5h 30m', priceStarting || 1800,
        hasUpperDeck ? 1 : 0, JSON.stringify(amenities || ['Wi-Fi', 'AC', 'Live GPS']),
      );

      // Generate seats or insert custom seats
      const insertSeat = db.prepare(`
        INSERT INTO seats (id, routeId, number, deck, row, col, price, status, isSleeper, isFemaleOnly)
        VALUES (@id, @routeId, @number, @deck, @row, @col, @price, @status, @isSleeper, @isFemaleOnly)
      `);

      let seatsToInsert = customSeats;
      if (!seatsToInsert || seatsToInsert.length === 0) {
        // Auto-generate based on busType
        const totalRows = busType.includes('3*2') || busType.includes('Leyland') ? 11 : busType.includes('2*2') ? 14 : 10;
        seatsToInsert = [];

        if (busType.includes('3*2') || busType.includes('Leyland')) {
          for (let r = 1; r <= totalRows; r++) {
            for (const c of [1, 2, 3, 5, 6]) {
              const seatLetter = String.fromCharCode(64 + (c > 4 ? c - 1 : c));
              const seatNum = `${r}${seatLetter}`;
              seatsToInsert.push({
                id: `${id}-${seatNum}`,
                routeId: id,
                number: seatNum,
                deck: 'lower',
                row: r,
                col: c,
                price: priceStarting || 1800,
                status: 'available',
                isSleeper: 0,
                isFemaleOnly: (r === 2 || r === 3) && c <= 3 ? 1 : 0,
              });
            }
          }
          for (const c of [1, 2]) {
            const seatNum = `12${String.fromCharCode(64 + c)}`;
            seatsToInsert.push({
              id: `${id}-${seatNum}`,
              routeId: id,
              number: seatNum,
              deck: 'lower',
              row: 12,
              col: c,
              price: priceStarting || 1800,
              status: 'available',
              isSleeper: 0,
              isFemaleOnly: 0,
            });
          }
        } else {
          for (let r = 1; r <= totalRows; r++) {
            for (const c of [1, 2, 4, 5]) {
              const seatLetter = String.fromCharCode(64 + (c > 3 ? c - 1 : c));
              const seatNum = `${r}${seatLetter}`;
              seatsToInsert.push({
                id: `${id}-${seatNum}`,
                routeId: id,
                number: seatNum,
                deck: 'lower',
                row: r,
                col: c,
                price: priceStarting || 1800,
                status: 'available',
                isSleeper: 0,
                isFemaleOnly: (r === 2 || r === 3) && c <= 2 ? 1 : 0,
              });
            }
          }
        }
      }

      for (const seat of seatsToInsert) {
        insertSeat.run({
          id: seat.id || `${id}-${seat.number}`,
          routeId: id,
          number: seat.number,
          deck: seat.deck || 'lower',
          row: seat.row,
          col: seat.col,
          price: seat.price || priceStarting || 1800,
          status: seat.status || 'available',
          isSleeper: seat.isSleeper ? 1 : 0,
          isFemaleOnly: seat.isFemaleOnly ? 1 : 0,
        });
      }
    })();

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── PUT /api/routes/:id/layout — Admin Customize Seat Grid ──────────────────
routesRouter.put('/:id/layout', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { busType, priceStarting, seats } = req.body;

  try {
    db.transaction(() => {
      if (busType) {
        db.prepare('UPDATE routes SET busType = ?, priceStarting = ? WHERE id = ?').run(
          busType,
          priceStarting || 1800,
          id
        );
      }

      if (seats && Array.isArray(seats)) {
        db.prepare('DELETE FROM seats WHERE routeId = ?').run(id);

        const insertSeat = db.prepare(`
          INSERT INTO seats (id, routeId, number, deck, row, col, price, status, isSleeper, isFemaleOnly)
          VALUES (@id, @routeId, @number, @deck, @row, @col, @price, @status, @isSleeper, @isFemaleOnly)
        `);

        for (const seat of seats) {
          insertSeat.run({
            id: seat.id || `${id}-${seat.number}`,
            routeId: id,
            number: seat.number,
            deck: seat.deck || 'lower',
            row: seat.row,
            col: seat.col,
            price: seat.price,
            status: seat.status || 'available',
            isSleeper: seat.isSleeper ? 1 : 0,
            isFemaleOnly: seat.isFemaleOnly ? 1 : 0,
          });
        }
      }
    })();

    res.json({ success: true, message: 'Seat layout updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
