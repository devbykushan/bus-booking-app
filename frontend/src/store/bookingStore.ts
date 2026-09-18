import { create } from 'zustand';
import type { BusRoute, BoardingPoint, Booking, PassengerDetails, UserAccount, SavedPassenger, TripStats, PaymentSlip } from '../types/booking';
import { routesApi, bookingsApi, seatsApi, validateApi, authApi, paymentSlipsApi } from '../services/api';
import confetti from 'canvas-confetti';
import { translations } from './translations';
import type { Language, TranslationKey } from './translations';


// ─── Generate a persistent browser session ID for seat locking ────────────────
function getSessionId(): string {
  let id = sessionStorage.getItem('omnibus_session');
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('omnibus_session', id);
  }
  return id;
}

export type AppView =
  | 'passenger-search'
  | 'schedules-dashboard'
  | 'seat-selection'
  | 'checkout'
  | 'ticket-confirmation'
  | 'my-bookings'
  | 'live-tracking'
  | 'admin-panel'
  | 'passenger-settings'
  | 'slip-upload'
  | 'admin-portal'
  | 'master-management';

export const VIEW_HASH_MAP: Record<AppView, string> = {
  'passenger-search': 'home',
  'schedules-dashboard': 'journeys',
  'seat-selection': 'seats',
  'checkout': 'checkout',
  'ticket-confirmation': 'confirmation',
  'my-bookings': 'my-tickets',
  'live-tracking': 'live-gps',
  'admin-panel': 'admin',
  'passenger-settings': 'settings',
  'slip-upload': 'slip-upload',
  'admin-portal': 'dew_super-admin',
  'master-management': 'master-management',
};

export const HASH_VIEW_MAP: Record<string, AppView> = {
  'home': 'passenger-search',
  '': 'passenger-search',
  '/': 'passenger-search',
  'search': 'passenger-search',
  'journeys': 'schedules-dashboard',
  'schedules': 'schedules-dashboard',
  'schedules-dashboard': 'schedules-dashboard',
  'seats': 'seat-selection',
  'seat-selection': 'seat-selection',
  'checkout': 'checkout',
  'confirmation': 'ticket-confirmation',
  'ticket-confirmation': 'ticket-confirmation',
  'my-tickets': 'my-bookings',
  'my-bookings': 'my-bookings',
  'live-gps': 'live-tracking',
  'live-tracking': 'live-tracking',
  'admin': 'admin-panel',
  'admin-panel': 'admin-panel',
  'portal': 'admin-portal',
  'admin-login': 'admin-portal',
  'staff-login': 'admin-portal',
  'dew_super-admin': 'admin-portal',
  'dew_super_admin': 'admin-portal',
  'super-admin': 'admin-portal',
  'settings': 'passenger-settings',
  'passenger-settings': 'passenger-settings',
  'slip-upload': 'slip-upload',
  'master-management': 'master-management',
  'master': 'master-management',
};

export function getViewFromLocation(): AppView {
  if (typeof window === 'undefined') return 'passenger-search';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').split('?')[0].toLowerCase();
  if (path && HASH_VIEW_MAP[path]) {
    return HASH_VIEW_MAP[path];
  }
  const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '').toLowerCase();
  if (rawHash && HASH_VIEW_MAP[rawHash]) {
    return HASH_VIEW_MAP[rawHash];
  }

  // Check if hostname or URL contains super admin patterns
  const hostname = window.location.hostname.toLowerCase();
  const fullUrl = window.location.href.toLowerCase();
  if (
    hostname.includes('dewmina-super-admin') ||
    hostname.includes('super-admin') ||
    fullUrl.includes('dew_super') ||
    fullUrl.includes('super-admin') ||
    fullUrl.includes('super_admin')
  ) {
    return 'admin-portal';
  }

  return 'passenger-search';
}

