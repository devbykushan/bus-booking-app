import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { MapPin, Calendar, ArrowRightLeft, Search, Shield, Filter, Sparkles } from 'lucide-react';

const CITIES = ['New York, NY', 'Boston, MA', 'Los Angeles, CA', 'San Francisco, CA', 'Chicago, IL', 'Detroit, MI'];

export const HeroSearch: React.FC = () => {
  const { 
    searchOrigin, 
    searchDestination, 
    searchDate, 
    soloFemaleOnly,
    busTypeFilter,
    setSearchCriteria, 
    setSoloFemaleOnly,
    setBusTypeFilter 
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
    <div className="relative pt-6 pb-10">
      {/* Background ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-pink-500/10 blur-3xl -z-10 rounded-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Real-Time Concurrency & Dynamic 2D Seat Layout</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Book Your Bus Seats in <span className="bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">Real Time</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Interactive seat maps, instant 8-minute Redis seat lock, live GPS bus tracking, and women-friendly seat reservations.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="max-w-5xl mx-auto px-4">
        <form onSubmit={handleSearchSubmit} className="glass-panel p-4 md:p-6 rounded-2xl shadow-2xl space-y-4 border border-slate-700/80">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Origin City */}
            <div className="md:col-span-4 relative bg-slate-900/90 rounded-xl p-3 border border-slate-800 focus-within:border-teal-500 transition-all">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                From City
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
              >
                {CITIES.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white border border-slate-700 shadow-md transition-all transform hover:rotate-180"
                title="Swap Locations"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination City */}
            <div className="md:col-span-4 relative bg-slate-900/90 rounded-xl p-3 border border-slate-800 focus-within:border-teal-500 transition-all">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                To City
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
              >
                {CITIES.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>
            </div>

            {/* Departure Date */}
            <div className="md:col-span-3 relative bg-slate-900/90 rounded-xl p-3 border border-slate-800 focus-within:border-teal-500 transition-all">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Journey Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
              />
            </div>

          </div>

          {/* Filters & Special Features Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            
            {/* Solo Female Traveler Filter Badge */}
            <button
              type="button"
              onClick={() => setSoloFemaleOnly(!soloFemaleOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                soloFemaleOnly 
                  ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-md shadow-pink-500/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className={`w-4 h-4 ${soloFemaleOnly ? 'text-pink-400 fill-pink-400/30' : ''}`} />
              <span>Solo Female Seats Only</span>
              {soloFemaleOnly && <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />}
            </button>

            {/* Bus Type Category Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Bus Type:</span>
              <select
                value={busTypeFilter}
                onChange={(e) => setBusTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Bus Classes</option>
                <option value="AC Sleeper">AC Sleeper</option>
                <option value="Luxury Volvo Multi-Axle">Volvo Multi-Axle</option>
                <option value="Double Decker Sleeper">Double Decker</option>
              </select>
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Search Available Buses</span>
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};
