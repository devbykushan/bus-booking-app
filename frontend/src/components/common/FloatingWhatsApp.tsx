import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, Phone, Clock } from 'lucide-react';

const WHATSAPP_CONTACTS = [
  {
    number: '076 258 1841',
    rawNumber: '94762581841',
    title: 'Seat Booking & Inquiries',
    subtitle: 'Conductor & Online Support',
    status: 'Online Now',
    message: 'Hello Dewmina Super Line, I would like to inquire about bus seat booking.',
  },
  {
    number: '072 417 3143',
    rawNumber: '94724173143',
    title: 'Express Dispatch & Helpline',
    subtitle: 'Route & Schedule Support',
    status: 'Active 24/7',
    message: 'Hello Dewmina Super Line, I need assistance with bus schedule/dispatch.',
  },
];

export const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenWhatsapp = (rawNumber: string, message: string) => {
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none" ref={menuRef}>
      {/* WhatsApp Popup Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-scale-up origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#075E54] p-4 text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 shadow-inner">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.476-.15-.676.15s-.776.98-.952 1.18c-.176.2-.351.226-.652.075s-1.269-.468-2.417-1.493c-.894-.799-1.497-1.786-1.673-2.087s-.019-.464.132-.614c.135-.135.301-.351.451-.527s.2-.301.301-.502c.1-.2.05-.376-.025-.526s-.677-1.631-.927-2.233c-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.507 1.078 2.908 1.228 3.109c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.781-.728 2.032-1.431.25-.703.25-1.305.175-1.431-.075-.125-.275-.2-.576-.351zm-5.467 7.604c-2.179 0-4.218-.621-5.962-1.698l-.427-.26-4.437 1.164 1.185-4.323-.279-.444c-1.185-1.884-1.812-4.067-1.812-6.307 0-6.685 5.439-12.124 12.124-12.124 3.24 0 6.287 1.261 8.578 3.553 2.292 2.291 3.554 5.338 3.554 8.579 0 6.686-5.439 12.124-12.124 12.124zm9.431-21.555c-2.52-2.52-5.87-3.909-9.431-3.909-7.346 0-13.324 5.978-13.324 13.324 0 2.348.613 4.639 1.776 6.666l-1.888 6.897 7.057-1.851c1.947 1.062 4.148 1.621 6.379 1.621 7.346 0 13.324-5.978 13.324-13.324 0-3.561-1.389-6.911-3.909-9.431z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight">Dewmina Super Line</h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  Typically replies within minutes
                </p>
              </div>
            </div>
          </div>

          {/* Body with Contact Numbers */}
          <div className="p-3.5 space-y-2.5 bg-slate-50/70">
            <p className="text-[11px] text-slate-500 font-medium px-1">
              Select a WhatsApp contact number to chat with our team:
            </p>

            {WHATSAPP_CONTACTS.map((contact, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenWhatsapp(contact.rawNumber, contact.message)}
                className="w-full text-left p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 text-slate-800 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {contact.number}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {contact.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700">{contact.title}</p>
                    <p className="text-[10px] text-slate-400">{contact.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-emerald-600" /> Monaragala ⇄ Colombo Daily Express
            </span>
            <span className="text-emerald-600 font-bold">24/7 Available</span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasInteracted(true);
        }}
        aria-label="Chat on WhatsApp with Dewmina Super Line"
        className="relative group flex items-center justify-center w-14 h-14 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl shadow-emerald-600/35 hover:shadow-2xl hover:shadow-emerald-600/50 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        {/* Glowing pulse ring */}
        <span className="absolute inset-0 rounded-2xl bg-[#25D366] opacity-40 animate-ping pointer-events-none group-hover:opacity-0" />

        {isOpen ? (
          <X className="w-7 h-7 relative z-10" />
        ) : (
          <svg className="w-7 h-7 fill-current relative z-10" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.476-.15-.676.15s-.776.98-.952 1.18c-.176.2-.351.226-.652.075s-1.269-.468-2.417-1.493c-.894-.799-1.497-1.786-1.673-2.087s-.019-.464.132-.614c.135-.135.301-.351.451-.527s.2-.301.301-.502c.1-.2.05-.376-.025-.526s-.677-1.631-.927-2.233c-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.507 1.078 2.908 1.228 3.109c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.781-.728 2.032-1.431.25-.703.25-1.305.175-1.431-.075-.125-.275-.2-.576-.351zm-5.467 7.604c-2.179 0-4.218-.621-5.962-1.698l-.427-.26-4.437 1.164 1.185-4.323-.279-.444c-1.185-1.884-1.812-4.067-1.812-6.307 0-6.685 5.439-12.124 12.124-12.124 3.24 0 6.287 1.261 8.578 3.553 2.292 2.291 3.554 5.338 3.554 8.579 0 6.686-5.439 12.124-12.124 12.124zm9.431-21.555c-2.52-2.52-5.87-3.909-9.431-3.909-7.346 0-13.324 5.978-13.324 13.324 0 2.348.613 4.639 1.776 6.666l-1.888 6.897 7.057-1.851c1.947 1.062 4.148 1.621 6.379 1.621 7.346 0 13.324-5.978 13.324-13.324 0-3.561-1.389-6.911-3.909-9.431z"/>
          </svg>
        )}

        {/* Unread badge / alert */}
        {!isOpen && !hasInteracted && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};
