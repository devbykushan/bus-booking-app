import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { BusCard } from './BusCard';
import { InteractiveRouteMap } from './InteractiveRouteMap';
import type { BusRoute } from '../../types/booking';
import {
  Bus,
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  MapPin,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Search,
  CheckCircle2,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';
import { CustomDatePicker } from '../common/CustomDatePicker';

const CITIES = [
  'Monaragala', 'Colombo', 'Kandy', 'Galle',
  'Jaffna', 'Anuradhapura', 'Badulla', 'Wellawaya',
  'Ratnapura', 'Matara',
];

type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening';
type SortOption = 'departure-asc' | 'departure-desc' | 'price-asc' | 'price-desc' | 'seats-desc' | 'rating-desc';

export const SchedulesDashboard: React.FC = () => {
  const {
    routes,
    searchOrigin,
    searchDestination,
    searchDate,
    busTypeFilter,
    setSearchCriteria,
    setBusTypeFilter,
    goToHome,
    t,
  } = useBookingStore();

  const [focusedRoute, setFocusedRoute] = useState<BusRoute | null>(null);
  const [isModifyOpen, setIsModifyOpen] = useState(false);

  // Dropdown open states
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const opRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (opRef.current && !opRef.current.contains(target)) setOperatorOpen(false);
      if (timeRef.current && !timeRef.current.contains(target)) setTimeOpen(false);
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to format date like "Sat, 22 Aug"
  const formatDateLabel = (d: Date) => {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${day} ${month}`;
  };

  const toISODateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => toISODateString(new Date()), []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Strictly 1 week (7 days) advance booking limit
    return toISODateString(d);
  }, []);

  // Search modify draft state
  const [modOrigin, setModOrigin] = useState(searchOrigin);
  const [modDestination, setModDestination] = useState(searchDestination);
  const [modDate, setModDate] = useState(() => {
    const now = toISODateString(new Date());
    return (!searchDate || searchDate < now) ? now : searchDate;
  });

  // Auto-heal past search dates
  useEffect(() => {
    const now = toISODateString(new Date());
    if (searchDate < now) {
      setSearchCriteria(searchOrigin, searchDestination, now);
    }
    if (modDate < now) {
      setModDate(now);
    }
  }, [todayStr]);

  // Horizontal scrollable dates state (Strictly 1 week / 7 days advance booking)
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const selectedDateBtnRef = useRef<HTMLButtonElement>(null);
  const dateBtnRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Sliding animated indicator pill position
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const availableDates = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const dates = [];
    // 0 to 7 days (1 week window)
    for (let i = 0; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = toISODateString(d);
      dates.push({
        dateObj: d,
        isoString: iso,
        label: formatDateLabel(d),
      });
    }
    return dates;
  }, []);

  // Update sliding indicator position
  const updateIndicator = useCallback(() => {
    const activeDateKey = searchDate || availableDates[0]?.isoString;
    const activeBtn = dateBtnRefs.current[activeDateKey];
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        opacity: 1,
      });
    }
  }, [searchDate, availableDates]);

  useEffect(() => {
    // Initial measurement after layout pass
    const timer = setTimeout(updateIndicator, 40);
    return () => clearTimeout(timer);
  }, [updateIndicator]);

  // Scroll tracking to enable/disable arrow buttons & update indicator
  const checkScroll = useCallback(() => {
    if (dateScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = dateScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const el = dateScrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', updateIndicator);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', updateIndicator);
      };
    }
  }, [availableDates, checkScroll, updateIndicator]);

  // Center selected date into view on mount or change
  useEffect(() => {
    if (selectedDateBtnRef.current) {
      selectedDateBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
    updateIndicator();
  }, [searchDate, updateIndicator]);

  const handleScrollDates = (direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Operator list options
  const operatorOptions = useMemo(() => {
    const ops = new Set<string>();
    routes.forEach((r) => {
      if (r.operatorName) ops.add(r.operatorName);
      if (r.busType) {
        if (r.busType.toLowerCase().includes('leyland') || r.busType.toLowerCase().includes('normal') || r.busType.toLowerCase().includes('non-ac')) {
          ops.add('Normal Service');
        }
        if (r.busType.toLowerCase().includes('yutong') || r.busType.toLowerCase().includes('luxury') || r.busType.toLowerCase().includes('sleeper') || r.busType.toLowerCase().includes('super')) {
          ops.add('Super Luxury');
        }
      }
    });
    return [
      { id: 'all', label: 'All Classes & Coaches' },
      { id: 'Normal Service', label: 'Normal Service' },
      { id: 'Super Luxury', label: 'Super Luxury' },
      ...Array.from(ops)
        .filter((o) => o !== 'Normal Service' && o !== 'Super Luxury' && o !== 'Ashok Leyland 54' && o !== 'Yutong Luxury' && o !== 'Ashok Leyland' && o !== 'Yutong')
        .map((o) => ({ id: o, label: o })),
    ];
  }, [routes]);

  // Time and Sorting states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('departure-asc');

  // Handle Swap in modify panel
  const handleSwap = () => {
    const temp = modOrigin;
    setModOrigin(modDestination);
    setModDestination(temp);
  };

  // Submit search modification
  const handleApplyModifiedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (modDate < todayStr || modDate > maxDateStr) {
      alert('Advance seat bookings are only allowed up to 1 week (7 days) in advance.');
      return;
    }
    setSearchCriteria(modOrigin, modDestination, modDate);
    setIsModifyOpen(false);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setBusTypeFilter('all');
    setTimeFilter('all');
    setSortBy('departure-asc');
  };

  // Parse time into minutes from midnight for sorting and filtering
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/(\d+):?(\d+)?\s*(am|pm)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridian = match[3]?.toLowerCase();

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  // Filter and Sort routes
  const filteredAndSortedRoutes = useMemo(() => {
    let result = routes.filter((route) => {
      // Bus class / type filter
      if (busTypeFilter !== 'all') {
        const bType = (route.busType || '').toLowerCase();
        const fType = busTypeFilter.toLowerCase();
        const opName = (route.operatorName || '').toLowerCase();

        if (fType === 'normal service' || fType === 'ashok leyland') {
          if (!bType.includes('normal') && !bType.includes('leyland') && !bType.includes('non-ac')) {
            return false;
          }
        } else if (fType === 'super luxury' || fType === 'yutong') {
          if (!bType.includes('super') && !bType.includes('luxury') && !bType.includes('yutong') && !bType.includes('ac') && !bType.includes('sleeper')) {
            return false;
          }
        } else if (!bType.includes(fType) && !opName.includes(fType)) {
          return false;
        }
      }
      // Origin filter
      if (searchOrigin && route.origin.toLowerCase() !== searchOrigin.toLowerCase()) {
        return false;
      }
      // Destination filter
      if (searchDestination && route.destination.toLowerCase() !== searchDestination.toLowerCase()) {
        return false;
      }
      // Available seats check
      if (route.availableSeatsCount <= 0) {
        return false;
      }
      // Time of day filter
      if (timeFilter !== 'all') {
        const minutes = parseTimeToMinutes(route.departureTime);
        if (timeFilter === 'morning' && !(minutes >= 300 && minutes < 720)) return false; // 5:00 AM - 11:59 AM
        if (timeFilter === 'afternoon' && !(minutes >= 720 && minutes < 1020)) return false; // 12:00 PM - 4:59 PM
        if (timeFilter === 'evening' && !(minutes >= 1020 || minutes < 300)) return false; // 5:00 PM - 4:59 AM
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'departure-asc') {
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      }
      if (sortBy === 'departure-desc') {
        return parseTimeToMinutes(b.departureTime) - parseTimeToMinutes(a.departureTime);
      }
      if (sortBy === 'price-asc') {
        return (a.priceStarting || 0) - (b.priceStarting || 0);
      }
      if (sortBy === 'price-desc') {
        return (b.priceStarting || 0) - (a.priceStarting || 0);
      }
      if (sortBy === 'seats-desc') {
        return b.availableSeatsCount - a.availableSeatsCount;
      }
      if (sortBy === 'rating-desc') {
        return (b.operatorRating || 0) - (a.operatorRating || 0);
      }
      return 0;
    });

    return result;
  }, [routes, searchOrigin, searchDestination, busTypeFilter, timeFilter, sortBy]);

  const activeRouteForMap = focusedRoute || filteredAndSortedRoutes[0] || null;

  const formattedDate = searchDate
    ? new Date(searchDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Today';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* ── Top Hero Banner for Dashboard ── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white pt-24 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-lg">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-5">
          {/* Breadcrumb / Back button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={goToHome}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('backToHome')}</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-blue-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('officialPortal')}</span>
            </div>
          </div>

          {/* Main Title & Search Summary Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/10 backdrop-blur-xl border border-white/15 p-5 md:p-6 rounded-3xl shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-blue-300 uppercase">
                <Bus className="w-4 h-4 text-blue-400" />
                <span>{t('availableSchedules')}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white flex flex-wrap items-center gap-3 tracking-tight">
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-300">
                      <span className="absolute -inset-0.5 rounded-lg bg-blue-400/30 animate-from-beacon pointer-events-none" />
                      <MapPin className="w-3.5 h-3.5 animate-from-icon relative z-10 text-blue-400" />
                    </span>
                    <span>{t(searchOrigin)}</span>
                  </span>
                  <span className="text-blue-400 font-light flex items-center gap-1 px-1">
                    <span className="w-6 sm:w-10 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-route-flow" />
                    <ChevronRight className="w-5 h-5 text-indigo-300 animate-bounce-horizontal -ml-2" />
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                      <span className="absolute -inset-0.5 rounded-lg bg-indigo-400/30 animate-to-beacon pointer-events-none" />
                      <MapPin className="w-3.5 h-3.5 animate-to-icon relative z-10 text-indigo-400" />
                    </span>
                    <span>{t(searchDestination)}</span>
                  </span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-blue-300 animate-date-icon" />
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {filteredAndSortedRoutes.length} {filteredAndSortedRoutes.length === 1 ? t('busFound') : t('busesFound')}
                </span>
              </div>
            </div>

            {/* Modify Search Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModifyOpen(!isModifyOpen)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer shadow-md ${
                  isModifyOpen
                    ? 'bg-white text-slate-900 border border-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 hover:shadow-blue-500/30'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{isModifyOpen ? t('closeSearchPanel') : t('modifySearch')}</span>
              </button>
            </div>
          </div>

          {/* ── Collapsible Modify Search Drawer ── */}
          {isModifyOpen && (
            <div className="animate-fade-in-up bg-white rounded-3xl p-5 md:p-6 shadow-2xl text-slate-800 border border-slate-200">
              <form onSubmit={handleApplyModifiedSearch} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>Update Route & Travel Date</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModifyOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Origin */}
                  <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all group/from">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center justify-between gap-1 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex items-center justify-center w-5 h-5 rounded-md bg-blue-100/70 border border-blue-300 text-blue-600 shadow-xs transition-transform duration-300 group-hover/from:scale-110">
                          <span className="absolute -inset-0.5 rounded-md bg-blue-400/30 animate-from-beacon pointer-events-none" />
                          <MapPin className="w-3.5 h-3.5 animate-from-icon relative z-10" />
                        </span>
                        <span className="font-extrabold">{t('from')}</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold normal-case">
                        Origin
                      </span>
                    </label>
                    <select
                      value={modOrigin}
                      onChange={(e) => setModOrigin(e.target.value)}
                      className="w-full bg-transparent text-slate-900 font-bold text-sm focus:outline-none cursor-pointer"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {t(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Swap */}
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={handleSwap}
                      title="Swap cities"
                      className="group/swap p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all duration-300 border border-slate-200 cursor-pointer hover:scale-110 active:scale-95"
                    >
                      <ArrowRightLeft className="w-4 h-4 transition-transform duration-500 group-hover/swap:rotate-180 text-blue-600" />
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all group/to">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center justify-between gap-1 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100/70 border border-indigo-300 text-indigo-600 shadow-xs transition-transform duration-300 group-hover/to:scale-110">
                          <span className="absolute -inset-0.5 rounded-md bg-indigo-400/30 animate-to-beacon pointer-events-none" />
                          <MapPin className="w-3.5 h-3.5 animate-to-icon relative z-10" />
                        </span>
                        <span className="font-extrabold">{t('to')}</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold normal-case">
                        Destination
                      </span>
                    </label>
                    <select
                      value={modDestination}
                      onChange={(e) => setModDestination(e.target.value)}
                      className="w-full bg-transparent text-slate-900 font-bold text-sm focus:outline-none cursor-pointer"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {t(c)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Real-Time Date Picker */}
                  <div className="md:col-span-3">
                    <CustomDatePicker
                      label={t('journeyDate')}
                      value={modDate}
                      minDate={todayStr}
                      maxDate={maxDateStr}
                      onChange={(newDate) => setModDate(newDate)}
                      theme="blue"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Update Search Results</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── Toolbar: Date Strip, Class Filter, Time of Day, and Sorting in Order ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 md:top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 relative">
            
            {/* 1. Date Carousel Strip with Vibrant Sliding Indicator & Rich Colors */}
            <div className="inline-flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1 shadow-xs max-w-full sm:max-w-[440px] md:max-w-[520px] lg:max-w-[580px] relative">
              {/* Left Scroll Button */}
              <button
                type="button"
                onClick={() => handleScrollDates('left')}
                disabled={!canScrollLeft}
                className={`group p-1.5 sm:p-2 rounded-xl transition-all duration-200 flex-shrink-0 z-10 ${
                  !canScrollLeft
                    ? 'opacity-30 cursor-not-allowed text-slate-300'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer active:scale-85 hover:shadow-xs'
                }`}
                aria-label="Scroll dates left"
                title="Scroll previous dates"
              >
                <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>

              {/* Scrollable Dates Strip with Vibrant Sliding Indicator */}
              <div 
                ref={dateScrollRef}
                className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1 px-1 py-0.5 flex-nowrap relative"
              >
                {/* ── Rich Gradient Sliding Active Capsule Indicator ── */}
                <div
                  className="absolute bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl shadow-md shadow-indigo-500/30 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    top: `${indicatorStyle.top}px`,
                    width: `${indicatorStyle.width}px`,
                    height: `${indicatorStyle.height}px`,
                    opacity: indicatorStyle.opacity,
                  }}
                />

                {availableDates.map((item) => {
                  const isSelected = searchDate === item.isoString;
                  const isPast = item.isoString < todayStr;
                  const isBeyondMax = item.isoString > maxDateStr;
                  const isValid = !isPast && !isBeyondMax;

                  return (
                    <button
                      key={item.isoString}
                      ref={(el) => {
                        dateBtnRefs.current[item.isoString] = el;
                        if (isSelected) {
                          (selectedDateBtnRef as any).current = el;
                        }
                      }}
                      type="button"
                      disabled={!isValid}
                      onClick={() => {
                        if (!isValid) return;
                        setSearchCriteria(searchOrigin, searchDestination, item.isoString);
                        setModDate(item.isoString);
                      }}
                      className={`relative z-10 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl text-xs sm:text-sm whitespace-nowrap flex-shrink-0 select-none transition-all duration-200 ${
                        !isValid
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : isSelected
                          ? 'text-white font-extrabold cursor-default drop-shadow-xs'
                          : 'text-slate-700 font-semibold hover:text-indigo-600 hover:bg-indigo-50/70 hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Button */}
              <button
                type="button"
                onClick={() => handleScrollDates('right')}
                disabled={!canScrollRight}
                className={`group p-1.5 sm:p-2 rounded-xl transition-all duration-200 flex-shrink-0 z-10 ${
                  !canScrollRight
                    ? 'opacity-30 cursor-not-allowed text-slate-300'
                    : 'text-slate-800 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer active:scale-85 hover:shadow-xs'
                }`}
                aria-label="Scroll dates right"
                title="Scroll next dates"
              >
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* 2. Dropdown Filters on the Right with Rich Colors & Glowing States */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">

              {/* ── Operator Dropdown (Vibrant Indigo Theme) ── */}
              <div className="relative" ref={opRef}>
                <button
                  type="button"
                  onClick={() => {
                    setOperatorOpen(!operatorOpen);
                    setTimeOpen(false);
                    setSortOpen(false);
                  }}
                  className={`filter-btn-animate flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold cursor-pointer select-none ${
                    operatorOpen || busTypeFilter !== 'all'
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white hover:bg-indigo-50/60 border-slate-200 text-indigo-600 hover:border-indigo-200 shadow-xs'
                  }`}
                >
                  {busTypeFilter !== 'all' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping inline-block shadow-sm shadow-indigo-500/50" />
                  )}
                  <span>{busTypeFilter === 'all' ? 'Operator' : busTypeFilter}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-600 transition-transform duration-300 ease-out ${operatorOpen ? 'rotate-180 scale-110' : ''}`} />
                </button>

                {operatorOpen && (
                  <div className="absolute right-0 sm:left-0 top-full mt-2 w-56 backdrop-blur-xl bg-white/95 rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-popover-in">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100/80 flex items-center justify-between">
                      <span>Select Operator / Class</span>
                      {busTypeFilter !== 'all' && (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md">Active</span>
                      )}
                    </div>
                    <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
                      {operatorOptions.map((opt) => {
                        const isSelected = busTypeFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setBusTypeFilter(opt.id);
                              setOperatorOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-700 font-bold translate-x-0.5 shadow-xs'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 animate-pop-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Time Dropdown (Vibrant Blue & Sky Theme) ── */}
              <div className="relative" ref={timeRef}>
                <button
                  type="button"
                  onClick={() => {
                    setTimeOpen(!timeOpen);
                    setOperatorOpen(false);
                    setSortOpen(false);
                  }}
                  className={`filter-btn-animate animate-clock-pulse group flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold cursor-pointer select-none ${
                    timeOpen || timeFilter !== 'all'
                      ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-blue-300 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-sky-50/60 border-slate-200 text-slate-700 hover:border-sky-200 shadow-xs'
                  }`}
                >
                  <Clock className={`clock-icon w-3.5 h-3.5 transition-colors duration-200 ${timeFilter !== 'all' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                  {timeFilter !== 'all' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block shadow-sm shadow-blue-500/50" />
                  )}
                  <span>
                    {timeFilter === 'all'
                      ? 'Departure Time'
                      : timeFilter === 'morning'
                      ? 'Morning'
                      : timeFilter === 'afternoon'
                      ? 'Afternoon'
                      : 'Night'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out group-hover:text-slate-600 ${timeOpen ? 'rotate-180 scale-110 text-blue-600' : ''}`} />
                </button>

                {timeOpen && (
                  <div className="absolute right-0 sm:left-0 top-full mt-2 w-56 backdrop-blur-xl bg-white/95 rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-popover-in">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100/80 flex items-center justify-between">
                      <span>Departure Window</span>
                      {timeFilter !== 'all' && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md">Active</span>
                      )}
                    </div>
                    <div className="py-1 space-y-0.5">
                      {[
                        { id: 'all', label: 'Anytime (All Day)' },
                        { id: 'morning', label: 'Morning (5 AM - 12 PM)' },
                        { id: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
                        { id: 'evening', label: 'Night (5 PM - 5 AM)' },
                      ].map((tItem) => {
                        const isSelected = timeFilter === tItem.id;
                        return (
                          <button
                            key={tItem.id}
                            type="button"
                            onClick={() => {
                              setTimeFilter(tItem.id as TimeFilter);
                              setTimeOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 font-bold translate-x-0.5 shadow-xs'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                            }`}
                          >
                            <span>{tItem.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 animate-pop-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sort Dropdown (Vibrant Amber Theme & Animated Micro-interactions) ── */}
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => {
                    setSortOpen(!sortOpen);
                    setOperatorOpen(false);
                    setTimeOpen(false);
                  }}
                  className={`filter-btn-animate flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold cursor-pointer select-none ${
                    sortOpen || sortBy !== 'departure-asc'
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-700 hover:border-amber-200 shadow-xs'
                  }`}
                >
                  <span className="text-slate-400 font-normal">Sort:</span>
                  <span className="font-semibold text-slate-800">
                    {sortBy === 'departure-asc'
                      ? 'Earliest'
                      : sortBy === 'departure-desc'
                      ? 'Latest'
                      : sortBy === 'price-asc'
                      ? 'Lowest Price'
                      : sortBy === 'price-desc'
                      ? 'Highest Price'
                      : sortBy === 'seats-desc'
                      ? 'Seats Left'
                      : 'Top Rated'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out ${sortOpen ? 'rotate-180 scale-110 text-amber-700' : ''}`} />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 backdrop-blur-xl bg-white/95 rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-popover-in">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100/80">
                      Sort Schedules
                    </div>
                    <div className="py-1 space-y-0.5">
                      {[
                        { id: 'departure-asc', label: 'Departure: Earliest' },
                        { id: 'departure-desc', label: 'Departure: Latest' },
                        { id: 'price-asc', label: 'Price: Lowest First' },
                        { id: 'price-desc', label: 'Price: Highest First' },
                        { id: 'seats-desc', label: 'Available Seats' },
                        { id: 'rating-desc', label: 'Rating: Highest' },
                      ].map((sItem) => {
                        const isSelected = sortBy === sItem.id;
                        return (
                          <button
                            key={sItem.id}
                            type="button"
                            onClick={() => {
                              setSortBy(sItem.id as SortOption);
                              setSortOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 text-amber-900 font-bold translate-x-0.5 shadow-xs'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                            }`}
                          >
                            <span>{sItem.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 animate-pop-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset if filters active with Rose Gradient & Rotation */}
              {(busTypeFilter !== 'all' || timeFilter !== 'all' || sortBy !== 'departure-asc') && (
                <button
                  onClick={handleResetFilters}
                  title="Reset all filters"
                  className="filter-btn-animate flex items-center gap-1 px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-rose-600 border border-rose-200 shadow-xs cursor-pointer select-none text-xs font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 hover:rotate-180" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Body Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {filteredAndSortedRoutes.length === 0 ? (
          /* Empty State */
          <div className="bg-white p-12 md:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-5 animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">No Bus Schedules Match Your Selection</h3>
              <p className="text-sm text-slate-500">
                We couldn't find any available buses for <strong>{searchOrigin} → {searchDestination}</strong> with the current filter settings.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
              <button
                onClick={() => setIsModifyOpen(true)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Change Route / Date</span>
              </button>
            </div>
          </div>
        ) : (
          /* 2-Column Schedule Results + Interactive Map */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Bus Cards List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Showing {filteredAndSortedRoutes.length} available {filteredAndSortedRoutes.length === 1 ? 'coach' : 'coaches'}</span>
              </div>

              {filteredAndSortedRoutes.map((route, idx) => {
                const isSelected = (activeRouteForMap?.id || filteredAndSortedRoutes[0]?.id) === route.id;
                return (
                  <div
                    key={route.id}
                    style={{ animationDelay: `${idx * 0.06}s` }}
                    className={`transition-all duration-300 rounded-3xl ${
                      isSelected
                        ? 'ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/10'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <BusCard
                      route={route as any}
                      isSelected={isSelected}
                      onFocusRoute={(r) => setFocusedRoute(r)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Right Side: Sticky Interactive Route Map Preview */}
            <div className="lg:col-span-4 hidden lg:block sticky top-36 space-y-4">
              {activeRouteForMap && (
                <InteractiveRouteMap route={activeRouteForMap as any} />
              )}

              {/* Quick Contact & Reassurance Box */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Need Immediate Help?</h4>
                    <p className="text-xs text-slate-500">Call Dewmina Dispatch: +94 (0) 55 227 6890</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All coaches are GPS-monitored with speed regulation, verified drivers, and real-time seat lock sync.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Feature Highlights Banner ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {[
            {
              title: '100% Real-Time Hold',
              desc: 'Live 8-minute seat lock concurrency engine prevents double bookings.',
              icon: ShieldCheck,
              color: 'text-blue-600 bg-blue-50 border-blue-200',
            },
            {
              title: 'Live GPS Tracking (Coming Soon)',
              desc: 'Track coach location on the road with real-time waypoint estimates.',
              icon: MapPin,
              color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
            },
            {
              title: 'Instant Boarding Pass',
              desc: 'Download PDF ticket and receive immediate SMS/WhatsApp confirmation.',
              icon: CheckCircle2,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            },
            {
              title: 'Free Rescheduling',
              desc: 'Easily cancel or adjust your booking up to 2 hours before departure.',
              icon: Clock,
              color: 'text-amber-600 bg-amber-50 border-amber-200',
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-3.5 hover:border-slate-300 transition-all"
              >
                <div className={`p-2.5 rounded-2xl border ${feat.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">{feat.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
