import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QRScannerModal } from './QRScannerModal';
import { SeatLayoutCustomizerModal } from '../admin/SeatLayoutCustomizerModal';
import { RouteDetailsTimetableEditorModal } from '../admin/RouteDetailsTimetableEditorModal';
import { RouteDeploymentForm } from '../admin/RouteDeploymentForm';
import { routesApi } from '../../services/api';
import type { BusRoute } from '../../types/booking';
import { QrCode, Plus, Users, Download, SlidersHorizontal, Trash2, RefreshCw, Edit3, Clock } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { routes, bookings, loadRoutes } = useBookingStore();

  const [showScanner, setShowScanner] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [showSeatBuilder, setShowSeatBuilder] = useState(false);
  const [customizeRouteModal, setCustomizeRouteModal] = useState<BusRoute | null>(null);
  const [editDetailsRoute, setEditDetailsRoute] = useState<BusRoute | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [confirmDeleteRouteId, setConfirmDeleteRouteId] = useState<string | null>(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  const manifestBookings = bookings.filter(b => b.routeId === selectedRoute?.id);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Bus Operator Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
              Fleet Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage bus schedules, customize 57-seat Leyland grid layouts, and scan passenger QR tickets.</p>
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
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Deploy New Bus / Route
          </button>
        </div>
      </div>

      {showSeatBuilder && (
        <RouteDeploymentForm onClose={() => setShowSeatBuilder(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center justify-between">
            <span>Active Bus Fleet ({routes.length})</span>
            <span className="text-xs text-slate-400">Click route to manage layout</span>
          </h3>

          <div className="space-y-3">
            {routes.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRouteId === r.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{r.busNumber}</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{r.origin} → {r.destination}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{r.busType}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> {r.departureTime} - {r.arrivalTime}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold">
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
                          >
                            <Edit3 className="w-3 h-3" /> Details & Timetable
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomizeRouteModal(r);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105"
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
                                : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
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

        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Passenger Trip Manifest
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRoute?.busNumber} • {selectedRoute?.origin} → {selectedRoute?.destination}</p>
            </div>
            <button
              onClick={() => alert('Downloading Passenger Manifest CSV...')}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>
          </div>

          {manifestBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No confirmed passengers booked for this route yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                    <th className="py-2.5 px-3">PNR</th>
                    <th className="py-2.5 px-3">Passenger</th>
                    <th className="py-2.5 px-3">Seats</th>
                    <th className="py-2.5 px-3">Boarding Stop</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                  {manifestBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{b.pnr}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-white">{b.passenger.fullName}</div>
                        <div className="text-[10px] text-slate-400">{b.passenger.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {b.seats.map(s => s.number).join(', ')}
                      </td>
                      <td className="py-2.5 px-3">{b.boardingPoint.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'boarded' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
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

      {editDetailsRoute && (
        <RouteDetailsTimetableEditorModal
          route={editDetailsRoute}
          onClose={() => setEditDetailsRoute(null)}
        />
      )}
    </div>
  );
};
