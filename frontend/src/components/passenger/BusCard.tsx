import React, { useState, useMemo } from 'react';
import type { BusRoute } from '../../types/booking';
import { useBookingStore } from '../../store/bookingStore';
import { 
  Star, Clock, ChevronRight, Info, AlertTriangle, 
  CheckCircle2, MapPin, Edit3, Bus, Calendar
} from 'lucide-react';
import { RouteDetailsModal } from './RouteDetailsModal';
import { RouteTimetableModal } from './RouteTimetableModal';
import { RouteDetailsTimetableEditorModal } from '../admin/RouteDetailsTimetableEditorModal';

interface BusCardProps {
  route: BusRoute;
  isSelected?: boolean;
  onFocusRoute?: (route: BusRoute) => void;
}

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridian = match[3]?.toLowerCase();

  if (meridian === 'pm' && hours < 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const BusCard: React.FC<BusCardProps> = ({ route, isSelected, onFocusRoute }) => {
  const { 
    setSelectedRoute, setCurrentView, searchDate, setSearchCriteria,
    routes, userRole, currentUser, setShowAuthModal, language, t 
  } = useBookingStore();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);

  // Time & Departure calculations
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  const effectiveDate = searchDate || route.departureDate || todayStr;
  const isDeparted = useMemo(() => {
    if (effectiveDate < todayStr) return true;
    if (effectiveDate === todayStr) {
      return parseTimeToMinutes(route.departureTime) <= currentMinutes;
    }
    return false;
  }, [effectiveDate, todayStr, route.departureTime, currentMinutes]);

  // Smart Next Available Trip Finder
  const nextTripInfo = useMemo(() => {
    if (!isDeparted) return null;

    const candidateTrips = (routes || []).filter((r) => {
      const rDate = r.departureDate || todayStr;
      if (rDate < todayStr) return false;
      if (rDate === todayStr) {
        return parseTimeToMinutes(r.departureTime) > currentMinutes;
      }
      return true;
    });

    // Priority 1: Same bus on same route on future date
    const sameBusNext = candidateTrips
      .filter((r) =>
        r.busNumber === route.busNumber &&
        r.origin?.toLowerCase() === route.origin?.toLowerCase() &&
        r.destination?.toLowerCase() === route.destination?.toLowerCase()
      )
      .sort((a, b) => {
        const dDiff = (a.departureDate || todayStr).localeCompare(b.departureDate || todayStr);
        if (dDiff !== 0) return dDiff;
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      })[0];

    if (sameBusNext) {
      return {
        route: sameBusNext,
        isSameBus: true,
        isTomorrow: (sameBusNext.departureDate || '') === tomorrowStr,
      };
    }

    // Priority 2: Same route (alternate bus) if current bus has off-day/turn
    const sameRouteNext = candidateTrips
      .filter((r) =>
        r.origin?.toLowerCase() === route.origin?.toLowerCase() &&
        r.destination?.toLowerCase() === route.destination?.toLowerCase()
      )
      .sort((a, b) => {
        const dDiff = (a.departureDate || todayStr).localeCompare(b.departureDate || todayStr);
        if (dDiff !== 0) return dDiff;
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      })[0];

    if (sameRouteNext) {
      return {
        route: sameRouteNext,
        isSameBus: false,
        isTomorrow: (sameRouteNext.departureDate || '') === tomorrowStr,
      };
    }

    return null;
  }, [isDeparted, routes, route, todayStr, tomorrowStr, currentMinutes]);

  const handleSelectSeats = () => {
    setSelectedRoute(route);
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setCurrentView('seat-selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookNextTrip = (targetRoute: BusRoute) => {
    const targetDate = targetRoute.departureDate || tomorrowStr;
    setSearchCriteria(targetRoute.origin, targetRoute.destination, targetDate);
    setSelectedRoute(targetRoute);
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
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
  const dateLocale = language === 'sinhala' ? 'si-LK' : language === 'tamil' ? 'ta-LK' : 'en-US';
  const departureDateObj = searchDate ? new Date(searchDate) : new Date();
  const depDateString = departureDateObj.toLocaleDateString(dateLocale, {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const nextDayDateObj = new Date(departureDateObj);
  nextDayDateObj.setDate(nextDayDateObj.getDate() + 1);
  const arrDateString = nextDayDateObj.toLocaleDateString(dateLocale, {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const nextTripFormattedDate = useMemo(() => {
    if (!nextTripInfo?.route.departureDate) return '';
    const dObj = new Date(nextTripInfo.route.departureDate);
    return dObj.toLocaleDateString(dateLocale, {
      weekday: 'short',
      month: '2-digit',
      day: '2-digit',
    });
  }, [nextTripInfo, dateLocale]);

  const isNormalBus = route.busType?.includes('Normal') || route.busType?.includes('3*2') || route.busType?.includes('Leyland');
  const isLuxuryBus = route.busType?.includes('Super Luxury') || route.busType?.includes('Luxury');
  const validatedPriceVal = isNormalBus ? 1157 : isLuxuryBus ? 2670 : (route.priceStarting || 1157);
  const formattedPrice = Number(validatedPriceVal).toLocaleString();

  return (
    <>
      <div 
        onClick={() => onFocusRoute && onFocusRoute(route)}
        className={`bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all duration-300 relative shadow-sm hover:shadow-md cursor-pointer group/card ${
          isSelected
            ? 'border-blue-500 shadow-blue-500/20 ring-4 ring-blue-500/10'
            : isDeparted
            ? 'border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/60'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50'
        }`}
      >
        {/* ── Top Header Row ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5 sm:pb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="text-blue-600 dark:text-blue-400">{t(route.origin)}</span>
              <span className="text-slate-400 font-normal">→</span>
              <span className="text-indigo-600 dark:text-indigo-400">{t(route.destination)}</span>
            </h3>
            <span className="text-xs text-slate-300 dark:text-slate-600 hidden xs:inline">•</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[120px] sm:max-w-none">
              {route.operatorName}
            </span>
            {route.busNumber && (
              <>
                <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-700/60 text-[11px] font-bold font-mono shadow-xs">
                  <Bus className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>{route.busNumber}</span>
                </span>
              </>
            )}
            <span className="text-xs text-slate-300 dark:text-slate-600 hidden md:inline">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
              {(route.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isDeparted ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-700 text-[10px] sm:text-xs font-extrabold">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{t('departed')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="hidden xs:inline">{t('certified')}</span>
              </span>
            )}

            <div className="flex items-center gap-0.5 sm:gap-1 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-bold font-mono bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-600/60">
              <span>{route.operatorRating ? Number(route.operatorRating).toFixed(1) : '4.9'}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        {/* ── Timing & Route Center Body (Compact Horizontal Layout) ─────── */}
        <div className="py-3 sm:py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          
          {/* Departure (From) Column */}
          <div className="space-y-0.5 min-w-0">
            <p className={`text-lg sm:text-2xl font-black font-mono tracking-tight flex items-center gap-1 sm:gap-1.5 ${
              isDeparted ? 'text-slate-500 dark:text-slate-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 flex-shrink-0">
                {!isDeparted && (
                  <span className="animate-from-beacon absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${isDeparted ? 'bg-slate-400' : 'bg-blue-500'}`}></span>
              </span>
              <span className="truncate">{route.departureTime}</span>
            </p>
            <div className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${
                isDeparted 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600' 
                  : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
              }`}>
                <MapPin className={`w-2 h-2 ${isDeparted ? 'text-slate-500' : 'animate-from-icon text-blue-600 dark:text-blue-400'}`} />
                <span>{t('departure')}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {t(route.origin)}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">
              {depDateString}
            </p>
          </div>

          {/* Route Arrow with Duration in Middle */}
          <div className="flex flex-col items-center justify-center px-1 sm:px-2">
            <div className="flex items-center gap-1 sm:gap-2 w-full justify-center">
              <div className="h-[2px] w-6 sm:w-14 bg-slate-200 dark:bg-slate-700 relative overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-route-flow opacity-75" />
              </div>
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs font-bold font-mono flex-shrink-0 shadow-xs flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                <span>{route.duration || '6h 00m'}</span>
              </span>
              <div className="h-[2px] w-6 sm:w-14 bg-slate-200 dark:bg-slate-700 relative flex items-center justify-end overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-route-flow opacity-75" />
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 -mr-1.5 sm:-mr-2 animate-bounce-horizontal relative z-10" />
              </div>
            </div>
          </div>

          {/* Arrival (To) Column */}
          <div className="space-y-0.5 text-right min-w-0">
            <p className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight flex items-center justify-end gap-1 sm:gap-1.5">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 flex-shrink-0">
                <span className="animate-to-beacon absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
              </span>
              <span className="truncate">{route.arrivalTime}</span>
            </p>
            <div className="flex items-center justify-end gap-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider">
                <MapPin className="w-2 h-2 animate-to-icon text-indigo-600 dark:text-indigo-400" />
                <span>{t('arrival')}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {t(route.destination)}
            </p>
            <div className="text-[10px] sm:text-xs font-mono truncate">
              {isMidnightJourney ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  +1 Day <span className="text-slate-400 font-normal">{arrDateString}</span>
                </span>
              ) : (
                <span className="text-slate-400">{depDateString}</span>
              )}
            </div>
          </div>

        </div>

        {/* ── Departed Notice Banner ─────────────────────────────────────── */}
        {isDeparted && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-[11px] sm:text-xs font-medium flex items-center justify-between gap-2 mb-3 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
              <span>
                <strong className="font-bold">{t('departedToday')}</strong> ({route.departureTime}) — {t('tripDepartedNotice')}
              </span>
            </div>
            {nextTripInfo && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                {nextTripInfo.isSameBus ? route.busNumber : t('nextTrip')}
              </span>
            )}
          </div>
        )}

        {/* ── Midnight Journey Warning Banner ────────────────────────────── */}
        {isMidnightJourney && (
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 mb-3 animate-fade-in">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
            <span>
              <strong className="font-bold">{t('midnightJourney')}</strong> — This journey starts before midnight and continues into the next day.
            </span>
          </div>
        )}

        {/* ── Bottom Action & Price Row (Compact Integrated Bar) ─────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-700/60">
          
          {/* Price & Fare label */}
          <div className="flex items-baseline gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-300 font-mono uppercase">
                LKR
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden xs:inline">• {t('perPassenger')}</span>
          </div>

          {/* Buttons Group */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsModal(true);
              }}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] sm:text-xs border border-slate-200 dark:border-slate-600 flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{t('details')}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTimetableModal(true);
              }}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] sm:text-xs border border-slate-200 dark:border-slate-600 flex items-center gap-1 transition-colors"
            >
              <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{t('timetable')}</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditorModal(true);
                }}
                className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] sm:text-xs border border-blue-200 dark:border-blue-700 flex items-center gap-1 transition-colors shadow-xs"
                title="Edit Route Details & Timetable"
              >
                <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Action Button: Book Now OR Smart Next Available Trip OR No Upcoming Trips */}
            {!isDeparted ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectSeats();
                }}
                className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-md transition-all transform hover:scale-105 active:scale-95"
              >
                <span>{t('bookNow')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : nextTripInfo ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookNextTrip(nextTripInfo.route);
                }}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95"
                title={nextTripInfo.isSameBus ? `Next available trip for ${route.busNumber}` : `Next trip on this route`}
              >
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>
                  {nextTripInfo.isTomorrow 
                    ? `${t('bookForTomorrow')}` 
                    : `${t('nextTrip')}: ${nextTripFormattedDate}`
                  }
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 font-bold text-[10px] sm:text-xs flex items-center gap-1 cursor-not-allowed border border-slate-200 dark:border-slate-700"
              >
                <AlertTriangle className="w-3 h-3 text-slate-400" />
                <span>{t('noUpcomingTrips')}</span>
              </button>
            )}
          </div>
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
