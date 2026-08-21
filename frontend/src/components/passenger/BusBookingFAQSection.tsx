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
      answer: 'When you tap on any available seat on our interactive 2D seat map, the system locks that seat exclusively for your session for 8 minutes. During this window, no other passenger can select or purchase your seat, completely eliminating duplicate bookings.',
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
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shadow-xs">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Frequently Asked Questions</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Common Questions About <span className="text-blue-600">Bus Booking in Sri Lanka</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Find fast answers to common questions about ticket reservations, passenger policies, boarding points, and payment security.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key as any);
              setOpenIndex(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon;

          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isOpen ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                    {faq.question}
                  </h3>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 flex-shrink-0 ${
                  isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1 pt-3 animate-fade-in-up">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Helpline Box */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Need personal assistance with your booking?</h4>
            <p className="text-xs text-slate-500">Our customer care and dispatch team is active 24 hours a day, 7 days a week.</p>
          </div>
        </div>

        <a
          href="tel:+94771234567"
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-sm flex items-center gap-2 transition-colors flex-shrink-0 font-mono"
        >
          <PhoneCall className="w-4 h-4 text-indigo-600" />
          <span>+94 77 123 4567</span>
        </a>
      </div>

    </section>
  );
};
