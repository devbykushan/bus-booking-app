import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { 
  Wrench, 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  SlidersHorizontal,
  Sparkles,
  Cpu
} from 'lucide-react';

export const MasterManagementDashboard: React.FC = () => {
  const { currentUser, userRole, setCurrentView } = useBookingStore();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin' || userRole === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 px-6 py-10 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-xl text-center space-y-5 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-center mx-auto text-red-600 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Master Management Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Access to Master Management is exclusively reserved for authorized administrators and fleet directors.
          </p>
        </div>
        <button
          onClick={() => setCurrentView('passenger-search')}
          className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in-up">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Master Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                {isSuperAdmin ? 'SUPER ADMIN CONSOLE' : 'ADMIN CONSOLE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dedicated Executive Master Control Dashboard
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('admin-panel')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch to Admin Dashboard</span>
        </button>
      </div>

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 sm:p-8 text-white shadow-xl border border-amber-500/20">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" />
            Master System Hub
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            🛠️ Master Management Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            මෙම Dashboard එක සාර්ථකව සකස් කරන ලදී. මෙහි ඇතුළත් විය යුතු Master Tools සහ Settings මොනවාදැයි දැන් ඔබට තීරණය කළ හැක.
          </p>
        </div>
      </div>

      {/* Waiting / Modular Ready Workspace */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Ready to Add Controls & Modules
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            ඔබට මෙම Master Management Dashboard එකට එකතු කිරීමට අවශ්‍ය modules සහ buttons සඳහන් කරන්න. ඒ අනුව අපි මෙහි සියලුම කොටස් නිර්මාණය කරමු.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-amber-500" /> Modular Layout Ready
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Bottom Bar Connected
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Role Protected
          </span>
        </div>
      </div>
    </div>
  );
};
