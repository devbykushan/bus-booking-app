import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { SeatLayoutCustomizerModal } from './SeatLayoutCustomizerModal';
import { QRScannerModal } from '../operator/QRScannerModal';
import { routesApi } from '../../services/api';
import type { BusRoute } from '../../types/booking';
import { 
  TrendingUp, Users, DollarSign, Bus, Shield, Award, BarChart2, 
  SlidersHorizontal, Plus, QrCode, LayoutGrid, Download, ShieldCheck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, routes, loadRoutes } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'fleet' | 'analytics'>('fleet');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [showSeatBuilder, setShowSeatBuilder] = useState(false);
  const [customizeRoute, setCustomizeRoute] = useState<BusRoute | null>(null);

  // New Route Deploy Form State
  const [newOperatorName, setNewOperatorName] = useState('Dewmina Super Line');
  const [newBusNumber, setNewBusNumber] = useState('ND-8899 (Lanka Ashok Leyland)');
  const [newOrigin, setNewOrigin] = useState('Monaragala');
  const [newDestination, setNewDestination] = useState('Colombo');
  const [newDepTime] = useState('10:00 AM');
  const [newPrice, setNewPrice] = useState(1800);
  const [newBusType, setNewBusType] = useState<any>('Lanka Ashok Leyland (57 Seats 3*2)');

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  const manifestBookings = bookings.filter(b => b.routeId === selectedRoute?.id);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.bookingStatus !== 'cancelled' ? b.totalFare : 0), 0);
  const confirmedBookingsCount = bookings.filter(b => b.bookingStatus !== 'cancelled').length;

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
      
      {/* Super Admin & Fleet Manager Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Super Admin & Fleet Management Portal</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Fleet & Admin Command
            </span>
          </div>
          <p className="text-xs text-slate-500">Manage 57-seat Leyland bus schedules, seat layouts, conductor QR tickets, and platform revenue.</p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'fleet' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Bus className="w-4 h-4" /> Fleet & Route Operations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Revenue & Analytics
            </button>
          </div>

          {activeTab === 'fleet' && (
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" /> Conductor Ticket Validator
            </button>
          )}
        </div>
      </div>

      {/* ─── TAB 1: FLEET & ROUTE OPERATIONS (Operator + Admin features) ─── */}
      {activeTab === 'fleet' && (
        <div className="space-y-8">
          
          {/* Top Fleet Toolbar */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Active Bus Fleet Management</h3>
            <button
              onClick={() => setShowSeatBuilder(!showSeatBuilder)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Deploy New Bus / Schedule
            </button>
          </div>

          {/* New Bus Deployment Form */}
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

          {/* Fleet Grid & Passenger Manifest Split Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Bus Fleet Route Cards */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Fleet Routes ({routes.length})
              </h4>

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
                            setCustomizeRoute(r);
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

            {/* Passenger Manifest Panel */}
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
                <div className="text-center py-12 text-slate-400 text-xs">
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

        </div>
      )}

      {/* ─── TAB 2: REVENUE & EXECUTIVE ANALYTICS ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Gross Platform Revenue</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800 font-mono">LKR {(totalRevenue + 485000.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4% from last month
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Completed Bookings</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800 font-mono">{confirmedBookingsCount + 342}</p>
              <p className="text-[11px] text-blue-600 font-semibold">Avg 4.8 seats per transaction</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Bus Fleet</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Bus className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800 font-mono">{routes.length + 18}</p>
              <p className="text-[11px] text-amber-600 font-semibold">Across 12 Bus Operators</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Solo Female Bookings</span>
                <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-pink-600 font-mono">42.8%</p>
              <p className="text-[11px] text-pink-600 font-semibold">Pink Reserved Seats Policy Active</p>
            </div>

          </div>

          {/* Popular Bus Routes & Operator Payout Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Popular Routes Ranking */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" /> Route Performance & Occupancy
                </span>
              </h3>

              <div className="space-y-4 text-xs">
                {routes.map(r => {
                  const total = r.totalSeatsCount || r.seats?.length || 57;
                  const occupancy = Math.round(((total - r.availableSeatsCount) / total) * 100);
                  return (
                    <div key={r.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <div>
                          <span className="font-bold text-sm">{r.origin} → {r.destination}</span>
                          <span className="text-xs text-slate-500 font-normal ml-2">({r.operatorName})</span>
                          <p className="text-[11px] text-blue-600 font-mono">{r.busType} • {total} Seats</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Live Occupancy</span>
                          <span className="text-blue-600 font-mono font-bold">{occupancy}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${occupancy}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operator Commission Summary */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Award className="w-5 h-5 text-indigo-600" /> Operator Commission Shares
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Dewmina Super Line</p>
                    <p className="text-slate-500 text-[11px]">8 Active Buses • 10% Platform Fee</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">LKR 684,000.00</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Royal Express LK</p>
                    <p className="text-slate-500 text-[11px]">6 Active Buses • 10% Platform Fee</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">LKR 492,000.00</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Lanka Ashok Leyland Air Bus</p>
                    <p className="text-slate-500 text-[11px]">4 Active Buses • 12% Platform Fee</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">LKR 315,000.00</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Modals */}
      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}

      {customizeRoute && (
        <SeatLayoutCustomizerModal
          route={customizeRoute}
          onClose={() => setCustomizeRoute(null)}
        />
      )}

    </div>
  );
};
