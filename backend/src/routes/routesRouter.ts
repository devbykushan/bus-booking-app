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
    amenities,
  } = req.body;

  try {
    db.prepare(`
      INSERT INTO routes (id, operatorId, operatorName, operatorRating, busNumber, busType,
        origin, destination, departureTime, arrivalTime, duration, priceStarting, hasUpperDeck,
        amenities, gpsLat, gpsLng, gpsSpeedKmH, gpsCurrentStop, gpsNextStop, gpsEtaMinutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'Origin Terminal', 'En Route', 0)
    `).run(
      id, operatorId, operatorName, operatorRating, busNumber, busType,
      origin, destination, departureTime, arrivalTime, duration, priceStarting,
      hasUpperDeck ? 1 : 0, JSON.stringify(amenities || []),
    );

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
