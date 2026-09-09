import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { 
  Heart, PhoneCall, Bus, Mail, 
  ChevronRight, Navigation, CheckCircle2
} from 'lucide-react';
import { RealisticBusAnimation } from './RealisticBusAnimation';
import { AnimatedLogoBadge } from './AnimatedLogoBadge';

export const Footer: React.FC = () => {
  const { goToSearchSchedules, setSearchCriteria, setCurrentView, currentUser, userRole, setUserRole, setShowAuthModal } = useBookingStore();
  const [currentSocialIndex, setCurrentSocialIndex] = useState<0 | 1>(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSocialIndex((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleRouteClick = (origin: string, dest: string) => {
    setSearchCriteria(origin, dest, new Date().toISOString().split('T')[0]);
    goToSearchSchedules();
  };

  return (
    <footer className="relative bg-gradient-to-b from-slate-50 via-white to-blue-50/40 text-slate-600 text-sm mt-20 overflow-hidden border-t border-slate-200 select-none shadow-inner">
      
      {/* ── High-Clarity Bus Photo Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/footer-bus-bg.jpg"
          alt="Dewmina Super Line Coach Background"
          className="w-full h-full object-cover object-center opacity-75 filter blur-[1.5px] saturate-[0.75] contrast-105 scale-105 transition-all duration-700 animate-ken-burns"
        />
        {/* Subtle daylight gradient overlay to keep text 100% crisp while keeping photo vivid */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/50 to-blue-50/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/20 to-slate-50/20" />

        {/* Ambient Floating Glow Blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-blob-1" />
        <div className="absolute -bottom-20 right-1/3 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-blob-2" />
      </div>

      {/* ── Top Radiant Glowing Shimmer Bar ── */}
      <div className="relative h-[2px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 via-pink-400 to-emerald-400 bg-[length:300%_100%] animate-gradient-flow" />

      {/* ── Subtle Highway Bus Streak Lane Animation ── */}
      <div className="relative w-full h-8 overflow-hidden border-b border-slate-200/60 bg-blue-50/30 backdrop-blur-xs">
        <div className="absolute inset-0 flex items-center">
          {/* Moving Dashed Road Center Line */}
          <div className="w-full flex gap-6 animate-road opacity-30">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="h-0.5 w-8 bg-blue-400 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Gliding Real Luxury Coach Streak */}
        <div className="absolute top-1 left-0 flex items-center animate-bus-streak pointer-events-none opacity-90">
          <RealisticBusAnimation />
        </div>
      </div>

      {/* ── Main Footer Grid Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          
          {/* 1. Brand Column (4.2 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div 
              onClick={goToSearchSchedules}
              className="group cursor-pointer inline-flex items-center gap-3.5"
            >
              <AnimatedLogoBadge size="md" />
              <div>
                <p className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  Dewmina Super Line
                </p>
                <p className="text-xs text-blue-600 font-medium italic">
                  Beyond the Journey: The Journey of Faith
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Sri Lanka’s premier digital passenger transit network. Experience guaranteed seat reservations with real-time locking, contactless QR boarding passes, and precision live GPS fleet telemetry.
            </p>

            {/* Verification & Trust Pills with Hover Scale */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full max-w-fit shadow-xs hover:border-emerald-300 hover:shadow-sm hover:scale-105 transition-all cursor-default">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 animate-pulse" />
                <span>NTC Registered & Highway Route Permit Operator</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-pink-700 bg-pink-50 border border-pink-200 px-3.5 py-1.5 rounded-full max-w-fit shadow-xs hover:border-pink-300 hover:shadow-sm hover:scale-105 transition-all cursor-default">
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500/20 flex-shrink-0 animate-pulse" />
                <span>100% Female Traveler Safety & Dedicated Seating</span>
              </div>
            </div>
          </div>

          {/* 2. Passenger Services (2.8 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-slate-900 font-bold text-sm tracking-wide flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600 animate-pulse" /> Passenger Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {[
                { label: 'Search Bus Schedules & Fares', action: goToSearchSchedules },
                { label: 'Live GPS Coach Tracking (Coming Soon)', action: () => setCurrentView('live-tracking') },
                { label: 'My Tickets & Boarding Passes', action: () => setCurrentView('my-bookings') },
                { label: 'Solo Female Seat Reservation', action: goToSearchSchedules },
                { label: 'Ticket Cancellation & Refunds', action: () => setCurrentView('my-bookings') },
              ].map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={item.action}
                    className="hover:text-blue-600 flex items-center gap-1.5 transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Popular Routes (2.5 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-slate-900 font-bold text-sm tracking-wide flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600 animate-pulse" /> Popular Routes
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {[
                { origin: 'Monaragala', dest: 'Colombo', label: 'Monaragala → Colombo' },
                { origin: 'Colombo', dest: 'Monaragala', label: 'Colombo → Monaragala' },
                { origin: 'Monaragala', dest: 'Kandy', label: 'Monaragala → Kandy' },
                { origin: 'Wellawaya', dest: 'Colombo', label: 'Wellawaya → Colombo' },
                { origin: 'Colombo', dest: 'Galle', label: 'Colombo → Galle' },
              ].map((r, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleRouteClick(r.origin, r.dest)}
                    className="hover:text-blue-600 flex items-center gap-1.5 transition-colors group text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    <span className="truncate">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Support Helpline, Our App & Follow Us (3 Cols) */}
          <div className="lg:col-span-3 space-y-5">
            <div>
              <h4 className="text-slate-900 font-bold text-sm tracking-wide mb-3 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600 animate-pulse" /> 24/7 Conductor Helpline
              </h4>
              <div className="space-y-2">
                <a
                  href="tel:0711433520"
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold font-mono text-slate-900 group-hover:text-emerald-700 transition-colors">071 143 3520</p>
                    <p className="text-[10px] text-slate-500">Main Dispatch Desk (24/7)</p>
                  </div>
                </a>

                <a
                  href="mailto:dewminasuperline@gmail.com"
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 text-slate-800 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">dewminasuperline@gmail.com</p>
                    <p className="text-[10px] text-slate-500">Online Inquiries & Support</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Follow Us Section with Scale & Hover Lift */}
            <div className="space-y-3 pt-1">
              <h5 className="text-slate-900 font-bold text-xs uppercase tracking-wider">FOLLOW US</h5>

              {/* Rotating Featured Social Card (Facebook ⇄ Instagram) */}
              <div 
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="relative"
              >
                {/* Facebook Card */}
                <a
                  href="https://www.facebook.com/share/18G2xVLaQk/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Dewmina Super Line on Facebook"
                  className={`group flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-tr from-blue-50/90 via-sky-50/60 to-indigo-50/60 hover:from-blue-100 hover:via-sky-100 hover:to-indigo-100 border border-blue-200/80 hover:border-blue-300 text-slate-800 transition-all duration-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                    currentSocialIndex === 0 ? 'relative opacity-100 scale-100 pointer-events-auto flex' : 'hidden opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">@dewminasuperline</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Official Facebook Page</p>
                  </div>
                  {/* Indicator Pills */}
                  <div className="flex flex-col gap-1 pr-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-blue-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                </a>

                {/* Instagram Card */}
                <a
                  href="https://www.instagram.com/dewminasuperline?igsi=MXcyOWx6NWU3ZGpqeA==&utm_source=ig_contact_invite"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Dewmina Super Line on Instagram @dewminasuperline"
                  className={`group flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-tr from-pink-50/90 via-purple-50/60 to-amber-50/60 hover:from-pink-100 hover:via-purple-100 hover:to-amber-100 border border-pink-200/80 hover:border-pink-300 text-slate-800 transition-all duration-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                    currentSocialIndex === 1 ? 'relative opacity-100 scale-100 pointer-events-auto flex' : 'hidden opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-pink-600 transition-colors truncate">@dewminasuperline</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Follow photos & videos</p>
                  </div>
                  {/* Indicator Pills */}
                  <div className="flex flex-col gap-1 pr-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-600 ring-2 ring-pink-300" />
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/share/18G2xVLaQk/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Dewmina Super Line on Facebook"
                  className="w-9 h-9 rounded-xl bg-white hover:bg-[#1877F2] text-slate-600 hover:text-white border border-slate-200 hover:border-[#1877F2] flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-xs hover:shadow-md"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/dewminasuperline?igsi=MXcyOWx6NWU3ZGpqeA==&utm_source=ig_contact_invite"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Dewmina Super Line on Instagram"
                  className="w-9 h-9 rounded-xl bg-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-slate-600 hover:text-white border border-slate-200 hover:border-pink-500 flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-xs hover:shadow-md"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* Single WhatsApp Icon with 2-Number Popover */}
                <div className="relative group">
                  <button
                    type="button"
                    aria-label="Chat on WhatsApp with Dewmina Super Line"
                    className="w-9 h-9 rounded-xl bg-white hover:bg-[#25D366] text-slate-600 hover:text-white border border-slate-200 hover:border-[#25D366] flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.476-.15-.676.15s-.776.98-.952 1.18c-.176.2-.351.226-.652.075s-1.269-.468-2.417-1.493c-.894-.799-1.497-1.786-1.673-2.087s-.019-.464.132-.614c.135-.135.301-.351.451-.527s.2-.301.301-.502c.1-.2.05-.376-.025-.526s-.677-1.631-.927-2.233c-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.507 1.078 2.908 1.228 3.109c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.781-.728 2.032-1.431.25-.703.25-1.305.175-1.431-.075-.125-.275-.2-.576-.351zm-5.467 7.604c-2.179 0-4.218-.621-5.962-1.698l-.427-.26-4.437 1.164 1.185-4.323-.279-.444c-1.185-1.884-1.812-4.067-1.812-6.307 0-6.685 5.439-12.124 12.124-12.124 3.24 0 6.287 1.261 8.578 3.553 2.292 2.291 3.554 5.338 3.554 8.579 0 6.686-5.439 12.124-12.124 12.124zm9.431-21.555c-2.52-2.52-5.87-3.909-9.431-3.909-7.346 0-13.324 5.978-13.324 13.324 0 2.348.613 4.639 1.776 6.666l-1.888 6.897 7.057-1.851c1.947 1.062 4.148 1.621 6.379 1.621 7.346 0 13.324-5.978 13.324-13.324 0-3.561-1.389-6.911-3.909-9.431z"/>
                    </svg>
                  </button>

                  {/* Popover Dropdown on Hover/Focus */}
                  <div className="absolute bottom-full right-0 mb-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-1 z-30 pointer-events-none group-hover:pointer-events-auto">
                    <div className="px-2 py-1 border-b border-slate-100 mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">WhatsApp Chat</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">2 Numbers</span>
                    </div>

                    <div className="space-y-1">
                      <a
                        href="https://wa.me/94762581841"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 transition-colors text-left group/item"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                          <PhoneCall className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono font-bold text-slate-900 group-hover/item:text-emerald-700">076 258 1841</p>
                          <p className="text-[10px] text-slate-500 truncate">Seat Booking & Conductor</p>
                        </div>
                      </a>

                      <a
                        href="https://wa.me/94724173143"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 transition-colors text-left group/item"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                          <PhoneCall className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono font-bold text-slate-900 group-hover/item:text-emerald-700">072 417 3143</p>
                          <p className="text-[10px] text-slate-500 truncate">Express Dispatch & Helpline</p>
                        </div>
                      </a>
                    </div>

                    {/* Caret / Pointer */}
                    <div className="absolute -bottom-1.5 right-3.5 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Payment Gateways */}
            <div className="pt-1">
              <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Supported Payment Gateways</p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-700">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs font-semibold hover:scale-105 transition-transform cursor-default">VISA</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs font-semibold hover:scale-105 transition-transform cursor-default">MasterCard</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs font-semibold hover:scale-105 transition-transform cursor-default">LankaQR</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs font-semibold hover:scale-105 transition-transform cursor-default">Cash</span>
              </div>
            </div>

          </div>

        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="text-center sm:text-left">
            © 2026 <strong className="text-slate-800 font-bold">Dewmina Super Line (Pvt) Ltd</strong>. All rights reserved.
          </p>

            <div className="flex items-center gap-6 text-slate-600 text-xs font-medium">
              <button onClick={goToSearchSchedules} className="hover:text-blue-600 transition-colors">Book Buses</button>
              <button onClick={() => setCurrentView('live-tracking')} className="hover:text-blue-600 transition-colors flex items-center gap-1">Live GPS <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-200">Soon</span></button>
              <button onClick={() => setCurrentView('my-bookings')} className="hover:text-blue-600 transition-colors">My Tickets</button>
              <button
                onClick={() => {
                  if (currentUser?.role === 'admin' || userRole === 'admin') {
                    setUserRole('admin');
                    setCurrentView('admin-panel');
                  } else if (currentUser) {
                    setCurrentView('admin-panel');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Operator Portal
              </button>
            </div>
        </div>

      </div>

    </footer>
  );
};
