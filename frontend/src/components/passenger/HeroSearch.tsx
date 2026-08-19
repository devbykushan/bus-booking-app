import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import {
  MapPin, Calendar, ArrowRightLeft, Search,
  Shield, Filter, Sparkles, Clock, Star
} from 'lucide-react';

const CITIES = [
  'Monaragala', 'Colombo', 'Kandy', 'Galle',
  'Jaffna', 'Anuradhapura', 'Badulla', 'Wellawaya',
  'Ratnapura', 'Matara',
];

export const HeroSearch: React.FC = () => {
  const {
    searchOrigin,
    searchDestination,
    searchDate,
    soloFemaleOnly,
    busTypeFilter,
    setSearchCriteria,
    setSoloFemaleOnly,
    setBusTypeFilter,
  } = useBookingStore();

  const [origin, setOrigin] = useState(searchOrigin);
  const [destination, setDestination] = useState(searchDestination);
  const [date, setDate] = useState(searchDate);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCriteria(origin, destination, date);
  };

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden">

      {/* ── Full-bleed Hero Background ───────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <img
          src="/yutong-hero.jpg"
          alt="Yutong C12 Pro Luxury Express Bus"
          className="w-full h-full object-cover object-center"
        />
        {/* Multi-layer gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 via-transparent to-indigo-950/50" />
        {/* Subtle animated shimmer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15)_0%,_transparent_60%)]" />
      </div>

      {/* ── Floating Badge ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-12 space-y-8">

        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                           bg-white/10 backdrop-blur-md border border-white/20
                           text-white/90 text-xs font-bold tracking-wider uppercase
                           shadow-lg shadow-blue-900/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Sri Lanka&apos;s #1 Real-Time Bus Booking
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
              Live
            </span>
          </span>
        </div>

        {/* ── Main Headline ─────────────────────────────────────────────── */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
            Book Premium Seats
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              In Real-Time
            </span>
          </h1>

          {/* Dewmina Super Line branding accent */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/60" />
            <span className="text-blue-200/90 text-sm md:text-base font-semibold tracking-[0.2em] uppercase">
              Dewmina Super Line
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/60" />
          </div>

          <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Interactive seat maps · 8-minute seat lock · Live GPS tracking · Female-reserved protection
          </p>
        </div>

        {/* ── Trust Badges ─────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap justify-center gap-3 text-xs font-semibold animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {[
            { icon: <Shield className="w-3.5 h-3.5 text-green-400" />, label: 'SSL Secured Payments' },
            { icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,  label: '8-Min Seat Lock' },
            { icon: <Star  className="w-3.5 h-3.5 text-yellow-400" />, label: '4.9★ Rated Service' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         bg-white/10 backdrop-blur-sm border border-white/15 text-white/80"
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* ── Main Glass Search Card ────────────────────────────────────── */}
        <div
          className="w-full max-w-4xl animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <form
            onSubmit={handleSearchSubmit}
            className="relative bg-white/10 backdrop-blur-xl border border-white/20
                       rounded-3xl shadow-2xl shadow-black/30 p-6 md:p-8 space-y-5"
          >
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-12 gap-3 items-center">

              {/* Origin */}
              <div className="md:col-span-4 group relative bg-white/90 backdrop-blur rounded-2xl p-4
                              border border-white/50 focus-within:border-blue-400 focus-within:ring-4
                              focus-within:ring-blue-400/20 transition-all shadow-sm">
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  From
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-extrabold text-base focus:outline-none cursor-pointer"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Swap */}
              <div className="md:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap"
                  className="p-3 rounded-2xl bg-white/90 hover:bg-blue-50 border border-white/50
                             text-slate-600 hover:text-blue-600 shadow-sm transition-all
                             hover:rotate-180 hover:scale-110 active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination */}
              <div className="md:col-span-4 group relative bg-white/90 backdrop-blur rounded-2xl p-4
                              border border-white/50 focus-within:border-indigo-400 focus-within:ring-4
                              focus-within:ring-indigo-400/20 transition-all shadow-sm">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  To
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-extrabold text-base focus:outline-none cursor-pointer"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Date */}
              <div className="md:col-span-3 group relative bg-white/90 backdrop-blur rounded-2xl p-4
                              border border-white/50 focus-within:border-amber-400 focus-within:ring-4
                              focus-within:ring-amber-400/20 transition-all shadow-sm">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Journey Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-extrabold text-sm focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Filters + Submit Row */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/20">

              {/* Female-only filter */}
              <button
                type="button"
                onClick={() => setSoloFemaleOnly(!soloFemaleOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
                  soloFemaleOnly
                    ? 'bg-pink-500/20 border-pink-400/50 text-pink-200 backdrop-blur-sm'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <Shield className={`w-4 h-4 ${soloFemaleOnly ? 'text-pink-300' : 'text-white/60'}`} />
                Solo Female Seats Only
                {soloFemaleOnly && <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />}
              </button>

              {/* Bus class filter */}
              <div className="flex items-center gap-2 text-xs bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2 rounded-2xl text-white/80">
                <Filter className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/70 font-semibold">Bus Class:</span>
                <select
                  value={busTypeFilter}
                  onChange={(e) => setBusTypeFilter(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="text-slate-900">All Classes</option>
                  <option value="Lanka Ashok Leyland" className="text-slate-900">Ashok Leyland 57</option>
                  <option value="AC Sleeper" className="text-slate-900">AC Sleeper</option>
                  <option value="Luxury Volvo Multi-Axle" className="text-slate-900">Volvo Multi-Axle</option>
                  <option value="Double Decker Sleeper" className="text-slate-900">Double Decker</option>
                </select>
              </div>

              {/* Search CTA */}
              <button
                type="submit"
                className="w-full md:w-auto flex items-center justify-center gap-2.5
                           px-10 py-3.5 rounded-2xl font-extrabold text-sm text-white
                           bg-gradient-to-r from-blue-500 to-indigo-600
                           hover:from-blue-400 hover:to-indigo-500
                           shadow-xl shadow-blue-700/40
                           transform hover:scale-[1.03] active:scale-95
                           transition-all duration-200 cursor-pointer"
              >
                <Search className="w-4.5 h-4.5" />
                Search Buses
              </button>
            </div>
          </form>
        </div>

        {/* ── Scroll hint ──────────────────────────────────────────────── */}
        <div className="animate-bounce opacity-60 mt-2">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>

      </div>
    </div>
  );
};
