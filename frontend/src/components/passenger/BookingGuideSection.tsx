import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { 
  Search, Armchair, CreditCard, QrCode, ArrowRight, 
  CheckCircle2, Zap, Sparkles 
} from 'lucide-react';

export const BookingGuideSection: React.FC = () => {
  const { goToSearchSchedules } = useBookingStore();

  const steps = [
    {
      stepNumber: '01',
      title: 'Search Routes & Timetable',
      description: 'Choose your origin, destination, and departure date. Filter by Luxury AC, Sleeper, or Solo Female friendly coaches.',
      icon: Search,
      badge: 'Step 1: Discover',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
      tag: 'Real-Time Schedules',
    },
    {
      stepNumber: '02',
      title: 'Select Seat with Concurrency Lock',
      description: 'Pick your exact window or aisle seat on our interactive 2D layout. Your selected seat is held securely for 8 minutes.',
      icon: Armchair,
      badge: 'Step 2: Reserve',
      badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      tag: 'Zero Double-Booking',
    },
    {
      stepNumber: '03',
      title: 'Passenger Info & Promos',
      description: 'Enter your passenger contact details, pick your exact pickup & drop landmarks, and apply instant discount voucher codes.',
      icon: CreditCard,
      badge: 'Step 3: Checkout',
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      tag: 'Secure 256-bit SSL',
    },
    {
      stepNumber: '04',
      title: 'Instant QR E-Ticket & GPS Tracking',
      description: 'Get your digital QR boarding pass instantly, receive SMS confirmation, and track your bus live with real-time GPS telemetry.',
      icon: QrCode,
      badge: 'Step 4: Journey',
      badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
      tag: 'Instant QR Verification',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-gradient-to-b from-white via-slate-50/50 to-blue-50/20 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Fast, Effortless & 100% Digital</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            How to Book a Bus Ticket Online on <span className="text-blue-600">Dewmina Super Line</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Reserve your seat in under 2 minutes with Sri Lanka’s most advanced bus booking platform. Follow these four simple steps from search to boarding.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group"
              >
                {/* Step indicator pill */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${step.badgeColor}`}>
                    {step.badge}
                  </span>
                  <span className="font-mono text-2xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                    {step.stepNumber}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50/80 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition-all duration-300 shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{step.tag}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Action Bar - Light Glassmorphism with Smooth Animation */}
        <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-blue-50/90 via-white/85 to-indigo-50/90 border border-white/90 shadow-lg shadow-blue-900/5 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all duration-300 hover:shadow-xl hover:border-blue-200">
          
          {/* Animated Background Light Beam */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-cyan-300/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-tl from-indigo-400/20 to-pink-300/10 rounded-full blur-2xl pointer-events-none animate-pulse" />

          {/* Animated Top Shimmer Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-gradient-flow" />

          <div className="relative z-10 space-y-1.5 text-center sm:text-left">
            <h4 className="text-base font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
              </span>
              <span>Ready to Experience First-Class Travel?</span>
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Browse live schedules between Monaragala, Colombo, Kandy, Galle, and more with instant seat selection.
            </p>
          </div>

          <button
            onClick={goToSearchSchedules}
            className="relative z-10 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0 group"
          >
            <span>Search & Book Buses</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};
