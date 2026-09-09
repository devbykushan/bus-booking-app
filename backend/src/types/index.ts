export type SeatStatus = 'available' | 'booked' | 'locked';
export type DeckType = 'lower' | 'upper';
export type BusCategory =
  | 'Super Luxury (49 Seats 2*2)'
  | 'Super Luxury'
  | 'Luxury Air Bus (48 Seats 2*2)'
  | 'Semi Luxury (2*2 Coach)'
  | 'Normal Service (58 Seats 3*2)'
  | 'Normal Service (54 Seats 3*2)'
  | 'Normal Service'
  | 'AC Sleeper'
  | 'AC Seater'
  | 'Non-AC Seater'
  | 'Luxury Volvo Multi-Axle'
  | 'Ashok Leyland (54 Seats 3*2)'
  | 'Ashok Leyland (54 Seats 2*2)'
  | 'Yutong (48 Seats 2*2)'
  | 'Yutong (51 Seats 2*2)'
  | 'Lanka Ashok Leyland (57 Seats 3*2)'
  | 'Lanka Ashok Leyland (57 Seats 2*2)';

export interface Seat {
  id: string;
  routeId: string;
  number: string;
  deck: DeckType;
  row: number;
  col: number;
  price: number;
  status: SeatStatus;
  isSleeper: boolean;
  isFemaleOnly: boolean;
}

export interface BoardingPoint {
  id: string;
  routeId: string;
  type: 'boarding' | 'drop';
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
  hasUpperDeck: boolean;
  amenities: string[];
  gpsLat: number;
  gpsLng: number;
  gpsSpeedKmH: number;
  gpsCurrentStop: string;
  gpsNextStop: string;
  gpsEtaMinutes: number;
}

export interface RouteWithDetails extends BusRoute {
  seats: Seat[];
  boardingPoints: BoardingPoint[];
  dropPoints: BoardingPoint[];
  availableSeatsCount: number;
  totalSeatsCount: number;
}

export interface PassengerDetails {
  fullName: string;
  email: string;
  phone: string;
  gender: 'female' | 'male' | 'other';
  age: number;
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
  boardingPointId: string;
  dropPointId: string;
  seatIds: string[];
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerGender: string;
  passengerAge: number;
  baseFare: number;
  taxAmount: number;
  insuranceAmount: number;
  discountAmount: number;
  totalFare: number;
  promoCodeApplied: string | null;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: 'confirmed' | 'cancelled' | 'boarded';
  qrCodeData: string;
  createdAt: string;
}

// In-memory seat lock: seatId -> { lockedBy, expiresAt }
export interface SeatLock {
  seatId: string;
  routeId: string;
  sessionId: string;
  expiresAt: number; // Unix ms timestamp
}
