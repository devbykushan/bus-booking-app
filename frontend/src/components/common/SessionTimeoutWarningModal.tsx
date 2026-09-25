import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Clock, ShieldAlert, Sparkles, LogOut } from 'lucide-react';

export const SessionTimeoutWarningModal: React.FC = () => {
  const {
    sessionWarningOpen,
    sessionWarningRemainingSeconds,
    staySignedIn,
    logout,
  } = useBookingStore();

  if (!sessionWarningOpen) return null;

  const minutes = Math.floor(sessionWarningRemainingSeconds / 60);
  const seconds = sessionWarningRemainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, (sessionWarningRemainingSeconds / 120) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-md rounded-[28px] ios-liquid-glass dark:bg-slate-900/95 dark:border-slate-800 p-6 sm:p-7 shadow-2xl border border-white/80 dark:border-slate-700/80 text-center animate-scaleIn">
        
        {/* Pulsating Ambient Warning Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-amber-500/25 dark:bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 shadow-inner">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/10 animate-ping" />
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Security Inactivity Alert</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Still Working?
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
          Your administrator session will expire soon due to inactivity. Click below to keep working.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
          අක්‍රියතාවය නිසා ඔබගේ session එක තව ස්වල්ප වේලාවකින් expire වනු ඇත.
        </p>

        {/* Big Countdown Display */}
        <div className="my-5 p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700">
          <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-wider font-mono">
            {formattedTime}
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-1">
            Time remaining until auto-logout
          </p>

          {/* Linear Progress Bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={staySignedIn}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 transition transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Stay Signed In (දිගටම වැඩ කරන්න)</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Now (දැන්ම Logout වන්න)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
