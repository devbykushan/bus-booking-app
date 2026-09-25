import React, { useState, useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import {
  DollarSign, TrendingUp, Calendar,
  Download, Printer, RefreshCw, Bus, CreditCard,
  Building, Filter, PieChart, BarChart3, Banknote
} from 'lucide-react';

type DateFilterType = 'today' | 'yesterday' | '7days' | 'this_month' | 'last_month' | 'all' | 'custom';

export const FinancialAnalyticsSection: React.FC = () => {
  const { bookings, routes, loadBookings, loadRoutes, isLoading } = useBookingStore();

  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [busSearchTerm, setBusSearchTerm] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Helper date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (dateFilter === 'yesterday') {
      return { start: yesterdayStr, end: yesterdayStr };
    }
    if (dateFilter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    }
    if (dateFilter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { start, end: todayStr };
    }
    if (dateFilter === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (dateFilter === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }
    return { start: '2020-01-01', end: '2030-12-31' };
  }, [dateFilter, customStartDate, customEndDate, todayStr, yesterdayStr]);

  // Filter confirmed bookings based on date bounds
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.bookingStatus === 'cancelled') return false;
      const createdDate = b.createdAt ? b.createdAt.split('T')[0] : '';
      const travelDate = b.departureDate || '';
      const relevantDate = createdDate || travelDate;
      if (!relevantDate) return true;
      return relevantDate >= dateRangeBounds.start && relevantDate <= dateRangeBounds.end;
    });
  }, [bookings, dateRangeBounds]);

  // Filter routes based on date bounds (for capacity & occupancy)
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const dep = r.departureDate;
      if (!dep) return true;
      return dep >= dateRangeBounds.start && dep <= dateRangeBounds.end;
    });
  }, [routes, dateRangeBounds]);

  // Revenue & Payment Channel Breakdowns
  const paymentBreakdown = useMemo(() => {
    let counterCash = 0;
    let bankTransfer = 0;
    let onlineCard = 0;
    let totalPassengers = 0;

    for (const b of filteredBookings) {
      const fare = b.totalFare || 0;
      const isCounter =
        b.pnr?.startsWith('CTR-') ||
        b.paymentMethod === 'wallet' ||
        (b as any).paymentMethod === 'cash';

      const isBankSlip = b.paymentMethod === 'bank_transfer';

      if (isCounter) {
        counterCash += fare;
      } else if (isBankSlip) {
        bankTransfer += fare;
      } else {
        onlineCard += fare;
      }

      const seatCount = (b.seats && b.seats.length > 0)
        ? b.seats.length
        : (b.seatNumbers && b.seatNumbers.length > 0)
        ? b.seatNumbers.length
        : 1;

      totalPassengers += seatCount;
    }

    const totalRevenue = counterCash + bankTransfer + onlineCard;
    const counterPercent = totalRevenue > 0 ? (counterCash / totalRevenue) * 100 : 0;
    const bankPercent = totalRevenue > 0 ? (bankTransfer / totalRevenue) * 100 : 0;
    const cardPercent = totalRevenue > 0 ? (onlineCard / totalRevenue) * 100 : 0;

    return {
      counterCash,
      bankTransfer,
      onlineCard,
      totalRevenue,
      totalPassengers,
      counterPercent,
      bankPercent,
      cardPercent,
      avgTicketPrice: totalPassengers > 0 ? Math.round(totalRevenue / totalPassengers) : 0,
    };
  }, [filteredBookings]);

  // Fleet Occupancy Calculations
  const occupancyStats = useMemo(() => {
    // Total scheduled seats in filtered routes
    let totalSeatsCapacity = 0;
    for (const r of filteredRoutes) {
      const cap = r.totalSeatsCount || (r.seats && r.seats.length > 0 ? r.seats.length : 54);
      totalSeatsCapacity += cap;
    }

    // If no filtered routes in range, fallback to count of active routes * 54
    if (totalSeatsCapacity === 0 && routes.length > 0) {
      totalSeatsCapacity = routes.length * 54;
    }

    const bookedSeats = paymentBreakdown.totalPassengers;
    const rate = totalSeatsCapacity > 0 ? Math.min(100, Math.round((bookedSeats / totalSeatsCapacity) * 100)) : 0;

    return {
      totalSeatsCapacity,
      bookedSeats,
      rate,
    };
  }, [filteredRoutes, routes.length, paymentBreakdown.totalPassengers]);

  // Per-Bus Fleet Performance breakdown
  const busPerformance = useMemo(() => {
    const map = new Map<string, {
      busNumber: string;
      routeLabel: string;
      operatorName: string;
      tripsCount: number;
      seatsCapacity: number;
      bookedSeats: number;
      counterRevenue: number;
      digitalRevenue: number;
      totalRevenue: number;
    }>();

    // Initialize from active routes
    for (const r of routes) {
      const bus = r.busNumber || 'ND-2903';
      if (!map.has(bus)) {
        map.set(bus, {
          busNumber: bus,
          routeLabel: `${r.origin} ➔ ${r.destination}`,
          operatorName: r.operatorName || 'Dewmina Super Line',
          tripsCount: 0,
          seatsCapacity: 0,
          bookedSeats: 0,
          counterRevenue: 0,
          digitalRevenue: 0,
          totalRevenue: 0,
        });
      }
    }

    // Add capacity from filtered routes
    for (const r of filteredRoutes) {
      const bus = r.busNumber || 'ND-2903';
      const record = map.get(bus);
      if (record) {
        record.tripsCount += 1;
        record.seatsCapacity += r.totalSeatsCount || (r.seats?.length || 54);
      }
    }

    // Add bookings & revenue
    for (const b of filteredBookings) {
      const bus = b.busNumber || 'ND-2903';
      let record = map.get(bus);
      if (!record) {
        record = {
          busNumber: bus,
          routeLabel: `${b.origin} ➔ ${b.destination}`,
          operatorName: b.operatorName || 'Dewmina Super Line',
          tripsCount: 1,
          seatsCapacity: 54,
          bookedSeats: 0,
          counterRevenue: 0,
          digitalRevenue: 0,
          totalRevenue: 0,
        };
        map.set(bus, record);
      }

      const seats = (b.seats && b.seats.length > 0) ? b.seats.length : (b.seatNumbers?.length || 1);
      record.bookedSeats += seats;

      const fare = b.totalFare || 0;
      const isCounter = b.pnr?.startsWith('CTR-') || b.paymentMethod === 'wallet' || (b as any).paymentMethod === 'cash';
      if (isCounter) {
        record.counterRevenue += fare;
      } else {
        record.digitalRevenue += fare;
      }
      record.totalRevenue += fare;
    }

    let list = Array.from(map.values());
    if (busSearchTerm.trim()) {
      const q = busSearchTerm.toLowerCase();
      list = list.filter((item) => item.busNumber.toLowerCase().includes(q) || item.routeLabel.toLowerCase().includes(q));
    }

    // Sort by revenue descending
    return list.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [routes, filteredRoutes, filteredBookings, busSearchTerm]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([loadBookings(), loadRoutes()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const dateRangeLabel = `${dateRangeBounds.start}_to_${dateRangeBounds.end}`;
    const header = [
      'PNR',
      'Travel Date',
      'Bus Number',
      'Route Origin',
      'Route Destination',
      'Passenger Name',
      'Passenger Phone',
      'Seats Count',
      'Payment Channel',
      'Payment Status',
      'Total Fare (LKR)',
      'Booking Timestamp'
    ];

    const rows = filteredBookings.map((b) => {
      const name = b.passenger?.fullName || (b as any).passengerName || 'Walk-in Passenger';
      const phone = b.passenger?.phone || (b as any).passengerPhone || 'N/A';
      const seatCount = (b.seats && b.seats.length > 0) ? b.seats.length : (b.seatNumbers?.length || 1);
      const isCounter = b.pnr?.startsWith('CTR-') || b.paymentMethod === 'wallet' || (b as any).paymentMethod === 'cash';
      const channel = isCounter ? 'Counter Cash' : (b.paymentMethod === 'bank_transfer' ? 'Bank Slip' : 'Online Card');

      return [
        b.pnr,
        b.departureDate || '',
        b.busNumber || '',
        b.origin,
        b.destination,
        `"${name.replace(/"/g, '""')}"`,
        `"${phone}"`,
        seatCount,
        channel,
        b.paymentStatus || 'paid',
        b.totalFare || 0,
        b.createdAt ? b.createdAt.replace('T', ' ').substring(0, 19) : ''
      ].join(',');
    });

    const summarySection = [
      '',
      '--- FINANCIAL SETTLEMENT SUMMARY ---',
      `Date Range: ${dateRangeBounds.start} to ${dateRangeBounds.end}`,
      `Total Confirmed Bookings: ${filteredBookings.length}`,
      `Total Passengers Carried: ${paymentBreakdown.totalPassengers}`,
      `Counter Cash Collected: LKR ${paymentBreakdown.counterCash.toLocaleString()}`,
      `Bank Slips & Online Paid: LKR ${(paymentBreakdown.bankTransfer + paymentBreakdown.onlineCard).toLocaleString()}`,
      `TOTAL GROSS REVENUE: LKR ${paymentBreakdown.totalRevenue.toLocaleString()}`,
      `Average Seat Occupancy: ${occupancyStats.rate}%`
    ].join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows, summarySection].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dewmina_financial_report_${dateRangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Financial Statement
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-7 animate-fadeIn font-sans">
      
      {/* ── Header Bar & Quick Date Controls ── */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial & Revenue Analytics
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time daily & monthly collections, seat occupancy rates, and cash settlement reports.
          </p>
        </div>

        {/* Action Buttons: Refresh, CSV Export, Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isRefreshing || isLoading}
            onClick={handleRefresh}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50"
            title="Refresh Financial Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Time Period Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 px-2 mr-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Period:</span>
        </div>

        {(['today', 'yesterday', '7days', 'this_month', 'last_month', 'all', 'custom'] as DateFilterType[]).map((tab) => {
          const labels: Record<DateFilterType, string> = {
            today: 'Today',
            yesterday: 'Yesterday',
            '7days': 'Last 7 Days',
            this_month: 'This Month',
            last_month: 'Last Month',
            all: 'All Time',
            custom: 'Custom Range'
          };
          const isActive = dateFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setDateFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 pl-2 mt-2 sm:mt-0 animate-fadeIn">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* ── 4 Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Collection</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              LKR {paymentBreakdown.totalRevenue.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                {filteredBookings.length} Bookings
              </span>
              <span className="text-[11px] text-slate-400">• {paymentBreakdown.totalPassengers} Passengers</span>
            </div>
          </div>
        </div>

        {/* Card 2: Seat Occupancy Rate */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Fleet Occupancy Rate</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {occupancyStats.rate}%
              </p>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                occupancyStats.rate >= 70
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : occupancyStats.rate >= 40
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
              }`}>
                {occupancyStats.rate >= 70 ? 'High Demand' : occupancyStats.rate >= 40 ? 'Moderate' : 'Low Traffic'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${occupancyStats.rate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              {occupancyStats.bookedSeats} seats booked of {occupancyStats.totalSeatsCapacity} capacity
            </p>
          </div>
        </div>

        {/* Card 3: Counter Cash Settlement */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Counter Cash Handed</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              LKR {paymentBreakdown.counterCash.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {Math.round(paymentBreakdown.counterPercent)}% of Total
              </span>
              <span className="text-slate-400 text-[11px]">Walk-in Cash</span>
            </div>
          </div>
        </div>

        {/* Card 4: Bank Slips & Online Payments */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bank & Digital Slips</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              LKR {(paymentBreakdown.bankTransfer + paymentBreakdown.onlineCard).toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {Math.round(paymentBreakdown.bankPercent + paymentBreakdown.cardPercent)}% of Total
              </span>
              <span className="text-slate-400 text-[11px]">Direct to Bank</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Cash Settlement Breakdown Comparison Bar ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Channel Settlement & Cashier Reconciliation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Physical cash collected at counter vs bank deposits verified
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            Average Ticket: LKR {paymentBreakdown.avgTicketPrice.toLocaleString()}
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
          <div
            className="h-full bg-amber-500 hover:bg-amber-600 transition-all cursor-pointer"
            style={{ width: `${paymentBreakdown.counterPercent || 0}%` }}
            title={`Counter Cash: LKR ${paymentBreakdown.counterCash.toLocaleString()}`}
          />
          <div
            className="h-full bg-indigo-500 hover:bg-indigo-600 transition-all cursor-pointer"
            style={{ width: `${paymentBreakdown.bankPercent || 0}%` }}
            title={`Bank Slip: LKR ${paymentBreakdown.bankTransfer.toLocaleString()}`}
          />
          <div
            className="h-full bg-cyan-500 hover:bg-cyan-600 transition-all cursor-pointer"
            style={{ width: `${paymentBreakdown.cardPercent || 0}%` }}
            title={`Online Card: LKR ${paymentBreakdown.onlineCard.toLocaleString()}`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Counter Cash</span>
            </div>
            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
              LKR {paymentBreakdown.counterCash.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Transfer Slips</span>
            </div>
            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
              LKR {paymentBreakdown.bankTransfer.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/50 dark:border-cyan-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Online Card / Gateway</span>
            </div>
            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
              LKR {paymentBreakdown.onlineCard.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Per-Bus & Route Fleet Occupancy & Revenue Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Per-Bus Fleet Performance & Occupancy</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trip frequency, passenger loads, seat occupancy percentages, and net revenue by bus
            </p>
          </div>

          {/* Bus Filter Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search bus (e.g. ND-2903)..."
              value={busSearchTerm}
              onChange={(e) => setBusSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 w-full sm:w-56"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Bus & Operator</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 text-center">Trips</th>
                <th className="py-3 px-4">Occupancy %</th>
                <th className="py-3 px-4 text-right">Counter Cash</th>
                <th className="py-3 px-4 text-right">Bank / Online</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {busPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No bus performance records found for this period.
                  </td>
                </tr>
              ) : (
                busPerformance.map((item) => {
                  const rate = item.seatsCapacity > 0
                    ? Math.min(100, Math.round((item.bookedSeats / item.seatsCapacity) * 100))
                    : 0;

                  return (
                    <tr key={item.busNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{item.busNumber}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.operatorName}</p>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {item.routeLabel}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.tripsCount || 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-mono font-bold ${
                            rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : rate >= 40 ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {rate}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{item.bookedSeats} / {item.seatsCapacity || 54} seats</p>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        LKR {item.counterRevenue.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        LKR {item.digitalRevenue.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        LKR {item.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Hidden Printable Statement (Visible only when Printing) ── */}
      <div id="printable-financial-report" className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-black tracking-tight">DEWMINA SUPER LINE (PVT) LTD</h1>
          <p className="text-xs text-gray-600">Executive Fleet Revenue & Cash Settlement Statement</p>
          <p className="text-xs font-semibold mt-1">Period: {dateRangeBounds.start} to {dateRangeBounds.end}</p>
          <p className="text-[10px] text-gray-500">Generated: {new Date().toLocaleString('en-GB')}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6 text-center text-xs">
          <div className="p-3 border rounded">
            <p className="font-bold text-gray-500">Total Bookings</p>
            <p className="text-base font-black font-mono">{filteredBookings.length}</p>
          </div>
          <div className="p-3 border rounded">
            <p className="font-bold text-gray-500">Counter Cash</p>
            <p className="text-base font-black font-mono">LKR {paymentBreakdown.counterCash.toLocaleString()}</p>
          </div>
          <div className="p-3 border rounded">
            <p className="font-bold text-gray-500">Bank Slips</p>
            <p className="text-base font-black font-mono">LKR {paymentBreakdown.bankTransfer.toLocaleString()}</p>
          </div>
          <div className="p-3 border rounded bg-gray-50">
            <p className="font-bold text-gray-700">Gross Total Revenue</p>
            <p className="text-base font-black font-mono">LKR {paymentBreakdown.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <table className="w-full text-xs text-left border-collapse border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border p-2">Bus Number</th>
              <th className="border p-2">Route</th>
              <th className="border p-2 text-center">Trips</th>
              <th className="border p-2 text-center">Occupancy</th>
              <th className="border p-2 text-right">Counter Cash</th>
              <th className="border p-2 text-right">Bank / Online</th>
              <th className="border p-2 text-right">Total (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {busPerformance.map((b) => (
              <tr key={b.busNumber}>
                <td className="border p-2 font-bold">{b.busNumber}</td>
                <td className="border p-2">{b.routeLabel}</td>
                <td className="border p-2 text-center font-mono">{b.tripsCount || 1}</td>
                <td className="border p-2 text-center font-mono">
                  {b.seatsCapacity > 0 ? Math.round((b.bookedSeats / b.seatsCapacity) * 100) : 0}%
                </td>
                <td className="border p-2 text-right font-mono">{b.counterRevenue.toLocaleString()}</td>
                <td className="border p-2 text-right font-mono">{b.digitalRevenue.toLocaleString()}</td>
                <td className="border p-2 text-right font-mono font-bold">{b.totalRevenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-end pt-12 text-xs">
          <div className="text-center">
            <div className="w-44 border-b border-black mb-1" />
            <p className="font-semibold">Prepared By (Cashier / Clerk)</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-black mb-1" />
            <p className="font-semibold">Verified By (Auditor)</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-black mb-1" />
            <p className="font-semibold">Authorized Signatory (Director)</p>
          </div>
        </div>
      </div>

    </div>
  );
};
