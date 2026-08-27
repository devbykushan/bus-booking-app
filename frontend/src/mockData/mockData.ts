import type { BusRoute, Seat } from '../types/booking';

const generateSeats = (busType: string, hasUpperDeck: boolean = false): Seat[] => {
  const seats: Seat[] = [];
  const basePrice = (busType.includes('Normal Service') || busType.includes('3*2') || busType.includes('Leyland')) ? 1160 : (busType.includes('Super Luxury') || busType.includes('Luxury')) ? 2670 : busType.includes('Sleeper') ? 2800 : 2670;

  // Super Luxury 49-seat 2*2 layout (Sri Lanka Express Coach 1-49)
  if (busType.includes('49 Seats') || busType.includes('Super Luxury')) {
    const femaleSeats = ['15', '19', '20', '23'];
    for (let r = 1; r <= 11; r++) {
      const leftWindowNum = ((r - 1) * 4 + 3).toString();
      const leftAisleNum = ((r - 1) * 4 + 4).toString();
      const rightAisleNum = ((r - 1) * 4 + 2).toString();
      const rightWindowNum = ((r - 1) * 4 + 1).toString();

      seats.push(
        { id: leftWindowNum, number: leftWindowNum, deck: 'lower', row: r, col: 1, price: basePrice, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(leftWindowNum) },
        { id: leftAisleNum, number: leftAisleNum, deck: 'lower', row: r, col: 2, price: basePrice, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(leftAisleNum) },
        { id: rightAisleNum, number: rightAisleNum, deck: 'lower', row: r, col: 4, price: basePrice, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(rightAisleNum) },
        { id: rightWindowNum, number: rightWindowNum, deck: 'lower', row: r, col: 5, price: basePrice, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(rightWindowNum) }
      );
    }
    const backSeats = [
      { num: '47', col: 1 },
      { num: '48', col: 2 },
      { num: '49', col: 3 },
      { num: '46', col: 4 },
      { num: '45', col: 5 },
    ];
    backSeats.forEach(s => {
      seats.push({ id: s.num, number: s.num, deck: 'lower', row: 12, col: s.col, price: basePrice, status: 'available', isSleeper: false, isFemaleOnly: false });
    });
    return seats;
  }

  // Ashok Leyland Normal Service 58-Seat 3*2 layout (Matching exact user diagram)
  if (busType.includes('Ashok Leyland') || busType.includes('Normal Service') || busType.includes('58 Seats') || busType.includes('54 Seats 3*2') || busType.includes('3*2')) {
    const femaleSeats = ['7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
    const bookedSeats = ['3', '15', '22', '31'];

    // Row 0: Top left single seat #1 (Mandatory Unavailable for Crew/Conductor)
    seats.push({
      id: '1', number: '1', deck: 'lower', row: 0, col: 1, price: basePrice,
      status: 'unavailable', isSleeper: false, isFemaleOnly: false
    });

    // Rows 1-9: 2 seats left (cols 1, 2), 3 seats right (cols 4, 5, 6)
    let currentNum = 2;
    for (let r = 1; r <= 9; r++) {
      [1, 2, 4, 5, 6].forEach((c) => {
        const numStr = currentNum.toString();
        seats.push({
          id: numStr,
          number: numStr,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: bookedSeats.includes(numStr) ? 'booked' : 'available',
          isSleeper: false,
          isFemaleOnly: femaleSeats.includes(numStr)
        });
        currentNum++;
      });
    }

    // Rows 10 & 11: 3 seats right only (cols 4, 5, 6 - left side is door/stairwell gap)
    for (let r = 10; r <= 11; r++) {
      [4, 5, 6].forEach((c) => {
        const numStr = currentNum.toString();
        seats.push({
          id: numStr,
          number: numStr,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: 'available',
          isSleeper: false,
          isFemaleOnly: false
        });
        currentNum++;
      });
    }

    // Row 12: 6 seats across the back wall (cols 1, 2, 3, 4, 5, 6)
    [1, 2, 3, 4, 5, 6].forEach((c) => {
      const numStr = currentNum.toString();
      seats.push({
        id: numStr,
        number: numStr,
        deck: 'lower',
        row: 12,
        col: c,
        price: basePrice,
        status: 'available',
        isSleeper: false,
        isFemaleOnly: false
      });
      currentNum++;
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
    id: 'route-100',
    operatorId: 'op-dewmina',
    operatorName: 'Dewmina Super Line',
    operatorRating: 4.9,
    busNumber: 'ND-3223 (Normal Service - Route 98)',
    busType: 'Normal Service',
    origin: 'Monaragala',
    destination: 'Colombo',
    departureTime: '05:00 AM',
    arrivalTime: '11:30 AM',
    duration: '6h 30m',
    priceStarting: 1160,
    availableSeatsCount: 34,
    totalSeatsCount: 54,
    hasUpperDeck: false,
    amenities: ['Normal Service A4 Highway', 'Reclining Seats', 'Live GPS Tracking', 'Direct Route 98 Pass'],
    boardingPoints: [
      { id: 'bp-100-1', name: 'Monaragala Main Bus Terminal', time: '05:00 AM', landmark: 'Platform 3', lat: 6.8722, lng: 81.3507 },
      { id: 'bp-100-2', name: 'Wellawaya Clock Tower', time: '05:40 AM', landmark: 'A4 Highway Junction', lat: 6.7410, lng: 81.1020 },
      { id: 'bp-100-3', name: 'Balangoda Bus Stand', time: '07:15 AM', landmark: 'Town Terminal', lat: 6.6580, lng: 80.7020 },
      { id: 'bp-100-4', name: 'Ratnapura Clock Tower', time: '08:30 AM', landmark: 'City Bus Stand', lat: 6.6828, lng: 80.3992 },
    ],
    dropPoints: [
      { id: 'dp-100-1', name: 'Avissawella Bus Terminal', time: '09:45 AM', landmark: 'A4 Main Stop', lat: 6.9530, lng: 80.2070 },
      { id: 'dp-100-2', name: 'Colombo Fort (Pettah Bastian Mawatha)', time: '11:30 AM', landmark: 'Central Terminal', lat: 6.9344, lng: 79.8530 },
    ],
    gpsLocation: {
      lat: 6.6828,
      lng: 80.3992,
      speedKmH: 55,
      currentStopName: 'Ratnapura Clock Tower',
      nextStopName: 'Avissawella Bus Terminal',
      etaMinutes: 180,
      lastUpdated: 'Just now'
    },
    seats: generateSeats('Ashok Leyland (54 Seats 3*2 Normal Service)', false)
  },
  {
    id: 'route-101',
    operatorId: 'op-dewmina',
    operatorName: 'Dewmina Super Line',
    operatorRating: 4.9,
    busNumber: 'ND-7788 (Dewmina Express)',
    busType: 'Super Luxury',
    origin: 'Monaragala',
    destination: 'Colombo',
    departureTime: '06:30 AM',
    arrivalTime: '12:30 PM',
    duration: '5h 30m',
    priceStarting: 2670,
    availableSeatsCount: 22,
    totalSeatsCount: 36,
    hasUpperDeck: false,
    amenities: ['Super Luxury AC', 'High-Speed Wi-Fi', 'Reclining Push-Back Seats', 'USB Fast Charging', 'Live GPS Tracking', 'Bottled Water', 'Expressway Direct Pass'],
    boardingPoints: [
      { id: 'bp-1', name: 'Monaragala Main Bus Terminal', time: '06:30 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
      { id: 'bp-2', name: 'Wellawaya Clock Tower', time: '07:05 AM', landmark: 'A4 Main Junction', lat: 6.7410, lng: 81.1020 },
      { id: 'bp-3', name: 'Thanamalwila Junction', time: '07:45 AM', landmark: 'Highway Express Stop', lat: 6.4380, lng: 81.1328 },
      { id: 'bp-4', name: 'Mattala Interchange (E01 Highway Entry)', time: '08:15 AM', landmark: 'Expressway Toll Gate', lat: 6.3025, lng: 81.1189 },
    ],
    dropPoints: [
      { id: 'dp-1', name: 'Makumbura (Kottawa) Multimodal Center', time: '11:45 AM', landmark: 'E01 Expressway Exit Hub', lat: 6.8416, lng: 79.9974 },
      { id: 'dp-2', name: 'Colombo Fort (Bastian Mawatha)', time: '12:30 PM', landmark: 'Super Luxury Terminal Gate 1', lat: 6.9344, lng: 79.8530 },
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
    busType: 'AC Sleeper',
    origin: 'Colombo',
    destination: 'Jaffna',
    departureTime: '09:30 PM',
    arrivalTime: '05:00 AM',
    duration: '7h 30m',
    priceStarting: 3500,
    availableSeatsCount: 18,
    totalSeatsCount: 36,
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
    seats: generateSeats('AC Sleeper', true)
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
