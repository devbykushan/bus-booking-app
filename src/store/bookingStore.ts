import { create } from 'zustand';
import type { BusRoute, Seat, Booking, PassengerDetails, BoardingPoint } from '../types/booking';
import { MOCK_ROUTES, MOCK_BOOKINGS } from '../mockData/mockData';

export type AppView = 
  | 'passenger-search'
  | 'seat-selection'
  | 'checkout'
  | 'ticket-confirmation'
  | 'my-bookings'
  | 'live-tracking'
  | 'operator-panel'
  | 'admin-panel';

interface BookingStore {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Role switching
  userRole: 'passenger' | 'operator' | 'admin';
  setUserRole: (role: 'passenger' | 'operator' | 'admin') => void;

  // Search criteria
  searchOrigin: string;
  searchDestination: string;
  searchDate: string;
  soloFemaleOnly: boolean;
  busTypeFilter: string;
  setSearchCriteria: (origin: string, dest: string, date: string) => void;
  setSoloFemaleOnly: (val: boolean) => void;
  setBusTypeFilter: (val: string) => void;

  // Bus Routes
  routes: BusRoute[];
  selectedRoute: BusRoute | null;
  setSelectedRoute: (route: BusRoute | null) => void;
  
  // Seat Selection & Concurrency Lock Engine
  selectedSeatIds: string[];
  lockExpirySeconds: number; // Seconds remaining in 8-min lock
  lockActive: boolean;
  toggleSeatSelection: (seatId: string) => void;
  clearSeatSelection: () => void;
  tickLockTimer: () => void;

  // Boarding & Drop selection
  selectedBoardingPoint: BoardingPoint | null;
  selectedDropPoint: BoardingPoint | null;
  setSelectedBoardingPoint: (bp: BoardingPoint) => void;
  setSelectedDropPoint: (dp: BoardingPoint) => void;

  // Passenger & Promo
  passengerInfo: PassengerDetails;
  setPassengerInfo: (info: Partial<PassengerDetails>) => void;
  appliedPromo: string;
  discountRate: number; // e.g. 0.1 for 10%
  applyPromoCode: (code: string) => boolean;

  // Bookings state
  bookings: Booking[];
  latestConfirmedBooking: Booking | null;
  createBooking: (paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet') => Booking | null;
  cancelBooking: (pnr: string) => void;
  validateTicketByPNR: (pnr: string) => { success: boolean; booking?: Booking; message: string };

  // Operator Actions
  addBusRoute: (newRoute: BusRoute) => void;

  // Tracking Target
  trackingRouteId: string | null;
  setTrackingRouteId: (id: string | null) => void;
}

// Initial LocalStorage lookup
const getSavedBookings = (): Booking[] => {
  try {
    const saved = localStorage.getItem('omnibus_bookings');
    return saved ? JSON.parse(saved) : MOCK_BOOKINGS;
  } catch (e) {
    return MOCK_BOOKINGS;
  }
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  currentView: 'passenger-search',
  setCurrentView: (view) => set({ currentView: view }),

  userRole: 'passenger',
  setUserRole: (role) => set({ userRole: role }),

  searchOrigin: 'New York, NY',
  searchDestination: 'Boston, MA',
  searchDate: new Date().toISOString().split('T')[0],
  soloFemaleOnly: false,
  busTypeFilter: 'all',

  setSearchCriteria: (origin, dest, date) => set({ searchOrigin: origin, searchDestination: dest, searchDate: date }),
  setSoloFemaleOnly: (val) => set({ soloFemaleOnly: val }),
  setBusTypeFilter: (val) => set({ busTypeFilter: val }),

  routes: MOCK_ROUTES,
  selectedRoute: null,
  setSelectedRoute: (route) => {
    set({
      selectedRoute: route,
      selectedSeatIds: [],
      selectedBoardingPoint: route ? route.boardingPoints[0] : null,
      selectedDropPoint: route ? route.dropPoints[0] : null,
      lockExpirySeconds: 480, // 8 minutes TTL
      lockActive: false
    });
  },

  selectedSeatIds: [],
  lockExpirySeconds: 480,
  lockActive: false,

  toggleSeatSelection: (seatId: string) => {
    const { selectedSeatIds, selectedRoute } = get();
    if (!selectedRoute) return;

    const seat = selectedRoute.seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'booked') return;

    let newSelected: string[];
    if (selectedSeatIds.includes(seatId)) {
      newSelected = selectedSeatIds.filter(id => id !== seatId);
    } else {
      if (selectedSeatIds.length >= 6) {
        alert('You can select a maximum of 6 seats per booking.');
        return;
      }
      newSelected = [...selectedSeatIds, seatId];
    }

    set({
      selectedSeatIds: newSelected,
      lockActive: newSelected.length > 0,
      lockExpirySeconds: newSelected.length > 0 ? (get().lockExpirySeconds || 480) : 480
    });
  },

  clearSeatSelection: () => set({ selectedSeatIds: [], lockActive: false, lockExpirySeconds: 480 }),

