import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';
import { seatLocks } from '../locks/seatLocks';

export const routesRouter = Router();

// ─── GET /api/routes ──────────────────────────────────────────────────────────
routesRouter.get('/', async (_req: Request, res: Response) => {
  const pool = getPool();

  try {
    const rawRoutesRes = await pool.query('SELECT * FROM routes ORDER BY "operatorName"');
    const rawRoutes = rawRoutesRes.rows;

    const routes = await Promise.all(
      rawRoutes.map(async (r) => {
        const [seatsRes, boardingRes, dropRes] = await Promise.all([
          pool.query('SELECT * FROM seats WHERE "routeId" = $1 ORDER BY "deck", "row", "col"', [r.id]),
          pool.query('SELECT * FROM boarding_points WHERE "routeId" = $1 AND "type" = \'boarding\' ORDER BY "time"', [r.id]),
          pool.query('SELECT * FROM boarding_points WHERE "routeId" = $1 AND "type" = \'drop\' ORDER BY "time"', [r.id]),
        ]);

        const seats = seatsRes.rows;
        const boardingPoints = boardingRes.rows;
        const dropPoints = dropRes.rows;

        // Apply in-memory lock state to seats
        const now = Date.now();
        const seatsWithLocks = seats.map((seat: any) => {
          const lock = seatLocks.get(seat.id);
          const isLocked = lock && lock.expiresAt > now;
          return {
            ...seat,
            isSleeper: seat.isSleeper === 1 || seat.isSleeper === true,
            isFemaleOnly: seat.isFemaleOnly === 1 || seat.isFemaleOnly === true,
            status: isLocked && seat.status !== 'booked' ? 'locked' : seat.status,
            lockedBySession: isLocked ? lock!.sessionId : undefined,
          };
        });

        const availableSeatsCount = seatsWithLocks.filter((s: any) => s.status === 'available').length;

        return {
          ...r,
          hasUpperDeck: r.hasUpperDeck === 1 || r.hasUpperDeck === true,
          amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities || '[]') : (r.amenities || []),
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
      })
    );

    res.json(routes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/routes/:id ──────────────────────────────────────────────────────
routesRouter.get('/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;

  try {
    const routeRes = await pool.query('SELECT * FROM routes WHERE "id" = $1', [id]);
    const route = routeRes.rows[0];

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    const [seatsRes, boardingRes, dropRes] = await Promise.all([
      pool.query('SELECT * FROM seats WHERE "routeId" = $1 ORDER BY "deck", "row", "col"', [id]),
      pool.query('SELECT * FROM boarding_points WHERE "routeId" = $1 AND "type" = \'boarding\'', [id]),
      pool.query('SELECT * FROM boarding_points WHERE "routeId" = $1 AND "type" = \'drop\'', [id]),
    ]);

    const seats = seatsRes.rows;
    const boardingPoints = boardingRes.rows;
    const dropPoints = dropRes.rows;

    const now = Date.now();
    const seatsWithLocks = seats.map((seat: any) => {
      const lock = seatLocks.get(seat.id);
      const isLocked = lock && lock.expiresAt > now;
      return {
        ...seat,
        isSleeper: seat.isSleeper === 1 || seat.isSleeper === true,
        isFemaleOnly: seat.isFemaleOnly === 1 || seat.isFemaleOnly === true,
        status: isLocked && seat.status !== 'booked' ? 'locked' : seat.status,
      };
    });

    res.json({
      ...route,
      hasUpperDeck: route.hasUpperDeck === 1 || route.hasUpperDeck === true,
      amenities: typeof route.amenities === 'string' ? JSON.parse(route.amenities || '[]') : (route.amenities || []),
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/routes — Add new route (Operator) ──────────────────────────────
routesRouter.post('/', async (req: Request, res: Response) => {
  const pool = getPool();
  const {
    id, operatorId, operatorName, operatorRating, busNumber, busType,
    origin, destination, departureTime, arrivalTime, duration, priceStarting, hasUpperDeck,
    amenities, seats: customSeats,
  } = req.body;

  // ─── Server-side Input Validation ──────────────────────────────────────────
  if (!operatorName || typeof operatorName !== 'string' || operatorName.trim().length < 2) {
    res.status(400).json({ error: 'Valid operator name is required (min 2 characters).' });
    return;
  }
  if (!busNumber || typeof busNumber !== 'string') {
    res.status(400).json({ error: 'Valid bus registration number is required.' });
    return;
  }
  const trimmedBusNum = busNumber.trim();
  const numPart = trimmedBusNum.split('-')[1]?.replace(/\D/g, '');
  if (numPart && numPart.length > 4) {
    res.status(400).json({ error: 'Bus registration number cannot exceed 4 digits (e.g., ND-8899 or WP ND-8899).' });
    return;
  }
  const platePattern = /^(([A-Za-z]{1,3}|[0-9]{2,3})\s*[- ]\s*[0-9]{1,4}|(WP|CP|SP|NP|EP|NW|NC|UP|SG)[- ]([A-Za-z]{2,3}|[0-9]{2,3})[- ][0-9]{1,4})$/i;
  const generalPattern = /^[A-Za-z0-9\s\-]+[- ]\d{1,4}$/i;
  if (trimmedBusNum.length < 4 || (!platePattern.test(trimmedBusNum) && !generalPattern.test(trimmedBusNum))) {
    res.status(400).json({ error: 'Valid Sri Lankan bus registration number is required (e.g., ND-8899 or WP ND-8899, max 4 digits).' });
    return;
  }
  if (!busType || typeof busType !== 'string' || !busType.trim()) {
    res.status(400).json({ error: 'Bus model & seating configuration is required.' });
    return;
  }
  if (!origin || typeof origin !== 'string' || !origin.trim() || !destination || typeof destination !== 'string' || !destination.trim()) {
    res.status(400).json({ error: 'Origin and destination cities are required.' });
    return;
  }
  if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
    res.status(400).json({ error: 'Destination city must be different from Origin city.' });
    return;
  }
  if (!departureTime || typeof departureTime !== 'string' || !departureTime.trim()) {
    res.status(400).json({ error: 'Departure time is required.' });
    return;
  }
  const parsedPrice = Number(priceStarting);
  if (isNaN(parsedPrice) || parsedPrice < 500) {
    res.status(400).json({ error: 'Base starting price must be at least 500 LKR.' });
    return;
  }
  if (parsedPrice > 50000) {
    res.status(400).json({ error: 'Base starting price cannot exceed 50,000 LKR.' });
    return;
  }

  const routeId = id || `route-${Date.now()}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      INSERT INTO routes (
        "id", "operatorId", "operatorName", "operatorRating", "busNumber", "busType",
        "origin", "destination", "departureTime", "arrivalTime", "duration", "priceStarting", "hasUpperDeck",
        "amenities", "gpsLat", "gpsLng", "gpsSpeedKmH", "gpsCurrentStop", "gpsNextStop", "gpsEtaMinutes"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 6.8722, 81.3507, 72, 'Main Terminal', 'En Route', 360)
    `, [
      routeId, operatorId || 'op-custom', operatorName.trim(), operatorRating || 4.9, busNumber.trim(), busType.trim(),
      origin.trim(), destination.trim(), departureTime.trim(), arrivalTime || '04:00 PM', duration || '5h 30m', parsedPrice,
      hasUpperDeck ? 1 : 0, JSON.stringify(amenities || ['Wi-Fi', 'AC', 'Live GPS']),
    ]);

    let seatsToInsert = customSeats;
    if (!seatsToInsert || seatsToInsert.length === 0) {
      const totalRows = busType.includes('3*2') || busType.includes('Leyland') ? 11 : busType.includes('2*2') ? 14 : 10;
      seatsToInsert = [];

      if (busType.includes('49 Seats') || busType.includes('Super Luxury')) {
        const femaleSeats = ['15', '19', '20', '23'];
        for (let r = 1; r <= 11; r++) {
          const leftWindowNum = ((r - 1) * 4 + 3).toString();
          const leftAisleNum = ((r - 1) * 4 + 4).toString();
          const rightAisleNum = ((r - 1) * 4 + 2).toString();
          const rightWindowNum = ((r - 1) * 4 + 1).toString();

          seatsToInsert.push(
            { id: `${id}-${leftWindowNum}`, routeId: id, number: leftWindowNum, deck: 'lower', row: r, col: 1, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(leftWindowNum) ? 1 : 0 },
            { id: `${id}-${leftAisleNum}`, routeId: id, number: leftAisleNum, deck: 'lower', row: r, col: 2, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(leftAisleNum) ? 1 : 0 },
            { id: `${id}-${rightAisleNum}`, routeId: id, number: rightAisleNum, deck: 'lower', row: r, col: 4, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(rightAisleNum) ? 1 : 0 },
            { id: `${id}-${rightWindowNum}`, routeId: id, number: rightWindowNum, deck: 'lower', row: r, col: 5, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(rightWindowNum) ? 1 : 0 }
          );
        }
        const backSeats = [
          { num: '47', col: 1 },
          { num: '48', col: 2 },
          { num: '49', col: 3 },
          { num: '46', col: 4 },
          { num: '45', col: 5 },
        ];
        backSeats.forEach(s => {
          seatsToInsert.push({ id: `${id}-${s.num}`, routeId: id, number: s.num, deck: 'lower', row: 12, col: s.col, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
        });
      } else if (busType.includes('58 Seats 3*2') || busType.includes('Normal Service') || busType.includes('54 Seats 3*2') || busType.includes('Ashok Leyland (54 Seats 3*2')) {
        for (let r = 1; r <= 11; r++) {
          for (const c of [1, 2, 3, 5, 6]) {
            const seatNum = `${r}${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
            seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: r, col: c, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 3 ? 1 : 0 });
          }
        }
        for (const c of [1, 2, 3]) {
          const seatNum = `12${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
          seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: 12, col: c, price: parsedPrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
        }
      } else if (busType.includes('Ashok Leyland (54 Seats')) {
        for (let r = 1; r <= 13; r++) {
          for (const c of [1, 2, 4, 5]) {
            const seatNum = `${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
            seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: r, col: c, price: priceStarting || 1800, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 2 ? 1 : 0 });
          }
        }
        for (const c of [1, 2]) {
          const seatNum = `14${String.fromCharCode(64 + c)}`;
          seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: 14, col: c, price: priceStarting || 1800, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
        }
      } else if (busType.includes('Yutong')) {
        for (let r = 1; r <= 12; r++) {
          for (const c of [1, 2, 4, 5]) {
            const seatNum = `Y${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
            seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: r, col: c, price: priceStarting || 1800, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 2 ? 1 : 0 });
          }
        }
        if (busType.includes('51 Seats')) {
          for (const c of [1, 2, 3]) {
            const seatNum = `Y13${String.fromCharCode(64 + c)}`;
            seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: 13, col: c, price: priceStarting || 1800, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
          }
        }
      } else if (busType.includes('3*2') || busType.includes('Leyland')) {
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
      await client.query(`
        INSERT INTO seats (
          "id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        seat.id || `${routeId}-${seat.number}`,
        routeId,
        seat.number,
        seat.deck || 'lower',
        seat.row,
        seat.col,
        seat.price || priceStarting || 1800,
        seat.status || 'available',
        seat.isSleeper ? 1 : 0,
        seat.isFemaleOnly ? 1 : 0,
      ]);
    }

    // Insert Boarding & Drop points if provided, or default
    const boardingPointsToInsert = req.body.boardingPoints && Array.isArray(req.body.boardingPoints) && req.body.boardingPoints.length > 0
      ? req.body.boardingPoints
      : [
          { id: `bp-${routeId}-1`, name: `${origin.trim()} Main Terminal`, time: departureTime.trim(), landmark: 'Main Station Gate', lat: 6.8722, lng: 81.3507 },
          { id: `bp-${routeId}-2`, name: 'Wellawaya Junction', time: '01:45 PM', landmark: 'Clock Tower Interchange', lat: 6.7410, lng: 81.1020 },
        ];

    const dropPointsToInsert = req.body.dropPoints && Array.isArray(req.body.dropPoints) && req.body.dropPoints.length > 0
      ? req.body.dropPoints
      : [
          { id: `dp-${routeId}-1`, name: 'Kottawa Highway Exit', time: '06:45 PM', landmark: 'Makumbura Multimodal Hub', lat: 6.8416, lng: 79.9974 },
          { id: `dp-${routeId}-2`, name: `${destination.trim()} Fort Station`, time: arrivalTime || '03:30 PM', landmark: 'Main Passenger Drop Bay', lat: 6.9344, lng: 79.8510 },
        ];

    for (const bp of boardingPointsToInsert) {
      if (!bp.name) continue;
      await client.query(`
        INSERT INTO boarding_points ("id", "routeId", "type", "name", "time", "landmark", "lat", "lng")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        bp.id || `bp-${routeId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        routeId,
        'boarding',
        bp.name.trim(),
        bp.time?.trim() || departureTime.trim(),
        bp.landmark?.trim() || '',
        Number(bp.lat) || 0,
        Number(bp.lng) || 0,
      ]);
    }

    for (const dp of dropPointsToInsert) {
      if (!dp.name) continue;
      await client.query(`
        INSERT INTO boarding_points ("id", "routeId", "type", "name", "time", "landmark", "lat", "lng")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        dp.id || `dp-${routeId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        routeId,
        'drop',
        dp.name.trim(),
        dp.time?.trim() || arrivalTime || '03:30 PM',
        dp.landmark?.trim() || '',
        Number(dp.lat) || 0,
        Number(dp.lng) || 0,
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, id: routeId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── PUT /api/routes/:id — Admin Edit Route Details & Timetable ──────────────
routesRouter.put('/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;
  const {
    operatorName, operatorRating, busNumber, busType,
    origin, destination, departureTime, arrivalTime, duration, priceStarting,
    hasUpperDeck, amenities, boardingPoints, dropPoints,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingRes = await client.query('SELECT * FROM routes WHERE "id" = $1', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ error: 'Route not found' });
      client.release();
      return;
    }
    const current = existingRes.rows[0];

    const updatedOperatorName = operatorName !== undefined ? operatorName.trim() : current.operatorName;
    const updatedOperatorRating = operatorRating !== undefined ? Number(operatorRating) : current.operatorRating;
    const updatedBusNumber = busNumber !== undefined ? busNumber.trim() : current.busNumber;
    const updatedBusType = busType !== undefined ? busType.trim() : current.busType;
    const updatedOrigin = origin !== undefined ? origin.trim() : current.origin;
    const updatedDestination = destination !== undefined ? destination.trim() : current.destination;
    const updatedDepartureTime = departureTime !== undefined ? departureTime.trim() : current.departureTime;
    const updatedArrivalTime = arrivalTime !== undefined ? arrivalTime.trim() : current.arrivalTime;
    const updatedDuration = duration !== undefined ? duration.trim() : current.duration;
    const updatedPrice = priceStarting !== undefined ? Number(priceStarting) : current.priceStarting;
    const updatedHasUpperDeck = hasUpperDeck !== undefined ? (hasUpperDeck ? 1 : 0) : current.hasUpperDeck;
    const updatedAmenities = amenities !== undefined ? (typeof amenities === 'string' ? amenities : JSON.stringify(amenities)) : current.amenities;

    await client.query(`
      UPDATE routes SET
        "operatorName" = $1,
        "operatorRating" = $2,
        "busNumber" = $3,
        "busType" = $4,
        "origin" = $5,
        "destination" = $6,
        "departureTime" = $7,
        "arrivalTime" = $8,
        "duration" = $9,
        "priceStarting" = $10,
        "hasUpperDeck" = $11,
        "amenities" = $12
      WHERE "id" = $13
    `, [
      updatedOperatorName,
      updatedOperatorRating,
      updatedBusNumber,
      updatedBusType,
      updatedOrigin,
      updatedDestination,
      updatedDepartureTime,
      updatedArrivalTime,
      updatedDuration,
      updatedPrice,
      updatedHasUpperDeck,
      updatedAmenities,
      id,
    ]);

    // Update boarding & drop points if provided
    if (boardingPoints || dropPoints) {
      await client.query('DELETE FROM boarding_points WHERE "routeId" = $1', [id]);

      if (Array.isArray(boardingPoints)) {
        for (const bp of boardingPoints) {
          if (!bp.name) continue;
          await client.query(`
            INSERT INTO boarding_points ("id", "routeId", "type", "name", "time", "landmark", "lat", "lng")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            bp.id || `bp-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            id,
            'boarding',
            bp.name.trim(),
            bp.time?.trim() || updatedDepartureTime,
            bp.landmark?.trim() || '',
            Number(bp.lat) || 0,
            Number(bp.lng) || 0,
          ]);
        }
      }

      if (Array.isArray(dropPoints)) {
        for (const dp of dropPoints) {
          if (!dp.name) continue;
          await client.query(`
            INSERT INTO boarding_points ("id", "routeId", "type", "name", "time", "landmark", "lat", "lng")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            dp.id || `dp-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            id,
            'drop',
            dp.name.trim(),
            dp.time?.trim() || updatedArrivalTime,
            dp.landmark?.trim() || '',
            Number(dp.lat) || 0,
            Number(dp.lng) || 0,
          ]);
        }
      }
    }

    // Auto-synchronize seat layout when busType changes (e.g. 49 Seats Super Luxury vs 54 Seats Normal Service)
    if (updatedBusType !== current.busType) {
      await client.query('DELETE FROM seats WHERE "routeId" = $1', [id]);

      const seatsToInsert: any[] = [];
      if (updatedBusType.includes('49 Seats') || updatedBusType.includes('Super Luxury')) {
        const femaleSeats = ['15', '19', '20', '23'];
        for (let r = 1; r <= 11; r++) {
          const leftWindowNum = ((r - 1) * 4 + 3).toString();
          const leftAisleNum = ((r - 1) * 4 + 4).toString();
          const rightAisleNum = ((r - 1) * 4 + 2).toString();
          const rightWindowNum = ((r - 1) * 4 + 1).toString();

          seatsToInsert.push(
            { id: `${id}-${leftWindowNum}`, routeId: id, number: leftWindowNum, deck: 'lower', row: r, col: 1, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(leftWindowNum) ? 1 : 0 },
            { id: `${id}-${leftAisleNum}`, routeId: id, number: leftAisleNum, deck: 'lower', row: r, col: 2, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(leftAisleNum) ? 1 : 0 },
            { id: `${id}-${rightAisleNum}`, routeId: id, number: rightAisleNum, deck: 'lower', row: r, col: 4, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(rightAisleNum) ? 1 : 0 },
            { id: `${id}-${rightWindowNum}`, routeId: id, number: rightWindowNum, deck: 'lower', row: r, col: 5, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(rightWindowNum) ? 1 : 0 }
          );
        }
        const backSeats = [
          { num: '47', col: 1 },
          { num: '48', col: 2 },
          { num: '49', col: 3 },
          { num: '46', col: 4 },
          { num: '45', col: 5 },
        ];
        backSeats.forEach(s => {
          seatsToInsert.push({ id: `${id}-${s.num}`, routeId: id, number: s.num, deck: 'lower', row: 12, col: s.col, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
        });
      } else if (updatedBusType.includes('58 Seats 3*2') || updatedBusType.includes('Normal Service') || updatedBusType.includes('54 Seats 3*2') || updatedBusType.includes('Ashok Leyland (54 Seats 3*2')) {
        for (let r = 1; r <= 11; r++) {
          for (const c of [1, 2, 3, 5, 6]) {
            const seatNum = `${r}${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
            seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: r, col: c, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 3 ? 1 : 0 });
          }
        }
        for (const c of [1, 2, 3]) {
          const seatNum = `12${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
          seatsToInsert.push({ id: `${id}-${seatNum}`, routeId: id, number: seatNum, deck: 'lower', row: 12, col: c, price: updatedPrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
        }
      }

      for (const seat of seatsToInsert) {
        await client.query(`
          INSERT INTO seats (
            "id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          seat.id,
          id,
          seat.number,
          seat.deck || 'lower',
          seat.row,
          seat.col,
          seat.price,
          seat.status || 'available',
          seat.isSleeper ? 1 : 0,
          seat.isFemaleOnly ? 1 : 0,
        ]);
      }
    } else if (updatedPrice !== current.priceStarting) {
      // Update seat prices for existing layout
      await client.query('UPDATE seats SET "price" = $1 WHERE "routeId" = $2', [updatedPrice, id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Route details & timetable updated successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── PUT /api/routes/:id/layout — Admin Customize Seat Grid ──────────────────
routesRouter.put('/:id/layout', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;
  const { busType, priceStarting, seats } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (busType) {
      await client.query(
        'UPDATE routes SET "busType" = $1, "priceStarting" = $2 WHERE "id" = $3',
        [busType, priceStarting || 1800, id]
      );
    }

    if (seats && Array.isArray(seats)) {
      await client.query('DELETE FROM seats WHERE "routeId" = $1', [id]);

      for (const seat of seats) {
        await client.query(`
          INSERT INTO seats (
            "id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          seat.id || `${id}-${seat.number}`,
          id,
          seat.number,
          seat.deck || 'lower',
          seat.row,
          seat.col,
          seat.price,
          seat.status || 'available',
          seat.isSleeper ? 1 : 0,
          seat.isFemaleOnly ? 1 : 0,
        ]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Seat layout updated successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── DELETE /api/routes/:id/layout — Admin Remove Seat Layout ───────────────
routesRouter.delete('/:id/layout', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const routeRes = await client.query('SELECT "id" FROM routes WHERE "id" = $1', [id]);
    if (routeRes.rows.length === 0) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    await client.query('BEGIN');

    const seatsRes = await client.query('SELECT "id" FROM seats WHERE "routeId" = $1', [id]);
    const seatIds = seatsRes.rows;

    await client.query('DELETE FROM seats WHERE "routeId" = $1', [id]);

    for (const { id: seatId } of seatIds) {
      seatLocks.delete(seatId);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Seat layout deleted successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── DELETE /api/routes/:id — Admin Delete Route Entirely ────────────────────
routesRouter.delete('/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const seatsRes = await client.query('SELECT "id" FROM seats WHERE "routeId" = $1', [id]);
    for (const { id: seatId } of seatsRes.rows) {
      seatLocks.delete(seatId);
    }

    await client.query('DELETE FROM seats WHERE "routeId" = $1', [id]);
    await client.query('DELETE FROM boarding_points WHERE "routeId" = $1', [id]);
    await client.query('DELETE FROM routes WHERE "id" = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Route deleted successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});
