import React, { useState, useMemo } from 'react';
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
  Filter,
  SlidersHorizontal,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Search,
  CheckCircle2,
  PhoneCall,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

  // Search modify draft state
  const [modOrigin, setModOrigin] = useState(searchOrigin);
  const [modDestination, setModDestination] = useState(searchDestination);
  const [modDate, setModDate] = useState(searchDate);

  // Date strip state
  const [dateOffset, setDateOffset] = useState(() => {
    if (!searchDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(searchDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff > 1 ? diff - 1 : 0);
  });

  const visibleDates = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const dates = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + dateOffset + i);
      const iso = toISODateString(d);
      dates.push({
        dateObj: d,
        isoString: iso,
        label: formatDateLabel(d),
      });
    }
    return dates;
  }, [dateOffset]);

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
      if (busTypeFilter !== 'all' && !route.busType.toLowerCase().includes(busTypeFilter.toLowerCase())) {
        return false;
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
              <span>Back to Home</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-blue-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Dewmina Super Line Booking Portal</span>
            </div>
          </div>

          {/* Main Title & Search Summary Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/10 backdrop-blur-xl border border-white/15 p-5 md:p-6 rounded-3xl shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-blue-300 uppercase">
                <Bus className="w-4 h-4 text-blue-400" />
                <span>Available Bus Schedules Dashboard</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white flex items-center gap-2 tracking-tight">
                  <span>{searchOrigin}</span>
                  <span className="text-blue-400 font-light">→</span>
                  <span>{searchDestination}</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {filteredAndSortedRoutes.length} {filteredAndSortedRoutes.length === 1 ? 'Bus Found' : 'Buses Found'}
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
                <span>{isModifyOpen ? 'Close Search Panel' : 'Modify Search'}</span>
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
                  <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {t('from')}
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
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors border border-slate-200"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Destination */}
                  <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {t('to')}
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

                  {/* Date */}
                  <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('journeyDate')}
                    </label>
                    <input
                      type="date"
                      value={modDate}
                      onChange={(e) => setModDate(e.target.value)}
                      className="w-full bg-transparent text-slate-900 font-bold text-sm focus:outline-none cursor-pointer"
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

      {/* ── Toolbar: Date Strip, Class Filter, Time of Day, and Sorting ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 md:top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* ── Left: Date Carousel Strip (Exact Match to User UI) ── */}
            <div className="flex items-center overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
              <div className="inline-flex items-center bg-slate-50 border border-slate-200/90 rounded-2xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setDateOffset((p) => Math.max(0, p - 1))}
                  disabled={dateOffset <= 0}
                  className={`p-2 rounded-xl text-slate-700 transition-all ${
                    dateOffset <= 0
                      ? 'opacity-25 cursor-not-allowed text-slate-400'
                      : 'hover:bg-white hover:shadow-xs hover:text-slate-900 cursor-pointer active:scale-95'
                  }`}
                  aria-label="Previous date"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 sm:gap-1.5 px-1">
                  {visibleDates.map((item) => {
                    const isSelected = searchDate === item.isoString;
                    return (
                      <button
                        key={item.isoString}
                        type="button"
                        onClick={() => {
                          setSearchCriteria(searchOrigin, searchDestination, item.isoString);
                          setModDate(item.isoString);
                        }}
                        className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#4f46e5] text-white font-bold shadow-md shadow-indigo-500/25'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setDateOffset((p) => p + 1)}
                  className="p-2 rounded-xl text-slate-700 hover:bg-white hover:shadow-xs hover:text-slate-900 transition-all cursor-pointer active:scale-95"
                  aria-label="Next date"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Right: Class Filter, Time Filter & Sorting ── */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Class Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                {[
                  { id: 'all', label: 'All Coaches' },
                  { id: 'Ashok Leyland', label: 'Ashok Leyland 54' },
                  { id: 'Yutong', label: 'Yutong Luxury' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setBusTypeFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      busTypeFilter === tab.id
                        ? 'bg-white text-blue-600 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Time Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                {[
                  { id: 'all', label: 'Anytime' },
                  { id: 'morning', label: 'Morning' },
                  { id: 'afternoon', label: 'Afternoon' },
                  { id: 'evening', label: 'Night' },
                ].map((tItem) => (
                  <button
                    key={tItem.id}
                    onClick={() => setTimeFilter(tItem.id as TimeFilter)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      timeFilter === tItem.id
                        ? 'bg-white text-blue-600 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tItem.label}
                  </button>
                ))}
              </div>

              {/* Sort By Select */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="departure-asc">Departure: Earliest</option>
                  <option value="departure-desc">Departure: Latest</option>
                  <option value="price-asc">Price: Lowest First</option>
                  <option value="price-desc">Price: Highest First</option>
                  <option value="seats-desc">Available Seats</option>
                  <option value="rating-desc">Rating: Highest</option>
                </select>
              </div>

              {/* Reset if filters active */}
              {(busTypeFilter !== 'all' || timeFilter !== 'all' || sortBy !== 'departure-asc') && (
                <button
                  onClick={handleResetFilters}
                  title="Reset all filters"
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
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
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Showing {filteredAndSortedRoutes.length} available {filteredAndSortedRoutes.length === 1 ? 'coach' : 'coaches'}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Guaranteed Seat Lock
                </span>
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
            <div className="lg:col-span-5 hidden lg:block sticky top-36 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-1 overflow-hidden">
                {activeRouteForMap && (
                  <InteractiveRouteMap route={activeRouteForMap as any} />
                )}
              </div>

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
              title: 'Live GPS Tracking',
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
