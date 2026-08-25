import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { RouteDeploymentForm } from './RouteDeploymentForm';
import { SeatLayoutCustomizerModal } from './SeatLayoutCustomizerModal';
import { RouteDetailsTimetableEditorModal } from './RouteDetailsTimetableEditorModal';
import { QRScannerModal } from '../operator/QRScannerModal';
import { routesApi } from '../../services/api';
import type { BusRoute } from '../../types/booking';
import { 
  TrendingUp, Users, DollarSign, Bus, Award, BarChart2, 
  SlidersHorizontal, Plus, QrCode, Download, ShieldCheck,
  Trash2, RefreshCw, Edit3, Clock, Star, Shield
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, routes, loadRoutes } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'fleet' | 'analytics'>('fleet');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [showSeatBuilder, setShowSeatBuilder] = useState(false);
  const [customizeRoute, setCustomizeRoute] = useState<BusRoute | null>(null);
  const [editDetailsRoute, setEditDetailsRoute] = useState<BusRoute | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [confirmDeleteRouteId, setConfirmDeleteRouteId] = useState<string | null>(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  const manifestBookings = bookings.filter(b => b.routeId === selectedRoute?.id);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.bookingStatus !== 'cancelled' ? b.totalFare : 0), 0);
  const confirmedBookingsCount = bookings.filter(b => b.bookingStatus !== 'cancelled').length;

  const handleDeleteRoute = async (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    if (confirmDeleteRouteId !== routeId) {
      setConfirmDeleteRouteId(routeId);
      setTimeout(() => {
        setConfirmDeleteRouteId(prev => (prev === routeId ? null : prev));
      }, 4000);
      return;
    }

    setDeletingRouteId(routeId);
    setConfirmDeleteRouteId(null);
    try {
      await routesApi.delete(routeId);
      await loadRoutes();
    } catch (err: any) {
      alert(`Failed to delete route: ${err.message}`);
    } finally {
      setDeletingRouteId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Super Admin & Fleet Manager Header */}
      <div className="border-b border-slate-200 pb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Super Admin & Fleet Management Portal</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Fleet & Admin Command
            </span>
          </div>
        </div>

      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        <aside className="w-full lg:w-72 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-4 lg:sticky lg:top-24 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">Admin Navigation</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left ${
                activeTab === 'fleet' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bus className="w-4 h-4" /> Fleet & Route Operations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Revenue & Analytics
            </button>
          </div>

          {activeTab === 'fleet' && (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">Quick Actions</div>
              <button
                onClick={() => {
                  const target = routes.find(r => r.id === selectedRouteId) || routes[0];
                  if (target) setEditDetailsRoute(target);
                }}
                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left"
              >
                <Clock className="w-4 h-4" /> Edit Details & Timetable
              </button>
              <button
                onClick={() => {
                  const target = routes.find(r => r.id === selectedRouteId) || routes[0];
                  if (target) setCustomizeRoute(target);
                }}
                className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left"
              >
                <SlidersHorizontal className="w-4 h-4" /> Customize Seat Layout
              </button>
              <button
                onClick={() => setShowScanner(true)}
                className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left"
              >
                <QrCode className="w-4 h-4" /> Conductor Ticket Validator
              </button>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1 w-full animate-fade-in-up" style={{ animationDelay: '0.25s' }}>

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
            <RouteDeploymentForm onClose={() => setShowSeatBuilder(false)} />
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
                      selectedRouteId === r.id ? 'border-blue-500 bg-blue-50/70 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{r.busNumber}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {r.operatorRating ? Number(r.operatorRating).toFixed(1) : '4.9'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 font-semibold">{r.origin} → {r.destination}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.busType}</p>
                        
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" /> {r.departureTime} - {r.arrivalTime}
                          </span>
                          <span>•</span>
                          <span className="font-bold font-mono text-emerald-700">LKR {r.priceStarting?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                          {r.availableSeatsCount} / {r.totalSeatsCount || r.seats?.length} Seats
                        </span>
                        
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditDetailsRoute(r);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                            title="Edit details, amenities & timetable stops"
                          >
                            <Edit3 className="w-3 h-3" /> Details & Timetable
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomizeRoute(r);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                            title="Customize seating layout"
                          >
                            <SlidersHorizontal className="w-3 h-3" /> Layout
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteRoute(e, r.id)}
                            disabled={deletingRouteId === r.id}
                            title={confirmDeleteRouteId === r.id ? 'Click again to confirm deletion' : 'Delete this route from fleet'}
                            className={`p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                              confirmDeleteRouteId === r.id
                                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-300 animate-pulse px-2'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300'
                            }`}
                          >
                            {deletingRouteId === r.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            {confirmDeleteRouteId === r.id && <span>Confirm?</span>}
                          </button>
                        </div>
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
                <div className="flex items-center gap-2">
                  {selectedRoute && (
                    <button
                      type="button"
                      onClick={() => setEditDetailsRoute(selectedRoute)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Details & Timetable
                    </button>
                  )}
                  <button
                    onClick={() => alert('Downloading Passenger Manifest CSV...')}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 text-blue-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV Export
                  </button>
                </div>
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

        </main>
      </div>

      {/* Modals */}
      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}

      {customizeRoute && (
        <SeatLayoutCustomizerModal
          route={customizeRoute}
          onClose={() => setCustomizeRoute(null)}
        />
      )}

      {editDetailsRoute && (
        <RouteDetailsTimetableEditorModal
          route={editDetailsRoute}
          onClose={() => setEditDetailsRoute(null)}
        />
      )}

    </div>
  );
};
