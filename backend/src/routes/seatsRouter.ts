import { Router, Request, Response } from 'express';
import { lockSeats, unlockSeats, isSeatAvailable, getLockRemainingSeconds } from '../locks/seatLocks';
import { getPool } from '../db/database';

export const seatsRouter = Router();

// ─── POST /api/seats/lock ─────────────────────────────────────────────────────
// Body: { seatIds: string[], routeId: string, sessionId: string }
seatsRouter.post('/lock', async (req: Request, res: Response) => {
  const { seatIds, routeId, sessionId } = req.body as {
    seatIds: string[];
    routeId: string;
    sessionId: string;
  };

  if (!seatIds?.length || !routeId || !sessionId) {
    res.status(400).json({ error: 'seatIds, routeId, and sessionId are required.' });
    return;
  }

  const pool = getPool();

  try {
    // Normalize seat IDs to canonical format
    const canonicalSeatIds = seatIds.map((id: string) => {
      if (id.startsWith(`${routeId}-`)) return id;
      const num = id.replace(/^[^-]+-/, '').replace(/^seat-/, '').replace(/^0+/, '');
      return `${routeId}-${num}`;
    });

    // Ensure missing seats are auto-inserted in DB
    for (const sId of canonicalSeatIds) {
      const seatNum = sId.replace(`${routeId}-`, '');
      await pool.query(`
        INSERT INTO seats ("id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly")
        VALUES ($1, $2, $3, 'lower', 1, 1, 3430, 'available', 0, 0)
        ON CONFLICT ("id") DO NOTHING
      `, [sId, routeId, seatNum]);
    }

    // Check all seats are available or already locked by this session
    const conflicts: string[] = [];
    for (let i = 0; i < canonicalSeatIds.length; i++) {
      const seatId = canonicalSeatIds[i];
      const rawId = seatIds[i];
      const rowRes = await pool.query('SELECT status FROM seats WHERE "id" = $1', [seatId]);
      const row = rowRes.rows[0];

      if (!row) {
        conflicts.push(`${seatId} (not found)`);
        continue;
      }
      if (row.status === 'booked') {
        conflicts.push(`${seatId} (already booked)`);
        continue;
      }
      if (!isSeatAvailable(seatId, sessionId) && !isSeatAvailable(rawId, sessionId)) {
        conflicts.push(`${seatId} (locked by another user)`);
      }
    }

    if (conflicts.length > 0) {
      res.status(409).json({
        error: 'Some seats are not available.',
        conflicts,
      });
      return;
    }

    lockSeats(seatIds, routeId, sessionId);

    const remaining = getLockRemainingSeconds(seatIds[0]);

    res.json({
      success: true,
      lockedSeatIds: seatIds,
      lockExpiresInSeconds: remaining,
      message: `${seatIds.length} seat(s) locked for 8 minutes.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/seats/unlock ───────────────────────────────────────────────────
// Body: { seatIds: string[], sessionId: string }
seatsRouter.post('/unlock', (req: Request, res: Response) => {
  const { seatIds, sessionId } = req.body as { seatIds: string[]; sessionId: string };

  if (!seatIds?.length || !sessionId) {
    res.status(400).json({ error: 'seatIds and sessionId are required.' });
    return;
  }

  unlockSeats(seatIds, sessionId);
  res.json({ success: true, message: `${seatIds.length} seat(s) unlocked.` });
});

// ─── GET /api/seats/lock-status/:seatId ──────────────────────────────────────
seatsRouter.get('/lock-status/:seatId', (req: Request, res: Response) => {
  const { seatId } = req.params;
  const { sessionId } = req.query as { sessionId?: string };

  const available = isSeatAvailable(seatId, sessionId || '');
  const remaining = getLockRemainingSeconds(seatId);

  res.json({
    seatId,
    available,
    lockRemainingSeconds: remaining,
  });
});