interface BookingStore {
  // Authentication
  currentUser: UserAccount | null;
  login: (email: string, pass: string, role?: 'passenger' | 'admin') => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (credential: string, role?: 'passenger' | 'admin') => Promise<{ success: boolean; message: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  sendOtp: (name: string, email: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, pass: string, otp: string, role?: 'passenger' | 'admin', phone?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (data: {
    name: string;
    phone?: string;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    notifyWhatsapp?: boolean;
    notifySms?: boolean;
  }) => Promise<{ success: boolean; message: string }>;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  
  // Saved Co-Passengers
  savedPassengers: SavedPassenger[];
  loadSavedPassengers: () => Promise<void>;
  addSavedPassenger: (data: { name: string; nic?: string; phone?: string; gender?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteSavedPassenger: (id: string) => Promise<{ success: boolean; message?: string }>;

  // Passenger Trip Stats
  tripStats: TripStats | null;
  loadTripStats: () => Promise<void>;

  showAuthModal: boolean;
  setShowAuthModal: (val: boolean) => void;
  isPwaPromptOpen: boolean;
  setIsPwaPromptOpen: (val: boolean) => void;

  // Loading & errors
  isLoading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView, pushHistory?: boolean) => void;
  goToSearchSchedules: () => void;
  goToHome: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Role switching
  userRole: 'passenger' | 'admin' | 'super_admin';
  setUserRole: (role: 'passenger' | 'admin' | 'super_admin') => void;

  // Session ID (for seat locking)
  sessionId: string;

  // Search criteria
  searchOrigin: string;
  searchDestination: string;
  searchDate: string;
  soloFemaleOnly: boolean;
  busTypeFilter: string;
  setSearchCriteria: (origin: string, dest: string, date: string) => void;
  setSoloFemaleOnly: (val: boolean) => void;
  setBusTypeFilter: (val: string) => void;

  // Bus routes (loaded from API)
  routes: BusRoute[];
  loadRoutes: () => Promise<void>;
  selectedRoute: BusRoute | null;
  setSelectedRoute: (route: BusRoute | null) => void;
  addBusRoute: (newRoute: BusRoute) => void;

  // Seat selection & concurrency
  selectedSeatIds: string[];
  lockExpirySeconds: number;
  lockActive: boolean;
  toggleSeatSelection: (seatId: string) => void;
  clearSeatSelection: () => void;
  tickLockTimer: () => void;

  // Boarding / drop
  selectedBoardingPoint: BoardingPoint | null;
  selectedDropPoint: BoardingPoint | null;
  setSelectedBoardingPoint: (bp: BoardingPoint) => void;
  setSelectedDropPoint: (dp: BoardingPoint) => void;

  // Passenger details & promo
  passengerInfo: PassengerDetails;
  setPassengerInfo: (info: Partial<PassengerDetails>) => void;
  appliedPromo: string;
  discountRate: number;
  applyPromoCode: (code: string) => boolean;

  // Bookings
  bookings: Booking[];
  loadBookings: () => Promise<void>;
  latestConfirmedBooking: Booking | null;
  setLatestConfirmedBooking: (b: Booking | null) => void;
  createBooking: (
    paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet' | 'bank_transfer',
    insuranceSelected: boolean,
  ) => Promise<Booking | null>;
  cancelBooking: (pnr: string) => Promise<void>;
  validateTicketByPNR: (pnr: string) => Promise<{ success: boolean; booking?: any; message: string }>;

  // GPS tracking
  trackingRouteId: string | null;
  setTrackingRouteId: (id: string | null) => void;

  // Admin Payment Slips & Notifications
  paymentSlips: PaymentSlip[];
  loadPaymentSlips: (isBackground?: boolean) => Promise<void>;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  adminSoundEnabled: boolean;
  setAdminSoundEnabled: (enabled: boolean) => void;
  adminReadSlipIds: string[];
  markSlipAsRead: (slipId: string) => void;
  markAllSlipsAsRead: () => void;
  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;

  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  currentUser: JSON.parse(localStorage.getItem('dewmina_user') || 'null'),
  showAuthModal: false,
  setShowAuthModal: (val) => set({ showAuthModal: val }),
  isPwaPromptOpen: false,
  setIsPwaPromptOpen: (val) => set({ isPwaPromptOpen: val }),

  theme: (localStorage.getItem('dewmina_theme') as 'light' | 'dark') || 'light',
  setTheme: (theme) => {
    localStorage.setItem('dewmina_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  login: async (email, password, role) => {
    try {
      const res = await authApi.login({ email, password, role });
      if (res.success && res.user) {
        const user: UserAccount = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          phone: res.user.phone,
          emergencyContactName: res.user.emergencyContactName || null,
          emergencyContactPhone: res.user.emergencyContactPhone || null,
          notifyWhatsapp: res.user.notifyWhatsapp !== false,
          notifySms: res.user.notifySms !== false,
          permissions: res.user.permissions || [],
          createdAt: res.user.createdAt,
        };
        localStorage.setItem('dewmina_user', JSON.stringify(user));
        localStorage.setItem('auth_token', res.token);
        set({
          currentUser: user,
          userRole: user.role as any,
          showAuthModal: false,
        });
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';
        get().setCurrentView(isAdmin ? 'admin-panel' : 'passenger-search');
        return { success: true, message: res.message || 'Logged in successfully' };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Authentication error occurred' };
    }
  },

  loginWithGoogle: async (credential, role) => {
    try {
      const res = await authApi.loginWithGoogle({ credential, role });
      if (res.success && res.user) {
        const user: UserAccount = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          phone: res.user.phone,
          emergencyContactName: res.user.emergencyContactName || null,
          emergencyContactPhone: res.user.emergencyContactPhone || null,
          notifyWhatsapp: res.user.notifyWhatsapp !== false,
          notifySms: res.user.notifySms !== false,
          permissions: res.user.permissions || [],
          createdAt: res.user.createdAt,
        };
        localStorage.setItem('dewmina_user', JSON.stringify(user));
        localStorage.setItem('auth_token', res.token);
        set({
          currentUser: user,
          userRole: user.role as any,
          showAuthModal: false,
        });
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';
        get().setCurrentView(isAdmin ? 'admin-panel' : 'passenger-search');
        return { success: true, message: res.message || 'Logged in successfully' };
      }
      return { success: false, message: res.message || 'Google login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Google authentication error occurred' };
    }
  },

  verifyEmailOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.verifyEmailOtp({ email, otp });
      set({ isLoading: false });
      return res;
    } catch (error: any) {
      set({ error: error.message || 'Failed to verify OTP', isLoading: false });
      throw error;
    }
  },
  sendOtp: async (name, email) => {
    try {
      const res: any = await authApi.sendOtp({ name, email });
      return { success: res.success, message: res.message || 'OTP sent successfully', devOtp: res.devOtp };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  },

  register: async (name, email, password, otp, role, phone) => {
    try {
      const res = await authApi.register({ name, email, password, otp, role, phone });
      if (res.success && res.user) {
        return { success: true, message: res.message || 'Registration successful' };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration error occurred' };
    }
  },

  logout: () => {
    localStorage.removeItem('dewmina_user');
    localStorage.removeItem('auth_token');
    set({ currentUser: null, userRole: 'passenger', tripStats: null, savedPassengers: [] });
    const hostname = window.location.hostname.toLowerCase();
    const isSuperHost = hostname.includes('dewmina-super-admin') || hostname.includes('super-admin');
    get().setCurrentView(isSuperHost ? 'admin-portal' : 'passenger-search');
  },

  updateProfile: async (data) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await authApi.updateProfile(token, data);
      if (res.success && res.user) {
        const currentUser = get().currentUser;
        const updatedUser: UserAccount = {
          ...currentUser,
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          phone: res.user.phone,
          emergencyContactName: res.user.emergencyContactName || null,
          emergencyContactPhone: res.user.emergencyContactPhone || null,
          notifyWhatsapp: res.user.notifyWhatsapp !== false,
          notifySms: res.user.notifySms !== false,
        };
        localStorage.setItem('dewmina_user', JSON.stringify(updatedUser));
        set({ currentUser: updatedUser });
        return { success: true, message: res.message || 'Profile updated successfully.' };
      }
      return { success: false, message: res.message || 'Update failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Profile update error.' };
    }
  },

  deleteAccount: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await authApi.deleteAccount(token);
      if (res.success) {
        get().logout();
        return { success: true, message: res.message || 'Account deleted successfully.' };
      }
      return { success: false, message: res.message || 'Failed to delete account.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error deleting account.' };
    }
  },

  savedPassengers: [],
  loadSavedPassengers: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const list = await authApi.getSavedPassengers(token);
      set({ savedPassengers: list || [] });
    } catch (_) {}
  },
  addSavedPassenger: async (data) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await authApi.addSavedPassenger(token, data);
      if (res.success && res.passenger) {
        set({ savedPassengers: [res.passenger, ...get().savedPassengers] });
        return { success: true };
      }
      return { success: false, message: 'Failed to add co-passenger.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error adding co-passenger.' };
    }
  },
  deleteSavedPassenger: async (id) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await authApi.deleteSavedPassenger(token, id);
      if (res.success) {
        set({ savedPassengers: get().savedPassengers.filter((p) => p.id !== id) });
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to delete co-passenger.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error deleting co-passenger.' };
    }
  },

  tripStats: null,
  loadTripStats: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const stats = await authApi.getTripStats(token);
      set({ tripStats: stats });
    } catch (_) {}
  },

  changePassword: async (currentPassword, newPassword) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, message: 'Not authenticated.' };
    try {
      const res = await authApi.changePassword(token, { currentPassword, newPassword });
      if (res.success) {
        return { success: true, message: res.message || 'Password changed successfully.' };
      }
      return { success: false, message: res.message || 'Password change failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Password change error.' };
    }
  },

  isLoading: false,
  error: null,
  setError: (msg) => set({ error: msg }),

  currentView: getViewFromLocation(),
  setCurrentView: (view, pushHistory = true) => {
    const current = get().currentView;
    if (view === current) return;

    if (pushHistory !== false && typeof window !== 'undefined') {
      const hash = VIEW_HASH_MAP[view] || 'home';
      const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const targetUrl = cleanPath && cleanPath !== '' ? `/#${hash}` : `#${hash}`;
      window.history.pushState(
        { view, routeId: get().selectedRoute?.id },
        '',
        targetUrl
      );
    }
    set({ currentView: view });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  goToSearchSchedules: () => {
    get().setCurrentView('schedules-dashboard');
  },
  goToHome: () => {
    get().setCurrentView('passenger-search');
  },

  userRole: JSON.parse(localStorage.getItem('dewmina_user') || 'null')?.role || 'passenger',
  setUserRole: (role) => set({ userRole: role }),

  sessionId: getSessionId(),

  searchOrigin: 'Monaragala',
  searchDestination: 'Colombo',
  searchDate: new Date().toISOString().split('T')[0],
  soloFemaleOnly: false,
  busTypeFilter: 'all',

  setSearchCriteria: (origin, dest, date) => {
    const today = new Date().toISOString().split('T')[0];
    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 7);
    const maxAllowed = maxD.toISOString().split('T')[0];
    let validDate = (!date || date < today) ? today : date;
    if (validDate > maxAllowed) validDate = maxAllowed;
    set({ searchOrigin: origin, searchDestination: dest, searchDate: validDate });
  },
  setSoloFemaleOnly: (val) => set({ soloFemaleOnly: val }),
  setBusTypeFilter: (val) => set({ busTypeFilter: val }),

  routes: (() => {
    try {
      const cached = localStorage.getItem('dewmina_cached_routes_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  })(),
  loadRoutes: async () => {
    const hasCached = get().routes.length > 0;
    if (!hasCached) {
      set({ isLoading: true, error: null });
    }
    try {
      const routes = await routesApi.getAll();
      if (Array.isArray(routes) && routes.length > 0) {
        try {
          localStorage.setItem('dewmina_cached_routes_v1', JSON.stringify(routes));
        } catch {}
      }
      set({ routes, isLoading: false, error: null });
    } catch (err: any) {
      if (get().routes.length === 0) {
        set({ isLoading: false, error: `Failed to load routes: ${err.message}` });
      } else {
        set({ isLoading: false });
      }
    }
  },
  selectedRoute: null,
  setSelectedRoute: (route) =>
    set({
      selectedRoute: route,
      selectedSeatIds: [],
      selectedBoardingPoint: route?.boardingPoints?.[0] ?? null,
      selectedDropPoint: route?.dropPoints?.[0] ?? null,
      lockExpirySeconds: 600,
      lockActive: false,
    }),
  addBusRoute: (newRoute) =>
    set((state) => ({ routes: [newRoute, ...state.routes] })),

  selectedSeatIds: [],
  lockExpirySeconds: 600,
  lockActive: false,

  toggleSeatSelection: (seatId: string) => {
    const { selectedSeatIds, selectedRoute, sessionId } = get();
    if (!selectedRoute) return;

    const routeId = selectedRoute.id;
    const normalizedNum = seatId.replace(`${routeId}-`, '').replace(/^seat-/, '').replace(/^0+/, '');
    const canonicalId = `${routeId}-${normalizedNum}`;

    let seat = selectedRoute.seats.find((s) => s.id === canonicalId || s.id === seatId || s.number === normalizedNum || s.number === seatId);
    if (!seat) {
      seat = {
        id: canonicalId,
        number: normalizedNum,
        row: 1,
        col: 1,
        price: selectedRoute.seats[0]?.price || selectedRoute.priceStarting || 1157,
        status: 'available',
        deck: 'lower'
      };
      selectedRoute.seats.push(seat);
    }

    if (seat.status === 'booked' || seat.status === 'blocked') return;
    const actualId = seat.id;

    let newSelected: string[];

    if (selectedSeatIds.includes(actualId) || selectedSeatIds.includes(seatId) || selectedSeatIds.includes(canonicalId)) {
      // Deselect — unlock on backend asynchronously
      newSelected = selectedSeatIds.filter((id) => id !== actualId && id !== seatId && id !== canonicalId);
      seatsApi.unlock({ seatIds: [actualId], sessionId }).catch(() => {});
    } else {
      if (selectedSeatIds.length >= 6) {
        alert('Maximum 6 seats per booking.');
        return;
      }

      // Optimistic instant selection
      newSelected = [...selectedSeatIds, actualId];

      // Async background server lock (non-blocking)
      seatsApi.lock({ seatIds: [actualId], routeId: selectedRoute.id, sessionId }).catch(() => {});
    }

    // Instant local state update (0ms lag)
    set({
      selectedSeatIds: newSelected,
      lockActive: newSelected.length > 0,
      lockExpirySeconds: 600,
    });
  },

  clearSeatSelection: () => {
    const { selectedSeatIds, sessionId } = get();
    if (selectedSeatIds.length > 0) {
      seatsApi.unlock({ seatIds: selectedSeatIds, sessionId }).catch(() => {});
    }
    set({ selectedSeatIds: [], lockActive: false, lockExpirySeconds: 600 });
  },

  tickLockTimer: () => {
    const { lockActive, lockExpirySeconds } = get();
    if (!lockActive) return;
    if (lockExpirySeconds <= 1) {
      get().clearSeatSelection();
      alert('Seat hold expired! Your 10-minute hold window has elapsed. Please re-select your seats.');
    } else {
      set({ lockExpirySeconds: lockExpirySeconds - 1 });
    }
  },

  selectedBoardingPoint: null,
  selectedDropPoint: null,
  setSelectedBoardingPoint: (bp) => set({ selectedBoardingPoint: bp }),
  setSelectedDropPoint: (dp) => set({ selectedDropPoint: dp }),

  passengerInfo: {
    fullName: '',
    email: '',
    phone: '',
    gender: 'female',
    age: 26,
    isSoloFemale: false,
  },
  setPassengerInfo: (info) =>
    set((state) => ({ passengerInfo: { ...state.passengerInfo, ...info } })),

  appliedPromo: '',
  discountRate: 0,
  applyPromoCode: (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BUS2026') {
      set({ appliedPromo: 'BUS2026', discountRate: 0.15 });
      return true;
    }
    if (clean === 'SAVE10') {
      set({ appliedPromo: 'SAVE10', discountRate: 0.10 });
      return true;
    }
    return false;
  },

  bookings: [],
  loadBookings: async () => {
    try {
      const bookings = await bookingsApi.getAll();
      set({ bookings });
    } catch (err: any) {
      console.error('Failed to load bookings:', err.message);
    }
  },
  latestConfirmedBooking: null,
  setLatestConfirmedBooking: (b) => set({ latestConfirmedBooking: b }),

  createBooking: async (paymentMethod, insuranceSelected) => {
    const {
      selectedRoute, selectedSeatIds, selectedBoardingPoint, selectedDropPoint,
      passengerInfo, appliedPromo, searchDate, sessionId,
    } = get();

    if (!selectedRoute || selectedSeatIds.length === 0 || !selectedBoardingPoint || !selectedDropPoint) {
      return null;
    }

    if (searchDate) {
      const today = new Date().toISOString().split('T')[0];
      const maxD = new Date();
      maxD.setDate(maxD.getDate() + 7);
      const maxAllowed = maxD.toISOString().split('T')[0];
      if (searchDate < today || searchDate > maxAllowed) {
        set({ isLoading: false, error: 'Bookings are only permitted up to 1 week (7 days) in advance.' });
        return null;
      }
    }

    // Map selectedSeatIds to canonical route-prefixed seat IDs (e.g. "route-101-17")
    const canonicalSeatIds = selectedSeatIds.map((id: string) => {
      if (id.startsWith(`${selectedRoute.id}-`)) return id;
      const num = id.replace(/^[^-]+-/, '').replace(/^seat-/, '').replace(/^0+/, '');
      return `${selectedRoute.id}-${num}`;
    });

    set({ isLoading: true, error: null });

    try {
      const newBooking = await bookingsApi.create({
        routeId: selectedRoute.id,
        boardingPointId: selectedBoardingPoint.id,
        dropPointId: selectedDropPoint.id,
        seatIds: canonicalSeatIds,
        sessionId,
        passenger: {
          fullName: passengerInfo.fullName,
          email: passengerInfo.email,
          phone: passengerInfo.phone,
          gender: passengerInfo.gender,
          age: passengerInfo.age,
        },
        paymentMethod,
        promoCode: appliedPromo || undefined,
        insuranceSelected,
        searchDate,
      });

      // Update selectedRoute local seat status so the SeatMap updates immediately with proper gender colors
      if (selectedRoute) {
        canonicalSeatIds.forEach(seatId => {
          const s = selectedRoute.seats.find(st => st.id === seatId || st.number === seatId.split('-').pop());
          if (s) {
            s.status = 'booked';
            (s as any).gender = passengerInfo.gender || 'male';
            if (passengerInfo.gender === 'female') {
              (s as any).isFemaleBooked = true;
            }
          }
        });
      }

      // Refresh routes so seat counts update
      const updatedRoutes = await routesApi.getAll();

      // Confetti
      if (paymentMethod !== 'bank_transfer') {
        try { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); } catch (_) {}
      }

      set({
        routes: updatedRoutes,
        bookings: [newBooking, ...get().bookings],
        latestConfirmedBooking: newBooking,
        selectedSeatIds: [],
        lockActive: false,
        isLoading: false,
        appliedPromo: '',
        discountRate: 0,
      });
      if (paymentMethod === 'bank_transfer') {
        get().setCurrentView('slip-upload');
      } else {
        get().setCurrentView('ticket-confirmation');
      }

      return newBooking;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return null;
    }
  },

  cancelBooking: async (pnr: string) => {
    try {
      await bookingsApi.cancel(pnr);
      // Refresh both bookings and routes
      const [bookings, routes] = await Promise.all([bookingsApi.getAll(), routesApi.getAll()]);
      set({ bookings, routes });
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    }
  },

  validateTicketByPNR: async (pnr: string) => {
    try {
      const result = await validateApi.validate(pnr);
      // Refresh bookings to reflect boarded status
      if (result.success) {
        bookingsApi.getAll().then((bookings) => set({ bookings })).catch(() => {});
      }
      return result;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  trackingRouteId: 'route-101',
  setTrackingRouteId: (id) => {
    set({ trackingRouteId: id });
    get().setCurrentView('live-tracking');
  },

  // Admin Payment Slips & Notifications Implementation
  paymentSlips: [],
  loadPaymentSlips: async (isBackground = false) => {
    try {
      const slips = await paymentSlipsApi.getAll();
      const prevSlips = get().paymentSlips;
      const prevPendingCount = prevSlips.filter((s: PaymentSlip) => s.status === 'pending').length;
      const newPendingCount = slips.filter((s: PaymentSlip) => s.status === 'pending').length;

      // Play audio chime if a new slip arrived
      if (isBackground && newPendingCount > prevPendingCount && get().adminSoundEnabled) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            // iOS Notes-style: soft triple ascending chime (E5 → A5 → E6)
            const notes = [
              { freq: 659.25, delay: 0,    gain: 0.28, decay: 0.55 },
              { freq: 880.00, delay: 0.18, gain: 0.26, decay: 0.75 },
              { freq: 1318.5, delay: 0.36, gain: 0.18, decay: 1.00 },
            ];
            notes.forEach(({ freq, delay, gain, decay }) => {
              const osc = ctx.createOscillator();
              const g = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now + delay);
              g.gain.setValueAtTime(0, now + delay);
              g.gain.linearRampToValueAtTime(gain, now + delay + 0.015);
              g.gain.exponentialRampToValueAtTime(0.001, now + delay + decay);
              osc.connect(g);
              g.connect(ctx.destination);
              osc.start(now + delay);
              osc.stop(now + delay + decay);
            });
          }
        } catch {}
      }

      set({ paymentSlips: slips });
    } catch (err: any) {
      console.error('Error loading payment slips in store:', err);
    }
  },
  isNotificationDrawerOpen: false,
  setIsNotificationDrawerOpen: (open) => set({ isNotificationDrawerOpen: open }),
  adminSoundEnabled: localStorage.getItem('dewmina_admin_sound') !== 'false',
  setAdminSoundEnabled: (enabled) => {
    localStorage.setItem('dewmina_admin_sound', String(enabled));
    set({ adminSoundEnabled: enabled });
  },
  adminReadSlipIds: (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_read_slips') || '[]');
    } catch {
      return [];
    }
  })(),
  markSlipAsRead: (slipId: string) => {
    const current = get().adminReadSlipIds;
    if (!current.includes(slipId)) {
      const updated = [...current, slipId];
      localStorage.setItem('admin_read_slips', JSON.stringify(updated));
      set({ adminReadSlipIds: updated });
    }
  },
  markAllSlipsAsRead: () => {
    const pendingIds = get().paymentSlips.filter((s: PaymentSlip) => s.status === 'pending').map((s: PaymentSlip) => s.id);
    const updated = Array.from(new Set([...get().adminReadSlipIds, ...pendingIds]));
    localStorage.setItem('admin_read_slips', JSON.stringify(updated));
    set({ adminReadSlipIds: updated });
  },
  adminActiveTab: 'fleet',
  setAdminActiveTab: (tab: string) => set({ adminActiveTab: tab }),

  // Localization Implementation
  language: (localStorage.getItem('dewmina_lang') as Language) || 'english',
  setLanguage: (lang) => {
    localStorage.setItem('dewmina_lang', lang);
    set({ language: lang });
  },
  t: (key) => {
    const lang = get().language;
    const dict = translations[lang] || translations.english;
    // Fallback if the key doesn't exist in translation dictionary
    return (dict as any)[key] || key;
  },
}));
