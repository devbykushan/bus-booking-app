import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { RouteDeploymentForm } from './RouteDeploymentForm';
import { SeatLayoutCustomizerModal } from './SeatLayoutCustomizerModal';
import { RouteDetailsTimetableEditorModal } from './RouteDetailsTimetableEditorModal';
import { QRScannerModal } from '../operator/QRScannerModal';
import { routesApi, authApi } from '../../services/api';
import type { BusRoute } from '../../types/booking';
import { 
  TrendingUp, Users, DollarSign, Bus, Award, BarChart2, 
  SlidersHorizontal, Plus, QrCode, Download, ShieldCheck,
  Trash2, RefreshCw, Edit3, Clock, Star, Search,
  Mail, Phone, Calendar, Ticket, UserCheck, UserX, Eye, X, CheckCircle2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, routes, loadRoutes } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'fleet' | 'analytics' | 'users'>('fleet');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [showSeatBuilder, setShowSeatBuilder] = useState(false);
  const [customizeRoute, setCustomizeRoute] = useState<BusRoute | null>(null);
  const [editDetailsRoute, setEditDetailsRoute] = useState<BusRoute | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [confirmDeleteRouteId, setConfirmDeleteRouteId] = useState<string | null>(null);

  // ─── User Accounts Management State ───
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState<string>('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<'all' | 'passenger' | 'admin'>('all');
  const [onlyWithBookings, setOnlyWithBookings] = useState<boolean>(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState<any | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  const manifestBookings = bookings.filter(b => b.routeId === selectedRoute?.id);

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.bookingStatus !== 'cancelled' ? b.totalFare : 0), 0);
  const confirmedBookingsCount = bookings.filter(b => b.bookingStatus !== 'cancelled').length;

  // Load users list from backend API
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await authApi.getAllUsers();
      if (res.success && Array.isArray(res.users)) {
        setUsersList(res.users);
      }
    } catch (err: any) {
      console.error('Error loading users in Admin Dashboard:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users list on mount and tab change
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && usersList.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === 'admin' ? 'passenger' : 'admin';
    try {
      const res = await authApi.updateUserRole(user.id, newRole);
      if (res.success) {
        showToast(`User role for ${user.name} changed to ${newRole.toUpperCase()}.`);
        await fetchUsers();
      }
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirmDeleteUserId !== userId) {
      setConfirmDeleteUserId(userId);
      setTimeout(() => {
        setConfirmDeleteUserId(prev => (prev === userId ? null : prev));
      }, 4000);
      return;
    }

    setConfirmDeleteUserId(null);
    try {
      const res = await authApi.deleteUser(userId);
      if (res.success) {
        showToast(res.message || 'User account deleted successfully.');
        await fetchUsers();
      }
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

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

  // Filter users by search query, role, and bookings count with safe null checks
  const filteredUsers = usersList.filter(u => {
    if (!u) return false;
    const nameStr = (u.name || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const phoneStr = u.phone ? String(u.phone) : '';
    const query = usersSearchQuery.trim().toLowerCase();

    const matchesSearch = 
      !query ||
      nameStr.includes(query) ||
      emailStr.includes(query) ||
      phoneStr.includes(query);

    const matchesRole = 
      usersRoleFilter === 'all' || u.role === usersRoleFilter;

    const matchesBookings = 
      !onlyWithBookings || (u.totalBookings && Number(u.totalBookings) > 0);

    return matchesSearch && matchesRole && matchesBookings;
  });

  const totalUsersCount = usersList.length;
  const passengerCount = usersList.filter(u => u && u.role === 'passenger').length;
  const adminCount = usersList.filter(u => u && u.role === 'admin').length;
  const totalUserBookings = usersList.reduce((acc, u) => acc + (u && u.totalBookings ? Number(u.totalBookings) : 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Toast Feedback Notification */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Super Admin & Fleet Manager Header */}
      <div className="border-b border-slate-200 pb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
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
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left ${
                activeTab === 'users' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> User Accounts ({totalUsersCount})
              </div>
              {usersList.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                }`}>
                  {totalUsersCount}
                </span>
              )}
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

      {/* ─── TAB 1: FLEET & ROUTE OPERATIONS ─── */}
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
            <RouteDeploymentForm 
              onClose={() => setShowSeatBuilder(false)} 
              onOpenTimetableEditor={(draftRoute) => {
                setShowSeatBuilder(false);
                setEditDetailsRoute(draftRoute);
              }}
            />
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
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{(r.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditDetailsRoute(r);
                          }}
                          title="Edit Details & Timetable"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteRoute(e, r.id)}
                          disabled={deletingRouteId === r.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            confirmDeleteRouteId === r.id 
                              ? 'bg-rose-600 text-white font-bold animate-pulse px-2.5 text-[10px]' 
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={confirmDeleteRouteId === r.id ? "Click again to confirm delete" : "Delete Route"}
                        >
                          {confirmDeleteRouteId === r.id ? 'Confirm?' : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>LKR {(r.priceStarting || 0).toLocaleString()}</span>
                      <span className="font-mono">{r.seats?.filter(s => s.status === 'booked').length || 0}/{r.seats?.length || 49} Booked</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Passenger Manifest Panel for Selected Route */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Manifest: {selectedRoute ? selectedRoute.busNumber : 'Select a Route'}
                  </h3>
                  {selectedRoute && (
                    <p className="text-xs text-slate-500">
                      {selectedRoute.origin} to {selectedRoute.destination} • {manifestBookings.length} Bookings
                    </p>
                  )}
                </div>

                {selectedRoute && (
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + ["PNR,Passenger Name,Gender,Phone,Seat Count,Seat Numbers,Fare,Status"].join(",") + "\n"
                        + manifestBookings.map(b => {
                            const seatsList = (b.seatNumbers && b.seatNumbers.length > 0) ? b.seatNumbers.join(';') : (b.seats && b.seats.length > 0) ? b.seats.map(s => s.number || s.id).join(';') : 'Assigned';
                            const count = (b.seats && b.seats.length > 0) ? b.seats.length : (b.seatNumbers && b.seatNumbers.length > 0) ? b.seatNumbers.length : 1;
                            const g = b.passenger?.gender || (b as any).gender || 'Unspecified';
                            const name = b.passenger?.fullName || (b as any).passengerName || 'Passenger';
                            const phone = b.passenger?.phone || (b as any).passengerPhone || '';
                            return `${b.pnr},"${name}",${g},${phone},${count},"${seatsList}",${b.totalFare},${b.bookingStatus}`;
                          }).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `manifest_${selectedRoute.busNumber}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Manifest
                  </button>
                )}
              </div>

              {manifestBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Ticket className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold">No passenger bookings recorded for this route yet.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-x-auto">
                  {manifestBookings.map(b => {
                    const seatNumsList = (b.seatNumbers && b.seatNumbers.length > 0) 
                      ? b.seatNumbers 
                      : (b.seats && b.seats.length > 0) 
                      ? b.seats.map(s => s.number || s.id.replace(/^.*-/, '')) 
                      : ['Assigned'];

                    const formattedSeatNumbers = seatNumsList.join(', ');
                    const seatCount = (b.seats && b.seats.length > 0) 
                      ? b.seats.length 
                      : (b.seatNumbers && b.seatNumbers.length > 0) 
                      ? b.seatNumbers.length 
                      : 1;

                    const passengerName = b.passenger?.fullName || (b as any).passengerName || 'Passenger';
                    const passengerPhone = b.passenger?.phone || (b as any).passengerPhone || 'N/A';
                    const gender = b.passenger?.gender || (b as any).gender || 'female';

                    return (
                      <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        
                        {/* Passenger Name, PNR, Phone & Gender */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-extrabold text-slate-900 text-sm">{passengerName}</p>

                            {/* Gender Badge (Male ♂️ / Female ♀️) */}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              gender === 'female'
                                ? 'bg-pink-50 text-pink-700 border-pink-200'
                                : gender === 'male'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {gender === 'female' ? '♀ Female' : gender === 'male' ? '♂ Male' : '👤 Passenger'}
                            </span>

                            {/* Booked Seat Count Badge */}
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                              {seatCount} {seatCount === 1 ? 'Seat' : 'Seats'}
                            </span>
                          </div>

                          <p className="text-slate-500 text-[11px] font-mono flex items-center gap-2">
                            <span>PNR: <strong className="text-blue-600 font-bold">{b.pnr}</strong></span>
                            <span>•</span>
                            <span>{passengerPhone}</span>
                          </p>
                        </div>

                        {/* Seat Numbers & Total Price */}
                        <div className="text-left sm:text-right space-y-1 shrink-0">
                          <div className="flex items-center sm:justify-end gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seat(s):</span>
                            <span className="font-mono font-black text-slate-900 text-sm bg-white px-2.5 py-1 rounded-xl border border-slate-300 shadow-2xs">
                              {formattedSeatNumbers}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold font-mono text-emerald-600">
                            LKR {(b.totalFare || 0).toLocaleString()}
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ─── TAB 2: REVENUE & ANALYTICS ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Gross Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">LKR {totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% from last month
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Confirmed Tickets</span>
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{confirmedBookingsCount}</p>
              <p className="text-xs text-blue-600 font-semibold">Across {routes.length} active fleet routes</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Accounts</span>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{totalUsersCount}</p>
              <p className="text-xs text-indigo-600 font-semibold">{passengerCount} Passengers • {adminCount} Admins</p>
            </div>
          </div>

          {/* Operator Commission Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Award className="w-5 h-5 text-indigo-600" /> Fleet Operator Revenue Shares
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">Dewmina Super Line</p>
                <p className="text-slate-500 text-[11px]">8 Active Buses • 10% Platform Fee</p>
                <p className="font-mono font-bold text-emerald-600 text-sm pt-2">LKR 684,000.00</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">Royal Express LK</p>
                <p className="text-slate-500 text-[11px]">6 Active Buses • 10% Platform Fee</p>
                <p className="font-mono font-bold text-emerald-600 text-sm pt-2">LKR 492,000.00</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">Lanka Ashok Leyland Air Bus</p>
                <p className="text-slate-500 text-[11px]">4 Active Buses • 12% Platform Fee</p>
                <p className="font-mono font-bold text-emerald-600 text-sm pt-2">LKR 315,000.00</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 3: USER ACCOUNTS & MANAGEMENT ─── */}
      {activeTab === 'users' && (
        <div className="space-y-8 animate-fade-in-up">
          
          {/* User Metrics Banner with Interactive Filtering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Accounts */}
            <div
              onClick={() => {
                setUsersRoleFilter('all');
                setOnlyWithBookings(false);
              }}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                usersRoleFilter === 'all' && !onlyWithBookings
                  ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl ring-4 ring-purple-500/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between opacity-80">
                <span className="text-xs font-bold uppercase tracking-wider">Total Accounts</span>
                <Users className={`w-5 h-5 ${usersRoleFilter === 'all' && !onlyWithBookings ? 'text-purple-300' : 'text-purple-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{totalUsersCount}</p>
              <div className="flex items-center justify-between">
                <p className={`text-[11px] font-medium ${usersRoleFilter === 'all' && !onlyWithBookings ? 'text-purple-200' : 'text-slate-500'}`}>
                  Registered in OmniBus Neon DB
                </p>
                {usersRoleFilter === 'all' && !onlyWithBookings && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-400/30 text-purple-200 border border-purple-300/30">
                    Showing All
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Passenger Accounts */}
            <div
              onClick={() => {
                setUsersRoleFilter('passenger');
                setOnlyWithBookings(false);
              }}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                usersRoleFilter === 'passenger' && !onlyWithBookings
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl ring-4 ring-blue-400/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${usersRoleFilter === 'passenger' && !onlyWithBookings ? 'text-blue-100' : 'text-slate-500'}`}>
                  Passenger Accounts
                </span>
                <UserCheck className={`w-5 h-5 ${usersRoleFilter === 'passenger' && !onlyWithBookings ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{passengerCount}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${usersRoleFilter === 'passenger' && !onlyWithBookings ? 'text-blue-100' : 'text-blue-600'}`}>
                  Standard passengers & travelers
                </p>
                {usersRoleFilter === 'passenger' && !onlyWithBookings && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                    Filtered
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: System Admins */}
            <div
              onClick={() => {
                setUsersRoleFilter('admin');
                setOnlyWithBookings(false);
              }}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                usersRoleFilter === 'admin' && !onlyWithBookings
                  ? 'bg-gradient-to-br from-purple-700 to-indigo-800 text-white shadow-xl ring-4 ring-purple-400/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${usersRoleFilter === 'admin' && !onlyWithBookings ? 'text-purple-100' : 'text-slate-500'}`}>
                  System Admins
                </span>
                <ShieldCheck className={`w-5 h-5 ${usersRoleFilter === 'admin' && !onlyWithBookings ? 'text-white' : 'text-purple-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{adminCount}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${usersRoleFilter === 'admin' && !onlyWithBookings ? 'text-purple-100' : 'text-purple-600'}`}>
                  Fleet managers & super admins
                </p>
                {usersRoleFilter === 'admin' && !onlyWithBookings && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                    Filtered
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: User Bookings Total */}
            <div
              onClick={() => {
                setOnlyWithBookings(!onlyWithBookings);
              }}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                onlyWithBookings
                  ? 'bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-xl ring-4 ring-emerald-400/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${onlyWithBookings ? 'text-emerald-100' : 'text-slate-500'}`}>
                  User Bookings Total
                </span>
                <Ticket className={`w-5 h-5 ${onlyWithBookings ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{totalUserBookings}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${onlyWithBookings ? 'text-emerald-100' : 'text-emerald-600'}`}>
                  Associated with user accounts
                </p>
                {onlyWithBookings && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                    Has Bookings
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* User Accounts Management Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-6 border-b border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" /> Registered User Accounts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect user registration details, mobile contacts, role privileges, and account history.
                  </p>
                </div>

                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin text-purple-600' : ''}`} />
                  <span>Refresh Users</span>
                </button>
              </div>

              {/* Real-time Search & Role Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={usersSearchQuery}
                    onChange={(e) => setUsersSearchQuery(e.target.value)}
                    placeholder="Search users by name, email, or Sri Lankan phone number…"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  {usersSearchQuery && (
                    <button
                      onClick={() => setUsersSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setUsersRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      usersRoleFilter === 'all'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({totalUsersCount})
                  </button>
                  <button
                    onClick={() => setUsersRoleFilter('passenger')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      usersRoleFilter === 'passenger'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Passengers ({passengerCount})
                  </button>
                  <button
                    onClick={() => setUsersRoleFilter('admin')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      usersRoleFilter === 'admin'
                        ? 'bg-white text-purple-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Admins ({adminCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Users List Data Table */}
            {usersLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-purple-500" />
                <p className="text-xs font-semibold">Loading user accounts from Neon DB…</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <UserX className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No user accounts found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {usersSearchQuery
                    ? `No accounts matching "${usersSearchQuery}". Try clearing search keywords.`
                    : 'No user accounts recorded in database.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Mobile Phone</th>
                      <th className="px-6 py-4">Role & Access</th>
                      <th className="px-6 py-4">Registered Date</th>
                      <th className="px-6 py-4 text-center">Bookings</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const formattedDate = u.createdAt ? new Date(u.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }) : 'N/A';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* User Name & Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xs ${
                                u.role === 'admin'
                                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                                  : 'bg-gradient-to-tr from-blue-600 to-cyan-600'
                              }`}>
                                {(u.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 text-sm">{u.name || 'User'}</p>
                                <p className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" /> {u.email || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Mobile Phone */}
                          <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                            {u.phone ? (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                {u.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">Not provided</span>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                {u.role}
                              </span>

                              <button
                                onClick={() => handleToggleRole(u)}
                                title={`Switch role to ${u.role === 'admin' ? 'passenger' : 'admin'}`}
                                className="text-[10px] font-bold text-slate-400 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              >
                                Toggle
                              </button>
                            </div>
                          </td>

                          {/* Registered Date */}
                          <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formattedDate}
                            </div>
                          </td>

                          {/* Total Bookings */}
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-mono font-extrabold text-xs ${
                              u.totalBookings > 0
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {u.totalBookings || 0}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedUserForModal(u)}
                                title="View User Account Details"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                  confirmDeleteUserId === u.id
                                    ? 'bg-rose-600 text-white font-bold text-[10px] animate-pulse px-3'
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                                }`}
                                title={confirmDeleteUserId === u.id ? 'Click again to confirm deletion' : 'Delete Account'}
                              >
                                {confirmDeleteUserId === u.id ? 'Confirm?' : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

        </main>
      </div>

      {/* ── Modal 1: User Account Details Inspect Modal ── */}
      {selectedUserForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md ${
                  selectedUserForModal.role === 'admin'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-600'
                }`}>
                  {(selectedUserForModal.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedUserForModal.name || 'User'}</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    selectedUserForModal.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedUserForModal.role || 'passenger'} Account
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Details Box */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-bold">User Account ID</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">{selectedUserForModal.id}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-bold">Email Address</span>
                <span className="font-mono font-bold text-slate-900">{selectedUserForModal.email || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-bold">Mobile Phone</span>
                <span className="font-mono font-bold text-slate-900">{selectedUserForModal.phone || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-bold">Registration Timestamp</span>
                <span className="font-mono text-slate-700">
                  {selectedUserForModal.createdAt ? new Date(selectedUserForModal.createdAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'N/A'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-emerald-900">
                <span className="font-bold">Total Confirmed Bookings</span>
                <span className="font-mono font-black text-sm">{selectedUserForModal.totalBookings || 0} Tickets</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Details
              </button>
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

      {editDetailsRoute && (
        <RouteDetailsTimetableEditorModal
          route={editDetailsRoute}
          onClose={() => setEditDetailsRoute(null)}
        />
      )}

    </div>
  );
};
