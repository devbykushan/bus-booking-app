import { create } from 'zustand';
import type { BusRoute, BoardingPoint, Booking, PassengerDetails, UserAccount } from '../types/booking';
import { routesApi, bookingsApi, seatsApi, validateApi, authApi } from '../services/api';
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
  | 'admin-panel';

export const VIEW_HASH_MAP: Record<AppView, string> = {
  'passenger-search': 'home',
  'schedules-dashboard': 'journeys',
  'seat-selection': 'seats',
  'checkout': 'checkout',
  'ticket-confirmation': 'confirmation',
  'my-bookings': 'my-tickets',
  'live-tracking': 'live-gps',
  'admin-panel': 'admin',
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
};

export function getViewFromLocation(): AppView {
  if (typeof window === 'undefined') return 'passenger-search';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash && HASH_VIEW_MAP[hash]) {
    return HASH_VIEW_MAP[hash];
  }
  return 'passenger-search';
}

interface BookingStore {
  // Authentication
  currentUser: UserAccount | null;
  login: (email: string, pass: string, role?: 'passenger' | 'admin') => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, pass: string, role?: 'passenger' | 'admin', phone?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (val: boolean) => void;

  // Loading & errors
  isLoading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView, pushHistory?: boolean) => void;
  goToSearchSchedules: () => void;
  goToHome: () => void;

  // Role switching
  userRole: 'passenger' | 'admin';
  setUserRole: (role: 'passenger' | 'admin') => void;

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
  createBooking: (
    paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet',
    insuranceSelected: boolean,
  ) => Promise<Booking | null>;
  cancelBooking: (pnr: string) => Promise<void>;
  validateTicketByPNR: (pnr: string) => Promise<{ success: boolean; booking?: any; message: string }>;

  // GPS tracking
  trackingRouteId: string | null;
  setTrackingRouteId: (id: string | null) => void;

  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  currentUser: JSON.parse(localStorage.getItem('dewmina_user') || 'null'),
  showAuthModal: false,
  setShowAuthModal: (val) => set({ showAuthModal: val }),

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
        };
        localStorage.setItem('dewmina_user', JSON.stringify(user));
        localStorage.setItem('auth_token', res.token);
        set({
          currentUser: user,
          userRole: user.role as any,
          showAuthModal: false,
        });
        get().setCurrentView(user.role === 'admin' ? 'admin-panel' : 'passenger-search');
        return { success: true, message: res.message || 'Logged in successfully' };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Authentication error occurred' };
    }
  },

  register: async (name, email, password, role, phone) => {
    try {
      const res = await authApi.register({ name, email, password, role, phone });
      if (res.success && res.user) {
        const user: UserAccount = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          phone: res.user.phone,
        };
        localStorage.setItem('dewmina_user', JSON.stringify(user));
        localStorage.setItem('auth_token', res.token);
        set({
          currentUser: user,
          userRole: user.role as any,
          showAuthModal: false,
        });
        get().setCurrentView(user.role === 'admin' ? 'admin-panel' : 'passenger-search');
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
    set({ currentUser: null, userRole: 'passenger' });
    get().setCurrentView('passenger-search');
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
      window.history.pushState(
        { view, routeId: get().selectedRoute?.id },
        '',
        `#${hash}`
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

  setSearchCriteria: (origin, dest, date) =>
    set({ searchOrigin: origin, searchDestination: dest, searchDate: date }),
  setSoloFemaleOnly: (val) => set({ soloFemaleOnly: val }),
  setBusTypeFilter: (val) => set({ busTypeFilter: val }),

  routes: [],
  loadRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const routes = await routesApi.getAll();
      set({ routes, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: `Failed to load routes: ${err.message}` });
    }
  },
  selectedRoute: null,
  setSelectedRoute: (route) =>
    set({
      selectedRoute: route,
      selectedSeatIds: [],
      selectedBoardingPoint: route?.boardingPoints?.[0] ?? null,
      selectedDropPoint: route?.dropPoints?.[0] ?? null,
      lockExpirySeconds: 480,
      lockActive: false,
    }),
  addBusRoute: (newRoute) =>
    set((state) => ({ routes: [newRoute, ...state.routes] })),

  selectedSeatIds: [],
  lockExpirySeconds: 480,
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
        price: selectedRoute.seats[0]?.price || 3430,
        status: 'available',
        deck: 'lower'
      };
      selectedRoute.seats.push(seat);
    }

    if (seat.status === 'booked') return;
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
      lockExpirySeconds: 480,
    });
  },

  clearSeatSelection: () => {
    const { selectedSeatIds, sessionId } = get();
    if (selectedSeatIds.length > 0) {
      seatsApi.unlock({ seatIds: selectedSeatIds, sessionId }).catch(() => {});
    }
    set({ selectedSeatIds: [], lockActive: false, lockExpirySeconds: 480 });
  },

  tickLockTimer: () => {
    const { lockActive, lockExpirySeconds } = get();
    if (!lockActive) return;
    if (lockExpirySeconds <= 1) {
      get().clearSeatSelection();
      alert('Seat hold expired! Please re-select your seats.');
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

  createBooking: async (paymentMethod, insuranceSelected) => {
    const {
      selectedRoute, selectedSeatIds, selectedBoardingPoint, selectedDropPoint,
      passengerInfo, appliedPromo, searchDate, sessionId,
    } = get();

    if (!selectedRoute || selectedSeatIds.length === 0 || !selectedBoardingPoint || !selectedDropPoint) {
      return null;
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
      try { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); } catch (_) {}

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
      get().setCurrentView('ticket-confirmation');

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
