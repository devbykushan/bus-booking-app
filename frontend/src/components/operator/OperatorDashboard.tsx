import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QRScannerModal } from './QRScannerModal';
import { routesApi } from '../../services/api';
import { QrCode, Plus, Users, LayoutGrid, Download } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { routes, bookings, loadRoutes } = useBookingStore();

  const [showScanner, setShowScanner] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [showSeatBuilder, setShowSeatBuilder] = useState(false);

  const [newOperatorName, setNewOperatorName] = useState('OmniExpress Lines');
  const [newBusNumber, setNewBusNumber] = useState('OMNI-7070');
  const [newOrigin, setNewOrigin] = useState('New York, NY');
  const [newDestination, setNewDestination] = useState('Washington, DC');
  const [newDepTime] = useState('10:00 AM');
  const [newPrice, setNewPrice] = useState(40);
  const [newBusType, setNewBusType] = useState<'AC Sleeper' | 'Luxury Volvo Multi-Axle' | 'Double Decker Sleeper'>('AC Sleeper');

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
        amenities: ['Wi-Fi', 'Power Outlet', 'Live GPS'],
      });
      // Refresh routes from backend
      await loadRoutes();
      setShowSeatBuilder(false);
      alert(`Bus Route ${newBusNumber} successfully deployed to live fleet!`);
    } catch (err: any) {
      alert(`Failed to deploy route: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Bus Operator Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold">
              Fleet Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">Manage bus schedules, customize seat grid layouts, and scan passenger QR tickets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Conductor Ticket Validator
          </button>

          <button
            onClick={() => setShowSeatBuilder(!showSeatBuilder)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-teal-400" /> Deploy New Bus / Route
          </button>
        </div>
      </div>

      {showSeatBuilder && (
        <form onSubmit={handleCreateRoute} className="glass-panel p-6 rounded-3xl border border-teal-500/40 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <LayoutGrid className="w-5 h-5 text-teal-400" /> Route & Visual Seat Layout Designer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Operator Name</label>
              <input type="text" value={newOperatorName} onChange={e => setNewOperatorName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Bus Reg. Number</label>
              <input type="text" value={newBusNumber} onChange={e => setNewBusNumber(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Bus Type Category</label>
              <select value={newBusType} onChange={(e: any) => setNewBusType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white">
                <option value="AC Sleeper">AC Sleeper</option>
                <option value="Luxury Volvo Multi-Axle">Luxury Volvo Multi-Axle</option>
                <option value="Double Decker Sleeper">Double Decker Sleeper</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Origin City</label>
              <input type="text" value={newOrigin} onChange={e => setNewOrigin(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Destination City</label>
              <input type="text" value={newDestination} onChange={e => setNewDestination(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Base Price ($)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowSeatBuilder(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs">
              Deploy Bus to Live Fleet
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>Active Bus Fleet ({routes.length})</span>
            <span className="text-xs text-slate-400">Click to view passenger manifest</span>
          </h3>

          <div className="space-y-3">
            {routes.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`glass-card p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRouteId === r.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{r.busNumber}</h4>
                    <p className="text-xs text-teal-400">{r.origin} → {r.destination}</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 text-xs font-mono">
                    {r.availableSeatsCount} / {r.totalSeatsCount} Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Passenger Trip Manifest
              </h3>
              <p className="text-xs text-slate-400">{selectedRoute?.busNumber} • {selectedRoute?.origin} → {selectedRoute?.destination}</p>
            </div>
            <button
              onClick={() => alert('Downloading Passenger Manifest CSV...')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-teal-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>
          </div>

          {manifestBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No confirmed passengers booked for this route yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">PNR</th>
                    <th className="py-2.5 px-3">Passenger</th>
                    <th className="py-2.5 px-3">Seats</th>
                    <th className="py-2.5 px-3">Boarding Stop</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {manifestBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-400">{b.pnr}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{b.passenger.fullName}</div>
                        <div className="text-[10px] text-slate-400">{b.passenger.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono text-indigo-300">
                        {b.seats.map(s => s.number).join(', ')}
                      </td>
                      <td className="py-2.5 px-3">{b.boardingPoint.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'boarded' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
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
    </div>
  );
};
