import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, Clock, Check } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  label?: string;
  className?: string;
  theme?: 'amber' | 'blue';
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SI = [
  'ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි',
  'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'
];

const MONTH_NAMES_TA = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
];

const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEKDAYS_SI = ['සඳු', 'අඟ', 'බුධ', 'බ්‍රහ', 'සිතු', 'සෙන', 'ඉරි'];
const WEEKDAYS_TA = ['திங்', 'செவ்', 'புத', 'வியா', 'வெள்', 'சனி', 'ஞாயி'];

// Helper to format Date to YYYY-MM-DD local string
const toISOStringLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  className = '',
  theme = 'amber'
}) => {
  const { language } = useBookingStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date
  const today = new Date();
  const todayStr = toISOStringLocal(today);
  const effectiveMinDateStr = minDate || todayStr;

  const initialDateParts = (value || todayStr).split('-').map(Number);
  const selectedDate = new Date(initialDateParts[0], initialDateParts[1] - 1, initialDateParts[2]);

  // Calendar View state (current month/year being viewed)
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [value]);

  // Calculation for month days grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // Get day of week (0=Sun, 1=Mon... convert to 0=Mon... 6=Sun)
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Handle month navigation
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const dateObj = new Date(viewYear, viewMonth, day);
    const dateStr = toISOStringLocal(dateObj);

    if (effectiveMinDateStr && dateStr < effectiveMinDateStr) return;
    if (maxDate && dateStr > maxDate) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  // Quick shortcuts
  const selectQuickShortcut = (offsetDays: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offsetDays);
    const targetStr = toISOStringLocal(targetDate);
    onChange(targetStr);
    setViewYear(targetDate.getFullYear());
    setViewMonth(targetDate.getMonth());
    setIsOpen(false);
  };

  // Formatted display text
  const getFormattedDisplayText = () => {
    if (!value) return 'Select Date';
    const parts = value.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);

    const isToday = value === todayStr;

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = value === toISOStringLocal(tomorrow);

    let prefix = '';
    if (isToday) prefix = language === 'sinhala' ? 'අද (' : language === 'tamil' ? 'இன்று (' : 'Today (';
    else if (isTomorrow) prefix = language === 'sinhala' ? 'හෙට (' : language === 'tamil' ? 'நாளை (' : 'Tomorrow (';

    const monthNames = language === 'sinhala' ? MONTH_NAMES_SI : language === 'tamil' ? MONTH_NAMES_TA : MONTH_NAMES_EN;
    const monthStr = monthNames[d.getMonth()];
    const dayNum = d.getDate();
    const yearNum = d.getFullYear();

    const formatted = `${monthStr} ${dayNum}, ${yearNum}`;
    return prefix ? `${prefix}${formatted})` : formatted;
  };

  const monthNames = language === 'sinhala' ? MONTH_NAMES_SI : language === 'tamil' ? MONTH_NAMES_TA : MONTH_NAMES_EN;
  const weekdays = language === 'sinhala' ? WEEKDAYS_SI : language === 'tamil' ? WEEKDAYS_TA : WEEKDAYS_EN;

  const tomorrowStr = toISOStringLocal(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const dayAfterTomorrowStr = toISOStringLocal(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 mb-1.5">
          <span className="relative flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-600 shadow-xs">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600 relative z-10" />
          </span>
          <span className="font-extrabold">{label}</span>
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/90 border rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group/picker ${
          isOpen
            ? theme === 'blue'
              ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-blue-200/50'
              : 'border-amber-400 ring-4 ring-amber-400/20 shadow-amber-200/50'
            : 'border-slate-200/90 hover:border-amber-400/80 bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover/picker:scale-110 group-hover/picker:rotate-3 ${
            theme === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {value === todayStr ? '● Real-time Today' : 'Selected Date'}
            </span>
            <span className="text-sm font-extrabold text-slate-900 truncate">
              {getFormattedDisplayText()}
            </span>
          </div>
        </div>

        {/* Quick Date Chips inside trigger */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => selectQuickShortcut(0, e)}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
              value === todayStr
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200/60'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={(e) => selectQuickShortcut(1, e)}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
              value === tomorrowStr
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200/60'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Custom Animated Calendar Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-[310px] sm:w-[340px] bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-900/20 p-4 animate-fade-in-up space-y-4">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                {monthNames[viewMonth]} {viewYear}
              </span>
              {viewYear === today.getFullYear() && viewMonth === today.getMonth() && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Current Month" />
              )}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((wd, i) => (
              <span key={i} className="text-[11px] font-black uppercase text-slate-400 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Previous Month Pad Days */}
            {Array.from({ length: startDay }).map((_, idx) => {
              const prevMonthDay = daysInPrevMonth - startDay + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-9 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center select-none opacity-40 cursor-not-allowed"
                >
                  {prevMonthDay}
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(viewYear, viewMonth, day);
              const dateStr = toISOStringLocal(dateObj);

              const isSelected = dateStr === value;
              const isTodayDay = dateStr === todayStr;
              const isDisabled = (effectiveMinDateStr && dateStr < effectiveMinDateStr) || (maxDate && dateStr > maxDate);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!!isDisabled}
                  onClick={() => handleSelectDate(day)}
                  className={`h-9 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer ${
                    isDisabled
                      ? 'text-slate-300 bg-slate-50/50 cursor-not-allowed line-through'
                      : isSelected
                      ? theme === 'blue'
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/40 scale-105 border border-blue-400 font-black'
                        : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/40 scale-105 border border-amber-400 font-black'
                      : isTodayDay
                      ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500/80 hover:bg-emerald-100 hover:scale-105'
                      : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900 hover:scale-105 hover:shadow-xs'
                  }`}
                >
                  <span>{day}</span>
                  {isTodayDay && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" />
                  )}
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts & Real-Time Status Footer */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                Quick Select:
              </span>

              <button
                type="button"
                onClick={(e) => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); selectQuickShortcut(0, e); }}
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors"
              >
                Reset to Today
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={(e) => selectQuickShortcut(0, e)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                  value === todayStr
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                {value === todayStr && <Check className="w-3 h-3 text-amber-600" />}
                Today
              </button>

              <button
                type="button"
                onClick={(e) => selectQuickShortcut(1, e)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                  value === tomorrowStr
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                {value === tomorrowStr && <Check className="w-3 h-3 text-amber-600" />}
                Tomorrow
              </button>

              <button
                type="button"
                onClick={(e) => selectQuickShortcut(2, e)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                  value === dayAfterTomorrowStr
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                {value === dayAfterTomorrowStr && <Check className="w-3 h-3 text-amber-600" />}
                +2 Days
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-2 text-center text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1.5 border border-slate-100">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>Real-time seat locks synced for {value}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
