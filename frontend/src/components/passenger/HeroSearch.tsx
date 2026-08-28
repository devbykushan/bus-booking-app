import React, { useState, useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import {
  MapPin, ArrowRightLeft, Search,
  Shield, Filter, Clock, Star, ChevronDown
} from 'lucide-react';
import { RealisticBusAnimation } from '../common/RealisticBusAnimation';
import { CustomDatePicker } from '../common/CustomDatePicker';

const CITIES = [
  'Monaragala', 'Colombo', 'Kandy', 'Galle',
  'Jaffna', 'Anuradhapura', 'Badulla', 'Wellawaya',
  'Ratnapura', 'Matara',
];

// Particle config: position (%), size, delay, duration
const PARTICLES = [
  { left: '8%', size: 4, delay: '0s', dur: '6s' },
  { left: '18%', size: 3, delay: '1.2s', dur: '8s' },
  { left: '30%', size: 5, delay: '2.4s', dur: '5s' },
  { left: '42%', size: 2, delay: '0.6s', dur: '9s' },
  { left: '55%', size: 4, delay: '3.1s', dur: '7s' },
  { left: '65%', size: 3, delay: '1.8s', dur: '6s' },
  { left: '75%', size: 5, delay: '0.9s', dur: '8s' },
  { left: '85%', size: 2, delay: '2.7s', dur: '5s' },
  { left: '93%', size: 3, delay: '4s', dur: '7s' },
  { left: '23%', size: 6, delay: '1.5s', dur: '10s' },
  { left: '70%', size: 4, delay: '3.6s', dur: '6s' },
  { left: '48%', size: 2, delay: '5s', dur: '9s' },
];

export const HeroSearch: React.FC = () => {
  const {
    searchOrigin,
    searchDestination,
    searchDate,
    busTypeFilter,
    setSearchCriteria,
    setBusTypeFilter,
    setCurrentView,
    t,
  } = useBookingStore();

  const toISODateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => toISODateString(new Date()), []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toISODateString(d);
  }, []);

  const [origin, setOrigin] = useState(searchOrigin);
  const [destination, setDestination] = useState(searchDestination);
  const [date, setDate] = useState(() => {
    const now = toISODateString(new Date());
    return (!searchDate || searchDate < now) ? now : searchDate;
  });

  // Auto-heal past dates when today's date changes or component renders
  React.useEffect(() => {
    const now = toISODateString(new Date());
    if (!date || date < now) {
      setDate(now);
      setSearchCriteria(origin, destination, now);
    }
  }, [todayStr]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleDateChange = (val: string) => {
    const now = toISODateString(new Date());
    if (!val || val < now) {
      setDate(now);
      setSearchCriteria(origin, destination, now);
    } else if (val > maxDateStr) {
      setDate(maxDateStr);
      setSearchCriteria(origin, destination, maxDateStr);
    } else {
      setDate(val);
      setSearchCriteria(origin, destination, val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = toISODateString(new Date());
    let targetDate = date;
    if (!date || date < now) {
      targetDate = now;
      setDate(now);
    } else if (date > maxDateStr) {
      targetDate = maxDateStr;
      setDate(maxDateStr);
    }
    setSearchCriteria(origin, destination, targetDate);
    setCurrentView('schedules-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-[95vh] flex flex-col justify-center overflow-hidden pt-20 md:pt-24 pb-12">

      {/* ── Ken Burns Hero Background ──────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/yutong-hero.jpg"
          alt="Yutong C12 Pro Luxury Express Bus"
          className="w-full h-full object-cover object-center animate-ken-burns"
        />
        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/55 via-transparent to-indigo-950/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(59,130,246,0.12)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(99,102,241,0.10)_0%,transparent_55%)]" />
      </div>

      {/* ── Floating Particles ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute bottom-0 rounded-full bg-blue-300/40 animate-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              // CSS custom properties for the animation
              ['--dur' as string]: p.dur,
              ['--delay' as string]: p.delay,
            }}
          />
        ))}
      </div>

      {/* ── Animated Real Luxury Coach Streak at bottom ──────────────── */}
      <div className="absolute bottom-[68px] left-0 z-[3] pointer-events-none w-full overflow-hidden">
        <div
          className="animate-bus-streak flex items-center"
          style={{ animationDelay: '1s', animationDuration: '14s' }}
        >
          <RealisticBusAnimation />
        </div>
      </div>

      {/* ── Animated Road Lines ────────────────────────────────────────── */}
      <div className="absolute bottom-16 left-0 right-0 z-[2] pointer-events-none overflow-hidden h-1 opacity-20">
        <div className="flex gap-8 animate-road" style={{ width: '200%' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-full w-16 bg-white/60 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* ── Hero Content ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-14 space-y-8">

        {/* Main headline */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
            {t('heroTitle')}
          </h1>

          {/* Dewmina Super Line branding with shimmer */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/60" />
            <span className="animate-shimmer-text text-sm md:text-base font-bold tracking-[0.22em] uppercase">
              Dewmina Super Line
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/60" />
          </div>

        </div>

        {/* Trust badges */}
        <div
          className="flex flex-wrap justify-center gap-3 text-xs font-semibold animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {[
            { icon: <Shield className="w-3.5 h-3.5 text-green-400" />, label: 'SSL Secured Payments' },
            { icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, label: t('seatsLocked') },
            { icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, label: '4.9★ Rated Service' },
          ].map(({ icon, label }, i) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                         bg-white/10 backdrop-blur-sm border border-white/15 text-white/80
                         hover:bg-white/20 hover:border-white/30 transition-all duration-300
                         hover:scale-105 cursor-default"
              style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* ── Glass Search Card with Glow Border ───────────────────────── */}
        <div
          className="w-full max-w-4xl animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <form
            onSubmit={handleSearchSubmit}
            className="relative bg-white/10 backdrop-blur-xl border border-white/25
                       rounded-3xl shadow-2xl shadow-black/30 p-6 md:p-8 space-y-5
                       animate-border-glow"
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/8 via-transparent to-white/3 pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-12 gap-3 items-center">

              {/* Origin */}
              <div className="md:col-span-4 relative bg-white/90 backdrop-blur rounded-2xl p-4
                              border border-white/50 focus-within:border-blue-400 focus-within:ring-4
                              focus-within:ring-blue-400/20 transition-all duration-300 shadow-sm
                              hover:shadow-blue-200/40 hover:shadow-md group/from">
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-600 shadow-xs transition-transform duration-300 group-hover/from:scale-110 group-hover/from:-translate-y-0.5">
                      <span className="absolute -inset-0.5 rounded-md bg-blue-400/30 animate-from-beacon pointer-events-none" />
                      <MapPin className="w-3.5 h-3.5 animate-from-icon relative z-10" />
                    </span>
                    <span className="font-extrabold">{t('from')}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100/70 text-blue-700 font-semibold normal-case">
                    Origin
                  </span>
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-extrabold text-base focus:outline-none cursor-pointer"
                >
                  {CITIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
              </div>

              {/* Swap */}
              <div className="md:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap Departure & Destination"
                  className="group/swap p-3 rounded-2xl bg-white/90 hover:bg-blue-50 border border-white/50
                             text-slate-600 hover:text-blue-600 shadow-sm
                             transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative"
                >
                  <ArrowRightLeft className="w-4 h-4 transition-transform duration-500 group-hover/swap:rotate-180 text-blue-600" />
                </button>
              </div>

              {/* Destination */}
              <div className="md:col-span-4 relative bg-white/90 backdrop-blur rounded-2xl p-4
                              border border-white/50 focus-within:border-indigo-400 focus-within:ring-4
                              focus-within:ring-indigo-400/20 transition-all duration-300 shadow-sm
                              hover:shadow-indigo-200/40 hover:shadow-md group/to">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-600 shadow-xs transition-transform duration-300 group-hover/to:scale-110 group-hover/to:-translate-y-0.5">
                      <span className="absolute -inset-0.5 rounded-md bg-indigo-400/30 animate-to-beacon pointer-events-none" />
                      <MapPin className="w-3.5 h-3.5 animate-to-icon relative z-10" />
                    </span>
                    <span className="font-extrabold">{t('to')}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100/70 text-indigo-700 font-semibold normal-case">
                    Destination
                  </span>
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-extrabold text-base focus:outline-none cursor-pointer"
                >
                  {CITIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
              </div>

              {/* Date */}
              <div className="md:col-span-3">
                <CustomDatePicker
                  label={t('journeyDate')}
                  value={date}
                  minDate={todayStr}
                  maxDate={maxDateStr}
                  onChange={handleDateChange}
                  theme="amber"
                />
              </div>
            </div>

            {/* Filters + Submit */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/20">

              {/* Animated Bus Class Pill Filter */}
              <div className="group/filter relative inline-flex items-center gap-2.5 text-xs bg-white/95 backdrop-blur-md
                              border border-white/80 hover:border-blue-400 px-4 py-2.5 rounded-2xl text-slate-800
                              shadow-lg shadow-black/10 hover:bg-white hover:shadow-xl hover:shadow-blue-500/20
                              transition-all duration-300 transform hover:scale-[1.03] active:scale-95 cursor-pointer overflow-hidden">
                {/* Ambient glow sweep on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent -translate-x-full group-hover/filter:translate-x-full transition-transform duration-700 pointer-events-none" />

                {/* Animated Filter Icon */}
                <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 transition-transform duration-300 group-hover/filter:scale-110 group-hover/filter:rotate-[-8deg] flex-shrink-0 shadow-2xs">
                  <Filter className="w-3.5 h-3.5 animate-filter-tilt relative z-10 text-blue-600" />
                </span>

                {/* Label & Active Option */}
                <span className="text-slate-600 font-semibold tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-slate-500 font-bold">{t('busClass')}:</span>
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                    {busTypeFilter === 'all'
                      ? t('allClasses')
                      : busTypeFilter === 'Normal Service' || busTypeFilter === 'Ashok Leyland'
                      ? t('normalService')
                      : busTypeFilter === 'Super Luxury' || busTypeFilter === 'Yutong'
                      ? t('superLuxury')
                      : busTypeFilter}
                  </span>
                </span>

                {/* Animated Chevron Down */}
                <ChevronDown className="w-4 h-4 text-blue-600 transition-transform duration-300 group-hover/filter:translate-y-0.5 group-hover/filter:text-blue-700 animate-chevron-bob flex-shrink-0 ml-0.5" />

                {/* Hidden Overlay Select for native click & accessibility */}
                <select
                  value={busTypeFilter}
                  onChange={(e) => setBusTypeFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900"
                  title="Select Bus Class"
                >
                  <option value="all" className="text-slate-900">{t('allClasses')}</option>
                  <option value="Normal Service" className="text-slate-900">{t('normalService')}</option>
                  <option value="Super Luxury" className="text-slate-900">{t('superLuxury')}</option>
                </select>
              </div>

              {/* Search CTA with ripple */}
              <button
                type="submit"
                className="ripple-effect w-full md:w-auto flex items-center justify-center gap-2.5
                           px-10 py-3.5 rounded-2xl font-extrabold text-sm text-white
                           bg-gradient-to-r from-blue-500 to-indigo-600
                           hover:from-blue-400 hover:to-indigo-500
                           shadow-xl shadow-blue-700/40
                           transform hover:scale-[1.05] active:scale-95
                           transition-all duration-200 cursor-pointer
                           relative overflow-hidden"
              >
                <Search className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{t('searchBuses')}</span>
                {/* Animated shine sweep on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
