import React, { useState } from 'react';
import type { BusRoute } from '../../types/booking';
import { useBookingStore } from '../../store/bookingStore';
import { 
  Star, Clock, ChevronRight, Info, AlertTriangle, 
  CheckCircle2, MapPin, Edit3
} from 'lucide-react';
import { RouteDetailsModal } from './RouteDetailsModal';
import { RouteTimetableModal } from './RouteTimetableModal';
import { RouteDetailsTimetableEditorModal } from '../admin/RouteDetailsTimetableEditorModal';

interface BusCardProps {
  route: BusRoute;
  isSelected?: boolean;
  onFocusRoute?: (route: BusRoute) => void;
}

export const BusCard: React.FC<BusCardProps> = ({ route, isSelected, onFocusRoute }) => {
  const { setSelectedRoute, setCurrentView, searchDate, userRole, currentUser } = useBookingStore();
  const isAdmin = userRole === 'admin' || currentUser?.role === 'admin';

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);

  const handleSelectSeats = () => {
    setSelectedRoute(route);
    setCurrentView('seat-selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to determine if journey is an overnight / midnight journey
  const isMidnightJourney = (() => {
    const dep = route.departureTime.toLowerCase();
    const arr = route.arrivalTime.toLowerCase();
    return (dep.includes('pm') && arr.includes('am')) || route.busNumber.toLowerCase().includes('night') || route.busType.toLowerCase().includes('sleeper');
  })();

  // Format date display
  const departureDateObj = searchDate ? new Date(searchDate) : new Date();
  const depDateString = departureDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const nextDayDateObj = new Date(departureDateObj);
  nextDayDateObj.setDate(nextDayDateObj.getDate() + 1);
  const arrDateString = nextDayDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const formattedPrice = Number(route.priceStarting || 1800).toLocaleString();

  return (
    <>
      <div 
        onClick={() => onFocusRoute && onFocusRoute(route)}
        className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative shadow-sm hover:shadow-md cursor-pointer group/card ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20' : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* ── Top Header Row ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="text-blue-600">{route.origin}</span>
              <span className="text-slate-400 font-normal">→</span>
              <span className="text-indigo-600">{route.destination}</span>
            </h3>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {route.operatorName}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              {(route.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Certified</span>
            </span>

            <div className="flex items-center gap-1 text-slate-700 text-xs font-bold font-mono">
              <span>{route.operatorRating ? Number(route.operatorRating).toFixed(1) : '4.9'}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        {/* ── Timing & Route Center Body ─────────────────────────────────── */}
        <div className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          {/* Departure (From) Column */}
          <div className="space-y-1">
            <p className="text-2xl font-black text-blue-600 font-mono tracking-tight flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-from-beacon absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {route.departureTime}
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-extrabold uppercase tracking-wider">
              <MapPin className="w-2.5 h-2.5 animate-from-icon text-blue-600" />
              DEPARTURE
            </span>
            <p className="text-sm font-bold text-slate-800 pt-0.5">
              {route.origin}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {depDateString}
            </p>
          </div>

          {/* Route Arrow with Duration in Middle */}
          <div className="flex flex-col items-center justify-center w-full sm:w-auto px-2">
            <div className="flex items-center gap-2 w-full justify-center">
              <div className="h-[2px] w-12 sm:w-16 bg-slate-200 relative overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-route-flow opacity-75" />
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold font-mono flex-shrink-0 shadow-xs flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                {route.duration || '6h 00m'}
              </span>
              <div className="h-[2px] w-12 sm:w-16 bg-slate-200 relative flex items-center justify-end overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-route-flow opacity-75" />
                <ChevronRight className="w-4 h-4 text-indigo-600 -mr-2 animate-bounce-horizontal relative z-10" />
              </div>
            </div>
          </div>

          {/* Arrival (To) Column */}
          <div className="space-y-1 sm:text-left">
            <p className="text-2xl font-black text-indigo-600 font-mono tracking-tight flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-to-beacon absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              {route.arrivalTime}
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-extrabold uppercase tracking-wider">
              <MapPin className="w-2.5 h-2.5 animate-to-icon text-indigo-600" />
              ARRIVAL
            </span>
            <p className="text-sm font-bold text-slate-800 pt-0.5">
              {route.destination}
            </p>
            <div className="text-xs font-mono">
              {isMidnightJourney ? (
                <span className="text-rose-600 font-bold">
                  +1 Day <span className="text-slate-400 font-normal">{arrDateString}</span>
                </span>
              ) : (
                <span className="text-slate-400">{depDateString}</span>
              )}
            </div>
          </div>

          {/* Prominent Price Tag */}
          <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
            <div className="inline-block px-4 py-2 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-left sm:text-right">
              <span className="text-2xl md:text-3xl font-black text-indigo-700 font-mono tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-xs font-bold text-indigo-600 ml-1.5 font-mono uppercase">
                LKR
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">per passenger seat</p>
            </div>
          </div>

        </div>

        {/* ── Midnight Journey Warning Banner ────────────────────────────── */}
        {isMidnightJourney && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2 mb-4 animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>
              <strong className="font-bold">Midnight Journey</strong> — This journey starts before midnight and continues into the next day. Please plan accordingly.
            </span>
          </div>
        )}

        {/* ── Bottom Action Row ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTimetableModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Timetable</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditorModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition-colors shadow-xs"
                title="Edit Route Details & Timetable"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectSeats();
            }}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all transform hover:scale-105 active:scale-95"
          >
            <span>Book Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <RouteDetailsModal
          route={route}
          onClose={() => setShowDetailsModal(false)}
          onBookNow={handleSelectSeats}
          onEdit={() => setShowEditorModal(true)}
        />
      )}

      {/* Timetable Modal */}
      {showTimetableModal && (
        <RouteTimetableModal
          route={route}
          onClose={() => setShowTimetableModal(false)}
          onBookNow={handleSelectSeats}
          onEdit={() => setShowEditorModal(true)}
        />
      )}

      {/* Admin Route & Timetable Editor Modal */}
      {showEditorModal && (
        <RouteDetailsTimetableEditorModal
          route={route}
          onClose={() => setShowEditorModal(false)}
        />
      )}
    </>
  );
};
