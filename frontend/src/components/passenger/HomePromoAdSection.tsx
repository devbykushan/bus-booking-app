import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { 
  Tag, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Flame
} from 'lucide-react';

export const HomePromoAdSection: React.FC = () => {
  const { goToSearchSchedules } = useBookingStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promoDeals = [
    {
      id: 'deal-1',
      code: 'SUPERLINE15',
      discount: '15% OFF',
      title: 'Monaragala ↔ Colombo Expressway Deal',
      desc: 'Valid on all Southern Expressway & E01 Super Luxury night & morning coaches.',
      badge: 'HOT DEAL',
      badgeColor: 'bg-red-500 text-white',
      gradient: 'from-blue-600 via-indigo-600 to-violet-700',
      bgGlow: 'bg-blue-500/20',
      expiry: 'Expires in 3 days',
    },
    {
      id: 'deal-2',
      code: 'WEEKEND20',
      discount: '20% OFF',
      title: 'Weekend Escape to Kandy & Galle',
      desc: 'Special rate for round-trip reservations made 48 hours in advance.',
      badge: 'LIMITED TIME',
      badgeColor: 'bg-amber-500 text-slate-950',
      gradient: 'from-indigo-600 via-purple-600 to-pink-600',
      bgGlow: 'bg-indigo-500/20',
      expiry: 'Valid Friday – Sunday',
    },
    {
      id: 'deal-3',
      code: 'EARLYBIRD',
      discount: 'LKR 300 OFF',
      title: 'Early Bird Morning Commuter Pass',
      desc: 'Flat instant discount on departures between 05:00 AM and 08:30 AM.',
      badge: 'POPULAR',
      badgeColor: 'bg-emerald-500 text-white',
      gradient: 'from-slate-900 via-blue-900 to-indigo-950',
      bgGlow: 'bg-emerald-500/20',
      expiry: 'Daily 05:00 – 08:30',
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 select-none">
      {/* ── Main Ad Banner Container ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border border-slate-800 p-6 sm:p-10 shadow-2xl text-white">
        
        {/* Glow ambient background orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 animate-gradient-flow" />

        <div className="relative z-10 space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-[11px] font-black tracking-wider uppercase shadow-md shadow-blue-500/20">
                  <Flame className="w-3.5 h-3.5 animate-bounce" />
                  About Dewmina Super Line
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-300 font-semibold bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-400/20">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Book Premium Seats Online
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                About Dewmina Super Line, Book Premium Seats
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Sri Lanka’s premier express bus platform. Reserve your guaranteed seat on luxury Ashok Leyland 54 & Yutong coaches, apply instant discount vouchers, and enjoy seamless expressway travel.
              </p>
            </div>

            <button
              onClick={goToSearchSchedules}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer self-start md:self-auto flex-shrink-0"
            >
              <span>Book Premium Seats</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Promotional Deal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {promoDeals.map((deal) => {
              const isCopied = copiedCode === deal.code;
              return (
                <div
                  key={deal.id}
                  className="relative group rounded-2xl p-5 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/90 hover:border-blue-500/60 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Glow Highlight */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${deal.bgGlow} rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${deal.badgeColor} shadow-sm`}>
                        {deal.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {deal.expiry}
                      </span>
                    </div>

                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 font-mono">
                        {deal.discount}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1 group-hover:text-blue-300 transition-colors">
                        {deal.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {deal.desc}
                      </p>
                    </div>
                  </div>

                  {/* Voucher Code Copy Box */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2 bg-slate-950/80 border border-dashed border-slate-700/80 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-amber-300 tracking-wider">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>{deal.code}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(deal.code)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-white/30'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 animate-pop-check" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Ad Feature Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">100% Guaranteed Seats</p>
                <p className="text-[11px] text-slate-500">Live seat lock during checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Instant E-Tickets & SMS</p>
                <p className="text-[11px] text-slate-500">Instant QR pass sent on booking</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Southern Expressway (E01)</p>
                <p className="text-[11px] text-slate-500">Fastest direct transit corridor</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
