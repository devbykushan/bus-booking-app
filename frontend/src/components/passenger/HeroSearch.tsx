import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { MapPin, Calendar, ArrowRightLeft, Search, Shield, Filter } from 'lucide-react';

const CITIES = ['Monaragala', 'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Anuradhapura', 'Badulla', 'Wellawaya', 'Ratnapura', 'Matara'];

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
      {/* Subtle top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent -z-10 pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-4 px-4">
        <div className="flex justify-center">
          <img
            src="/dewmina-logo.png"
            alt="Dewmina Super Line"
            className="h-20 md:h-24 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-800 leading-tight">
          Book Your Bus Seats in <span className="text-blue-600">Real Time</span>
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
          Interactive seat maps, instant 8-minute seat lock, live GPS bus tracking, and women-friendly seat reservations across Sri Lanka.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="max-w-5xl mx-auto px-4">
        <form onSubmit={handleSearchSubmit} className="bg-white p-4 md:p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Origin City */}
            <div className="md:col-span-4 relative bg-slate-50 rounded-xl p-3 border border-slate-200 focus-within:border-blue-400 transition-all">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                From City
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-transparent text-slate-800 font-semibold text-sm focus:outline-none cursor-pointer"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 border border-slate-200 shadow-sm transition-all hover:rotate-180"
                title="Swap Locations"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination City */}
            <div className="md:col-span-4 relative bg-slate-50 rounded-xl p-3 border border-slate-200 focus-within:border-blue-400 transition-all">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                To City
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent text-slate-800 font-semibold text-sm focus:outline-none cursor-pointer"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Departure Date */}
            <div className="md:col-span-3 relative bg-slate-50 rounded-xl p-3 border border-slate-200 focus-within:border-blue-400 transition-all">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Journey Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-slate-800 font-semibold text-sm focus:outline-none cursor-pointer"
              />
            </div>

          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            
            {/* Solo Female Filter */}
            <button
              type="button"
              onClick={() => setSoloFemaleOnly(!soloFemaleOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                soloFemaleOnly 
                  ? 'bg-pink-50 border-pink-300 text-pink-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className={`w-4 h-4 ${soloFemaleOnly ? 'text-pink-500' : ''}`} />
              <span>Solo Female Seats Only</span>
              {soloFemaleOnly && <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />}
            </button>

            {/* Bus Type Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Bus Type:</span>
              <select
                value={busTypeFilter}
                onChange={(e) => setBusTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Bus Classes</option>
                <option value="AC Sleeper">AC Sleeper</option>
                <option value="Luxury Volvo Multi-Axle">Volvo Multi-Axle</option>
                <option value="Double Decker Sleeper">Double Decker</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
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
