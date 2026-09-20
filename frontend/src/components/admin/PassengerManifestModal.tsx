import React from 'react';
import type { BusRoute, Booking } from '../../types/booking';
import { X, Printer, Download, Bus, Users } from 'lucide-react';

interface Props {
  route: BusRoute;
  bookings: Booking[];
  onClose: () => void;
}

export const PassengerManifestModal: React.FC<Props> = ({ route, bookings, onClose }) => {
  const activeBookings = bookings.filter(b => b.bookingStatus !== 'cancelled');

  const totalSeats = route.seats?.length || 49;
  const bookedSeatsCount = activeBookings.reduce((sum, b) => {
    if (b.seats && b.seats.length > 0) return sum + b.seats.length;
    if (b.seatNumbers && b.seatNumbers.length > 0) return sum + b.seatNumbers.length;
    return sum + 1;
  }, 0);

  const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);

  const maleCount = activeBookings.filter(b => {
    const g = (b.passenger?.gender || (b as any).gender || '').toLowerCase();
    return g === 'male';
  }).length;

  const femaleCount = activeBookings.filter(b => {
    const g = (b.passenger?.gender || (b as any).gender || '').toLowerCase();
    return g === 'female';
  }).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const header = ['#', 'Seat(s)', 'Passenger Name', 'Gender', 'Phone', 'Boarding Point', 'PNR', 'Payment Method', 'Status', 'Total Fare (LKR)'];
    const rows = activeBookings.map((b, idx) => {
      const seats = (b.seatNumbers && b.seatNumbers.length > 0)
        ? b.seatNumbers.join(';')
        : (b.seats && b.seats.length > 0)
        ? b.seats.map(s => s.number || s.id.replace(/^.*-/, '')).join(';')
        : 'Assigned';
      const name = b.passenger?.fullName || (b as any).passengerName || 'Passenger';
      const gender = b.passenger?.gender || (b as any).gender || 'Unspecified';
      const phone = b.passenger?.phone || (b as any).passengerPhone || '';
      const boarding = b.boardingPoint?.name || route.origin;
      return [
        idx + 1,
        `"${seats}"`,
        `"${name}"`,
        gender,
        `"${phone}"`,
        `"${boarding}"`,
        b.pnr,
        b.paymentMethod || 'Online',
        b.paymentStatus || 'paid',
        b.totalFare || 0
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `passenger_manifest_${route.busNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Printable CSS style tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-manifest, #printable-manifest * {
            visibility: visible;
          }
          #printable-manifest {
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

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Action Bar (hidden in print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">Passenger Travel Manifest</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official passenger boarding register & printable sheet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Manifest Document Content */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6" id="printable-manifest">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-800 dark:border-slate-700 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded bg-slate-900 dark:bg-slate-800 text-white border border-slate-700/50">
                  OFFICIAL PASSENGER MANIFEST
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {route.operatorName || 'National Express Transit'}
                </h2>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-0.5">
                  <span>Bus No: <strong className="font-mono text-slate-900 dark:text-white">{route.busNumber}</strong></span>
                  <span>•</span>
                  <span>Type: <strong className="text-slate-900 dark:text-white">{route.busType}</strong></span>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs space-y-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 sm:bg-transparent sm:dark:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 dark:border-slate-700">
                <p><strong>Route:</strong> {route.origin} → {route.destination}</p>
                <p><strong>Departure:</strong> {route.departureTime} ({route.departureDate || 'Daily Service'})</p>
                <p><strong>Printed On:</strong> {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold block">Capacity & Load</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {bookedSeatsCount} / {totalSeats} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Seats ({Math.round((bookedSeatsCount / totalSeats) * 100)}%)</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold block">Passenger Gender</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                ♂ {maleCount} <span className="text-slate-400 font-normal">|</span> ♀ {femaleCount}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold block">Total Fare Revenue</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                LKR {totalRevenue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold block">Available Vacant</span>
              <span className="text-base font-black text-blue-600 dark:text-blue-400">
                {totalSeats - bookedSeatsCount} Seats
              </span>
            </div>
          </div>

          {/* Manifest Passenger Table */}
          {activeBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-bold">No active bookings recorded for this schedule.</p>
            </div>
          ) : (
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 text-center w-10 border-r border-slate-800">#</th>
                    <th className="p-2.5 border-r border-slate-800 w-20 text-center">Seat(s)</th>
                    <th className="p-2.5 border-r border-slate-800">Passenger Name</th>
                    <th className="p-2.5 border-r border-slate-800 w-16 text-center">Gender</th>
                    <th className="p-2.5 border-r border-slate-800">Contact No</th>
                    <th className="p-2.5 border-r border-slate-800">Boarding Point</th>
                    <th className="p-2.5 border-r border-slate-800 font-mono">PNR</th>
                    <th className="p-2.5 border-r border-slate-800 text-right">Fare (LKR)</th>
                    <th className="p-2.5 text-center w-24">Boarded?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-300">
                  {activeBookings.map((b, idx) => {
                    const seatNumsList = (b.seatNumbers && b.seatNumbers.length > 0)
                      ? b.seatNumbers
                      : (b.seats && b.seats.length > 0)
                      ? b.seats.map(s => s.number || s.id.replace(/^.*-/, ''))
                      : ['-'];
                    const name = b.passenger?.fullName || (b as any).passengerName || 'Passenger';
                    const phone = b.passenger?.phone || (b as any).passengerPhone || 'N/A';
                    const gender = (b.passenger?.gender || (b as any).gender || 'other').toLowerCase();
                    const boarding = b.boardingPoint?.name || route.origin;

                    return (
                      <tr key={b.id || b.pnr} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-850/60'}>
                        <td className="p-2 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">{idx + 1}</td>
                        <td className="p-2 text-center font-mono font-black text-slate-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-950/20">
                          {seatNumsList.join(', ')}
                        </td>
                        <td className="p-2 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                          {name}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-700 capitalize">
                          {gender === 'female' ? '♀ F' : gender === 'male' ? '♂ M' : '-'}
                        </td>
                        <td className="p-2 font-mono text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{phone}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700">{boarding}</td>
                        <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700">{b.pnr}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                          {(b.totalFare || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <div className="w-5 h-5 border-2 border-slate-400 dark:border-slate-500 rounded mx-auto" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Section for Bus Crew */}
          <div className="pt-8 border-t border-slate-300 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-10">
              <p className="font-bold text-slate-800 dark:text-slate-200">Conductor In-Charge:</p>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-44" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Name & Signature</p>
            </div>
            <div className="space-y-10">
              <p className="font-bold text-slate-800 dark:text-slate-200">Driver / Co-Driver:</p>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-44" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Name & Signature</p>
            </div>
            <div className="space-y-10 col-span-2 sm:col-span-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">Station Inspector Stamp:</p>
              <div className="border-b border-dashed border-slate-400 dark:border-slate-600 w-44" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Date & Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
