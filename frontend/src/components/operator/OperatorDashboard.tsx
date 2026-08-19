import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QRScannerModal } from './QRScannerModal';
import { SeatLayoutCustomizerModal } from '../admin/SeatLayoutCustomizerModal';
import { routesApi } from '../../services/api';
import type { BusRoute } from '../../types/booking';
import { QrCode, Plus, Users, LayoutGrid, Download, SlidersHorizontal } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { routes, bookings, loadRoutes } = useBookingStore();

  const [showScanner, setShowScanner] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [showSeatBuilder, setShowSeatBuilder] = useState(false);
  const [customizeRouteModal, setCustomizeRouteModal] = useState<BusRoute | null>(null);

  const [newOperatorName, setNewOperatorName] = useState('Dewmina Super Line');
  const [newBusNumber, setNewBusNumber] = useState('ND-8899 (Lanka Ashok Leyland)');
  const [newOrigin, setNewOrigin] = useState('Monaragala');
  const [newDestination, setNewDestination] = useState('Colombo');
  const [newDepTime] = useState('10:00 AM');
  const [newPrice, setNewPrice] = useState(1800);
  const [newBusType, setNewBusType] = useState<any>('Lanka Ashok Leyland (57 Seats 3*2)');

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  const manifestBookings = bookings.filter(b => b.routeId === selectedRoute?.id);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `route-${Date.now()}`;
    try {
      await routesApi.create({
        id: newId,
        operatorId: 'op-custom',
        operatorName: newOperatorName,
        operatorRating: 4.9,
        busNumber: newBusNumber,
        busType: newBusType,
        origin: newOrigin,
        destination: newDestination,
        departureTime: newDepTime,
        arrivalTime: '03:30 PM',
        duration: '5h 30m',
        priceStarting: newPrice,
        hasUpperDeck: newBusType.includes('Double') || newBusType.includes('Sleeper'),
        amenities: ['Wi-Fi', 'AC', 'Live GPS'],
      });
      await loadRoutes();
      setShowSeatBuilder(false);
      alert(`Bus Route ${newBusNumber} successfully deployed to live fleet!`);
    } catch (err: any) {
      alert(`Failed to deploy route: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bus Operator Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold">
              Fleet Admin
            </span>
          </div>
          <p className="text-xs text-slate-500">Manage bus schedules, customize 57-seat Leyland grid layouts, and scan passenger QR tickets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Conductor Ticket Validator
          </button>

          <button
            onClick={() => setShowSeatBuilder(!showSeatBuilder)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Deploy New Bus / Route
          </button>
        </div>
      </div>

      {showSeatBuilder && (
        <form onSubmit={handleCreateRoute} className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" /> Route & Visual Seat Layout Designer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Operator Name</label>
              <input type="text" value={newOperatorName} onChange={e => setNewOperatorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Bus Reg. Number</label>
              <input type="text" value={newBusNumber} onChange={e => setNewBusNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold text-blue-600">Bus Model & Seating</label>
              <select value={newBusType} onChange={(e: any) => setNewBusType(e.target.value)} className="w-full bg-slate-50 border border-blue-300 rounded-xl p-2.5 text-slate-800 font-bold">
                <option value="Lanka Ashok Leyland (57 Seats 3*2)">🚌 Lanka Ashok Leyland (57 Seats 3*2)</option>
                <option value="Lanka Ashok Leyland (57 Seats 2*2)">🚌 Lanka Ashok Leyland (57 Seats 2*2)</option>
                <option value="AC Sleeper">🛋️ AC Sleeper (36 Seats)</option>
                <option value="Luxury Volvo Multi-Axle">🚍 Luxury Volvo Multi-Axle (40 Seats)</option>
                <option value="Double Decker Sleeper">🚌 Double Decker Sleeper (48 Seats)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Origin City</label>
              <input type="text" value={newOrigin} onChange={e => setNewOrigin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Destination City</label>
              <input type="text" value={newDestination} onChange={e => setNewDestination(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Base Price (LKR)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowSeatBuilder(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-sm">
              Deploy Bus to Live Fleet
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
            <span>Active Bus Fleet ({routes.length})</span>
            <span className="text-xs text-slate-400">Click route to manage layout</span>
          </h3>

          <div className="space-y-3">
            {routes.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRouteId === r.id ? 'border-blue-500 bg-blue-50' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{r.busNumber}</h4>
                    <p className="text-xs text-blue-600">{r.origin} → {r.destination}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.busType}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                      {r.availableSeatsCount} / {r.totalSeatsCount || r.seats?.length} Seats
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomizeRouteModal(r);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      <SlidersHorizontal className="w-3 h-3" /> Customize Layout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Passenger Trip Manifest
              </h3>
              <p className="text-xs text-slate-500">{selectedRoute?.busNumber} • {selectedRoute?.origin} → {selectedRoute?.destination}</p>
            </div>
            <button
              onClick={() => alert('Downloading Passenger Manifest CSV...')}
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-blue-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>
          </div>

          {manifestBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No confirmed passengers booked for this route yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="py-2.5 px-3">PNR</th>
                    <th className="py-2.5 px-3">Passenger</th>
                    <th className="py-2.5 px-3">Seats</th>
                    <th className="py-2.5 px-3">Boarding Stop</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {manifestBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{b.pnr}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{b.passenger.fullName}</div>
                        <div className="text-[10px] text-slate-400">{b.passenger.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono text-indigo-600">
                        {b.seats.map(s => s.number).join(', ')}
                      </td>
                      <td className="py-2.5 px-3">{b.boardingPoint.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'boarded' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}

      {customizeRouteModal && (
        <SeatLayoutCustomizerModal
          route={customizeRouteModal}
          onClose={() => setCustomizeRouteModal(null)}
        />
      )}
    </div>
  );
};
