import type { SeatLock } from '../types';

// In-memory seat lock store: seatId -> SeatLock
// This mirrors a Redis TTL cache for concurrency control
export const seatLocks = new Map<string, SeatLock>();

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes (600 seconds)

// Clean up expired locks every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [seatId, lock] of seatLocks.entries()) {
    if (lock.expiresAt <= now) {
      seatLocks.delete(seatId);
    }
  }
}, 60_000);

export function lockSeats(seatIds: string[], routeId: string, sessionId: string): void {
  const expiresAt = Date.now() + LOCK_TTL_MS;
  for (const seatId of seatIds) {
    seatLocks.set(seatId, { seatId, routeId, sessionId, expiresAt });
  }
}

export function unlockSeats(seatIds: string[], sessionId: string): void {
  for (const seatId of seatIds) {
    const lock = seatLocks.get(seatId);
    // Only unlock if it belongs to the same session
    if (lock && lock.sessionId === sessionId) {
      seatLocks.delete(seatId);
    }
  }
}

export function isSeatAvailable(seatId: string, sessionId: string): boolean {
  const lock = seatLocks.get(seatId);
  if (!lock) return true;
  if (lock.expiresAt <= Date.now()) {
    seatLocks.delete(seatId);
    return true;
  }
  // Available if owned by same session
  return lock.sessionId === sessionId;
}

export function isSeatLockedBySession(seatId: string, sessionId: string): boolean {
  const lock = seatLocks.get(seatId);
  if (!lock || lock.expiresAt <= Date.now()) {
    if (lock) seatLocks.delete(seatId);
    return false;
  }
  return lock.sessionId === sessionId;
}

export function getLockRemainingSeconds(seatId: string): number {
  const lock = seatLocks.get(seatId);
  if (!lock || lock.expiresAt <= Date.now()) return 0;
  return Math.ceil((lock.expiresAt - Date.now()) / 1000);
}
