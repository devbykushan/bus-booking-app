import React from 'react';
import { Bus, ShieldCheck, Heart, Lock, PhoneCall, QrCode } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 text-slate-400 text-sm mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">OmniBus Platform</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Next-generation bus seat booking platform featuring real-time seat lock concurrency, live GPS bus tracking, and instant QR boarding pass validation.
          </p>
          <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold bg-pink-950/40 border border-pink-500/30 p-2 rounded-lg">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
            <span>100% Female Traveler Safety Guarantee</span>
          </div>
        </div>

        {/* Popular Routes */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Popular Bus Routes</h4>
          <ul className="space-y-2 text-xs">
            <li className="hover:text-teal-300 transition-colors cursor-pointer">New York → Boston (AC Sleeper)</li>
            <li className="hover:text-teal-300 transition-colors cursor-pointer">Los Angeles → San Francisco (Volvo)</li>
            <li className="hover:text-teal-300 transition-colors cursor-pointer">Chicago → Detroit (Double Decker)</li>
            <li className="hover:text-teal-300 transition-colors cursor-pointer">London → Manchester (Express)</li>
          </ul>
        </div>

        {/* Features & USPs */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Platform Highlights</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-teal-400" /> Redis Concurrency Hold (8m)</li>
            <li className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-indigo-400" /> Smart QR Boarding Pass</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> Women-Friendly Reserved Seats</li>
            <li className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-amber-400" /> 24/7 Conductor Helpline</li>
          </ul>
        </div>

        {/* Security & Payment Badges */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Secure Checkout</h4>
          <p className="text-xs text-slate-400 mb-3">
            Protected by 256-bit SSL encryption. ACID compliant PostgreSQL transactions prevent double booking.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">VISA</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">MasterCard</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">UPI / Wallet</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">Stripe</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 border-t border-slate-900 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 OmniBus Inc. All rights reserved. Powered by React & Tailwind.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
          <a href="#" className="hover:text-slate-300">Operator Portal</a>
        </div>
      </div>
    </footer>
  );
};
