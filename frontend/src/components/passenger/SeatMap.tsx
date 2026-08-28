import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBookingStore } from '../../store/bookingStore';
import type { DeckType } from '../../types/booking';
import { 
  ArrowLeft, Clock, Check, Armchair, ChevronRight, 
  ChevronUp, ChevronDown, Lock, CheckCircle2, Info,
  ArrowRight, Crown, X, User, Users
} from 'lucide-react';

export const SeatMap: React.FC = () => {
  const { 
    selectedRoute, 
    selectedSeatIds, 
    toggleSeatSelection, 
    selectedBoardingPoint,
    selectedDropPoint,
    setSelectedBoardingPoint,
    setSelectedDropPoint,
    setPassengerInfo,
    discountRate,
    applyPromoCode,
    createBooking,
    goToSearchSchedules,
    goToHome,
    searchDate,
    setSearchCriteria,
    lockActive,
    lockExpirySeconds,
    tickLockTimer,
    currentUser,
    t
  } = useBookingStore();

  // Collapsible Accordion sections (1, 2, 4, 5, moreDetails)
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(true);
  const [openSection4, setOpenSection4] = useState(true);
  const [openSection5, setOpenSection5] = useState(true);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Right-Side Sliding Seat Drawer State
  const [isSeatDrawerOpen, setIsSeatDrawerOpen] = useState(false);

  // Form states
  const [travelDate, setTravelDate] = useState(searchDate || new Date().toISOString().split('T')[0]);
  const [countryCode, setCountryCode] = useState('+94');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [boardingError, setBoardingError] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'myself' | 'others'>('myself');
  const [seatPassengerNames, setSeatPassengerNames] = useState<{ [seatId: string]: string }>({});
  const [seatGenders, setSeatGenders] = useState<{ [seatId: string]: 'male' | 'female' }>({});
  const [genderToastMessage, setGenderToastMessage] = useState<string | null>(null);
  const [hoveredSeatNum, setHoveredSeatNum] = useState<string | null>(null);
  const [pendingGenderSeat, setPendingGenderSeat] = useState<{ id: string; number: string } | null>(null);

  // Gender Validation Rule Check Function
  const getGenderValidationError = (seatId: string, assignedGender: 'male' | 'female'): string | null => {
    if (!selectedRoute) return null;

    const normalizedNum = seatId.replace('seat-', '').replace(/^0+/, '');
    const seatObj = selectedRoute.seats.find(s => s.id === seatId || s.number === normalizedNum || s.number === seatId);

    // Rule 1: Male assigned to Female Reserved Priority seat
    if (assignedGender === 'male' && seatObj?.isFemaleOnly) {
      return `Seat #${normalizedNum} is reserved for female passengers only.`;
    }

    // Rule 2: Male assigned adjacent to a seat Booked by Ladies
    if (assignedGender === 'male') {
      const num = parseInt(normalizedNum, 10);
      if (!isNaN(num)) {
        // In 2x2 coach layout: (1,2), (3,4), (5,6), (7,8) are adjacent pairs
        const adjacentNum = num % 2 === 1 ? num + 1 : num - 1;
        const adjacentSeat = selectedRoute.seats.find(s => 
          s.number === adjacentNum.toString() || 
          s.number === `0${adjacentNum}` || 
          s.id.endsWith(`-${adjacentNum}`)
        );

        if (adjacentSeat && adjacentSeat.status === 'booked') {
          const isAdjacentFemale = (adjacentSeat as any).gender === 'female' || adjacentSeat.isFemaleOnly;
          if (isAdjacentFemale) {
            return `Gentlemen cannot book Seat #${normalizedNum} because adjacent Seat #${adjacentSeat.number} is Booked by Ladies.`;
          }
        }
      }
    }

    return null;
  };

  // Payment & Promo states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone input changer with automatic zero stripping and Sri Lanka prefix validation
  const handlePhoneChange = (raw: string) => {
    let clean = raw.replace(/\D/g, '');
    if (countryCode === '+94' && clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    if (countryCode === '+94' && clean.length > 9) {
      clean = clean.slice(0, 9);
    }
    setPhoneInput(clean);
    setIsPhoneVerified(false);
    if (countryCode === '+94') {
      if (clean.length > 0 && clean.length < 9) {
        setPhoneError(`Must be 9 digits without leading 0 (entered ${clean.length}/9)`);
      } else if (clean.length === 9 && !/^7[01245678]\d{7}$/.test(clean)) {
        setPhoneError('Invalid Sri Lankan mobile prefix (must start with 70, 71, 72, 74, 75, 76, 77, or 78)');
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
  };

  // Concurrency Seat Hold Timer
  useEffect(() => {
    let interval: any = null;
    if (lockActive) {
      interval = setInterval(() => {
        tickLockTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockActive, tickLockTimer]);

  // Lock background scroll when seat drawer is open so left & right scroll independently
  useEffect(() => {
    if (isSeatDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSeatDrawerOpen]);

  if (!selectedRoute) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <Armchair className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No Bus Route Selected</h3>
        <p className="text-slate-500 text-sm">Please choose a bus schedule to view seat layout and book seats.</p>
        <button
          onClick={goToSearchSchedules}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all"
        >
          {t('backToSearch')}
        </button>
      </div>
    );
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Date parsing for "Displaying Results for 08/26/2026 Wednesday"
  const formattedDateBanner = useMemo(() => {
    try {
      const parts = travelDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy} ${days[d.getDay()]}`;
      }
    } catch (_) {}
    return travelDate;
  }, [travelDate]);

  // Helper for validated ticket price
  const validatedSeatPrice = useMemo(() => {
    if (!selectedRoute) return 1160;
    const type = selectedRoute.busType || '';
    if (type.includes('Normal') || type.includes('3*2') || type.includes('Leyland')) {
      return 1160;
    }
    if (type.includes('Super Luxury') || type.includes('Luxury')) {
      return 2670;
    }
    if (type.includes('Sleeper')) {
      return 2800;
    }
    return selectedRoute.priceStarting || 2670;
  }, [selectedRoute]);

  // Seat Calculations
  const selectedSeatsList = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedSeatIds.map(id => {
      const normalized = id.replace('seat-', '').replace(/^0+/, '');
      const existing = selectedRoute.seats.find(s => s.id === id || s.number === normalized || s.number === id);
      return {
        id,
        number: existing?.number || id.replace('seat-', ''),
        row: existing?.row || 1,
        col: existing?.col || 1,
        price: validatedSeatPrice,
        status: existing?.status || 'available' as const,
        deck: (existing?.deck || 'lower') as DeckType
      };
    });
  }, [selectedRoute, selectedSeatIds, validatedSeatPrice]);

  const baseTotal = selectedSeatsList.reduce((sum, s) => sum + s.price, 0);
  const discountAmount = Number((baseTotal * discountRate).toFixed(2));
  const finalTotal = Math.max(0, baseTotal - discountAmount);

  // Progressive Disclosure Step Calculations
  const isStep1Done = useMemo(() => {
    return Boolean(selectedBoardingPoint && selectedDropPoint && travelDate);
  }, [selectedBoardingPoint, selectedDropPoint, travelDate]);

  const isStep2Unlocked = isStep1Done;
  const isStep2Done = isStep2Unlocked && isPhoneVerified;

  const isStep3Unlocked = isStep2Done;
  const isStep3Done = isStep3Unlocked && selectedSeatIds.length > 0;

  const isStep4Unlocked = isStep3Done;
  const isStep4Done = isStep4Unlocked && Boolean(paymentMethod);

  const isStep5Unlocked = isStep4Done;

  const handleStep1Proceed = () => {
    if (!selectedBoardingPoint) {
      setBoardingError('Please select a pickup / boarding location.');
      return;
    }
    if (!selectedDropPoint) {
      setDropError('Please select a dropping / drop-off location.');
      return;
    }
    setBoardingError(null);
    setDropError(null);
    setOpenSection1(false);
    setOpenSection2(true);
  };

  const handleStep2Proceed = () => {
    if (!isPhoneVerified) return;
    setOpenSection2(false);
    setIsSeatDrawerOpen(true);
  };

  const handleStep3Proceed = () => {
    if (selectedSeatIds.length === 0) return;
    setOpenSection4(true);
  };

  const handleStep4Proceed = () => {
    if (!paymentMethod) return;
    setOpenSection5(true);
  };

  const handleDateConfirm = () => {
    setSearchCriteria(selectedRoute.origin, selectedRoute.destination, travelDate);
  };

  const handleSeatClick = (seatId: string) => {
    const isSelecting = !selectedSeatIds.includes(seatId);
    if (isSelecting) {
      const routeId = selectedRoute?.id || '';
      const normalizedNum = seatId.replace(`${routeId}-`, '').replace(/^seat-/, '').replace(/^0+/, '');
      setPendingGenderSeat({ id: seatId, number: normalizedNum });
    } else {
      toggleSeatSelection(seatId);
    }
  };

  const handleGenderSelect = (gender: 'male' | 'female') => {
    if (!pendingGenderSeat) return;
    const seatId = pendingGenderSeat.id;
    
    const valErr = getGenderValidationError(seatId, gender);
    if (valErr) {
      setGenderToastMessage(valErr);
      setTimeout(() => setGenderToastMessage(null), 5000);
    }

    setSeatGenders(prev => ({ ...prev, [seatId]: gender }));
    toggleSeatSelection(seatId);
    setPendingGenderSeat(null);
  };

  const handleVerifyPhone = () => {
    let clean = phoneInput.replace(/\D/g, '');
    if (countryCode === '+94' && clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    if (countryCode === '+94' && clean.length !== 9) {
      setPhoneError('Please enter your contact number without leading zero (e.g. 771234567)');
      return;
    }
    if (clean.length < 8) {
      setPhoneError('Please enter a valid contact number');
      return;
    }
    setPhoneInput(clean);
    setPhoneError(null);
    setIsPhoneVerified(true);
    setPassengerInfo({ 
      phone: `${countryCode}${clean}`,
      fullName: currentUser?.name || 'Passenger',
      email: currentUser?.email || 'passenger@dewminasuperline.lk'
    });
    setOpenSection2(false);
    setIsSeatDrawerOpen(true);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMessage(null);
    const success = applyPromoCode(promoInput);
    if (success) {
      setPromoMessage({ type: 'success', text: `Promo code "${promoInput.toUpperCase()}" applied successfully!` });
    } else {
      setPromoMessage({ type: 'error', text: 'Invalid promo code. Try "BUS2026" or "SAVE10".' });
    }
  };

  const handleProceedToCheckout = async () => {
    if (!selectedBoardingPoint) {
      setBoardingError('Please select a pickup / boarding location.');
      setOpenSection1(true);
      return;
    }

    if (!selectedDropPoint) {
      setDropError('Please select a dropping / drop-off location.');
      setOpenSection1(true);
      return;
    }

    if (selectedSeatIds.length === 0) {
      setIsSeatDrawerOpen(true);
      return;
    }

    // Gender validation check for all selected seats
    for (const seatId of selectedSeatIds) {
      const assignedGender = seatGenders[seatId] || 'male';
      const valErr = getGenderValidationError(seatId, assignedGender);
      if (valErr) {
        setGenderToastMessage(`Validation Error: ${valErr}`);
        return;
      }
    }

    let cleanPhone = phoneInput.replace(/\D/g, '');
    if (countryCode === '+94' && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      setPhoneError('Please enter a valid contact number without leading zero in Step 2.');
      setOpenSection2(true);
      return;
    }

    setPassengerInfo({
      fullName: currentUser?.name || 'Passenger',
      email: currentUser?.email || 'passenger@dewminasuperline.lk',
      phone: `${countryCode}${cleanPhone}`,
      gender: 'female',
    });

    setIsSubmitting(true);
    const booking = await createBooking(paymentMethod, false);
    setIsSubmitting(false);

    if (!booking) {
      // Handled via store error banner
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in relative">
      
      {/* ── Top Breadcrumbs & Back Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 text-xs font-medium text-slate-500 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <button 
            onClick={goToHome}
            className="hover:text-blue-600 transition-colors flex items-center gap-1 font-semibold text-slate-600 hover:-translate-x-0.5 transform duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </button>
          <span>›</span>
          <button 
            onClick={goToSearchSchedules}
            className="hover:text-blue-600 transition-colors truncate cursor-pointer"
          >
            Journeys
          </button>
          <span>›</span>
          <span className="text-slate-800 font-bold truncate">
            {selectedRoute.origin} - {selectedRoute.destination} {selectedRoute.departureTime}
          </span>
        </div>

        <button
          onClick={goToSearchSchedules}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all flex-shrink-0 active:scale-95 shadow-2xs hover:shadow-xs"
        >
          Change Bus
        </button>
      </div>

      {/* ── Centered Bus Route Header (Mockup Style) ─────────────────────────── */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight transition-transform duration-300">
          {selectedRoute.origin} - {selectedRoute.destination} {selectedRoute.busNumber || 'EX1-51/35'} {selectedRoute.departureTime}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-600">
          <span className="font-semibold">{selectedRoute.operatorName || 'Dewmina Super Line'}</span>
          <span>-</span>
          <span className="text-slate-700 font-medium">{(selectedRoute.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}</span>
          <span>|</span>
          <span className="font-mono text-slate-800 font-bold">{selectedRoute.busNumber || 'ND-8899'}</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Certified
          </span>
        </div>

        {/* View More Details Toggle Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <div className={`transition-transform duration-300 ${showMoreDetails ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <span>{showMoreDetails ? 'Hide Details' : 'View More Details'}</span>
          </button>
        </div>

        {/* Expandable Route Details Drawer */}
        {showMoreDetails && (
          <div className="mt-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-lg max-w-2xl mx-auto text-left text-xs space-y-3 animate-scale-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Departure</p>
                <p className="font-bold text-slate-800">{selectedRoute.departureTime}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Arrival (Est.)</p>
                <p className="font-bold text-slate-800">{selectedRoute.arrivalTime}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Est. Duration</p>
                <p className="font-bold text-slate-800">{selectedRoute.duration || '5h 30m'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Coach Class</p>
                <p className="font-bold text-blue-600">{(selectedRoute.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">❄️ Air Conditioned</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">⚡ USB Charging Ports</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">📡 Live GPS Tracking</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">💺 Reclining Luxury Seats</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">🛡️ Conductor Assistance</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Concurrency Lock Expiry Alert Banner ─────────────────────────────── */}
      {lockActive && (
        <div className="p-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-800 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900">
                Temporary Seat Hold Active ({selectedSeatIds.length} Seats Held)
              </p>
              <p className="text-[11px] text-amber-700">
                Seats are locked for you. Complete your checkout before the timer expires.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span className="text-xs text-slate-500">Hold Expires:</span>
            <span className="text-sm font-mono font-black text-amber-700">{formatTimer(lockExpirySeconds)}</span>
          </div>
        </div>
      )}

      {/* ── Visual 5-Step Progress Bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs animate-fade-in">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-1">
          <span className="text-slate-800 flex items-center gap-2 font-extrabold text-sm sm:text-base">
            <span>Booking Progress</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
              {isStep5Unlocked 
                ? 'Step 5 of 5: Checkout' 
                : isStep4Unlocked 
                ? 'Step 4 of 5: Payment Method' 
                : isStep3Unlocked 
                ? 'Step 3 of 5: Choose Seat' 
                : isStep2Unlocked 
                ? 'Step 2 of 5: Passenger Info' 
                : 'Step 1 of 5: Locations'}
            </span>
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Fill each step to proceed to the next
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
          {/* Step 1 Pill */}
          <div className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left transition-all ${
            isStep1Done ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs' : 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-500/10'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
              isStep1Done ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {isStep1Done ? <Check className="w-3.5 h-3.5 text-white" /> : '1'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-[11px] sm:text-xs font-extrabold truncate">1. Info</p>
              <p className="text-[9px] text-slate-500 truncate hidden sm:block">Date & Points</p>
            </div>
          </div>

          {/* Step 2 Pill */}
          <div className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left transition-all ${
            isStep2Done 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs' 
              : isStep2Unlocked 
              ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-500/10' 
              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
              isStep2Done ? 'bg-emerald-600 text-white' : isStep2Unlocked ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-500'
            }`}>
              {isStep2Done ? <Check className="w-3.5 h-3.5 text-white" /> : isStep2Unlocked ? '2' : <Lock className="w-3 h-3" />}
            </div>
            <div className="truncate min-w-0">
              <p className="text-[11px] sm:text-xs font-extrabold truncate">2. Passenger</p>
              <p className="text-[9px] text-slate-500 truncate hidden sm:block">Phone Verification</p>
            </div>
          </div>

          {/* Step 3 Pill */}
          <div className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left transition-all ${
            isStep3Done 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs' 
              : isStep3Unlocked 
              ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-500/10' 
              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
              isStep3Done ? 'bg-emerald-600 text-white' : isStep3Unlocked ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-500'
            }`}>
              {isStep3Done ? <Check className="w-3.5 h-3.5 text-white" /> : isStep3Unlocked ? '3' : <Lock className="w-3 h-3" />}
            </div>
            <div className="truncate min-w-0">
              <p className="text-[11px] sm:text-xs font-extrabold truncate">3. Seat</p>
              <p className="text-[9px] text-slate-500 truncate hidden sm:block">Seat Selection</p>
            </div>
          </div>

          {/* Step 4 Pill */}
          <div className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left transition-all ${
            isStep4Done 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs' 
              : isStep4Unlocked 
              ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-500/10' 
              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
              isStep4Done ? 'bg-emerald-600 text-white' : isStep4Unlocked ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-500'
            }`}>
              {isStep4Done ? <Check className="w-3.5 h-3.5 text-white" /> : isStep4Unlocked ? '4' : <Lock className="w-3 h-3" />}
            </div>
            <div className="truncate min-w-0">
              <p className="text-[11px] sm:text-xs font-extrabold truncate">4. Payment</p>
              <p className="text-[9px] text-slate-500 truncate hidden sm:block">IPG / On Board</p>
            </div>
          </div>

          {/* Step 5 Pill */}
          <div className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left transition-all ${
            isStep5Unlocked 
              ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-500/10' 
              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
              isStep5Unlocked ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-500'
            }`}>
              {isStep5Unlocked ? '5' : <Lock className="w-3 h-3" />}
            </div>
            <div className="truncate min-w-0">
              <p className="text-[11px] sm:text-xs font-extrabold truncate">5. Checkout</p>
              <p className="text-[9px] text-slate-500 truncate hidden sm:block">Summary & Pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Responsive Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ════ LEFT COLUMN: Accordion Steps (1, 2, 3, 4) ══════════════════════ */}
        <div className="lg:col-span-8 space-y-5">

          {/* ── STEP 1: Booking Information ── */}
          <div className="portal-stagger-1 portal-card-interactive bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <button
              onClick={() => setOpenSection1(!openSection1)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-full text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${
                  isStep1Done ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-blue-600 shadow-blue-600/30 portal-badge-pulse'
                }`}>
                  {isStep1Done ? <Check className="w-4 h-4 text-white" /> : '1'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <span>Booking Information</span>
                    {isStep1Done && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Completed ✓
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">Fill out travel date & locations</p>
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <div className={`transition-transform duration-300 ${openSection1 ? 'rotate-0' : '-rotate-180'}`}>
                  <ChevronUp className="w-4 h-4" />
                </div>
              </div>
            </button>

            {openSection1 && (
              <div className="p-5 sm:p-6 pt-1 border-t border-slate-100 space-y-5 animate-fade-in">
                {/* Confirm Travel Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Confirm Travel Date
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={travelDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setTravelDate(e.target.value);
                        setDateError(null);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner ${
                        dateError ? 'border-rose-400 bg-rose-50/40 text-rose-900' : 'border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        if (travelDate < today) {
                          setDateError('Please select a valid future travel date');
                          return;
                        }
                        setDateError(null);
                        handleDateConfirm();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex-shrink-0 active:scale-95 hover:shadow-md"
                    >
                      Confirm
                    </button>
                  </div>
                  {dateError ? (
                    <p className="text-xs font-semibold text-rose-600 pt-0.5 animate-fade-in flex items-center gap-1">
                      <span>⚠️</span> {dateError}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-rose-500 pt-0.5 animate-fade-in">
                      Displaying Results for {formattedDateBanner}
                    </p>
                  )}
                </div>

                {/* Choose Pickup and Drop-off Locations */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Choose Pickup and Drop-off Locations
                  </label>

                  {/* Pickup Dropdown */}
                  <div className="space-y-1">
                    <div className="relative group">
                      <select
                        value={selectedBoardingPoint?.id ?? ''}
                        onChange={(e) => {
                          const bp = selectedRoute.boardingPoints.find(p => p.id === e.target.value);
                          if (bp) {
                            setSelectedBoardingPoint(bp);
                            setBoardingError(null);
                          } else {
                            setSelectedBoardingPoint(null as any);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold appearance-none focus:outline-none focus:ring-2 pr-10 transition-all cursor-pointer shadow-2xs ${
                          boardingError 
                            ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-400' 
                            : selectedBoardingPoint 
                            ? 'border-emerald-300 bg-emerald-50/20 text-slate-900 focus:ring-emerald-400' 
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 focus:ring-blue-500 focus:bg-white group-hover:border-blue-300'
                        }`}
                      >
                        <option value="">Select Boarding Point / Pickup Location</option>
                        {selectedRoute.boardingPoints.map((bp, idx) => (
                          <option key={bp.id} value={bp.id}>
                            Point {idx + 1} - {bp.name} ({bp.time || selectedRoute.departureTime}) {bp.landmark ? `[${bp.landmark}]` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-600 transition-colors" />
                    </div>
                    {boardingError && (
                      <p className="text-[11px] font-semibold text-rose-600 pl-1 flex items-center gap-1 animate-fade-in">
                        <span>⚠️</span> {boardingError}
                      </p>
                    )}
                  </div>

                  {/* Drop-off Dropdown */}
                  <div className="space-y-1">
                    <div className="relative group">
                      <select
                        value={selectedDropPoint?.id ?? ''}
                        onChange={(e) => {
                          const dp = selectedRoute.dropPoints.find(p => p.id === e.target.value);
                          if (dp) {
                            setSelectedDropPoint(dp);
                            setDropError(null);
                          } else {
                            setSelectedDropPoint(null as any);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold appearance-none focus:outline-none focus:ring-2 pr-10 transition-all cursor-pointer shadow-2xs ${
                          dropError 
                            ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-400' 
                            : selectedDropPoint 
                            ? 'border-emerald-300 bg-emerald-50/20 text-slate-900 focus:ring-emerald-400' 
                            : 'border-blue-500 bg-white text-slate-700 focus:ring-blue-500 focus:bg-white group-hover:border-blue-600'
                        }`}
                      >
                        <option value="">Select Dropping Point / Drop-off Location</option>
                        {selectedRoute.dropPoints.map((dp, idx) => (
                          <option key={dp.id} value={dp.id}>
                            Point {idx + 1} - {dp.name} ({dp.time || selectedRoute.arrivalTime}) {dp.landmark ? `[${dp.landmark}]` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-600 transition-colors" />
                    </div>
                    {dropError && (
                      <p className="text-[11px] font-semibold text-rose-600 pl-1 flex items-center gap-1 animate-fade-in">
                        <span>⚠️</span> {dropError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Continue to Step 2 Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleStep1Proceed}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Proceed to Step 2: Passenger Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── STEP 2: Passenger Information ── */}
          {isStep2Unlocked && (
            <div className="portal-stagger-2 portal-card-interactive bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden animate-fade-in">
              <button
                onClick={() => setOpenSection2(!openSection2)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${
                    isPhoneVerified ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-blue-600 shadow-blue-600/30 portal-badge-pulse'
                  }`}>
                    {isPhoneVerified ? <Check className="w-4 h-4 text-white" /> : '2'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      <span>Passenger Information</span>
                      {isPhoneVerified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Verified ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">Fill out the form below and verify your identity.</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <div className={`transition-transform duration-300 ${openSection2 ? 'rotate-0' : '-rotate-180'}`}>
                    <ChevronUp className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {openSection2 && (
                <div className="p-5 sm:p-6 pt-1 border-t border-slate-100 space-y-3 animate-fade-in">
                  {/* Phone Verification Row */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-400 bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0 hover:border-slate-500 transition-colors pr-8 appearance-none shadow-2xs"
                      >
                        <option value="+94">Sri Lanka (+94)</option>
                        <option value="+91">India (+91)</option>
                        <option value="+44">UK (+44)</option>
                        <option value="+1">USA/Canada (+1)</option>
                        <option value="+971">UAE (+971)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        placeholder="Your contact number without leading zero"
                        value={phoneInput}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength={countryCode === '+94' ? 9 : 12}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                          phoneError 
                            ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-400 focus:border-rose-500' 
                            : isPhoneVerified 
                            ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 focus:ring-emerald-400 focus:border-emerald-500' 
                            : 'border-blue-600 bg-white text-slate-800 focus:ring-blue-400 focus:border-blue-600 placeholder:text-slate-400'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      className={`px-7 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
                        isPhoneVerified
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                      }`}
                    >
                      {isPhoneVerified ? <Check className="w-4 h-4 animate-scale-in" /> : null}
                      <span>{isPhoneVerified ? 'Verified' : 'Verify'}</span>
                    </button>
                  </div>

                  {/* Validation Feedback Messages */}
                  {phoneError && (
                    <p className="text-[11px] font-semibold text-rose-600 pl-1 flex items-center gap-1 animate-fade-in">
                      <span>⚠️</span> {phoneError}
                    </p>
                  )}

                  {isPhoneVerified && !phoneError && (
                    <div className="space-y-3 pt-1">
                      <p className="text-[11px] font-semibold text-emerald-700 pl-1 flex items-center gap-1 animate-fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Number verified ({countryCode} {phoneInput}). Your e-ticket and tracking link will be sent via SMS & WhatsApp.</span>
                      </p>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleStep2Proceed}
                          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span>Proceed to Step 3: Choose Seat</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Choose Your Seat ── */}
          {isStep3Unlocked && (
            <div className="portal-stagger-3 portal-card-interactive bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden animate-fade-in">
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-full text-white font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${
                    isStep3Done ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-blue-600 shadow-blue-600/30 portal-badge-pulse'
                  }`}>
                    {isStep3Done ? <Check className="w-5 h-5 text-white" /> : '3'}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                      <span>Choose Your Seat</span>
                      {isStep3Done && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {selectedSeatIds.length} Seat(s) Selected ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-normal">
                      Click on an available seat to select
                    </p>
                  </div>
                </div>

                {/* Right Side Pill Button: [ Select seat | → ] */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSeatDrawerOpen(true)}
                    className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all transform active:scale-95 overflow-hidden group cursor-pointer"
                  >
                    <span className="px-5 py-2.5 sm:py-3">
                      {selectedSeatIds.length > 0 ? 'Change seats' : 'Select seat'}
                    </span>
                    <span className="px-3.5 py-2.5 sm:py-3 bg-blue-700 group-hover:bg-blue-800 border-l border-blue-500/50 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Selected Seats List & Booking Type (Rendered When Seats are Selected) */}
              {selectedSeatIds.length > 0 && (
                <div className="p-5 sm:p-6 pt-0 space-y-6 animate-fade-in border-t border-slate-100">
                  {/* Gender Toast / Warning Banner */}
                  {genderToastMessage && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-bold text-xs sm:text-sm flex items-center justify-between shadow-md animate-bounce">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>{genderToastMessage}</span>
                      </div>
                      <button onClick={() => setGenderToastMessage(null)} className="text-amber-700 hover:text-amber-900 font-black">✕</button>
                    </div>
                  )}

                  {/* List of Selected Seat rows */}
                  <div className="space-y-3 pt-4">
                    {selectedSeatsList.map((s) => {
                      const currentGender = seatGenders[s.id] || 'male';
                      const valErr = getGenderValidationError(s.id, currentGender);

                      return (
                        <div key={s.id} className="space-y-2 p-3 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5">
                            <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                              {/* Seat Box (Mockup Exact Style) */}
                              <div className="w-[58px] sm:w-[64px] h-[64px] sm:h-[70px] rounded-xl border-[1.5px] border-slate-700 bg-white flex flex-col items-center justify-between p-1.5 shadow-2xs flex-shrink-0">
                                <span className="text-base sm:text-lg font-extrabold text-slate-900 leading-none pt-0.5">
                                  {s.number}
                                </span>
                                <div className="w-5 h-1 rounded-sm border border-slate-700 my-0.5" />
                                <div className={`w-full h-1.5 rounded-b-md ${currentGender === 'female' ? 'bg-pink-500' : 'bg-blue-600'} mt-auto`} />
                              </div>

                              {/* Dashed Input for Passenger Name */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  placeholder="Add a passenger name or keep it as your name"
                                  value={seatPassengerNames[s.id] || ''}
                                  onChange={(e) => setSeatPassengerNames(prev => ({ ...prev, [s.id]: e.target.value }))}
                                  className="w-full h-[64px] sm:h-[70px] px-4 sm:px-5 rounded-2xl border border-dashed border-slate-300 bg-white hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              {/* Price Box */}
                              <div className="h-[64px] sm:h-[70px] px-4 sm:px-6 rounded-2xl border-2 border-blue-500 bg-white flex items-center justify-center font-extrabold text-blue-600 text-base sm:text-lg flex-shrink-0 tracking-tight shadow-2xs min-w-[100px]">
                                LKR {s.price || selectedRoute?.priceStarting || 950}
                              </div>
                            </div>
                          </div>

                          {/* Per-Seat Gender Validation Error Warning */}
                          {valErr && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                              <span className="text-sm">⚠️</span>
                              <span>{valErr}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Booking Type Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                          Booking Type
                        </h4>
                        <p className="text-xs text-slate-500 font-normal">
                          Choose who the ticket is created for.
                        </p>
                      </div>
                      <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                        Sri Lanka only
                      </span>
                    </div>

                    {/* Switcher Pill Buttons */}
                    <div className="p-1.5 bg-slate-100/90 rounded-2xl flex items-center gap-1.5 border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => setBookingType('myself')}
                        className={`flex-1 py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          bookingType === 'myself'
                            ? 'bg-white border border-blue-400 text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Book for myself</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('others')}
                        className={`flex-1 py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          bookingType === 'others'
                            ? 'bg-white border border-blue-400 text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Book for others</span>
                      </button>
                    </div>
                  </div>

                  {/* Continue to Step 4 Action Button */}
                  <div className="pt-3 flex justify-end border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleStep3Proceed}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Proceed to Step 4: Payment Method</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Payment Method & Promo ── */}
          {isStep4Unlocked && (
            <div className="portal-stagger-4 portal-card-interactive bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden animate-fade-in">
              <button
                onClick={() => setOpenSection4(!openSection4)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${
                    isStep4Done ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-blue-600 shadow-blue-600/30 portal-badge-pulse'
                  }`}>
                    {isStep4Done ? <Check className="w-4 h-4 text-white" /> : '4'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      <span>Payment Method</span>
                      {isStep4Done && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Selected ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">Select your payment method from below.</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <div className={`transition-transform duration-300 ${openSection4 ? 'rotate-0' : '-rotate-180'}`}>
                    <ChevronUp className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {openSection4 && (
                <div className="p-5 sm:p-6 pt-1 border-t border-slate-100 space-y-4 animate-fade-in">
                  
                  {/* Pay By IPG Card (Highlighted Mockup Style) */}
                  <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4 hover:-translate-y-0.5 ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-scale-in" />}
                    </div>

                    <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* IPG / Card Gateway Badges */}
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] tracking-wider shadow-2xs">
                          IPG PAY
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Pay By IPG (For passengers who would like to pay online.)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">VISA</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">MasterCard</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">LankaQR</span>
                      </div>
                    </div>
                  </div>

                  {/* Alternative: Pay On Board / Conductor Cash */}
                  <div 
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4 hover:-translate-y-0.5 ${
                      paymentMethod === 'wallet'
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                      {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-scale-in" />}
                    </div>

                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800">
                        Pay On Board (Cash to Conductor / At Boarding Point Counter)
                      </span>
                      <p className="text-[11px] text-slate-500">Pay directly in cash when boarding the bus.</p>
                    </div>
                  </div>

                  {/* Promo Code & Travel Insurance */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Promo Input */}
                    <form onSubmit={handleApplyPromo} className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Have a Promo Code?</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. BUS2026"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase font-mono font-bold focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                        >
                          Apply
                        </button>
                      </div>
                      {promoMessage && (
                        <p className={`text-[11px] font-semibold animate-fade-in ${promoMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {promoMessage.text}
                        </p>
                      )}
                    </form>
                  </div>

                  <div className="pt-3 flex justify-end border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleStep4Proceed}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Proceed to Step 5: Final Review & Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>


        {/* ════ RIGHT COLUMN: Sticky Summary & Notice (Card 5 + Notice) ════════ */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">

          {/* ── CARD 5: Your Booking (Proceed To Checkout) ── */}
          {isStep5Unlocked ? (
            <div className="portal-stagger-5 portal-card-interactive bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-600/30 portal-badge-pulse">
                    5
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">Your Booking</h3>
                    <p className="text-xs text-slate-500 font-normal">Proceed To Checkout.</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenSection5(!openSection5)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <div className={`transition-transform duration-300 ${openSection5 ? 'rotate-0' : '-rotate-180'}`}>
                    <ChevronUp className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {openSection5 && (
                <div className="p-5 space-y-4 animate-fade-in">
                  {/* Selected Seats Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Selected Seats.</span>
                    
                    {selectedSeatIds.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-500">No seats selected yet.</p>
                        <button
                          type="button"
                          onClick={() => setIsSeatDrawerOpen(true)}
                          className="text-xs font-bold text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Choose Seats on Map →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {selectedSeatsList.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-scale-in">
                            <span className="font-bold text-slate-800">Seat #{s.number}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-blue-600 font-bold">LKR {s.price.toLocaleString()}</span>
                              <button
                                onClick={() => toggleSeatSelection(s.id)}
                                className="text-slate-400 hover:text-red-500 font-bold transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  {selectedSeatIds.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 animate-fade-in">
                      <div className="flex justify-between">
                        <span>Base Ticket Fare</span>
                        <span className="font-mono font-semibold text-slate-800">LKR {baseTotal.toLocaleString()}</span>
                      </div>
                      {discountRate > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Promo Discount ({(discountRate * 100).toFixed(0)}%)</span>
                          <span className="font-mono">- LKR {discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub Total Royal Blue Bar (Animated Gradient Style) */}
                  <div className="p-3.5 rounded-2xl portal-subtotal-gradient text-white flex items-center justify-between shadow-md">
                    <span className="text-xs font-bold">
                      Sub Total ({selectedSeatIds.length} Seats)
                    </span>
                    <span className="text-sm font-mono font-black tracking-tight">
                      LKR {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Your information is never shared with third parties.</span>
                  </div>

                  {/* Proceed To Checkout CTA Button */}
                  <button
                    type="button"
                    disabled={isSubmitting || selectedSeatIds.length === 0}
                    onClick={handleProceedToCheckout}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all duration-300 transform active:scale-95 group relative overflow-hidden ${
                      selectedSeatIds.length > 0 && !isSubmitting
                        ? 'bg-slate-900 hover:bg-blue-600 text-white cursor-pointer hover:shadow-xl hover:-translate-y-0.5'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Confirming Booking...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed To Checkout</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50/80 rounded-3xl border-2 border-dashed border-slate-200 p-6 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">Step 5: Checkout Locked</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Complete Steps 1 to 4 to unlock your booking summary & checkout.
                </p>
              </div>
            </div>
          )}

          {/* ── Important Notice Card (Mockup Style) ── */}
          <div className="portal-stagger-6 portal-card-interactive rounded-3xl bg-blue-50/80 border border-blue-200/80 p-5 space-y-2.5 text-xs text-blue-950 shadow-2xs hover:border-blue-300 transition-all">
            <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-700" /> Important Notice
            </h4>
            <ol className="list-decimal list-outside pl-4 space-y-1.5 text-[11px] text-blue-900/85 leading-relaxed font-normal">
              <li>
                This notice absolves us of responsibility for luggage damage due to inadequate protection or fragile items.
              </li>
              <li>
                Refunds won’t be given for missing boarding or transport issues.
              </li>
              <li>
                No full refunds for transport breakdowns; service fees are non-refundable.
              </li>
              <li>
                Passengers must report to boarding point 15 minutes before departure.
              </li>
            </ol>
            <div className="pt-2 border-t border-blue-200/60 text-[10px] text-blue-800 font-medium flex items-center justify-between">
              <span>📞 24/7 Conductor Helpline:</span>
              <strong className="font-mono text-blue-900">071 143 3520</strong>
            </div>
          </div>

        </div>

      </div>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── RIGHT-SIDE SLIDING SEAT DRAWER (MOCKUP EXACT DESIGN) ────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isSeatDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsSeatDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300" 
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-[70] flex flex-col justify-between overflow-hidden animate-slide-in-right">
            
            {/* Drawer Top Header (Mockup Style: Blue Badge 6 / 3 + Close ✕) */}
            <div className="p-4 sm:p-5 pr-5 sm:pr-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/30">
                  3
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                    Choose Your Seat
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Click on an available seat to select.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSeatDrawerOpen(false)}
                className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex-shrink-0 mr-1"
                aria-label="Close Seat Map"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-36 sm:pb-44 space-y-6 scroll-smooth">
              
              {/* ── Top Economy Class Floating Pill with Live Coach Stats ── */}
              <div className="flex items-center justify-between gap-3 pt-1 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{selectedRoute.busNumber || 'ND-9999'} • {(selectedRoute.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}</span>
                </div>
                <div className="border border-blue-500/80 rounded-xl px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50/50 flex items-center gap-2 shadow-2xs">
                  <Crown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-black text-blue-600 tracking-wider uppercase">
                      {selectedRoute.busType?.includes('Normal') || selectedRoute.busType?.includes('3*2') || selectedRoute.busType?.includes('Leyland') ? 'Normal Service' : 'Super Luxury'}
                    </div>
                    <div className="text-xs font-black text-slate-900 font-mono">
                      LKR {validatedSeatPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ════ CLEAN MINIMALIST BUS COACH CONTAINER ════ */}
              <div className="relative rounded-3xl border border-slate-200 bg-slate-50/70 p-3 sm:p-5 shadow-sm">
                
                {/* ── Minimalist Front Cockpit / Driver Bar ── */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl mb-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Exit Door</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600 bg-sky-50/70 px-2.5 py-1 rounded-xl border border-sky-200/80">
                    <span>Driver</span>
                    <div className="w-4 h-4 rounded-full border-2 border-sky-400 flex items-center justify-center bg-white shadow-2xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    </div>
                  </div>
                </div>

                {/* ── Seating Matrix ── */}
                <div className="relative space-y-3 sm:space-y-3.5 py-1 flex flex-col items-center">
                  
                  {/* Center Clean Aisle Runner */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 sm:w-12 pointer-events-none rounded-xl bg-slate-200/40 border-x border-slate-200/60 z-0" />

                  {([
                    { rowNum: 0, left: ['1'], right: [] },
                    { rowNum: 1, left: ['2', '3'], right: ['4', '5', '6'] },
                    { rowNum: 2, left: ['7', '8'], right: ['9', '10', '11'] },
                    { rowNum: 3, left: ['12', '13'], right: ['14', '15', '16'] },
                    { rowNum: 4, left: ['17', '18'], right: ['19', '20', '21'] },
                    { rowNum: 5, left: ['22', '23'], right: ['24', '25', '26'] },
                    { rowNum: 6, left: ['27', '28'], right: ['29', '30', '31'] },
                    { rowNum: 7, left: ['32', '33'], right: ['34', '35', '36'] },
                    { rowNum: 8, left: ['37', '38'], right: ['39', '40', '41'] },
                    { rowNum: 9, left: ['42', '43'], right: ['44', '45', '46'] },
                    { rowNum: 10, left: [], right: ['47', '48', '49'] },
                    { rowNum: 11, left: [], right: ['50', '51', '52'] },
                    { rowNum: 12, isRear: true, seats: ['53', '54', '55', '56', '57', '58'] },
                  ] as Array<{ rowNum: number; left?: string[]; right?: string[]; isRear?: boolean; seats?: string[] }>).map((row, rIdx) => {
                    
                    // Render Rear 5-Seat Bench
                    if (row.isRear && row.seats) {
                      return (
                        <div 
                          key={row.rowNum} 
                          className="pt-2 pb-1 flex items-center justify-center gap-1.5 sm:gap-2 w-full relative z-10"
                        >
                          {row.seats.map((seatNumStr, sIdx) => {
                            const normalizedNum = seatNumStr.replace(/^0+/, '');
                            const existingSeat = selectedRoute.seats.find(s => s.id === `${selectedRoute.id}-${normalizedNum}` || s.number === normalizedNum || s.number === seatNumStr || s.id === seatNumStr);
                            const seat = existingSeat || {
                              id: `${selectedRoute.id}-${normalizedNum}`,
                              number: seatNumStr,
                              row: 12,
                              col: sIdx + 1,
                              price: selectedRoute.seats[0]?.price || selectedRoute.priceStarting || 1860,
                              status: 'available' as const,
                              deck: 'lower' as DeckType
                            };

                            const isSelected = selectedSeatIds.includes(seat.id) || selectedSeatIds.includes(seatNumStr) || selectedSeatIds.includes(normalizedNum);
                            const isBooked = seat.status === 'booked';
                            const isBookedFemale = isBooked && ((seat as any).gender === 'female' || (seat as any).isFemaleBooked);
                            const isBookedMale = isBooked && !isBookedFemale;
                            const isReserved = !isBooked && !isSelected && (seat.isFemaleOnly || seat.status === 'blocked');
                            const isUnavailable = seat.status === 'unavailable' || seat.status === 'locked';

                            return (
                              <div 
                                key={seatNumStr} 
                                className="relative"
                                onMouseEnter={() => setHoveredSeatNum(seatNumStr)}
                                onMouseLeave={() => setHoveredSeatNum(null)}
                              >
                                {/* Floating Light Tooltip */}
                                {hoveredSeatNum === seatNumStr && (
                                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-in flex flex-col items-center">
                                    <div className="border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-900 shadow-md whitespace-nowrap text-left leading-tight">
                                      <div className="text-[10px] font-bold text-blue-600">
                                        SEAT #{seatNumStr} • {sIdx === 2 ? 'REAR CENTER' : sIdx === 0 || sIdx === 4 ? 'WINDOW' : 'AISLE'}
                                      </div>
                                      <div className="text-xs font-mono font-extrabold text-emerald-600">
                                        LKR {validatedSeatPrice.toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="w-2 h-2 bg-white border-b border-r border-slate-300 rotate-45 -mt-1 shadow-2xs" />
                                  </div>
                                )}

                                <button
                                  type="button"
                                  disabled={isBooked || isUnavailable}
                                  onClick={() => handleSeatClick(seat.id)}
                                  style={{ animationDelay: `${(rIdx * 4 + sIdx) * 12}ms` }}
                                  className={`w-[48px] sm:w-[54px] h-[48px] sm:h-[54px] rounded-2xl flex flex-col items-center justify-between p-1 transition-all duration-200 cursor-pointer relative shadow-2xs hover:z-30 overflow-hidden ${
                                    isSelected
                                      ? 'bg-white border-2 border-[#00a86b] text-slate-900 scale-105 active:scale-95 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                                      : isBookedFemale
                                      ? 'bg-[#ec4899] border-2 border-pink-600 text-white cursor-not-allowed opacity-90'
                                      : isBookedMale
                                      ? 'bg-[#3b82f6] border-2 border-blue-600 text-white cursor-not-allowed opacity-90'
                                      : isReserved
                                      ? 'bg-[#4f46e5] border-2 border-indigo-600 text-white cursor-not-allowed opacity-90'
                                      : isUnavailable
                                      ? 'bg-[#e11d48] border-2 border-rose-600 text-white cursor-not-allowed opacity-80'
                                      : 'bg-white border-2 border-slate-300 text-slate-800 hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-md active:scale-95'
                                  }`}
                                >
                                  {/* Large Bold Seat Number */}
                                  <span className={`text-base sm:text-lg font-extrabold tracking-tight my-auto ${
                                    isBookedFemale || isBookedMale || isReserved || isUnavailable ? 'text-white' : 'text-slate-800'
                                  }`}>
                                    {seatNumStr}
                                  </span>

                                  {/* Bottom Status Bar for White Cards */}
                                  {(!isBooked && !isReserved && !isUnavailable) && (
                                    <div className={`w-full h-1.5 rounded-b-xl -mb-1 ${
                                      isSelected ? 'bg-[#00a86b]' : 'bg-[#60a5fa]'
                                    }`} />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    const leftSeats = row.left || [];
                    const rightSeats = row.right || [];

                    return (
                      <div 
                        key={row.rowNum} 
                        className="flex items-center justify-between gap-4 sm:gap-6 w-full max-w-[320px] sm:max-w-[350px] relative z-10"
                      >
                        {/* Left Column Seats */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {leftSeats.length === 0 ? (
                            row.rowNum === 10 ? (
                              <div className="relative w-[106px] sm:w-[120px] h-[50px] sm:h-[56px]">
                                <div className="absolute top-0 left-0 w-[106px] sm:w-[120px] h-[112px] sm:h-[126px] z-20 flex items-center justify-center">
                                  <div className="w-full py-2.5 px-2 rounded-2xl border border-dashed border-emerald-400 bg-emerald-50/90 backdrop-blur-xs flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-emerald-700 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                                    <span>Entrance Door</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-[106px] sm:w-[120px] h-[50px] sm:h-[56px] pointer-events-none select-none" />
                            )
                          ) : (
                            leftSeats.map((seatNumStr, sIdx) => {
                            const normalizedNum = seatNumStr.replace(/^0+/, '');
                            const existingSeat = selectedRoute.seats.find(s => s.id === `${selectedRoute.id}-${normalizedNum}` || s.number === normalizedNum || s.number === seatNumStr || s.id === seatNumStr);
                            const seat = existingSeat || {
                              id: `${selectedRoute.id}-${normalizedNum}`,
                              number: seatNumStr,
                              row: row.rowNum,
                              col: sIdx + 1,
                              price: selectedRoute.seats[0]?.price || selectedRoute.priceStarting || 1860,
                              status: 'available' as const,
                              deck: 'lower' as DeckType
                            };

                            const isNormalService = selectedRoute.busType?.includes('Normal Service') || selectedRoute.busType?.includes('3*2') || selectedRoute.busType?.includes('Leyland');
                            const isSeat1 = seatNumStr === '1' || normalizedNum === '1';
                            const isSelected = selectedSeatIds.includes(seat.id) || selectedSeatIds.includes(seatNumStr) || selectedSeatIds.includes(normalizedNum);
                            const isBooked = seat.status === 'booked';
                            const isBookedFemale = isBooked && ((seat as any).gender === 'female' || (seat as any).isFemaleBooked);
                            const isBookedMale = isBooked && !isBookedFemale;
                            const isReserved = !isBooked && !isSelected && (seat.isFemaleOnly || seat.status === 'blocked');
                            const isUnavailable = seat.status === 'unavailable' || seat.status === 'locked' || (isNormalService && isSeat1);

                            return (
                              <div 
                                key={seatNumStr} 
                                className="relative"
                                onMouseEnter={() => setHoveredSeatNum(seatNumStr)}
                                onMouseLeave={() => setHoveredSeatNum(null)}
                              >
                                {/* Floating Light Tooltip */}
                                {hoveredSeatNum === seatNumStr && (
                                  <div className={`absolute -top-12 z-50 pointer-events-none animate-scale-in flex flex-col ${
                                    sIdx === 0 ? 'left-0 translate-x-0 items-start' : 'left-1/2 -translate-x-1/2 items-center'
                                  }`}>
                                    <div className="border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-900 shadow-md whitespace-nowrap text-left leading-tight">
                                      <div className={`text-[10px] font-bold ${isSeat1 ? 'text-rose-600' : 'text-blue-600'}`}>
                                        SEAT #{seatNumStr} • {isSeat1 ? 'CREW / CONDUCTOR SEAT (UNAVAILABLE)' : sIdx === 0 ? 'LEFT WINDOW' : 'LEFT AISLE'}
                                      </div>
                                      <div className="text-xs font-mono font-extrabold text-emerald-600">
                                        {isSeat1 ? 'NOT FOR BOOKING' : `LKR ${validatedSeatPrice.toLocaleString()}`}
                                      </div>
                                    </div>
                                    <div className={`w-2 h-2 bg-white border-b border-r border-slate-300 rotate-45 -mt-1 shadow-2xs ${
                                      sIdx === 0 ? 'ml-4' : ''
                                    }`} />
                                  </div>
                                )}

                                <button
                                  type="button"
                                  disabled={isBooked || isUnavailable}
                                  onClick={() => handleSeatClick(seat.id)}
                                  style={{ animationDelay: `${(rIdx * 4 + sIdx) * 12}ms` }}
                                  className={`w-[50px] sm:w-[56px] h-[50px] sm:h-[56px] rounded-2xl flex flex-col items-center justify-between p-1 transition-all duration-200 cursor-pointer relative shadow-2xs hover:z-30 overflow-hidden ${
                                    isSelected
                                      ? 'bg-white border-2 border-[#00a86b] text-slate-900 scale-105 active:scale-95 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                                      : isBookedFemale
                                      ? 'bg-[#ec4899] border-2 border-pink-600 text-white cursor-not-allowed opacity-90'
                                      : isBookedMale
                                      ? 'bg-[#3b82f6] border-2 border-blue-600 text-white cursor-not-allowed opacity-90'
                                      : isReserved
                                      ? 'bg-[#4f46e5] border-2 border-indigo-600 text-white cursor-not-allowed opacity-90'
                                      : isUnavailable
                                      ? 'bg-[#e11d48] border-2 border-rose-600 text-white cursor-not-allowed opacity-80'
                                      : 'bg-white border-2 border-slate-300 text-slate-800 hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-md active:scale-95'
                                  }`}
                                >
                                  {/* Large Bold Seat Number */}
                                  <span className={`text-base sm:text-lg font-extrabold tracking-tight my-auto ${
                                    isBookedFemale || isBookedMale || isReserved || isUnavailable ? 'text-white' : 'text-slate-800'
                                  }`}>
                                    {seatNumStr}
                                  </span>

                                  {/* Bottom Status Bar for White Cards */}
                                  {(!isBooked && !isReserved && !isUnavailable) && (
                                    <div className={`w-full h-1.5 rounded-b-xl -mb-1 ${
                                      isSelected ? 'bg-[#00a86b]' : 'bg-[#60a5fa]'
                                    }`} />
                                  )}
                                </button>
                              </div>
                            );
                          })
                        )}
                        </div>

                        {/* Minimalist Aisle Space */}
                        <div className="w-4 select-none" />

                        {/* Right Column Seats */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {rightSeats.map((seatNumStr, sIdx) => {
                            const normalizedNum = seatNumStr.replace(/^0+/, '');
                            const existingSeat = selectedRoute.seats.find(s => s.id === `${selectedRoute.id}-${normalizedNum}` || s.number === normalizedNum || s.number === seatNumStr || s.id === seatNumStr);
                            const seat = existingSeat || {
                              id: `${selectedRoute.id}-${normalizedNum}`,
                              number: seatNumStr,
                              row: row.rowNum,
                              col: sIdx + 3,
                              price: selectedRoute.seats[0]?.price || selectedRoute.priceStarting || 1860,
                              status: 'available' as const,
                              deck: 'lower' as DeckType
                            };

                            const isSelected = selectedSeatIds.includes(seat.id) || selectedSeatIds.includes(seatNumStr) || selectedSeatIds.includes(normalizedNum);
                            const isBooked = seat.status === 'booked';
                            const isBookedFemale = isBooked && ((seat as any).gender === 'female' || (seat as any).isFemaleBooked);
                            const isBookedMale = isBooked && !isBookedFemale;
                            const isReserved = !isBooked && !isSelected && (seat.isFemaleOnly || seat.status === 'blocked');
                            const isUnavailable = seat.status === 'unavailable' || seat.status === 'locked';

                            return (
                              <div 
                                key={seatNumStr} 
                                className="relative"
                                onMouseEnter={() => setHoveredSeatNum(seatNumStr)}
                                onMouseLeave={() => setHoveredSeatNum(null)}
                              >
                                {/* Floating Light Tooltip */}
                                {hoveredSeatNum === seatNumStr && (
                                  <div className={`absolute -top-12 z-50 pointer-events-none animate-scale-in flex flex-col ${
                                    sIdx === rightSeats.length - 1 ? 'right-0 left-auto translate-x-0 items-end' : 'left-1/2 -translate-x-1/2 items-center'
                                  }`}>
                                    <div className="border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-900 shadow-md whitespace-nowrap text-left leading-tight">
                                      <div className="text-[10px] font-bold text-blue-600">
                                        SEAT #{seatNumStr} • {sIdx === 0 ? 'RIGHT AISLE' : sIdx === 1 ? 'RIGHT MIDDLE' : 'RIGHT WINDOW'}
                                      </div>
                                      <div className="text-xs font-mono font-extrabold text-emerald-600">
                                        LKR {validatedSeatPrice.toLocaleString()}
                                      </div>
                                    </div>
                                    <div className={`w-2 h-2 bg-white border-b border-r border-slate-300 rotate-45 -mt-1 shadow-2xs ${
                                      sIdx === rightSeats.length - 1 ? 'mr-4' : ''
                                    }`} />
                                  </div>
                                )}

                                <button
                                  type="button"
                                  disabled={isBooked || isUnavailable}
                                  onClick={() => handleSeatClick(seat.id)}
                                  style={{ animationDelay: `${(rIdx * 4 + sIdx + 2) * 12}ms` }}
                                  className={`w-[50px] sm:w-[56px] h-[50px] sm:h-[56px] rounded-2xl flex flex-col items-center justify-between p-1 transition-all duration-200 cursor-pointer relative shadow-2xs hover:z-30 overflow-hidden ${
                                    isSelected
                                      ? 'bg-white border-2 border-[#00a86b] text-slate-900 scale-105 active:scale-95 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                                      : isBookedFemale
                                      ? 'bg-[#ec4899] border-2 border-pink-600 text-white cursor-not-allowed opacity-90'
                                      : isBookedMale
                                      ? 'bg-[#3b82f6] border-2 border-blue-600 text-white cursor-not-allowed opacity-90'
                                      : isReserved
                                      ? 'bg-[#4f46e5] border-2 border-indigo-600 text-white cursor-not-allowed opacity-90'
                                      : isUnavailable
                                      ? 'bg-[#e11d48] border-2 border-rose-600 text-white cursor-not-allowed opacity-80'
                                      : 'bg-white border-2 border-slate-300 text-slate-800 hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-md active:scale-95'
                                  }`}
                                >
                                  {/* Large Bold Seat Number */}
                                  <span className={`text-base sm:text-lg font-extrabold tracking-tight my-auto ${
                                    isBookedFemale || isBookedMale || isReserved || isUnavailable ? 'text-white' : 'text-slate-800'
                                  }`}>
                                    {seatNumStr}
                                  </span>

                                  {/* Bottom Status Bar for White Cards */}
                                  {(!isBooked && !isReserved && !isUnavailable) && (
                                    <div className={`w-full h-1.5 rounded-b-xl -mb-1 ${
                                      isSelected ? 'bg-[#00a86b]' : 'bg-[#60a5fa]'
                                    }`} />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Rear Bumper ── */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2">
                  <span>Rear Engine</span>
                  <span>Superline Coach</span>
                </div>

              </div>

              {/* ── Legend (Solid Status Fill for Booked/Unavailable, White Body for Available/Selected) ── */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Seating Plan for {selectedRoute.busNumber || 'NG 9933'}
                </h4>

                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {/* Available Seats */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md border-2 border-slate-300 bg-white flex flex-col justify-between shadow-2xs overflow-hidden">
                      <div className="w-full flex-1 bg-white" />
                      <div className="w-full h-1.5 bg-[#60a5fa] rounded-b-xs" />
                    </div>
                    <span className="text-slate-800 font-bold">Available Seats</span>
                  </div>

                  {/* Selected by You */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md border-2 border-[#00a86b] bg-white flex flex-col justify-between shadow-2xs overflow-hidden">
                      <div className="w-full flex-1 bg-white" />
                      <div className="w-full h-1.5 bg-[#00a86b] rounded-b-xs" />
                    </div>
                    <span className="text-slate-800 font-bold">Selected by You</span>
                  </div>

                  {/* Booked by Gents */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#3b82f6] border border-blue-600 shadow-2xs overflow-hidden" />
                    <span className="text-slate-800 font-bold">Booked by Gents</span>
                  </div>

                  {/* Booked by Ladies */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#ec4899] border border-pink-600 shadow-2xs overflow-hidden" />
                    <span className="text-slate-800 font-bold">Booked by Ladies</span>
                  </div>

                  {/* Reserved Seats */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#4f46e5] border border-indigo-600 shadow-2xs overflow-hidden" />
                    <span className="text-slate-800 font-bold">Reserved Seats</span>
                  </div>

                  {/* Unavailable Seats */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#e11d48] border border-rose-600 shadow-2xs overflow-hidden" />
                    <span className="text-slate-800 font-bold">Unavailable Seats</span>
                  </div>
                </div>
              </div>

              {/* ── Drawer Bottom Action Flow ── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
                
                {/* Selected Seats summary chips */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Selected Seats.</span>
                  {selectedSeatIds.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No seats selected yet. Click any seat above.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSeatsList.map(s => (
                        <span 
                          key={s.id} 
                          className="px-2.5 py-0.5 rounded-lg font-bold text-xs flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300"
                        >
                          <span>Seat #{s.number}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub Total Glowing Bar */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between font-bold text-xs shadow-md animate-luxury-shimmer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sub Total ({selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'Seat' : 'Seats'})</span>
                  </div>
                  <span className="font-mono text-sm sm:text-base font-black">
                    LKR {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Encrypted & secure seat booking reservation</span>
                </div>

                {/* Proceed / Confirm button */}
                <button
                  type="button"
                  onClick={() => setIsSeatDrawerOpen(false)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2 ${
                    selectedSeatIds.length > 0
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 animate-luxury-shimmer'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {selectedSeatIds.length > 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm {selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'Seat' : 'Seats'} (LKR {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                    </>
                  ) : (
                    'Close Seat Map'
                  )}
                </button>

              </div>

            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── Gender Selection Modal Popup (Compact & Sleek Top Level Portal z-[99999]) ────────────────── */}
      {pendingGenderSeat && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-[260px] sm:max-w-[280px] w-full space-y-3 shadow-2xl border border-slate-200 animate-scale-in text-center relative z-[100000]">
            <button
              type="button"
              onClick={() => setPendingGenderSeat(null)}
              className="absolute top-3.5 right-3.5 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-4 h-4" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Select Gender
              </h3>
              <p className="text-[11px] text-slate-500">
                Seat <strong className="text-slate-800 font-bold">#{pendingGenderSeat.number}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {/* Male Bar Button */}
              <button
                type="button"
                onClick={() => handleGenderSelect('male')}
                className="py-2 px-3 rounded-xl border-2 border-blue-200 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-600 text-slate-800 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs hover:shadow-xs active:scale-95"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">👨</span>
                <span className="font-extrabold text-xs">Male</span>
              </button>

              {/* Female Bar Button */}
              <button
                type="button"
                onClick={() => handleGenderSelect('female')}
                className="py-2 px-3 rounded-xl border-2 border-pink-200 hover:border-pink-600 bg-pink-50/50 hover:bg-pink-600 text-slate-800 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs hover:shadow-xs active:scale-95"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">👩</span>
                <span className="font-extrabold text-xs">Female</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
