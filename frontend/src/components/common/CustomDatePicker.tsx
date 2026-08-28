import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Clock } from 'lucide-react';

interface CustomDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  theme?: 'amber' | 'blue';
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label = 'Journey Date',
  value,
  onChange,
  minDate,
  maxDate,
  theme = 'amber',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD helper to local Date (ignoring timezone drift)
  const parseYYYYMMDD = (str: string): Date => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  // Format Date object to YYYY-MM-DD
  const formatYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYYYYMMDD(new Date());

  const selectedDateObj = parseYYYYMMDD(value || todayStr);

  // Display Month/Year for calendar view
  const [viewMonth, setViewMonth] = useState<number>(selectedDateObj.getMonth());
  const [viewYear, setViewYear] = useState<number>(selectedDateObj.getFullYear());

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = parseYYYYMMDD(value);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick preset calculations
  const getTomorrowStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatYYYYMMDD(d);
  };

  const getWeekendStr = (): string => {
    const d = new Date();
    const day = d.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
    return formatYYYYMMDD(d);
  };

  const tomorrowStr = getTomorrowStr();
  const weekendStr = getWeekendStr();

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Calendar Days Calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Human Readable Label (e.g. "Today, Sat 29 Aug 2026")
  const formatHumanLabel = (str: string) => {
    if (!str) return 'Select Date';
    if (str === todayStr) return `Today (${dayNamesShort[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} ${monthNamesShort[selectedDateObj.getMonth()]})`;
    if (str === tomorrowStr) return `Tomorrow (${dayNamesShort[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} ${monthNamesShort[selectedDateObj.getMonth()]})`;
    return `${dayNamesShort[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} ${monthNamesShort[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()}`;
  };

  // Select Date handler
  const handleSelectDay = (dayNum: number) => {
    const selectedDate = new Date(viewYear, viewMonth, dayNum);
    const dateStr = formatYYYYMMDD(selectedDate);

    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  const isSelectedDay = (dayNum: number): boolean => {
    const cellDateStr = formatYYYYMMDD(new Date(viewYear, viewMonth, dayNum));
    return cellDateStr === value;
  };

  const isTodayDay = (dayNum: number): boolean => {
    const cellDateStr = formatYYYYMMDD(new Date(viewYear, viewMonth, dayNum));
    return cellDateStr === todayStr;
  };

  const isDisabledDay = (dayNum: number): boolean => {
    const cellDateStr = formatYYYYMMDD(new Date(viewYear, viewMonth, dayNum));
    if (minDate && cellDateStr < minDate) return true;
    if (maxDate && cellDateStr > maxDate) return true;
    return false;
  };

  const isAmber = theme === 'amber';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Card Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 hover:bg-white border rounded-2xl p-3 transition-all duration-300 cursor-pointer shadow-2xs group/date ${
          isOpen
            ? isAmber
              ? 'border-amber-500 ring-2 ring-amber-100 bg-white shadow-md'
              : 'border-blue-500 ring-2 ring-blue-100 bg-white shadow-md'
            : isAmber
              ? 'border-slate-200 hover:border-amber-300 hover:shadow-xs'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
        }`}
      >
        <label className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-1 cursor-pointer ${
          isAmber ? 'text-amber-600' : 'text-blue-600'
        }`}>
          <span className={`relative flex items-center justify-center w-5 h-5 rounded-md border shadow-2xs transition-transform duration-300 group-hover/date:scale-110 ${
            isAmber ? 'bg-amber-100/70 border-amber-300 text-amber-600' : 'bg-blue-100/70 border-blue-300 text-blue-600'
          }`}>
            <Calendar className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <span>{label}</span>
        </label>

        <div className="flex items-center justify-between">
          <span className="text-slate-900 font-extrabold text-xs sm:text-sm tracking-tight truncate">
            {formatHumanLabel(value)}
          </span>
          <span className={`ml-2 transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180 text-amber-600' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {/* ── Animated Creative Popover Calendar ── */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-72 sm:w-80 bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up p-4 space-y-4">
          
          {/* Top Quick Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
            <button
              type="button"
              onClick={() => { onChange(todayStr); setIsOpen(false); }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                value === todayStr
                  ? isAmber ? 'bg-amber-500 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Today
            </button>

            <button
              type="button"
              onClick={() => { onChange(tomorrowStr); setIsOpen(false); }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                value === tomorrowStr
                  ? isAmber ? 'bg-amber-500 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" /> Tomorrow
            </button>

            <button
              type="button"
              onClick={() => { onChange(weekendStr); setIsOpen(false); }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                value === weekendStr
                  ? isAmber ? 'bg-amber-500 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Weekend
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center font-extrabold text-slate-800 text-sm tracking-tight">
              {monthNames[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNamesShort.map((day, idx) => (
              <span key={idx} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {day.charAt(0)}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-8 sm:h-9" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const selected = isSelectedDay(dayNum);
              const today = isTodayDay(dayNum);
              const disabled = isDisabledDay(dayNum);

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 sm:h-9 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center ${
                    disabled
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed line-through opacity-50'
                      : selected
                        ? isAmber
                          ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-extrabold shadow-md scale-105 z-10'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold shadow-md scale-105 z-10'
                        : today
                          ? isAmber
                            ? 'bg-amber-50 text-amber-700 border border-amber-300 font-extrabold hover:bg-amber-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-300 font-extrabold hover:bg-blue-100'
                          : 'text-slate-700 hover:bg-slate-100 hover:scale-105 active:scale-95'
                  }`}
                >
                  {dayNum}
                  {today && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Seat locks sync in real-time</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
