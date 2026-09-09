import React, { useState } from 'react';
import { 
  HelpCircle, ChevronDown, PhoneCall, ShieldCheck, 
  CreditCard, Clock, Armchair, Luggage, Ban, Sparkles 
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'booking' | 'seats' | 'luggage' | 'refunds';
  icon: React.ComponentType<{ className?: string }>;
}

export const BusBookingFAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'booking' | 'seats' | 'luggage' | 'refunds'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: 'booking',
      question: 'How far in advance can I book a bus ticket on Dewmina Super Line?',
      answer: 'You can book your bus tickets up to 30 days in advance of your travel date. Live seat layouts and timetable schedules are updated in real time across all our routes including Monaragala, Colombo Fort, Kandy, Galle, and Badulla.',
      icon: Clock,
    },
    {
      category: 'seats',
      question: 'What is the seat locking feature and how does it prevent double-booking?',
      answer: 'When you tap on any available seat on our interactive 2D seat map, the system locks that seat exclusively for your session for 10 minutes. During this window, no other passenger can select or purchase your seat, completely eliminating duplicate bookings.',
      icon: Armchair,
    },
    {
      category: 'seats',
      question: 'Can solo female travelers reserve designated female-only seats?',
      answer: 'Yes! Rows 2 and 3 on our Lanka Ashok Leyland and Yutong coaches are reserved for solo female travelers. You can toggle the "Solo Female Seats Only" filter on the homepage search to instantly view and reserve these protected seats.',
      icon: ShieldCheck,
    },
    {
      category: 'booking',
      question: 'How do I board the bus using the digital QR E-Ticket?',
      answer: 'Upon completing your reservation, an instant E-Ticket with a high-resolution QR code is generated on screen and sent to your mobile via SMS and email. Simply present the QR code on your smartphone to the bus conductor at your boarding point for instant contactless validation.',
      icon: HelpCircle,
    },
    {
      category: 'booking',
      question: 'Which payment methods are supported on Dewmina Super Line?',
      answer: 'We accept all major Sri Lankan and international Credit and Debit cards (Visa, MasterCard), Online Banking transfer portals, and authorized counter checkouts with bank-grade 256-bit SSL encryption.',
      icon: CreditCard,
    },
    {
      category: 'luggage',
      question: 'What is the luggage allowance per passenger?',
      answer: 'Each ticket includes one standard undercarriage check-in luggage bag up to 20kg plus one personal handbag or laptop backpack inside the cabin. Fragile and oversize parcel baggage can also be tagged directly at our bus terminal counters.',
      icon: Luggage,
    },
    {
      category: 'refunds',
      question: 'What is the cancellation and refund policy for online tickets?',
      answer: 'Cancellations made 24 hours or more before departure receive a 100% full refund. Cancellations made between 6 and 24 hours prior to departure receive a 50% refund. You can cancel directly from the "My Tickets" portal using your PNR number.',
      icon: Ban,
    },
    {
      category: 'booking',
      question: 'How does live GPS bus tracking work on the day of travel?',
      answer: 'On your travel date, tap "Live GPS" or access tracking from your ticket to view your bus’s current real-time GPS coordinates, vehicle speed, current stop name, and estimated arrival time (ETA) updated every few seconds.',
      icon: Sparkles,
    },
  ];

  const categories = [
    { key: 'all', label: 'All Questions' },
    { key: 'booking', label: 'Booking & Payments' },
    { key: 'seats', label: 'Seat Selection & Safety' },
    { key: 'luggage', label: 'Luggage & Boarding' },
    { key: 'refunds', label: 'Cancellations & Refunds' },
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 select-none overflow-hidden">
      
      {/* ── Ambient Floating Background Glow Orbs ── */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none animate-blob-1" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none animate-blob-2" />

      {/* Section Header (Left-aligned) */}
      <div className="relative z-10 text-left space-y-2.5 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs hover:scale-105 transition-transform cursor-default">
          <HelpCircle className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Frequently Asked Questions</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Common Questions About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Bus Booking in Sri Lanka</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Find fast answers to common questions about ticket reservations, passenger policies, boarding points, and payment security.
        </p>
      </div>

      {/* Category Pills (Left-aligned) */}
      <div className="relative z-10 flex flex-wrap items-center justify-start gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key as any);
              setOpenIndex(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${
              activeCategory === cat.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-400/30'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-xs hover:border-blue-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List with Light Glassmorphic Cards & Hover Lift */}
      <div className="relative z-10 space-y-3.5">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon;

          return (
            <div
              key={idx}
              className={`rounded-2xl border backdrop-blur-md transition-all duration-300 overflow-hidden shadow-xs group ${
                isOpen 
                  ? 'bg-white/95 border-blue-300 shadow-md shadow-blue-900/5 ring-2 ring-blue-100' 
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 select-none cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-xs ${
                    isOpen 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white scale-105 shadow-blue-600/20' 
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight transition-colors duration-200 ${
                    isOpen ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'
                  }`}>
                    {faq.question}
                  </h3>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                  isOpen 
                    ? 'rotate-180 bg-blue-100 text-blue-700 shadow-xs' 
                    : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1 pt-3.5 animate-fade-in-up">
                  <p className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 font-normal">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Helpline Glass Box with Smooth Hover Lift & Pulse */}
      <div className="relative z-10 p-6 sm:p-7 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-blue-50/90 via-white/90 to-indigo-50/90 border border-white shadow-lg shadow-blue-900/5 hover:shadow-xl hover:border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all duration-300">
        
        {/* Animated Top Flowing Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-gradient-flow" />

        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/25">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">Need personal assistance with your booking?</h4>
            <p className="text-xs text-slate-600 font-normal">Our customer care and dispatch team is active 24 hours a day, 7 days a week.</p>
          </div>
        </div>

        <a
          href="tel:0711433520"
          className="px-6 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md flex items-center gap-2 transition-all duration-300 transform hover:scale-105 active:scale-95 flex-shrink-0 font-mono group"
        >
          <PhoneCall className="w-4 h-4 text-emerald-600 group-hover:animate-bounce" />
          <span>+94 71 143 3520</span>
        </a>
      </div>

    </section>
  );
};
