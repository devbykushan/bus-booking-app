import React from 'react';
import { ShieldCheck, Heart, Lock, PhoneCall, QrCode } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 text-sm mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <img
              src="/dewmina-logo.png"
              alt="Dewmina Super Line"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">Dewmina Super Line</p>
            <p className="text-xs text-blue-600 italic mb-2">Beyond the Journey: The Journey of Faith</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sri Lanka's trusted bus booking platform featuring real-time seat lock concurrency, live GPS bus tracking, and instant QR boarding pass validation.
          </p>
          <div className="flex items-center gap-2 text-pink-600 text-xs font-semibold bg-pink-50 border border-pink-200 p-2 rounded-lg">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            <span>100% Female Traveler Safety Guarantee</span>
          </div>
        </div>

        {/* Popular Routes */}
        <div>
          <h4 className="text-slate-800 font-semibold text-sm mb-3">Popular Bus Routes</h4>
          <ul className="space-y-2 text-xs">
            <li className="hover:text-blue-600 transition-colors cursor-pointer">Monaragala → Colombo (Dewmina Express)</li>
            <li className="hover:text-blue-600 transition-colors cursor-pointer">Colombo → Monaragala (Night Super)</li>
            <li className="hover:text-blue-600 transition-colors cursor-pointer">Monaragala → Kandy (Air Bus)</li>
            <li className="hover:text-blue-600 transition-colors cursor-pointer">Wellawaya → Colombo (Highway)</li>
          </ul>
        </div>

        {/* Features & USPs */}
        <div>
          <h4 className="text-slate-800 font-semibold text-sm mb-3">Platform Highlights</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-500" /> Seat Lock Concurrency (8m)</li>
            <li className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-indigo-500" /> Smart QR Boarding Pass</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-pink-500" /> Women-Friendly Reserved Seats</li>
            <li className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-amber-500" /> 24/7 Conductor Helpline</li>
          </ul>
        </div>

        {/* Security & Payment Badges */}
        <div>
          <h4 className="text-slate-800 font-semibold text-sm mb-3">Secure Checkout</h4>
          <p className="text-xs text-slate-500 mb-3">
            Protected by 256-bit SSL encryption. ACID compliant database transactions prevent double booking.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-600">
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">VISA</span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">MasterCard</span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">LKR Cash</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 Dewmina Super Line. All rights reserved. | 📞 0711433520 | ✉️ dewminasuperline@gmail.com</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-600">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600">Terms of Service</a>
          <a href="#" className="hover:text-slate-600">Operator Portal</a>
        </div>
      </div>
    </footer>
  );
};
