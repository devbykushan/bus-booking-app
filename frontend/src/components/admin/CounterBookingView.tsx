import React, { useState, useMemo, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { bookingsApi } from '../../services/api';
import type { Seat } from '../../types/booking';
import {
  Bus, Calendar, CheckCircle2, DollarSign, User, Phone, MapPin,
  Printer, RefreshCw, AlertCircle,
  CreditCard, Check, Armchair,
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

  // Group seats by row for intuitive layout
  const rowsMap = useMemo(() => {
    const map = new Map<number, Seat[]>();
    routeSeats.forEach((seat) => {
      const r = seat.row || 1;
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(seat);
    });
    // Sort seats in each row by column
    map.forEach((seats) => seats.sort((a, b) => a.col - b.col));
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 animate-fade-in shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-200/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Ticket Issued Successfully
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  PNR: <span className="font-mono text-emerald-700">{successBooking.pnr}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
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
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Passenger</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">{successBooking.passenger?.fullName || passengerName}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{successBooking.passenger?.phone || passengerPhone}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Route & Bus</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">
                {currentRoute?.origin} ➔ {currentRoute?.destination}
              </div>
              <div className="text-xs text-blue-600 font-bold mt-0.5">
                Bus: {currentRoute?.busNumber} ({currentRoute?.departureTime})
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Selected Seats</div>
              <div className="text-sm font-black text-emerald-700 mt-1 flex flex-wrap gap-1">
                {selectedSeatIds.map((id) => (
                  <span key={id} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-xs">
                    {id.replace(/^[^-]+-/, '')}
                  </span>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Date: {travelDate}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase">Payment Status</div>
              <div className="text-sm font-black text-slate-900 mt-1">
                LKR {totalFare.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> Paid via {paymentMethod === 'cash' ? 'Cash Counter' : 'Card POS'}
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-emerald-100/60 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>
                <strong>WhatsApp E-Ticket:</strong> An official confirmation message with PNR and QR Code has been automatically dispatched to <strong>{passengerPhone}</strong>.
              </span>
            </div>
            <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0">
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-blue-200">
              <Ticket className="w-3.5 h-3.5" /> Counter & Phone Reservation
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Direct Seat Confirmation
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
            Counter Ticket Booking
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Book seats instantly for walk-in passengers and phone inquiries with instant cash receipts and automated WhatsApp E-Tickets.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Form
          </button>
        </div>
      </div>

      {/* ─── ERROR BANNER ─── */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-500 hover:text-rose-800"
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">1</span>
                <h3 className="text-base font-black text-slate-900">Select Bus Route & Date</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {routes.length} Active Routes
              </span>
            </div>

            {/* Route selector dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-blue-600" /> Bus Service Route
                </label>
                <input
                  type="text"
                  placeholder="Search route or bus..."
                  value={routeSearchQuery}
                  onChange={(e) => setRouteSearchQuery(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
                />
              </div>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                {filteredRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} ➔ {r.destination} | {r.departureTime} | Bus: {r.busNumber} ({r.busType}) — LKR {r.priceStarting}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date selection (Shortcuts + Date picker) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Travel Date (Within 7 Days)
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTravelDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    travelDate === todayStr
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Boarding & Drop points */}
            {currentRoute && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Boarding Point
                  </label>
                  <select
                    value={boardingPointId}
                    onChange={(e) => setBoardingPointId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {currentRoute.boardingPoints?.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.name} ({bp.time || currentRoute.departureTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" /> Drop-off Point
                  </label>
                  <select
                    value={dropPointId}
                    onChange={(e) => setDropPointId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {currentRoute.dropPoints?.map((dp) => (
                      <option key={dp.id} value={dp.id}>
                        {dp.name} ({dp.time || currentRoute.arrivalTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. INTERACTIVE SEAT MAP */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
                <h3 className="text-base font-black text-slate-900">Select Seats on Seat Map</h3>
              </div>

              {currentRoute?.hasUpperDeck && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedDeck('lower')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDeck === 'lower' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Lower Deck
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDeck('upper')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDeck === 'upper' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Upper Deck
                  </button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md border-2 border-slate-300 bg-white" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">✓</span>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-rose-500 text-white flex items-center justify-center text-[10px]">✕</span>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto text-slate-500">
                <span>Fare per seat:</span>
                <strong className="text-slate-900">LKR {pricePerSeat.toLocaleString()}</strong>
              </div>
            </div>

            {/* Bus layout container */}
            <div className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/80 flex flex-col items-center">
              {/* Bus Front Cap / Windshield */}
              <div className="w-full max-w-md bg-white border-2 border-slate-300 rounded-t-3xl p-3 mb-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    🚌
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase text-slate-400">Front of Bus</div>
                    <div className="text-xs font-extrabold text-slate-800">{currentRoute?.busNumber}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                    Entrance Door
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700" title="Driver">
                    👨‍✈️
                  </div>
                </div>
              </div>

              {/* Seat Matrix Grid */}
              <div className="w-full max-w-md space-y-3">
                {rowsMap.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No seats configured for this deck. Please check fleet seat layout.
                  </div>
                ) : (
                  rowsMap.map(([rowNum, seatsInRow]) => (
                    <div key={rowNum} className="flex items-center justify-between gap-2">
                      {/* Left seats */}
                      <div className="flex items-center gap-2">
                        {seatsInRow.slice(0, 2).map((seat) => {
                          const isBooked = seat.status === 'booked';
                          const isSelected = selectedSeatIds.includes(seat.id);

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={isBooked}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all cursor-pointer ${
                                isBooked
                                  ? 'bg-rose-500 text-white cursor-not-allowed opacity-90'
                                  : isSelected
                                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 scale-105'
                                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                              }`}
                            >
                              <Armchair className="w-4 h-4" />
                              <span className="text-[10px] leading-none mt-0.5">{seat.number}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Walking Aisle */}
                      <div className="flex-1 border-t border-dashed border-slate-300 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1 bg-slate-100">
                          Aisle
                        </span>
                      </div>

                      {/* Right seats */}
                      <div className="flex items-center gap-2">
                        {seatsInRow.slice(2).map((seat) => {
                          const isBooked = seat.status === 'booked';
                          const isSelected = selectedSeatIds.includes(seat.id);

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={isBooked}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all cursor-pointer ${
                                isBooked
                                  ? 'bg-rose-500 text-white cursor-not-allowed opacity-90'
                                  : isSelected
                                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 scale-105'
                                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                              }`}
                            >
                              <Armchair className="w-4 h-4" />
                              <span className="text-[10px] leading-none mt-0.5">{seat.number}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected seats badge bar */}
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-3 mt-4 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500">
                  Selected Seats ({selectedSeatIds.length}):
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {selectedSeatIds.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">None selected</span>
                  ) : (
                    selectedSeatIds.map((id) => (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs"
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">3</span>
              <h3 className="text-base font-black text-slate-900">Passenger Information</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" /> Passenger Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kasun Kalhara"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Mobile / WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 0771234567 or +94771234567"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Official E-Ticket with QR code will be dispatched automatically via WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Gender</label>
                <select
                  value={passengerGender}
                  onChange={(e) => setPassengerGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(Number(e.target.value) || 28)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">NIC / Passport</label>
                <input
                  type="text"
                  placeholder="e.g. 199512345678"
                  value={passengerNic}
                  onChange={(e) => setPassengerNic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Counter Remarks (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Booked via phone call / Paid by cash"
                value={counterRemarks}
                onChange={(e) => setCounterRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* 4. PAYMENT & TOTAL SUMMARY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">4</span>
              <h3 className="text-base font-black text-slate-900">Payment & Issue Ticket</h3>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black">Cash at Counter</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('counter_card')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'counter_card'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-black">Counter POS Card</span>
              </button>
            </div>

            {/* Cash calculator helper */}
            {paymentMethod === 'cash' && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Cash Received:</span>
                  <input
                    type="number"
                    placeholder="Enter cash amount"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-32 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-right font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {parseFloat(cashTendered) >= totalFare && (
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 pt-1 border-t border-slate-200">
                    <span>Balance / Change Due:</span>
                    <span className="font-mono text-sm">LKR {changeDue}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bill breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Seats Selected:</span>
                <span className="font-bold text-slate-800">{selectedSeatIds.length} Seat(s)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Fare per Seat:</span>
                <span className="font-bold text-slate-800">LKR {pricePerSeat.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Due:</span>
                <span className="text-lg text-emerald-700 font-mono">
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
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
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
