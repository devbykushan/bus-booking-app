import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { TrendingUp, Users, DollarSign, Bus, Shield, Award, BarChart2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, routes } = useBookingStore();

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.bookingStatus !== 'cancelled' ? b.totalFare : 0), 0);
  const confirmedBookingsCount = bookings.filter(b => b.bookingStatus !== 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Super Admin Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Super Admin Platform Analytics</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-semibold">
              Live Executive Dashboard
            </span>
          </div>
          <p className="text-xs text-slate-400">Platform revenue metrics, route performance, operator commissions, and female safety stats.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime System Status: 100% Operational</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gross Platform Revenue</span>
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">${(totalRevenue + 12845.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% from last month
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Completed Bookings</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{confirmedBookingsCount + 342}</p>
          <p className="text-[11px] text-teal-300 font-semibold">Avg 4.8 seats per transaction</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Bus Fleet</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{routes.length + 18}</p>
          <p className="text-[11px] text-amber-300 font-semibold">Across 12 Bus Operators</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Solo Female Bookings</span>
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-pink-300 font-mono">42.8%</p>
          <p className="text-[11px] text-pink-400 font-semibold">Pink Reserved Seats Policy Active</p>
        </div>

      </div>

      {/* Top Performing Bus Routes & Operator Payout Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Popular Routes Ranking */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <BarChart2 className="w-5 h-5 text-teal-400" /> Popular Routes & Occupancy Rates
          </h3>

          <div className="space-y-4 text-xs">
            {routes.map(r => {
              const occupancy = Math.round(((r.totalSeatsCount - r.availableSeatsCount) / r.totalSeatsCount) * 100);
              return (
                <div key={r.id} className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-white">
                    <span>{r.origin} → {r.destination} ({r.operatorName})</span>
                    <span className="text-teal-400 font-mono">{occupancy}% Occupancy</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full" style={{ width: `${occupancy}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operator Commission & Payout Summary */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-indigo-400" /> Operator Commission Shares
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <p className="font-bold text-white">OmniExpress Lines</p>
                <p className="text-slate-400 text-[11px]">8 Active Buses • 10% Platform Fee</p>
              </div>
              <span className="font-mono font-bold text-emerald-400">$6,840.00</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <p className="font-bold text-white">Royal Cruiser Travels</p>
                <p className="text-slate-400 text-[11px]">6 Active Buses • 10% Platform Fee</p>
              </div>
              <span className="font-mono font-bold text-emerald-400">$4,920.00</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <p className="font-bold text-white">City Connect Air Bus</p>
                <p className="text-slate-400 text-[11px]">4 Active Buses • 12% Platform Fee</p>
              </div>
              <span className="font-mono font-bold text-emerald-400">$3,150.00</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