  tickLockTimer: () => {
    const { lockActive, lockExpirySeconds } = get();
    if (!lockActive) return;

    if (lockExpirySeconds <= 1) {
      set({ selectedSeatIds: [], lockActive: false, lockExpirySeconds: 480 });
      alert('Seat hold time expired! Please select your seats again.');
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
    isSoloFemale: false
  },
  setPassengerInfo: (info) => set((state) => ({ passengerInfo: { ...state.passengerInfo, ...info } })),

  appliedPromo: '',
  discountRate: 0,
  applyPromoCode: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'BUS2026') {
      set({ appliedPromo: 'BUS2026', discountRate: 0.15 });
      return true;
    } else if (cleanCode === 'SAVE10') {
      set({ appliedPromo: 'SAVE10', discountRate: 0.10 });
      return true;
    }
    return false;
  },

  bookings: getSavedBookings(),
  latestConfirmedBooking: null,

  createBooking: (paymentMethod) => {
    const { 
      selectedRoute, 
      selectedSeatIds, 
      selectedBoardingPoint, 
      selectedDropPoint, 
      passengerInfo, 
      discountRate, 
      appliedPromo,
      routes,
      bookings
    } = get();

    if (!selectedRoute || selectedSeatIds.length === 0 || !selectedBoardingPoint || !selectedDropPoint) {
      return null;
    }

    const selectedSeats = selectedRoute.seats.filter(s => selectedSeatIds.includes(s.id));
    const baseFare = selectedSeats.reduce((acc, s) => acc + s.price, 0);
    const taxAmount = Number((baseFare * 0.10).toFixed(2));
    const insuranceAmount = 1.50;
    const discountAmount = Number((baseFare * discountRate).toFixed(2));
    const totalFare = Number((baseFare + taxAmount + insuranceAmount - discountAmount).toFixed(2));

    const pnr = `OMNI-${Math.floor(10000 + Math.random() * 90000)}`;
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      id: bookingId,
      pnr,
      routeId: selectedRoute.id,
      operatorName: selectedRoute.operatorName,
      busNumber: selectedRoute.busNumber,
      busType: selectedRoute.busType,
      origin: selectedRoute.origin,
      destination: selectedRoute.destination,
      departureDate: get().searchDate || new Date().toISOString().split('T')[0],
      departureTime: selectedRoute.departureTime,
      boardingPoint: selectedBoardingPoint,
      dropPoint: selectedDropPoint,
      seats: selectedSeats,
      passenger: passengerInfo,
      baseFare,
      taxAmount,
      insuranceAmount,
      discountAmount,
      totalFare,
      promoCodeApplied: appliedPromo || undefined,
      paymentMethod,
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
      qrCodeData: `PNR:${pnr}|PASS:${passengerInfo.fullName}|BUS:${selectedRoute.busNumber}|SEATS:${selectedSeatIds.join(',')}`,
      createdAt: new Date().toLocaleString()
    };

    const updatedRoutes = routes.map(r => {
      if (r.id === selectedRoute.id) {
        const updatedSeats = r.seats.map(s => {
          if (selectedSeatIds.includes(s.id)) {
            return { ...s, status: 'booked' as const };
          }
          return s;
        });
        return {
          ...r,
          seats: updatedSeats,
          availableSeatsCount: r.availableSeatsCount - selectedSeatIds.length
        };
      }
      return r;
    });

    const updatedBookings = [newBooking, ...bookings];

    try {
      localStorage.setItem('omnibus_bookings', JSON.stringify(updatedBookings));
    } catch (e) {
      console.error(e);
    }

    set({
      routes: updatedRoutes,
      bookings: updatedBookings,
      latestConfirmedBooking: newBooking,
      selectedSeatIds: [],
      lockActive: false,
      currentView: 'ticket-confirmation'
    });

    return newBooking;
  },

  cancelBooking: (pnr) => {
    const { bookings, routes } = get();
    const targetBooking = bookings.find(b => b.pnr === pnr);
    if (!targetBooking) return;

    const updatedBookings = bookings.map(b => {
      if (b.pnr === pnr) {
        return { ...b, bookingStatus: 'cancelled' as const, paymentStatus: 'refunded' as const };
      }
      return b;
    });

    const updatedRoutes = routes.map(r => {
      if (r.id === targetBooking.routeId) {
        const bookedSeatIds = targetBooking.seats.map(s => s.id);
        const updatedSeats = r.seats.map(s => {
          if (bookedSeatIds.includes(s.id)) {
            return { ...s, status: 'available' as const };
          }
          return s;
        });
        return {
          ...r,
          seats: updatedSeats,
          availableSeatsCount: r.availableSeatsCount + bookedSeatIds.length
        };
      }
      return r;
    });

    try {
      localStorage.setItem('omnibus_bookings', JSON.stringify(updatedBookings));
    } catch (e) {}

    set({ bookings: updatedBookings, routes: updatedRoutes });
  },

  validateTicketByPNR: (pnr) => {
    const { bookings } = get();
    const cleanPnr = pnr.trim().toUpperCase();
    const booking = bookings.find(b => b.pnr.toUpperCase() === cleanPnr || b.qrCodeData.includes(cleanPnr));

    if (!booking) {
      return { success: false, message: 'Invalid PNR Code or QR scan! No matching booking found.' };
    }

    if (booking.bookingStatus === 'cancelled') {
      return { success: false, booking, message: 'Ticket Cancelled! Refund has been processed.' };
    }

    if (booking.bookingStatus === 'boarded') {
      return { success: true, booking, message: 'Passenger already scanned and boarded.' };
    }

    const updatedBookings = bookings.map(b => b.pnr === booking.pnr ? { ...b, bookingStatus: 'boarded' as const } : b);
    try {
      localStorage.setItem('omnibus_bookings', JSON.stringify(updatedBookings));
    } catch (e) {}

    set({ bookings: updatedBookings });
    return { success: true, booking: { ...booking, bookingStatus: 'boarded' }, message: 'Ticket Validated Successfully! Passenger Approved for Boarding.' };
  },

  addBusRoute: (newRoute) => set((state) => ({ routes: [newRoute, ...state.routes] })),

  trackingRouteId: 'route-101',
  setTrackingRouteId: (id) => set({ trackingRouteId: id, currentView: 'live-tracking' }),
}));
