/**
 * OmniBus API Service Layer
 * Centralized fetch wrapper for all backend REST API calls.
 * All requests go to http://localhost:4000 (proxied via Vite as /api).
 */

const BASE_URL = '/api';

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `API Error ${res.status}`);
  }

  return res.json();
}

// ─── Routes API ───────────────────────────────────────────────────────────────

export const routesApi = {
  /** Fetch all bus routes with seats, boarding points, and GPS */
  getAll: (): Promise<any[]> => apiFetch('/routes'),

  /** Fetch a single route by ID */
  getById: (id: string): Promise<any> => apiFetch(`/routes/${id}`),

  /** Add a new bus route (Operator feature) */
  create: (routeData: any): Promise<any> =>
    apiFetch('/routes', { method: 'POST', body: JSON.stringify(routeData) }),

  /** Update an existing bus route's details and timetable */
  update: (id: string, routeData: any): Promise<any> =>
    apiFetch(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(routeData) }),

  /** Remove all seats from a route while keeping its schedule available */
  deleteLayout: (id: string): Promise<any> =>
    apiFetch(`/routes/${id}/layout`, { method: 'DELETE' }),

  /** Delete a bus route entirely from fleet */
  delete: (id: string): Promise<any> =>
    apiFetch(`/routes/${id}`, { method: 'DELETE' }),
};

// ─── Bookings API ─────────────────────────────────────────────────────────────

export const bookingsApi = {
  /** Get all bookings */
  getAll: (): Promise<any[]> => apiFetch('/bookings'),

  /** Get a single booking by PNR */
  getByPnr: (pnr: string): Promise<any> => apiFetch(`/bookings/${pnr}`),

  /** Create a new booking (atomic — marks seats booked in DB) */
  create: (payload: {
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
  }): Promise<any> =>
    apiFetch('/bookings', { method: 'POST', body: JSON.stringify(payload) }),

  /** Cancel a booking by PNR (releases seats, marks refunded) */
  cancel: (pnr: string): Promise<any> =>
    apiFetch(`/bookings/${pnr}/cancel`, { method: 'PATCH' }),
};

// ─── Seat Locking API ─────────────────────────────────────────────────────────

export const seatsApi = {
  /** Acquire an 8-minute TTL lock on selected seats */
  lock: (payload: { seatIds: string[]; routeId: string; sessionId: string }): Promise<any> =>
    apiFetch('/seats/lock', { method: 'POST', body: JSON.stringify(payload) }),

  /** Release locks for a session */
  unlock: (payload: { seatIds: string[]; sessionId: string }): Promise<any> =>
    apiFetch('/seats/unlock', { method: 'POST', body: JSON.stringify(payload) }),

  /** Check lock status for a single seat */
  lockStatus: (seatId: string, sessionId: string): Promise<any> =>
    apiFetch(`/seats/lock-status/${seatId}?sessionId=${sessionId}`),
};

// ─── Ticket Validation API (Conductor) ────────────────────────────────────────

export const validateApi = {
  /** Validate a PNR or QR code string — marks passenger as boarded */
  validate: (pnr: string): Promise<{
    success: boolean;
    alreadyBoarded?: boolean;
    booking?: any;
    message: string;
  }> =>
    apiFetch('/validate-ticket', { method: 'POST', body: JSON.stringify({ pnr }) }),
};

// ─── Authentication API ───────────────────────────────────────────────────────

export const authApi = {
  /** Register a new user account against Neon PostgreSQL */
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role?: 'passenger' | 'admin';
    phone?: string;
  }): Promise<{ success: boolean; message: string; token: string; user: any }> =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  /** Log in to an existing account */
  login: (payload: {
    email: string;
    password: string;
    role?: 'passenger' | 'admin';
  }): Promise<{ success: boolean; message: string; token: string; user: any }> =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  /** Get authenticated user profile */
  getMe: (token: string): Promise<{ user: any }> =>
    apiFetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),

  /** Update user name / username and phone */
  updateProfile: (
    token: string,
    payload: { name: string; phone?: string }
  ): Promise<{ success: boolean; message: string; user: any }> =>
    apiFetch('/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  /** Change user password */
  changePassword: (
    token: string,
    payload: { currentPassword: string; newPassword: string }
  ): Promise<{ success: boolean; message: string }> =>
    apiFetch('/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  /** Fetch all registered users for Admin User Management Dashboard */
  getAllUsers: (): Promise<{ success: boolean; totalCount: number; users: any[] }> =>
    apiFetch('/auth/users'),

  /** Change or toggle user role (passenger <-> admin) */
  updateUserRole: (id: string, role: 'passenger' | 'admin'): Promise<any> =>
    apiFetch(`/auth/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  /** Delete a registered user account */
  deleteUser: (id: string): Promise<any> =>
    apiFetch(`/auth/users/${id}`, { method: 'DELETE' }),
};

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthApi = {
  ping: (): Promise<{ status: string; timestamp: string }> => apiFetch('/health'),
};

