import type { BusRoute, Seat, Booking } from '../types/booking';

const generateSeats = (busType: string, hasUpperDeck: boolean = false): Seat[] => {
  const seats: Seat[] = [];
  const totalRows = busType.includes('Sleeper') ? 6 : 10;
  
  for (let r = 1; r <= totalRows; r++) {
    const cols = busType.includes('Sleeper') ? [1, 2, 4] : [1, 2, 4, 5];
    cols.forEach((c) => {
      const isFemaleOnly = (r === 2 || r === 3) && (c === 1 || c === 2);
      const seatNum = `L${r}${String.fromCharCode(64 + c)}`;
      const isBooked = (r === 1 && c === 1) || (r === 4 && c === 2) || (r === 5 && c === 4);

      seats.push({
        id: seatNum,
        number: seatNum,
        deck: 'lower',
        row: r,
        col: c,
        price: busType.includes('Sleeper') ? 45 : 30,
        status: isBooked ? 'booked' : 'available',
        isSleeper: busType.includes('Sleeper'),
        isFemaleOnly,
      });
    });
  }

  if (hasUpperDeck) {
    for (let r = 1; r <= totalRows; r++) {
      const cols = busType.includes('Sleeper') ? [1, 2, 4] : [1, 2, 4, 5];
      cols.forEach((c) => {
        const isFemaleOnly = r === 1 && c === 1;
        const seatNum = `U${r}${String.fromCharCode(64 + c)}`;
        const isBooked = (r === 2 && c === 4) || (r === 6 && c === 1);

        seats.push({
          id: seatNum,
          number: seatNum,
          deck: 'upper',
          row: r,
          col: c,
          price: busType.includes('Sleeper') ? 50 : 35,
          status: isBooked ? 'booked' : 'available',
          isSleeper: busType.includes('Sleeper'),
          isFemaleOnly,
        });
      });
    }
  }

  return seats;
};

