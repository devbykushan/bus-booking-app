import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { AuthModal } from './AuthModal';
import { Bus, MapPin, Ticket, Clock, ShieldCheck, User, LogOut, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser,
    userRole, 
    setUserRole, 
    logout,
    lockActive, 
    lockExpirySeconds,
    selectedSeatIds 
  } = useBookingStore();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setCurrentView('passenger-search')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/dewmina-logo.png"
              alt="Dewmina Super Line Logo"
              className="h-14 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Real-time Seat Hold Bar if active */}
          {lockActive && selectedSeatIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium animate-pulse">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Seats Locked ({selectedSeatIds.join(', ')}):</span>
              <span className="font-mono font-bold text-amber-600">{formatTimer(lockExpirySeconds)}</span>
            </div>
          )}

          {/* Navigation Links & User Authentication */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm font-medium">
            
            <button
              onClick={() => setCurrentView('passenger-search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'passenger-search' || currentView === 'seat-selection'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Find Buses</span>
            </button>

            <button
              onClick={() => setCurrentView('live-tracking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'live-tracking'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Live GPS Tracker</span>
            </button>

            <button
              onClick={() => setCurrentView('my-bookings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'my-bookings'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>My Tickets</span>
            </button>

            {/* Admin Portal Tab (Available when logged in as admin or role set to admin) */}
            {(userRole === 'admin' || currentUser?.role === 'admin') && (
              <button
                onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  currentView === 'admin-panel'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin & Fleet Portal</span>
              </button>
            )}

            {/* User Account Login / Profile Status */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl text-xs">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 truncate max-w-[120px]">{currentUser.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                    currentUser.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Admin Login</span>
              </button>
            )}

          </div>

        </div>
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
