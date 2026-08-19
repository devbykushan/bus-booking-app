import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Bus, MapPin, Ticket, Clock } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    userRole, 
    setUserRole, 
    lockActive, 
    lockExpirySeconds,
    selectedSeatIds 
  } = useBookingStore();

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <nav className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentView('passenger-search')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Real Company Logo */}
          <img
            src="/dewmina-logo.png"
            alt="Dewmina Super Line Logo"
            className="h-12 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-lg"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-300 via-blue-100 to-white bg-clip-text text-transparent">
                Dewmina Super Line
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic">Beyond the Journey: The Journey of Faith</p>
          </div>
        </div>

        {/* Real-time Concurrency Seat Hold Bar if active */}
        {lockActive && selectedSeatIds.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Seats Locked ({selectedSeatIds.join(', ')}):</span>
            <span className="font-mono font-bold text-amber-200">{formatTimer(lockExpirySeconds)}</span>
          </div>
        )}

        {/* Navigation Links & Role Selector */}
        <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          
          {/* Passenger Links */}
          <button
            onClick={() => setCurrentView('passenger-search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'passenger-search' || currentView === 'seat-selection'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Find Buses</span>
          </button>

          <button
            onClick={() => setCurrentView('live-tracking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'live-tracking'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-400 animate-bounce" />
            <span>Live GPS Tracker</span>
          </button>

          <button
            onClick={() => setCurrentView('my-bookings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'my-bookings'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Tickets</span>
          </button>

          {/* Role Mode Switcher Pill */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => { setUserRole('passenger'); setCurrentView('passenger-search'); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                userRole === 'passenger' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passenger
            </button>
            <button
              onClick={() => { setUserRole('operator'); setCurrentView('operator-panel'); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                userRole === 'operator' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                userRole === 'admin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>

        </div>

      </div>
    </nav>
  );
};
