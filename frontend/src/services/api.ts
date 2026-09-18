/**
 * OmniBus API Service Layer
 * Centralized fetch wrapper for all backend REST API calls.
 * All requests go to http://localhost:4000 (proxied via Vite as /api).
 */

const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
export const BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
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
  getAll: (date?: string): Promise<any[]> => apiFetch(`/routes${date ? `?date=${date}` : ''}`),

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
    sessionId?: string;
    passenger: { fullName: string; email?: string; phone: string; gender?: string; age?: number };
    paymentMethod: string;
    promoCode?: string;
    insuranceSelected?: boolean;
    searchDate?: string;
    isCounterBooking?: boolean;
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
  /** Send OTP for account registration */
  verifyEmailOtp: (payload: { email: string; otp: string }): Promise<{ success: boolean; message: string }> =>
    apiFetch('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendOtp: (payload: { name: string; email: string }): Promise<{ success: boolean; message: string }> =>
    apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify(payload) }),

  /** Register a new user account against Neon PostgreSQL */
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role?: 'passenger' | 'admin';
    phone?: string;
    otp: string;
  }): Promise<{ success: boolean; message: string; token: string; user: any }> =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  /** Log in to an existing account */
  login: (payload: {
    email: string;
    password: string;
    role?: 'passenger' | 'admin';
  }): Promise<{ success: boolean; message: string; token: string; user: any }> =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  /** Log in or auto-register via Google OAuth ID token */
  loginWithGoogle: (payload: {
    credential: string;
    role?: 'passenger' | 'admin';
  }): Promise<{ success: boolean; message: string; token: string; user: any }> =>
    apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),

  /** Get authenticated user profile */
  getMe: (token: string): Promise<{ user: any }> =>
    apiFetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),

  /** Update user name, phone, emergency contact, and notifications */
  updateProfile: (
    token: string,
    payload: {
      name: string;
      phone?: string;
      emergencyContactName?: string | null;
      emergencyContactPhone?: string | null;
      notifyWhatsapp?: boolean;
      notifySms?: boolean;
      avatarUrl?: string | null;
    }
  ): Promise<{ success: boolean; message: string; user: any }> =>
    apiFetch('/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  /** Delete passenger account permanently */
  deleteAccount: (token: string): Promise<{ success: boolean; message: string }> =>
    apiFetch('/auth/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** Get saved co-passengers */
  getSavedPassengers: (token: string): Promise<any[]> =>
    apiFetch('/auth/saved-passengers', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** Add a saved co-passenger */
  addSavedPassenger: (
    token: string,
    payload: { name: string; nic?: string; phone?: string; gender?: string }
  ): Promise<{ success: boolean; passenger: any }> =>
    apiFetch('/auth/saved-passengers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  /** Delete a saved co-passenger */
  deleteSavedPassenger: (token: string, id: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/auth/saved-passengers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** Fetch passenger trip stats (completed, upcoming, total) */
  getTripStats: (token: string): Promise<{ completedTrips: number; upcomingTrips: number; totalTrips: number }> =>
    apiFetch('/auth/trip-stats', {
      headers: { Authorization: `Bearer ${token}` },
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

  /** Fetch all staff and sub-admins (Super Admin only) */
  getStaff: (token: string): Promise<{ success: boolean; staff: any[] }> =>
    apiFetch('/auth/staff', { headers: { Authorization: `Bearer ${token}` } }),

  /** Create new sub-admin / staff member (Super Admin only) */
  createStaff: (
    token: string,
    payload: { name: string; email: string; password: string; phone?: string; permissions: string[] }
  ): Promise<{ success: boolean; message: string; staff: any }> =>
    apiFetch('/auth/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  /** Update staff member permissions or details (Super Admin only) */
  updateStaff: (
    token: string,
    id: string,
    payload: { name?: string; phone?: string; permissions?: string[]; password?: string }
  ): Promise<{ success: boolean; message: string; staff: any }> =>
    apiFetch(`/auth/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  /** Delete staff member account (Super Admin only) */
  deleteStaff: (token: string, id: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/auth/staff/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** Send 6-digit OTP to passenger WhatsApp number */
  sendWhatsAppOtp: (phone: string): Promise<{ success: boolean; message: string; otpPreview?: string; whatsappUrl?: string }> =>
    apiFetch('/auth/send-whatsapp-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  /** Verify WhatsApp OTP entered by passenger */
  verifyWhatsAppOtp: (payload: { phone: string; otp: string }): Promise<{ success: boolean; message: string }> =>
    apiFetch('/auth/verify-whatsapp-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Payment Slips API ────────────────────────────────────────────────────────

export const paymentSlipsApi = {
  /** Upload a bank transfer payment slip */
  upload: (payload: {
    bookingId: string;
    pnr: string;
    imageData: string;
    imageMime: string;
    amount: number;
    passengerName: string;
    passengerPhone: string;
  }): Promise<{ success: boolean; slipId?: string; message: string }> =>
    apiFetch('/payment-slips', { method: 'POST', body: JSON.stringify(payload) }),

  /** Get all payment slips (admin) */
  getAll: (): Promise<any[]> => apiFetch('/payment-slips'),

  /** Approve a payment slip (admin) */
  approve: (id: string, adminName?: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/payment-slips/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ adminName }) }),

  /** Reject a payment slip (admin) */
  reject: (id: string, reason?: string, adminName?: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/payment-slips/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason, adminName }) }),
};

// ─── WhatsApp Service API ───────────────────────────────────────────────────

export const whatsappApi = {
  /** Get live connection status & QR code */
  getStatus: (): Promise<{
    status: 'connected' | 'connecting' | 'qr_ready' | 'disconnected';
    qrCode: string | null;
    user: { id: string; name?: string } | null;
  }> => apiFetch('/whatsapp/status'),

  /** Restart session and generate fresh QR */
  restart: (): Promise<{ success: boolean; message: string }> =>
    apiFetch('/whatsapp/restart', { method: 'POST' }),

  /** Test sending a message */
  testSend: (phone: string, message: string): Promise<{ success: boolean; message: string; error?: string }> =>
    apiFetch('/whatsapp/test-send', { method: 'POST', body: JSON.stringify({ phone, message }) }),

  /** Broadcast emergency message to all passengers on a route */
  broadcast: (routeId: string, message: string): Promise<{
    success: boolean;
    totalPassengers?: number;
    sentCount?: number;
    message: string;
  }> =>
    apiFetch('/whatsapp/broadcast', { method: 'POST', body: JSON.stringify({ routeId, message }) }),
};

// ─── Promo Codes API ──────────────────────────────────────────────────────────

export const promoCodesApi = {
  /** Get all promo codes (Admin) */
  getAll: (): Promise<{ success: boolean; promoCodes: any[] }> =>
    apiFetch('/promo-codes'),

  /** Create a promo code (Admin) */
  create: (payload: {
    code: string;
    discountPercent: number;
    maxDiscount?: number;
    validUntil?: string;
    maxUsage?: number;
  }): Promise<{ success: boolean; message: string }> =>
    apiFetch('/promo-codes', { method: 'POST', body: JSON.stringify(payload) }),

  /** Toggle active status (Admin) */
  toggle: (id: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/promo-codes/${id}/toggle`, { method: 'PATCH' }),

  /** Delete promo code (Admin) */
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/promo-codes/${id}`, { method: 'DELETE' }),

  /** Validate promo code */
  validate: (code: string, totalFare: number): Promise<{
    success: boolean;
    code?: string;
    discountPercent?: number;
    discountAmount?: number;
    message: string;
  }> =>
    apiFetch('/promo-codes/validate', { method: 'POST', body: JSON.stringify({ code, totalFare }) }),
};

// ─── Live Bot API ────────────────────────────────────────────────────────────

export const botApi = {
  chat: (message: string, lang?: string): Promise<{
    success: boolean;
    text: string;
    options?: Array<{ label: string; value: string; icon?: string }>;
    actions?: Array<{ type: string; label: string; data?: any }>;
    pnrData?: any;
  }> => apiFetch('/bot/chat', { method: 'POST', body: JSON.stringify({ message, lang }) }),
};

// ─── Seats Admin API (Maintenance Block) ──────────────────────────────────────

export const seatsAdminApi = {
  toggleBlock: (seatId: string): Promise<{
    success: boolean;
    status: 'available' | 'blocked';
    message: string;
  }> =>
    apiFetch(`/seats/${seatId}/block`, { method: 'PATCH' }),
};

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthApi = {
  ping: (): Promise<{ status: string; timestamp: string }> => apiFetch('/health'),
};


