import type { BusRoute, Seat } from '../types/booking';

const generateSeats = (busType: string, hasUpperDeck: boolean = false): Seat[] => {
  const seats: Seat[] = [];
  const basePrice = busType.includes('Sleeper') ? 2800 : 1800;

  // 1. Lanka Ashok Leyland 57-Seat 3*2 Model (Classic Sri Lanka Leyland Intercity)
  if (busType.includes('3*2') || busType.includes('Leyland')) {
    const totalRows = 11;
    for (let r = 1; r <= totalRows; r++) {
      const cols = [1, 2, 3, 5, 6];
      cols.forEach((c) => {
        const isFemaleOnly = (r === 2 || r === 3) && (c === 1 || c === 2 || c === 3);
        const seatLetter = String.fromCharCode(64 + (c > 4 ? c - 1 : c));
        const seatNum = `${r}${seatLetter}`;
        const isBooked = (r === 1 && c === 1) || (r === 3 && c === 5) || (r === 6 && c === 2);

        seats.push({
          id: seatNum,
          number: seatNum,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: isBooked ? 'booked' : 'available',
          isSleeper: false,
          isFemaleOnly,
        });
      });
    }
    // Row 12: 2 seats for 57 seats total
    [1, 2].forEach((c) => {
      const seatNum = `12${String.fromCharCode(64 + c)}`;
      seats.push({
        id: seatNum,
        number: seatNum,
        deck: 'lower',
        row: 12,
        col: c,
        price: basePrice,
        status: 'available',
        isSleeper: false,
        isFemaleOnly: false,
      });
    });
    return seats;
  }

  // 2. Lanka Ashok Leyland 57-Seat 2*2 Model
  if (busType.includes('2*2')) {
    const totalRows = 14;
    for (let r = 1; r <= totalRows; r++) {
      [1, 2, 4, 5].forEach((c) => {
        const isFemaleOnly = (r === 2 || r === 3) && (c === 1 || c === 2);
        const seatLetter = String.fromCharCode(64 + (c > 3 ? c - 1 : c));
        const seatNum = `${r}${seatLetter}`;
        const isBooked = (r === 1 && c === 1) || (r === 4 && c === 4);

        seats.push({
          id: seatNum,
          number: seatNum,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: isBooked ? 'booked' : 'available',
          isSleeper: false,
          isFemaleOnly,
        });
      });
    }
    seats.push({
      id: '15A',
      number: '15A',
      deck: 'lower',
      row: 15,
      col: 1,
      price: basePrice,
      status: 'available',
      isSleeper: false,
      isFemaleOnly: false,
    });
    return seats;
  }

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
        price: busType.includes('Sleeper') ? 2800 : 1800,
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
          price: busType.includes('Sleeper') ? 3200 : 2000,
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
    operatorId: 'op-dewmina',
    operatorName: 'Dewmina Super Line',
    operatorRating: 4.9,
    busNumber: 'ND-7788 (Dewmina Express)',
    busType: 'Luxury Volvo Multi-Axle',
    origin: 'Monaragala',
    destination: 'Colombo',
    departureTime: '06:30 AM',
    arrivalTime: '12:30 PM',
    duration: '6h 00m',
    priceStarting: 2800,
    availableSeatsCount: 22,
    totalSeatsCount: 36,
    hasUpperDeck: false,
    amenities: ['Wi-Fi', 'AC', 'Reclining Seats', 'Power Outlet', 'Live GPS', 'Water Bottle'],
    boardingPoints: [
      { id: 'bp-1', name: 'Monaragala Main Bus Station', time: '06:30 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
      { id: 'bp-2', name: 'Wellawaya Town Clock Tower', time: '07:15 AM', landmark: 'Main Junction', lat: 6.7410, lng: 81.1020 },
      { id: 'bp-3', name: 'Ratnapura Central Stand', time: '10:15 AM', landmark: 'Stand Gate 2', lat: 6.6828, lng: 80.3992 },
    ],
    dropPoints: [
      { id: 'dp-1', name: 'Kottawa Interchange', time: '12:00 PM', landmark: 'Exit Gate', lat: 6.8415, lng: 79.9654 },
      { id: 'dp-2', name: 'Colombo Fort Central Bus Stand', time: '12:30 PM', landmark: 'Main Entrance', lat: 6.9344, lng: 79.8530 },
    ],
    gpsLocation: {
      lat: 6.7410,
      lng: 81.1020,
      speedKmH: 72,
      currentStopName: 'Monaragala Main Terminal',
      nextStopName: 'Wellawaya Clock Tower',
      etaMinutes: 360,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('Luxury Volvo Multi-Axle', false)
  },
  {
    id: 'route-102',
    operatorId: 'op-royal',
    operatorName: 'Royal Express LK',
    operatorRating: 4.8,
    busNumber: 'NC-5520 (Kandy Intercity)',
    busType: 'AC Sleeper',
    origin: 'Colombo',
    destination: 'Kandy',
    departureTime: '08:30 AM',
    arrivalTime: '11:45 AM',
    duration: '3h 15m',
    priceStarting: 1800,
    availableSeatsCount: 28,
    totalSeatsCount: 36,
    hasUpperDeck: true,
    amenities: ['Wi-Fi', 'AC Sleeper', 'Power Outlet', 'Reclining Sleeper', 'Live GPS'],
    boardingPoints: [
      { id: 'bp-102-1', name: 'Colombo Fort Bus Terminal', time: '08:30 AM', landmark: 'Bastian Mawatha Gate 3', lat: 6.9344, lng: 79.8530 },
      { id: 'bp-102-2', name: 'Kadawatha Highway Entrance', time: '09:00 AM', landmark: 'Interchange Gate', lat: 7.0016, lng: 79.9542 },
    ],
    dropPoints: [
      { id: 'dp-102-1', name: 'Kandy Goods Shed Bus Stand', time: '11:45 AM', landmark: 'Platform 4', lat: 7.2906, lng: 80.6337 },
    ],
    gpsLocation: {
      lat: 7.0016,
      lng: 79.9542,
      speedKmH: 65,
      currentStopName: 'Kadawatha Interchange',
      nextStopName: 'Peradeniya Junction',
      etaMinutes: 165,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('AC Sleeper', true)
  },
  {
    id: 'route-103',
    operatorId: 'op-dewmina',
    operatorName: 'Dewmina Super Line',
    operatorRating: 4.9,
    busNumber: 'ND-9900 (Dewmina Night Super)',
    busType: 'Double Decker Sleeper',
    origin: 'Colombo',
    destination: 'Jaffna',
    departureTime: '09:30 PM',
    arrivalTime: '05:00 AM',
    duration: '7h 30m',
    priceStarting: 3500,
    availableSeatsCount: 18,
    totalSeatsCount: 48,
    hasUpperDeck: true,
    amenities: ['Wi-Fi', 'AC Sleeper', 'Blanket', 'Charging Ports', 'Live GPS', 'Night Reading Lamp'],
    boardingPoints: [
      { id: 'bp-103-1', name: 'Colombo Fort Bus Terminal', time: '09:30 PM', landmark: 'Platform 12', lat: 6.9344, lng: 79.8530 },
    ],
    dropPoints: [
      { id: 'dp-103-1', name: 'Jaffna Central Bus Station', time: '05:00 AM', landmark: 'Main Stand', lat: 9.6615, lng: 80.0255 },
    ],
    gpsLocation: {
      lat: 6.9344,
      lng: 79.8530,
      speedKmH: 80,
      currentStopName: 'Colombo Fort Terminal',
      nextStopName: 'Kurunegala Central',
      etaMinutes: 450,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('Double Decker Sleeper', true)
  },
  {
    id: 'route-104',
    operatorId: 'op-southern',
    operatorName: 'Southern Highway Super',
    operatorRating: 4.7,
    busNumber: 'NB-3341 (Expressway Air Bus)',
    busType: 'Luxury Volvo Multi-Axle',
    origin: 'Colombo',
    destination: 'Galle',
    departureTime: '02:00 PM',
    arrivalTime: '03:45 PM',
    duration: '1h 45m',
    priceStarting: 1500,
    availableSeatsCount: 30,
    totalSeatsCount: 40,
    hasUpperDeck: false,
    amenities: ['Wi-Fi', 'AC', 'Power Outlet', 'Live GPS'],
    boardingPoints: [
      { id: 'bp-104-1', name: 'Makumbura Multimodal Center', time: '02:00 PM', landmark: 'Highway Bay 1', lat: 6.8450, lng: 79.9720 },
    ],
    dropPoints: [
      { id: 'dp-104-1', name: 'Galle International Bus Stand', time: '03:45 PM', landmark: 'Fort Gate Platform', lat: 6.0367, lng: 80.2170 },
    ],
    gpsLocation: {
      lat: 6.8450,
      lng: 79.9720,
      speedKmH: 95,
      currentStopName: 'Makumbura MMC',
      nextStopName: 'Pinnaduwa Exit',
      etaMinutes: 105,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('Luxury Volvo Multi-Axle', false)
  },
  {
    id: 'route-105',
    operatorId: 'op-dewmina',
    operatorName: 'Dewmina Super Line',
    operatorRating: 4.9,
    busNumber: 'ND-4412 (Dewmina Hill Express)',
    busType: 'AC Sleeper',
    origin: 'Monaragala',
    destination: 'Kandy',
    departureTime: '07:00 AM',
    arrivalTime: '12:00 PM',
    duration: '5h 00m',
    priceStarting: 2200,
    availableSeatsCount: 24,
    totalSeatsCount: 36,
    hasUpperDeck: true,
    amenities: ['Wi-Fi', 'AC Sleeper', 'Charging Ports', 'Live GPS', 'Water Bottle'],
    boardingPoints: [
      { id: 'bp-105-1', name: 'Monaragala Main Station', time: '07:00 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
    ],
    dropPoints: [
      { id: 'dp-105-1', name: 'Kandy Goods Shed Stand', time: '12:00 PM', landmark: 'Main Stand', lat: 7.2906, lng: 80.6337 },
    ],
    gpsLocation: {
      lat: 6.8722,
      lng: 81.3507,
      speedKmH: 60,
      currentStopName: 'Monaragala Main Station',
      nextStopName: 'Badulla Bus Stand',
      etaMinutes: 300,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('AC Sleeper', true)
  }
];
