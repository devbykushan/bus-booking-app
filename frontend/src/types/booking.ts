export type BusCategory = 
  | 'Super Luxury'
  | 'Normal Service'
  | 'Ashok Leyland (54 Seats 3*2)'
  | 'Ashok Leyland (54 Seats 2*2)'
  | 'Yutong (48 Seats 2*2)'
  | 'Yutong (51 Seats 2*2)'
  | 'Lanka Ashok Leyland (57 Seats 3*2)'
  | 'Lanka Ashok Leyland (57 Seats 2*2)'
  | 'AC Seater' 
  | 'AC Sleeper' 
  | 'Non-AC Seater' 
  | 'Luxury Volvo Multi-Axle';

export type SeatStatus = 'available' | 'selected' | 'booked' | 'locked';

export type DeckType = 'lower' | 'upper';

export interface Seat {
  id: string;
  number: string;
  deck: DeckType;
  row: number;
  col: number; // 0 to 4 (e.g., 0,1 are left side, 2 aisle, 3,4 right side)
  price: number;
  status: SeatStatus;
  isSleeper?: boolean;
  isFemaleOnly?: boolean;
  lockedBy?: string; // Session or user ID
  lockExpiry?: number; // Unix timestamp
}

export interface BoardingPoint {
  id: string;
  name: string;
  time: string;
  landmark: string;
  lat: number;
  lng: number;
}

export interface GPSLocation {
  lat: number;
  lng: number;
  speedKmH: number;
  currentStopName: string;
  nextStopName: string;
  etaMinutes: number;
  lastUpdated: string;
}

export interface BusRoute {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorRating: number;
  busNumber: string;
  busType: BusCategory;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  priceStarting: number;
  availableSeatsCount: number;
  totalSeatsCount: number;
  amenities: string[];
  boardingPoints: BoardingPoint[];
  dropPoints: BoardingPoint[];
  gpsLocation: GPSLocation;
  seats: Seat[];
  hasUpperDeck?: boolean;
}

export interface PassengerDetails {
  fullName: string;
  email: string;
  phone: string;
  gender: 'female' | 'male' | 'other';
  age: number;
  isSoloFemale?: boolean;
}

export interface Booking {
  id: string;
  pnr: string;
  routeId: string;
  operatorName: string;
  busNumber: string;
  busType: BusCategory;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  boardingPoint: BoardingPoint;
  dropPoint: BoardingPoint;
  seats: Seat[];
  passenger: PassengerDetails;
  baseFare: number;
  taxAmount: number;
  insuranceAmount: number;
  discountAmount: number;
  totalFare: number;
  promoCodeApplied?: string;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  bookingStatus: 'confirmed' | 'cancelled' | 'boarded';
  qrCodeData: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'passenger' | 'admin';
}

export interface UserRole {
  role: 'passenger' | 'admin';
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalBookings: number;
  activeBuses: number;
  occupancyRate: number;
  femaleBookingsPct: number;
}
