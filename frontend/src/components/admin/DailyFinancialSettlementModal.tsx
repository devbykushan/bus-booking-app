import React, { useState, useMemo } from 'react';
import type { Booking } from '../../types/booking';
import { X, Printer, Download, DollarSign, Calendar, CreditCard, Banknote, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface Props {
  bookings: Booking[];
  onClose: () => void;
}

export const DailyFinancialSettlementModal: React.FC<Props> = ({ bookings, onClose }) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filter bookings by selected date (either departureDate or createdAt date)
  const dayBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.bookingStatus === 'cancelled') return false;
      const createdDate = b.createdAt ? b.createdAt.split('T')[0] : '';
      const travelDate = b.departureDate || '';
      return createdDate === selectedDate || travelDate === selectedDate;
    });
  }, [bookings, selectedDate]);

  // Breakdown calculations
  const cashBookings = dayBookings.filter(b => b.paymentMethod === 'wallet' || (b as any).paymentMethod === 'cash' || (!b.paymentMethod && b.pnr.startsWith('CTR-')));
  const slipBookings = dayBookings.filter(b => b.paymentMethod === 'bank_transfer');
  const cardBookings = dayBookings.filter(b => b.paymentMethod === 'card' || b.paymentMethod === 'upi' || b.paymentMethod === 'netbanking');

  const cashTotal = cashBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
  const slipTotal = slipBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
  const cardTotal = cardBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
  const grandTotal = cashTotal + slipTotal + cardTotal;

  const totalPassengers = dayBookings.reduce((sum, b) => {
    if (b.seats && b.seats.length > 0) return sum + b.seats.length;
    if (b.seatNumbers && b.seatNumbers.length > 0) return sum + b.seatNumbers.length;
    return sum + 1;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const header = ['PNR', 'Passenger Name', 'Phone', 'Route / Bus', 'Method', 'Status', 'Seats', 'Fare (LKR)', 'Time'];
    const rows = dayBookings.map(b => {
      const name = b.passenger?.fullName || (b as any).passengerName || 'Passenger';
      const phone = b.passenger?.phone || (b as any).passengerPhone || '';
      const route = `${b.busNumber || ''} (${b.origin} -> ${b.destination})`;
      const seatCount = (b.seats && b.seats.length > 0) ? b.seats.length : (b.seatNumbers && b.seatNumbers.length > 0) ? b.seatNumbers.length : 1;
      const method = b.paymentMethod || 'Online';
      return [
        b.pnr,
        `"${name}"`,
        `"${phone}"`,
        `"${route}"`,
        method,
        b.paymentStatus || 'paid',
        seatCount,
        b.totalFare || 0,
        b.createdAt ? b.createdAt.replace('T', ' ').substring(0, 19) : ''
      ].join(',');
    });

    const summaryRow = `\nSUMMARY,Cash Total: LKR ${cashTotal},Slip Total: LKR ${slipTotal},Card Total: LKR ${cardTotal},Grand Total: LKR ${grandTotal},Passengers: ${totalPassengers}`;
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows].join('\n') + summaryRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_settlement_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-settlement, #printable-settlement * {
            visibility: visible;
          }
          #printable-settlement {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top bar */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">Daily Financial Settlement Sheet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Accounting reconciliation for counter cash, bank slips & card transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Date filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-mono text-xs cursor-pointer text-slate-800 dark:text-white"
              />
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100" id="printable-settlement">
          {/* Header */}
          <div className="border-b-2 border-slate-800 dark:border-slate-600 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded bg-emerald-700 text-white">
                  OFFICIAL REVENUE SETTLEMENT
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Daily Collections & Reconciliation Report
                </h2>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                  Reconciliation Date: <strong className="font-mono text-slate-900 dark:text-white">{selectedDate}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs space-y-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 dark:border-slate-700">
                <p><strong>Generated At:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Total Transactions:</strong> {dayBookings.length}</p>
                <p><strong>Total Passenger Seats:</strong> {totalPassengers}</p>
              </div>
            </div>
          </div>

          {/* Settlement Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Cash */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Counter Cash</span>
                <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xl font-black text-amber-900 dark:text-amber-200 font-mono">
                LKR {cashTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">{cashBookings.length} Counter Bookings</p>
            </div>

            {/* Bank Slip */}
            <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">Bank Slips</span>
                <FileSpreadsheet className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-xl font-black text-orange-900 dark:text-orange-200 font-mono">
                LKR {slipTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-orange-700 dark:text-orange-400">{slipBookings.length} Verified Transfers</p>
            </div>

            {/* Card / Online */}
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Card / Online</span>
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-black text-blue-900 dark:text-blue-200 font-mono">
                LKR {cardTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">{cardBookings.length} Gateway Payments</p>
            </div>

            {/* Grand Total */}
            <div className="p-4 rounded-2xl bg-emerald-600 text-white space-y-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Settlement</span>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
              </div>
              <p className="text-2xl font-black font-mono">
                LKR {grandTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-100 font-bold">{dayBookings.length} Bookings Total</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Settlement Ledger Entries ({dayBookings.length})
            </h4>

            {dayBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold">No completed transactions recorded for {selectedDate}.</p>
              </div>
            ) : (
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 dark:bg-slate-950 text-white font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-2.5 font-mono">PNR</th>
                      <th className="p-2.5">Passenger</th>
                      <th className="p-2.5">Route</th>
                      <th className="p-2.5 text-center">Seats</th>
                      <th className="p-2.5 text-center">Method</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/70 font-medium text-slate-700 dark:text-slate-300">
                    {dayBookings.map((b, idx) => {
                      const name = b.passenger?.fullName || (b as any).passengerName || 'Passenger';
                      const seatCount = (b.seats && b.seats.length > 0) ? b.seats.length : (b.seatNumbers && b.seatNumbers.length > 0) ? b.seatNumbers.length : 1;
                      const isCash = b.paymentMethod === 'wallet' || (b as any).paymentMethod === 'cash' || (!b.paymentMethod && b.pnr.startsWith('CTR-'));
                      const isSlip = b.paymentMethod === 'bank_transfer';

                      return (
                        <tr key={b.id || b.pnr} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/50'}>
                          <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">{b.pnr}</td>
                          <td className="p-2 font-bold text-slate-900 dark:text-white">{name}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-300">{b.busNumber} • {b.origin} → {b.destination}</td>
                          <td className="p-2 text-center font-mono font-bold">{seatCount}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isCash 
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' 
                                : isSlip 
                                  ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300' 
                                  : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                            }`}>
                              {isCash ? 'Cash (Counter)' : isSlip ? 'Bank Slip' : 'Card / Online'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              PAID
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-black text-slate-900 dark:text-white">
                            {(b.totalFare || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                      <td colSpan={6} className="p-3 text-right uppercase tracking-wider text-[11px]">
                        Grand Total Settlement:
                      </td>
                      <td className="p-3 text-right font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                        LKR {grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-10">
              <p className="font-bold text-slate-800 dark:text-slate-200">Counter Cashier / Officer:</p>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-44" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Signature & Date</p>
            </div>
            <div className="space-y-10">
              <p className="font-bold text-slate-800 dark:text-slate-200">Finance Manager / Accountant:</p>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-44" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Signature & Date</p>
            </div>
            <div className="space-y-10 col-span-2 sm:col-span-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">Managing Director Stamp:</p>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-44" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Official Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
