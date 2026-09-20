import React, { useState, useMemo, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { bookingsApi } from '../../services/api';
import type { Seat } from '../../types/booking';
import {
  Bus, Calendar, CheckCircle2, DollarSign, User, Phone, MapPin,
  Printer, RefreshCw, AlertCircle,
  CreditCard, Check,
  MessageSquare, X, Ticket
} from 'lucide-react';

interface CounterBookingViewProps {
  onBookingComplete?: (booking: any) => void;
}

export const CounterBookingView: React.FC<CounterBookingViewProps> = ({ onBookingComplete }) => {
  const { routes, loadRoutes, loadBookings } = useBookingStore();

  // Helper date functions (strictly up to 7 days in advance)
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => toISODate(new Date()), []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toISODate(d);
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODate(d);
  }, []);

  // State
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [travelDate, setTravelDate] = useState<string>(todayStr);
  const [selectedDeck, setSelectedDeck] = useState<'lower' | 'upper'>('lower');
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  
  // Boarding & drop points
  const [boardingPointId, setBoardingPointId] = useState<string>('');
  const [dropPointId, setDropPointId] = useState<string>('');

  // Passenger state
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerGender, setPassengerGender] = useState<'male' | 'female' | 'other'>('male');
  const [passengerAge, setPassengerAge] = useState<number>(28);
  const [passengerNic, setPassengerNic] = useState('');
  const [counterRemarks, setCounterRemarks] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'counter_card'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  // Full active route object
  const currentRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || null;
  }, [routes, selectedRouteId]);

  // Sync boarding & drop point defaults when currentRoute changes
  useEffect(() => {
    if (currentRoute) {
      if (currentRoute.boardingPoints?.length > 0) {
        setBoardingPointId(currentRoute.boardingPoints[0].id);
      } else {
        setBoardingPointId('');
      }

      if (currentRoute.dropPoints?.length > 0) {
        setDropPointId(currentRoute.dropPoints[0].id);
      } else {
        setDropPointId('');
      }
      setSelectedSeatIds([]);
    }
  }, [currentRoute?.id]);

  // Filtered routes list for quick selection
  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return routes;
    const q = routeSearchQuery.toLowerCase();
    return routes.filter(
      (r) =>
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.busNumber.toLowerCase().includes(q) ||
        r.operatorName.toLowerCase().includes(q) ||
        r.busType.toLowerCase().includes(q)
    );
  }, [routes, routeSearchQuery]);

  // Seats processing
  const routeSeats = useMemo(() => {
    if (!currentRoute || !currentRoute.seats) return [];
    return currentRoute.seats.filter((s) => s.deck === selectedDeck);
  }, [currentRoute, selectedDeck]);

  const busType = currentRoute?.busType || '';
  const is3By2 = useMemo(() => {
    return (
      busType.includes('3*2') ||
      busType.includes('Leyland') ||
      busType.includes('Normal Service') ||
      (currentRoute?.seats || []).some((s) => s.col === 6 || /[A-E]$/i.test(s.number))
    );
  }, [busType, currentRoute]);

  // Group seats by deck & row for grid rendering
  const { rowsMap, rowNumbers } = useMemo(() => {
    const map: { [row: number]: Seat[] } = {};
    routeSeats.forEach((seat) => {
      const r = seat.row !== undefined ? seat.row : 1;
      if (!map[r]) map[r] = [];
      map[r].push(seat);
    });
    const numbers = Object.keys(map).map(Number).sort((a, b) => a - b);
    return { rowsMap: map, rowNumbers: numbers };
  }, [routeSeats]);

  // Seat toggle handler
  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked') return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      } else {
        return [...prev, seat.id];
      }
    });
  };

  // Pricing calculations
  const pricePerSeat = currentRoute?.priceStarting || 1200;
  const totalFare = selectedSeatIds.length * pricePerSeat;
  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0;
    if (tendered >= totalFare) {
      return (tendered - totalFare).toFixed(2);
    }
    return '0.00';
  }, [cashTendered, totalFare]);

  // Handle Booking Creation
  const handleCreateCounterBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentRoute) {
      setErrorMessage('Please select a valid bus route.');
      return;
    }
    if (selectedSeatIds.length === 0) {
      setErrorMessage('Please select at least one seat from the seat map.');
      return;
    }
    if (!passengerName.trim()) {
      setErrorMessage('Please enter passenger full name.');
      return;
    }
    if (!passengerPhone.trim()) {
      setErrorMessage('Please enter passenger mobile/WhatsApp number.');
      return;
    }

    // Sri Lankan phone validation / formatting check
    const cleanPhone = passengerPhone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 9) {
      setErrorMessage('Please enter a valid phone number (e.g. 0771234567 or +94771234567).');
      return;
    }

    // Default fallback boarding & drop points if missing
    const bpId = boardingPointId || currentRoute.boardingPoints?.[0]?.id || `bp-default-${currentRoute.id}`;
    const dpId = dropPointId || currentRoute.dropPoints?.[0]?.id || `dp-default-${currentRoute.id}`;

    setIsSubmitting(true);

    try {
      const payload = {
        routeId: currentRoute.id,
        boardingPointId: bpId,
        dropPointId: dpId,
        seatIds: selectedSeatIds,
        passenger: {
          fullName: passengerName.trim(),
          phone: passengerPhone.trim(),
          email: `${cleanPhone.replace('+', '')}@counter.ticket`,
          gender: passengerGender,
          age: Number(passengerAge) || 30,
        },
        paymentMethod: paymentMethod === 'cash' ? 'cash' : 'card',
        searchDate: travelDate,
        isCounterBooking: true,
      };

      const result = await bookingsApi.create(payload);

      if (result) {
        setSuccessBooking(result);
        if (onBookingComplete) {
          onBookingComplete(result);
        }
        await loadBookings();
        await loadRoutes();
      }
    } catch (err: any) {
      console.error('Counter booking failed:', err);
      setErrorMessage(err.message || 'Failed to complete counter booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to book another ticket
  const handleReset = () => {
    setSelectedSeatIds([]);
    setPassengerName('');
    setPassengerPhone('');
    setPassengerNic('');
    setCounterRemarks('');
    setCashTendered('');
    setSuccessBooking(null);
    setErrorMessage(null);
  };

  // Printable receipt window trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ─── PRINTABLE RECEIPT STYLES (Applies only when printing) ─── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #counter-thermal-receipt, #counter-thermal-receipt * {
            visibility: visible;
          }
          #counter-thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 10px;
            font-family: monospace;
            color: black;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ─── SUCCESS / CONFIRMATION MODAL ─── */}
      {successBooking && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-6 sm:p-8 animate-fade-in shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-200/80 dark:border-emerald-800/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                  Ticket Issued Successfully
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  PNR: <span className="font-mono text-emerald-700 dark:text-emerald-400">{successBooking.pnr}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Thermal Ticket
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Issue Next Ticket
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Passenger</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{successBooking.passenger?.fullName || passengerName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{successBooking.passenger?.phone || passengerPhone}</div>
            </div>

            <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Route & Bus</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                {currentRoute?.origin} ➔ {currentRoute?.destination}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                Bus: {currentRoute?.busNumber} ({currentRoute?.departureTime})
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Selected Seats</div>
              <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1 flex flex-wrap gap-1">
                {selectedSeatIds.map((id) => (
                  <span key={id} className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md text-xs border border-emerald-200 dark:border-emerald-800/50">
                    {id.replace(/^[^-]+-/, '')}
                  </span>
                ))}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Date: {travelDate}</div>
            </div>

            <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Payment Status</div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                LKR {totalFare.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> Paid via {paymentMethod === 'cash' ? 'Cash Counter' : 'Card POS'}
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-medium border border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>
                <strong>WhatsApp E-Ticket:</strong> An official confirmation message with PNR and QR Code has been automatically dispatched to <strong>{passengerPhone}</strong>.
              </span>
            </div>
            <span className="bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0">
              WAHA Engine Active
            </span>
          </div>

          {/* Hidden Thermal Receipt format for Browser Printing */}
          <div id="counter-thermal-receipt" className="hidden print:block">
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>DEWMINA SUPER LINE</h2>
              <p style={{ fontSize: '10px', margin: '2px 0' }}>Express Passenger Service</p>
              <p style={{ fontSize: '10px', margin: '2px 0' }}>Tel: 077 123 4567 / 055 222 3456</p>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '6px 0 2px 0' }}>COUNTER E-TICKET</h3>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0' }}>PNR: {successBooking.pnr}</p>
            </div>

            <div style={{ fontSize: '10px', lineHeight: '1.4', marginBottom: '8px' }}>
              <div><strong>Date:</strong> {travelDate}</div>
              <div><strong>Departure:</strong> {currentRoute?.departureTime}</div>
              <div><strong>From:</strong> {currentRoute?.origin}</div>
              <div><strong>To:</strong> {currentRoute?.destination}</div>
              <div><strong>Bus No:</strong> {currentRoute?.busNumber} ({currentRoute?.busType})</div>
              <div><strong>Seats:</strong> {selectedSeatIds.map(id => id.replace(/^[^-]+-/, '')).join(', ')}</div>
              <div><strong>Passenger:</strong> {passengerName}</div>
              <div><strong>Phone:</strong> {passengerPhone}</div>
              <div><strong>Payment:</strong> PAID (CASH COUNTER)</div>
              <div style={{ borderTop: '1px dashed #000', marginTop: '6px', paddingTop: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                TOTAL FARE: LKR {totalFare.toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '9px' }}>
              <p style={{ margin: '0 0 2px 0' }}>Please arrive 15 minutes before departure.</p>
              <p style={{ margin: '0 0 2px 0' }}>Scan QR / Show SMS to Conductor.</p>
              <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>Thank you for traveling with us!</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEADER BAR ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 dark:border-blue-800/60">
              <Ticket className="w-3.5 h-3.5" /> Counter & Phone Reservation
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
              Direct Seat Confirmation
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-2">
            Counter Ticket Booking
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Book seats instantly for walk-in passengers and phone inquiries with instant cash receipts and automated WhatsApp E-Tickets.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Form
          </button>
        </div>
      </div>

      {/* ─── ERROR BANNER ─── */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-500 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── MAIN BOOKING GRID ─── */}
      <form onSubmit={handleCreateCounterBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ROUTE, DATE & SEAT MAP (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. ROUTE & TRIP SELECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">1</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Select Bus Route & Date</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {routes.length} Active Routes
              </span>
            </div>

            {/* Route selector dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Bus Service Route
                </label>
                <input
                  type="text"
                  placeholder="Search route or bus..."
                  value={routeSearchQuery}
                  onChange={(e) => setRouteSearchQuery(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
                />
              </div>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
              >
                {filteredRoutes.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-slate-900 dark:text-white">
                    {r.origin} ➔ {r.destination} | {r.departureTime} | Bus: {r.busNumber} ({r.busType}) — LKR {r.priceStarting}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date selection (Shortcuts + Date picker) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Travel Date (Within 7 Days)
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTravelDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    travelDate === todayStr
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Today ({todayStr})
                </button>
                <button
                  type="button"
                  onClick={() => setTravelDate(tomorrowStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    travelDate === tomorrowStr
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Tomorrow
                </button>
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="date"
                    min={todayStr}
                    max={maxDateStr}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Boarding & Drop points */}
            {currentRoute && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Boarding Point
                  </label>
                  <select
                    value={boardingPointId}
                    onChange={(e) => setBoardingPointId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {currentRoute.boardingPoints?.map((bp) => (
                      <option key={bp.id} value={bp.id} className="dark:bg-slate-900 dark:text-white">
                        {bp.name} ({bp.time || currentRoute.departureTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Drop-off Point
                  </label>
                  <select
                    value={dropPointId}
                    onChange={(e) => setDropPointId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {currentRoute.dropPoints?.map((dp) => (
                      <option key={dp.id} value={dp.id} className="dark:bg-slate-900 dark:text-white">
                        {dp.name} ({dp.time || currentRoute.arrivalTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. INTERACTIVE SEAT MAP */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Select Seats on Seat Map</h3>
              </div>

              {currentRoute?.hasUpperDeck && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedDeck('lower')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDeck === 'lower' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Lower Deck
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDeck('upper')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDeck === 'upper' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Upper Deck
                  </button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-blue-100 dark:bg-blue-950/60 border-2 border-blue-600 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[10px] font-black">✓</span>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-black">✕</span>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-pink-50 dark:bg-pink-950/40 border-2 border-pink-400 dark:border-pink-600 text-pink-700 dark:text-pink-300 flex items-center justify-center text-[10px] font-black">♀</span>
                <span>Female Priority</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto text-slate-500 dark:text-slate-400">
                <span>Fare per seat:</span>
                <strong className="text-slate-900 dark:text-white">LKR {pricePerSeat.toLocaleString()}</strong>
              </div>
            </div>

            {/* Bus layout container */}
            <div className={`bg-slate-50/90 dark:bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-700 space-y-4 shadow-sm mx-auto transition-all ${
              is3By2 ? 'max-w-[500px]' : 'max-w-[440px]'
            }`}>
              {/* Top Cockpit & Driver Header Bar */}
              <div className="bg-slate-900 rounded-2xl p-3 text-white flex items-center justify-between text-xs font-bold shadow-md">
                {/* Entry Door */}
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-[11px] tracking-wider uppercase">
                  <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-0.5 bg-emerald-400 rounded-full" />
                    <div className="w-4 h-0.5 bg-emerald-400/70 rounded-full" />
                    <div className="w-4 h-0.5 bg-emerald-400/40 rounded-full" />
                  </div>
                  <span>ENTRY DOOR</span>
                </div>

                {/* Front Cockpit Badge */}
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full text-[10px] font-bold text-slate-200">
                  <Bus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Front Cockpit • {currentRoute?.busNumber || 'Bus'}</span>
                </div>

                {/* Driver Steering Wheel */}
                <div className="flex items-center gap-2 text-slate-300 font-extrabold text-[11px] tracking-wider uppercase">
                  <span>DRIVER</span>
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border border-dashed border-slate-400 flex items-center justify-center">
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seating Matrix */}
              <div className="relative space-y-2.5 py-1 flex flex-col items-center">
                {/* Ambient Aisle Strip - positioned at exact aisle location */}
                <div className={`absolute inset-y-0 pointer-events-none z-0 rounded-full bg-indigo-100/60 dark:bg-indigo-950/40 border-x border-indigo-200/40 dark:border-indigo-900/30 ${
                  is3By2 ? 'left-[60%] -translate-x-1/2 w-8' : 'left-1/2 -translate-x-1/2 w-9'
                }`} />

                {rowNumbers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs font-medium">
                    No seats configured on {selectedDeck} deck. Please check fleet seat layout.
                  </div>
                ) : (
                  rowNumbers.map((rowNum) => {
                    const rowSeats = rowsMap[rowNum] || [];
                    const leftSeats = rowSeats.filter((s) => is3By2 ? s.col <= 3 : s.col <= 2).sort((a, b) => a.col - b.col);
                    const centerSeats = rowSeats.filter((s) => !is3By2 && s.col === 3).sort((a, b) => a.col - b.col);
                    const rightSeats = rowSeats.filter((s) => is3By2 ? s.col >= 4 : s.col >= 4).sort((a, b) => a.col - b.col);

                    const renderSeatButton = (seat: Seat) => {
                      const isBooked = seat.status === 'booked';
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const hasCustomPrice = seat.price && seat.price !== pricePerSeat;

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seat)}
                          className={`w-10 h-12 sm:w-11 sm:h-13 rounded-xl flex flex-col items-center justify-between p-1.5 font-bold transition-all relative z-10 shadow-2xs hover:z-20 cursor-pointer ${
                            isBooked
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 opacity-90 cursor-not-allowed'
                              : isSelected
                              ? 'ring-2 ring-blue-600 bg-blue-100 dark:bg-blue-900/70 border-2 border-blue-500 text-blue-900 dark:text-blue-100 shadow-md scale-105'
                              : seat.isFemaleOnly
                              ? 'bg-pink-50 dark:bg-pink-950/40 border-2 border-pink-400 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700/60'
                          }`}
                          title={`Seat ${seat.number} • LKR ${seat.price || pricePerSeat} • ${seat.status}${seat.isFemaleOnly ? ' • Female Priority' : ''}`}
                        >
                          {/* Headrest Cushion Bar */}
                          <div className={`w-full h-1.5 rounded-t-sm ${
                            isBooked ? 'bg-rose-500' : isSelected ? 'bg-blue-600' : seat.isFemaleOnly ? 'bg-pink-400 dark:bg-pink-500' : 'bg-slate-200 dark:bg-slate-600'
                          }`} />

                          <span className={`text-[11px] sm:text-xs font-black tracking-tight ${
                            isBooked ? 'text-rose-800 dark:text-rose-300 line-through' : isSelected ? 'text-blue-900 dark:text-blue-100' : seat.isFemaleOnly ? 'text-pink-800 dark:text-pink-200' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {seat.number}
                          </span>

                          {/* Bottom Accent Bar or Custom Price */}
                          {hasCustomPrice ? (
                            <span className="text-[8px] font-mono font-extrabold text-amber-700 dark:text-amber-400">LKR {seat.price}</span>
                          ) : (
                            <div className={`w-3/4 h-1 rounded-full ${
                              isBooked ? 'bg-rose-400' : isSelected ? 'bg-blue-600' : seat.isFemaleOnly ? 'bg-pink-500' : 'bg-blue-500/80'
                            }`} />
                          )}
                        </button>
                      );
                    };

                    return (
                      <div key={rowNum} className="flex flex-wrap items-center justify-between gap-2 sm:gap-2.5 px-1 w-full relative z-10">
                        {/* Left side seats (3 seats for 3x2, 2 seats for 2x2) */}
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-[210px]">
                          {leftSeats.map(renderSeatButton)}
                        </div>

                        {/* Center Aisle Spacer */}
                        <div className="flex items-center justify-center min-w-[20px] sm:min-w-[28px] text-center shrink-0">
                          {!is3By2 && centerSeats.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {centerSeats.map(renderSeatButton)}
                            </div>
                          ) : (
                            <div className="text-[9px] font-mono font-black text-slate-400/60 dark:text-slate-500/60 select-none">│</div>
                          )}
                        </div>

                        {/* Right side seats (2 seats for 3x2, 2 seats for 2x2) */}
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-[210px]">
                          {rightSeats.map(renderSeatButton)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Rear Engine Footer Bar */}
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REAR ENGINE
                </span>
                <span>DEWMINA LUXURY COACH</span>
                <span className="flex items-center gap-1 text-rose-500">
                  BACK <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </span>
              </div>

              {/* Selected seats badge bar */}
              <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mt-4 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Selected Seats ({selectedSeatIds.length}):
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {selectedSeatIds.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">None selected</span>
                  ) : (
                    selectedSeatIds.map((id) => (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-extrabold text-xs border border-blue-200 dark:border-blue-800/60"
                      >
                        {id.replace(/^[^-]+-/, '')}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PASSENGER DETAILS, PAYMENT & CONFIRMATION (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 3. PASSENGER DETAILS FORM */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">3</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Passenger Information</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Passenger Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kasun Kalhara"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Mobile / WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 0771234567 or +94771234567"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Official E-Ticket with QR code will be dispatched automatically via WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</label>
                <select
                  value={passengerGender}
                  onChange={(e) => setPassengerGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                >
                  <option value="male" className="dark:bg-slate-900">Male</option>
                  <option value="female" className="dark:bg-slate-900">Female</option>
                  <option value="other" className="dark:bg-slate-900">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(Number(e.target.value) || 28)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">NIC / Passport</label>
                <input
                  type="text"
                  placeholder="e.g. 199512345678"
                  value={passengerNic}
                  onChange={(e) => setPassengerNic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Counter Remarks (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Booked via phone call / Paid by cash"
                value={counterRemarks}
                onChange={(e) => setCounterRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* 4. PAYMENT & TOTAL SUMMARY */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">4</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Payment & Issue Ticket</h3>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                }`}
              >
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black">Cash at Counter</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('counter_card')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'counter_card'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-black">Counter POS Card</span>
              </button>
            </div>

            {/* Cash calculator helper */}
            {paymentMethod === 'cash' && (
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Cash Received:</span>
                  <input
                    type="number"
                    placeholder="Enter cash amount"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-32 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-right font-mono font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {parseFloat(cashTendered) >= totalFare && (
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Balance / Change Due:</span>
                    <span className="font-mono text-sm">LKR {changeDue}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bill breakdown */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Seats Selected:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSeatIds.length} Seat(s)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Fare per Seat:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">LKR {pricePerSeat.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total Amount Due:</span>
                <span className="text-lg text-emerald-700 dark:text-emerald-400 font-mono">
                  LKR {totalFare.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || selectedSeatIds.length === 0}
              className={`w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
                isSubmitting || selectedSeatIds.length === 0
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing & Issuing Ticket...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm Booking & Issue Ticket (LKR {totalFare.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