export const MOCK_ROUTES: BusRoute[] = [
  {
    id: 'route-101',
    operatorId: 'op-express',
    operatorName: 'OmniExpress Lines',
    operatorRating: 4.8,
    busNumber: 'OMNI-9082',
    busType: 'AC Sleeper',
    origin: 'New York, NY',
    destination: 'Boston, MA',
    departureTime: '08:30 AM',
    arrivalTime: '01:15 PM',
    duration: '4h 45m',
    priceStarting: 45,
    availableSeatsCount: 22,
    totalSeatsCount: 36,
    hasUpperDeck: true,
    amenities: ['Wi-Fi', 'Power Outlet', 'Reclining Sleeper', 'Water Bottle', 'Live GPS', 'Blanket'],
    boardingPoints: [
      { id: 'bp-1', name: 'Port Authority Bus Terminal', time: '08:15 AM', landmark: 'Gate 22, 8th Ave', lat: 40.7570, lng: -73.9902 },
      { id: 'bp-2', name: 'Queens Plaza Station', time: '08:30 AM', landmark: 'Subway Exit 3', lat: 40.7505, lng: -73.9401 },
    ],
    dropPoints: [
      { id: 'dp-1', name: 'South Station Terminal', time: '01:00 PM', landmark: 'Platform 4', lat: 42.3523, lng: -71.0552 },
      { id: 'dp-2', name: 'Back Bay Station', time: '01:15 PM', landmark: 'Dartmouth St Entrance', lat: 42.3474, lng: -71.0754 },
    ],
    gpsLocation: {
      lat: 41.3083,
      lng: -72.9279,
      speedKmH: 85,
      currentStopName: 'New Haven Transit Stop',
      nextStopName: 'Hartford Union Station',
      etaMinutes: 125,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('AC Sleeper', true)
  },
  {
    id: 'route-102',
    operatorId: 'op-royal',
    operatorName: 'Royal Cruiser Travels',
    operatorRating: 4.6,
    busNumber: 'RC-4011',
    busType: 'Luxury Volvo Multi-Axle',
    origin: 'Los Angeles, CA',
    destination: 'San Francisco, CA',
    departureTime: '09:00 PM',
    arrivalTime: '05:30 AM',
    duration: '8h 30m',
    priceStarting: 38,
    availableSeatsCount: 28,
    totalSeatsCount: 40,
    hasUpperDeck: false,
    amenities: ['Wi-Fi', 'Charging Port', 'Leg Rest', 'Restroom', 'Live Tracking'],
    boardingPoints: [
      { id: 'bp-3', name: 'Union Station Amtrak/Bus Plaza', time: '08:45 PM', landmark: 'Bay 6', lat: 34.0562, lng: -118.2365 },
      { id: 'bp-4', name: 'North Hollywood Station', time: '09:15 PM', landmark: 'Lankershim Blvd', lat: 34.1685, lng: -118.3768 },
    ],
    dropPoints: [
      { id: 'dp-3', name: 'Salesforce Transit Center', time: '05:15 AM', landmark: 'Level 3 Bus Deck', lat: 37.7897, lng: -122.3972 },
    ],
    gpsLocation: {
      lat: 35.3733,
      lng: -119.0187,
      speedKmH: 100,
      currentStopName: 'Bakersfield Rest Area',
      nextStopName: 'Fresno Transit Hub',
      etaMinutes: 240,
      lastUpdated: '1 min ago'
    },
    seats: generateSeats('AC Seater', false)
  },
  {
    id: 'route-103',
    operatorId: 'op-city',
    operatorName: 'City Connect Air Bus',
    operatorRating: 4.9,
    busNumber: 'CC-7721',
    busType: 'Double Decker Sleeper',
    origin: 'Chicago, IL',
    destination: 'Detroit, MI',
    departureTime: '02:00 PM',
    arrivalTime: '07:15 PM',
    duration: '5h 15m',
    priceStarting: 42,
    availableSeatsCount: 30,
    totalSeatsCount: 48,
    hasUpperDeck: true,
    amenities: ['Wi-Fi', 'Individual Screens', 'Coffee Dispenser', 'Reclining Sleeper', 'Live GPS'],
    boardingPoints: [
      { id: 'bp-5', name: 'Union Station Canal St', time: '01:45 PM', landmark: 'Jackson Blvd Gate', lat: 41.8786, lng: -87.6403 },
    ],
    dropPoints: [
      { id: 'dp-4', name: 'Detroit Rosa Parks Transit Center', time: '07:15 PM', landmark: 'Bay 12', lat: 42.3314, lng: -83.0458 },
    ],
    gpsLocation: {
      lat: 41.6820,
      lng: -86.2520,
      speedKmH: 92,
      currentStopName: 'South Bend Hub',
      nextStopName: 'Kalamazoo Terminal',
      etaMinutes: 110,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('Double Decker Sleeper', true)
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-89021',
    pnr: 'OMNI-89021',
    routeId: 'route-101',
    operatorName: 'OmniExpress Lines',
    busNumber: 'OMNI-9082',
    busType: 'AC Sleeper',
    origin: 'New York, NY',
    destination: 'Boston, MA',
    departureDate: '2026-08-20',
    departureTime: '08:30 AM',
    boardingPoint: MOCK_ROUTES[0].boardingPoints[0],
    dropPoint: MOCK_ROUTES[0].dropPoints[0],
    seats: [
      { id: 'L2A', number: 'L2A', deck: 'lower', row: 2, col: 1, price: 45, status: 'booked', isFemaleOnly: true }
    ],
    passenger: {
      fullName: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      phone: '+1 (555) 234-5678',
      gender: 'female',
      age: 28,
      isSoloFemale: true
    },
    baseFare: 45.00,
    taxAmount: 4.50,
    insuranceAmount: 1.50,
    discountAmount: 5.00,
    totalFare: 46.00,
    promoCodeApplied: 'BUS2026',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    qrCodeData: 'OMNI-89021|Sarah Jenkins|L2A|New York->Boston',
    createdAt: '2026-08-19 10:15 AM'
  }
];
