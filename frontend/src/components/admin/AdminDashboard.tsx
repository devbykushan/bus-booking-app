import React, { useState, useEffect, useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { RouteDeploymentForm } from './RouteDeploymentForm';
import { SeatLayoutCustomizerModal } from './SeatLayoutCustomizerModal';
import { RouteDetailsTimetableEditorModal } from './RouteDetailsTimetableEditorModal';
import { TimetableManager } from './TimetableManager';
import { QRScannerModal } from '../operator/QRScannerModal';
import { WhatsAppManagerSection } from './WhatsAppManagerModal';
import { CounterBookingView } from './CounterBookingView';
import { StaffManagementSection } from './StaffManagementSection';
import { PassengerManifestModal } from './PassengerManifestModal';
import { BroadcastAnnouncementModal } from './BroadcastAnnouncementModal';
import { PromoCodesManager } from './PromoCodesManager';
import { DailyFinancialSettlementModal } from './DailyFinancialSettlementModal';
import { SeatBlockManagerModal } from './SeatBlockManagerModal';
import { LiveMap } from '../passenger/LiveMap';
import { routesApi, authApi, paymentSlipsApi } from '../../services/api';
import type { BusRoute } from '../../types/booking';
import { 
  TrendingUp, Users, DollarSign, Bus, Award, BarChart2, 
  SlidersHorizontal, Plus, QrCode, Download, ShieldCheck,
  Trash2, RefreshCw, Edit3, Clock, Star, Search,
  Mail, Phone, Calendar, Ticket, UserCheck, UserX, Eye, X, CheckCircle2, FileText, MessageSquare, Menu, Shield,
  Printer, Wrench, MapPin, ArrowLeft, ChevronDown, ChevronUp, Layers, Filter, Sparkles
} from 'lucide-react';

export type AdminDashboardTab = 'fleet' | 'timetables' | 'analytics' | 'users' | 'payment-slips' | 'whatsapp' | 'counter-booking' | 'staff' | 'promos' | 'live-gps';

interface AdminDashboardProps {
  mode?: 'operations' | 'master';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ mode }) => {
  const { bookings, routes, loadRoutes, loadBookings, currentUser, adminActiveTab, setAdminActiveTab, currentView, setCurrentView } = useBookingStore();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const isMasterMode = mode === 'master' || currentView === 'master-management';
  const isSlipsMode = !isMasterMode && adminActiveTab === 'payment-slips';

  const hasPermission = (permKey: string): boolean => {
    if (isSuperAdmin) return true;
    // For now, all standard admins get full operational access across all operational tabs
    if (currentUser?.role === 'admin') {
      return true;
    }
    return currentUser?.permissions?.includes(permKey) || false;
  };

  const getDefaultTab = (): AdminDashboardTab => {
    if (isMasterMode) {
      if (adminActiveTab && ['fleet', 'timetables', 'whatsapp', 'staff', 'users'].includes(adminActiveTab)) {
        return adminActiveTab as AdminDashboardTab;
      }
      return 'fleet';
    }
    if (adminActiveTab && ['counter-booking', 'analytics', 'live-gps', 'promos', 'payment-slips'].includes(adminActiveTab)) {
      return adminActiveTab as AdminDashboardTab;
    }
    if (hasPermission('counter_booking')) return 'counter-booking';
    return 'analytics';
  };

  const [activeTab, setActiveTabState] = useState<AdminDashboardTab>(() => {
    return getDefaultTab();
  });

  const setActiveTab = (tab: AdminDashboardTab) => {
    setActiveTabState(tab);
    setAdminActiveTab(tab);
  };

  useEffect(() => {
    if (isMasterMode) {
      const masterTabs = ['fleet', 'timetables', 'whatsapp', 'staff', 'users'];
      if (adminActiveTab && masterTabs.includes(adminActiveTab)) {
        if (adminActiveTab !== activeTab) {
          setActiveTabState(adminActiveTab as AdminDashboardTab);
        }
      } else if (!masterTabs.includes(activeTab)) {
        setActiveTabState('fleet');
      }
    } else {
      const opsTabs = ['counter-booking', 'analytics', 'live-gps', 'promos', 'payment-slips'];
      if (adminActiveTab && opsTabs.includes(adminActiveTab)) {
        if (adminActiveTab !== activeTab) {
          setActiveTabState(adminActiveTab as AdminDashboardTab);
        }
      } else if (!opsTabs.includes(activeTab)) {
        setActiveTabState('counter-booking');
      }
    }
  }, [adminActiveTab, isMasterMode]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
  const [passengerFilter, setPassengerFilter] = useState<'all' | 'with-bookings' | 'without-bookings'>('all');
  const [selectedUserForModal, setSelectedUserForModal] = useState<any | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Payment Slips state
  const [paymentSlips, setPaymentSlips] = useState<any[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(false);
  const [selectedSlipImage, setSelectedSlipImage] = useState<{ src: string; pnr: string; isPdf?: boolean } | null>(null);
  const [processingSlipId, setProcessingSlipId] = useState<string | null>(null);
  const [slipFilter, setSlipFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredSlips = useMemo(() => {
    if (slipFilter === 'all') return paymentSlips;
    return paymentSlips.filter(s => s.status === slipFilter);
  }, [paymentSlips, slipFilter]);

  // New Modals State
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showDailySettlementModal, setShowDailySettlementModal] = useState(false);
  const [showSeatBlockModal, setShowSeatBlockModal] = useState(false);
  const [fleetMobileView, setFleetMobileView] = useState<'routes' | 'manifest'>('routes');

  // ─── Fleet Filter & Organization State ───
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [fleetDateFilter, setFleetDateFilter] = useState<'today' | 'tomorrow' | 'custom' | 'all'>('today');
  const [customFleetDate, setCustomFleetDate] = useState<string>(todayStr);
  const [fleetSearchQuery, setFleetSearchQuery] = useState<string>('');
  const [fleetGroupByBus, setFleetGroupByBus] = useState<boolean>(false);
  const [expandedBuses, setExpandedBuses] = useState<Record<string, boolean>>({});

  const toggleExpandBus = (busNo: string) => {
    setExpandedBuses(prev => ({ ...prev, [busNo]: !prev[busNo] }));
  };

  // Filtered Fleet Routes
  const filteredFleetRoutes = useMemo(() => {
    return routes.filter(r => {
      // Search query filter
      if (fleetSearchQuery.trim()) {
        const q = fleetSearchQuery.toLowerCase();
        const matchBus = r.busNumber?.toLowerCase().includes(q);
        const matchOrigin = r.origin?.toLowerCase().includes(q);
        const matchDest = r.destination?.toLowerCase().includes(q);
        const matchType = r.busType?.toLowerCase().includes(q);
        if (!matchBus && !matchOrigin && !matchDest && !matchType) return false;
      }

      // Date filter
      const rDate = r.departureDate || '';
      if (fleetDateFilter === 'today') {
        return rDate === todayStr || !rDate;
      }
      if (fleetDateFilter === 'tomorrow') {
        return rDate === tomorrowStr;
      }
      if (fleetDateFilter === 'custom') {
        return rDate === customFleetDate;
      }
      return true; // 'all'
    }).sort((a, b) => {
      if ((a.departureDate || '') !== (b.departureDate || '')) {
        return (a.departureDate || '').localeCompare(b.departureDate || '');
      }
      return (a.departureTime || '').localeCompare(b.departureTime || '');
    });
  }, [routes, fleetSearchQuery, fleetDateFilter, customFleetDate, todayStr, tomorrowStr]);

  // Unique bus grouping
  const uniqueBusesMap = useMemo(() => {
    const map: Record<string, BusRoute[]> = {};
    filteredFleetRoutes.forEach(r => {
      const key = r.busNumber || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [filteredFleetRoutes]);

  const countToday = useMemo(() => routes.filter(r => (r.departureDate || '') === todayStr || !r.departureDate).length, [routes, todayStr]);
  const countTomorrow = useMemo(() => routes.filter(r => (r.departureDate || '') === tomorrowStr).length, [routes, tomorrowStr]);

  useEffect(() => {
    if (filteredFleetRoutes.length > 0 && !filteredFleetRoutes.some(r => r.id === selectedRouteId)) {
      setSelectedRouteId(filteredFleetRoutes[0].id);
    }
  }, [filteredFleetRoutes, selectedRouteId]);



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
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (activeTab === 'users' && usersList.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchPaymentSlips = async () => {
    setSlipsLoading(true);
    try {
      const slips = await paymentSlipsApi.getAll();
      setPaymentSlips(slips);
    } catch (err: any) {
      console.error('Error loading payment slips:', err);
    } finally {
      setSlipsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentSlips();
  }, []);

  useEffect(() => {
    if (activeTab === 'payment-slips') {
      fetchPaymentSlips();
    }
  }, [activeTab]);

  const handleApproveSlip = async (slipId: string) => {
    setProcessingSlipId(slipId);
    try {
      await paymentSlipsApi.approve(slipId, 'Admin');
      showToast('Payment approved! Booking confirmed.');
      await fetchPaymentSlips();
    } catch (err: any) {
      alert(`Failed to approve: ${err.message}`);
    } finally {
      setProcessingSlipId(null);
    }
  };

  const handleRejectSlip = async (slipId: string) => {
    const reason = prompt('Reason for rejection (optional):') || 'Payment could not be verified.';
    setProcessingSlipId(slipId);
    try {
      await paymentSlipsApi.reject(slipId, reason, 'Admin');
      showToast('Payment rejected. Booking cancelled.');
      await fetchPaymentSlips();
    } catch (err: any) {
      alert(`Failed to reject: ${err.message}`);
    } finally {
      setProcessingSlipId(null);
    }
  };

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
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

  // Isolate passengers from system administrators (admins & super_admins belong to Staff tab)
  const passengerUsersList = useMemo(() => {
    return usersList.filter(u => u && u.role === 'passenger');
  }, [usersList]);

  // Filter passengers by search query and bookings status
  const filteredUsers = useMemo(() => {
    return passengerUsersList.filter(u => {
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

      const hasBookings = Boolean(u.totalBookings && Number(u.totalBookings) > 0);
      const matchesFilter = 
        passengerFilter === 'all' ||
        (passengerFilter === 'with-bookings' && hasBookings) ||
        (passengerFilter === 'without-bookings' && !hasBookings);

      return matchesSearch && matchesFilter;
    });
  }, [passengerUsersList, usersSearchQuery, passengerFilter]);

  const totalPassengersCount = passengerUsersList.length;
  const passengersWithBookingsCount = passengerUsersList.filter(u => u.totalBookings && Number(u.totalBookings) > 0).length;
  const passengersWithoutBookingsCount = totalPassengersCount - passengersWithBookingsCount;
  const totalPassengerBookings = passengerUsersList.reduce((acc, u) => acc + (u && u.totalBookings ? Number(u.totalBookings) : 0), 0);
  const systemAdminsCount = usersList.filter(u => u && (u.role === 'admin' || u.role === 'super_admin')).length;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {isSlipsMode 
                ? 'Payment Slips Verification & Approval' 
                : isMasterMode 
                  ? 'Master System & Fleet Command' 
                  : 'Super Admin & Operations Portal'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold flex items-center gap-1 ${
              isSlipsMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isMasterMode
                  ? 'bg-amber-50 text-amber-800 border-amber-300/70'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {isSlipsMode ? (
                <>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Slip Management
                </>
              ) : isMasterMode ? (
                <>
                  <Wrench className="w-3.5 h-3.5 text-amber-600" /> Master Command
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Daily Operations
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSlipsMode ? (
              <button
                onClick={() => {
                  setActiveTab('counter-booking');
                  setCurrentView('admin-panel');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Admin Operations
              </button>
            ) : isMasterMode ? (
              <button
                onClick={() => setCurrentView('admin-panel')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Switch to Operations
              </button>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('master-management')}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-black text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-amber-600" /> Master Management →
                </button>
                <button
                  onClick={() => setActiveTab('counter-booking')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" /> ➕ Counter Booking
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE TOP NAVIGATION BAR (Visible on mobile screens only) ─── */}
      {!isSlipsMode && (
        <div className="lg:hidden bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 flex items-center justify-between animate-fade-in-up">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
              isMasterMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label="Open Menu"
          >
            <Menu className="w-4 h-4" />
            <span>{isMasterMode ? 'Master Menu' : 'Admin Menu'}</span>
          </button>

          <div className="flex items-center gap-2 font-black text-xs text-slate-800">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isMasterMode ? 'bg-amber-500' : 'bg-blue-600'}`} />
            <span>
              {activeTab === 'counter-booking' && 'Counter & Phone Booking'}
              {activeTab === 'fleet' && 'Fleet & Route Operations'}
              {activeTab === 'timetables' && 'Master Timetables'}
              {activeTab === 'analytics' && 'Revenue & Analytics'}
              {activeTab === 'users' && `Passenger Accounts (${totalPassengersCount})`}
              {activeTab === 'payment-slips' && 'Payment Slips'}
              {activeTab === 'whatsapp' && 'WhatsApp Gateway'}
              {activeTab === 'promos' && 'Promo Codes & Discounts'}
              {activeTab === 'live-gps' && 'Live GPS Fleet Tracking'}
              {activeTab === 'staff' && 'Staff & Sub-Admins'}
            </span>
          </div>
        </div>
      )}

      {/* ─── MOBILE SLIDE-OVER DRAWER MODAL ─── */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dimmed backdrop overlay */}
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          />

          {/* Slide Drawer Content */}
          <div className="relative w-[82vw] max-w-xs h-full bg-white shadow-2xl flex flex-col p-5 space-y-4 overflow-y-auto animate-slide-in-left z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Admin Navigation</h4>
                <p className="text-xs font-extrabold text-slate-800">Dewmina Super Line</p>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <div className={`px-2 pb-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isMasterMode ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {isMasterMode ? (
                  <>
                    <Wrench className="w-3.5 h-3.5" /> Master Command
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Operations Menu
                  </>
                )}
              </div>

              {isMasterMode ? (
                <>
                  {hasPermission('fleet_management') && (
                    <button
                      onClick={() => { setActiveTab('fleet'); setIsMobileNavOpen(false); }}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'fleet' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Bus className="w-4 h-4" /> Fleet & Route Operations
                    </button>
                  )}

                  {hasPermission('timetable_management') && (
                    <button
                      onClick={() => { setActiveTab('timetables'); setIsMobileNavOpen(false); }}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'timetables' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4" /> Master Timetables
                    </button>
                  )}

                  {hasPermission('whatsapp') && (
                    <button
                      onClick={() => { setActiveTab('whatsapp'); setIsMobileNavOpen(false); }}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'whatsapp' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> WhatsApp Gateway
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        activeTab === 'whatsapp' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        BOT
                      </span>
                    </button>
                  )}

                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => { setActiveTab('staff'); setIsMobileNavOpen(false); }}
                        className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                          activeTab === 'staff' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-500" /> Staff & Sub-Admins
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          SUPER
                        </span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('users'); setIsMobileNavOpen(false); }}
                        className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                          activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" /> Passenger Accounts ({totalPassengersCount})
                        </div>
                        {totalPassengersCount > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {totalPassengersCount}
                          </span>
                        )}
                      </button>
                    </>
                  )}

                  {/* Switch to Operations Button in Mobile Drawer */}
                  <div className="pt-4 mt-auto border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        setAdminActiveTab('counter-booking');
                        setCurrentView('admin-panel');
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Admin Operations
                      </span>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">GO</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {hasPermission('counter_booking') && (
                    <button
                      onClick={() => { setActiveTab('counter-booking'); setIsMobileNavOpen(false); }}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-black text-left cursor-pointer ${
                        activeTab === 'counter-booking' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 bg-blue-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-blue-500" /> Counter Booking
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white">
                        BOOK
                      </span>
                    </button>
                  )}

                  {hasPermission('analytics') && (
                    <button
                      onClick={() => { setActiveTab('analytics'); setIsMobileNavOpen(false); }}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4" /> Revenue & Analytics
                    </button>
                  )}

                  <button
                    onClick={() => { setActiveTab('live-gps'); setIsMobileNavOpen(false); }}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                      activeTab === 'live-gps' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Live GPS Fleet Tracking
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'live-gps' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      LIVE
                    </span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('promos'); setIsMobileNavOpen(false); }}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                      activeTab === 'promos' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-purple-500" /> Promo Codes & Discounts
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'promos' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}>
                      DEALS
                    </span>
                  </button>

                  {/* Payment Slips Entry */}
                  <button
                    onClick={() => { setActiveTab('payment-slips'); setIsMobileNavOpen(false); }}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                      activeTab === 'payment-slips' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Payment Slips
                    </div>
                    {paymentSlips.filter(s => s.status === 'pending').length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700 animate-pulse">
                        {paymentSlips.filter(s => s.status === 'pending').length}
                      </span>
                    )}
                  </button>

                  {/* Switch to Master Management in Mobile Drawer */}
                  <div className="pt-4 mt-auto border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        setAdminActiveTab('fleet');
                        setCurrentView('master-management');
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/70 text-xs font-black flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-600" /> Master Management
                      </span>
                      <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full">OPEN</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {isMasterMode && activeTab === 'fleet' && (
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">Quick Actions ({selectedRoute ? selectedRoute.busNumber : 'Route'})</div>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setShowManifestModal(true);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print A4 Passenger Manifest
                </button>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setShowBroadcastModal(true);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Broadcast WhatsApp Alert
                </button>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setShowSeatBlockModal(true);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <Wrench className="w-4 h-4" /> Seat Maintenance Lock
                </button>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    const target = routes.find(r => r.id === selectedRouteId) || routes[0];
                    if (target) setEditDetailsRoute(target);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <Clock className="w-4 h-4" /> Edit Details & Timetable
                </button>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    const target = routes.find(r => r.id === selectedRouteId) || routes[0];
                    if (target) setCustomizeRoute(target);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Customize Seat Layout
                </button>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setShowScanner(true);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> Conductor Ticket Validator
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* ─── DESKTOP SIDEBAR (Hidden on mobile screens, sticky on desktop, hidden in Slips Mode) ─── */}
        {!isSlipsMode && (
          <aside className="hidden lg:block w-72 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-4 lg:sticky lg:top-24 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {isMasterMode ? 'Master Controls' : 'Operations Navigation'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isMasterMode ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
              }`}>
                {isMasterMode ? 'MASTER' : 'DAILY'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {isMasterMode ? (
                <>
                  {hasPermission('fleet_management') && (
                    <button
                      onClick={() => setActiveTab('fleet')}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'fleet' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Bus className="w-4 h-4" /> Fleet & Route Operations
                    </button>
                  )}

                  {hasPermission('timetable_management') && (
                    <button
                      onClick={() => setActiveTab('timetables')}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'timetables' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4" /> Master Timetables
                    </button>
                  )}

                  {hasPermission('whatsapp') && (
                    <button
                      onClick={() => setActiveTab('whatsapp')}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'whatsapp' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> WhatsApp Gateway
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        activeTab === 'whatsapp' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        BOT
                      </span>
                    </button>
                  )}

                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => setActiveTab('staff')}
                        className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                          activeTab === 'staff' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-500" /> Staff & Sub-Admins
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          SUPER
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                          activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" /> Passenger Accounts ({totalPassengersCount})
                        </div>
                        {totalPassengersCount > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {totalPassengersCount}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {hasPermission('counter_booking') && (
                    <button
                      onClick={() => setActiveTab('counter-booking')}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-black text-left cursor-pointer ${
                        activeTab === 'counter-booking' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-blue-600" /> Counter Booking
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        activeTab === 'counter-booking' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        NEW
                      </span>
                    </button>
                  )}

                  {hasPermission('analytics') && (
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold text-left cursor-pointer ${
                        activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4" /> Revenue & Analytics
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('live-gps')}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                      activeTab === 'live-gps' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Live GPS Fleet Tracking
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'live-gps' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      LIVE
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('promos')}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                      activeTab === 'promos' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-purple-500" /> Promo Codes & Discounts
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'promos' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}>
                      DEALS
                    </span>
                  </button>

                  {/* Payment Slips Button in Sidebar */}
                  <button
                    onClick={() => setActiveTab('payment-slips')}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between text-sm font-bold text-left cursor-pointer ${
                      activeTab === 'payment-slips'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 text-slate-700 hover:text-emerald-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className={`w-4 h-4 ${activeTab === 'payment-slips' ? 'text-white' : 'text-emerald-600'}`} /> Payment Slips
                    </div>
                    {paymentSlips.filter(s => s.status === 'pending').length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'payment-slips' ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-700 animate-pulse'
                      }`}>
                        {paymentSlips.filter(s => s.status === 'pending').length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {isMasterMode && activeTab === 'fleet' && (
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">Quick Actions</div>
                <button
                  onClick={() => {
                    const target = routes.find(r => r.id === selectedRouteId) || routes[0];
                    if (target) setEditDetailsRoute(target);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <Clock className="w-4 h-4" /> Edit Details & Timetable
                </button>
                <button
                  onClick={() => {
                    const target = routes.find(r => r.id === selectedRouteId) || routes[0];
                    if (target) setCustomizeRoute(target);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Customize Seat Layout
                </button>
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 text-left cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> Conductor Ticket Validator
                </button>
              </div>
            )}

            {/* Switcher card at the bottom of sidebar */}
            <div className="border-t border-slate-200 pt-3">
              {isMasterMode ? (
                <button
                  onClick={() => {
                    setAdminActiveTab('counter-booking');
                    setCurrentView('admin-panel');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 text-blue-600" /> Admin Operations
                  </span>
                  <span className="text-[10px] text-blue-600 font-black">RETURN</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAdminActiveTab('fleet');
                    setCurrentView('master-management');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-50/60 hover:bg-amber-100 border border-amber-200/80 text-amber-900 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-600" /> Master Management
                  </span>
                  <span className="text-[10px] text-amber-700 font-black">OPEN →</span>
                </button>
              )}
            </div>
          </aside>
        )}

        <main className={`min-w-0 flex-1 w-full animate-fade-in-up ${isSlipsMode ? 'max-w-7xl mx-auto' : ''}`} style={{ animationDelay: '0.25s' }}>

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

          {/* Fleet Controls: Search Bar & Date Filter Tabs */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fleetSearchQuery}
                  onChange={(e) => setFleetSearchQuery(e.target.value)}
                  placeholder="Search Bus No (e.g. ND-2903), Origin, Destination..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {fleetSearchQuery && (
                  <button
                    onClick={() => setFleetSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Group By Bus Toggle */}
              <button
                type="button"
                onClick={() => setFleetGroupByBus(!fleetGroupByBus)}
                className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  fleetGroupByBus 
                    ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Group schedules by unique Bus Number"
              >
                <Layers className="w-4 h-4" />
                <span>{fleetGroupByBus ? 'Grouped by Bus' : 'Group by Bus'}</span>
              </button>
            </div>

            {/* Date Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Date:
              </span>

              {/* Today Button */}
              <button
                type="button"
                onClick={() => setFleetDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  fleetDateFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${fleetDateFilter === 'today' ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`} />
                <span>Today ({countToday})</span>
              </button>

              {/* Tomorrow Button */}
              <button
                type="button"
                onClick={() => setFleetDateFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  fleetDateFilter === 'tomorrow'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tomorrow ({countTomorrow})</span>
              </button>

              {/* Custom Date Input */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                fleetDateFilter === 'custom'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}>
                <Calendar className={`w-3.5 h-3.5 ${fleetDateFilter === 'custom' ? 'text-white' : 'text-slate-500'}`} />
                <input
                  type="date"
                  value={customFleetDate}
                  onChange={(e) => {
                    setCustomFleetDate(e.target.value);
                    setFleetDateFilter('custom');
                  }}
                  className={`bg-transparent text-xs font-mono font-bold outline-none cursor-pointer ${
                    fleetDateFilter === 'custom' ? 'text-white' : 'text-slate-800'
                  }`}
                />
              </div>

              {/* All Dates Button */}
              <button
                type="button"
                onClick={() => setFleetDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer sm:ml-auto ${
                  fleetDateFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Dates ({routes.length})</span>
              </button>
            </div>
          </div>

          {/* Mobile View Segmented Switcher: Routes vs Manifest */}
          <div className="flex lg:hidden bg-slate-200/90 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setFleetMobileView('routes')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                fleetMobileView === 'routes' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Fleet Buses ({filteredFleetRoutes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFleetMobileView('manifest')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                fleetMobileView === 'manifest' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Manifest ({selectedRoute ? selectedRoute.busNumber : 'Select Bus'})</span>
            </button>
          </div>

          {/* Fleet Grid & Passenger Manifest Split Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Bus Fleet Route Cards */}
            <div className={`lg:col-span-5 space-y-4 ${fleetMobileView === 'manifest' ? 'hidden lg:block' : 'block'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Fleet Routes ({filteredFleetRoutes.length})
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {fleetDateFilter === 'today' ? 'Showing: Today\'s Departures' : fleetDateFilter === 'tomorrow' ? 'Showing: Tomorrow\'s Departures' : fleetDateFilter === 'custom' ? `Showing: ${customFleetDate}` : 'Showing: All Departures'}
                  </p>
                </div>
                <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                  {filteredFleetRoutes.length} of {routes.length}
                </span>
              </div>

              {filteredFleetRoutes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No buses scheduled for this date or search.</p>
                  <button
                    onClick={() => { setFleetDateFilter('all'); setFleetSearchQuery(''); }}
                    className="text-xs text-blue-600 font-extrabold underline cursor-pointer"
                  >
                    View All Schedules ({routes.length})
                  </button>
                </div>
              ) : fleetGroupByBus ? (
                /* Grouped by Bus Accordion */
                <div className="space-y-3">
                  {Object.entries(uniqueBusesMap).map(([busNo, busRoutes]) => {
                    const isExpanded = expandedBuses[busNo] ?? (selectedRoute?.busNumber === busNo);
                    const primaryRoute = busRoutes[0];
                    return (
                      <div key={busNo} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div
                          onClick={() => toggleExpandBus(busNo)}
                          className="p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                              <Bus className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">{busNo}</h4>
                              <p className="text-[11px] text-slate-500 font-semibold">{primaryRoute?.origin} ⇄ {primaryRoute?.destination}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                              {busRoutes.length} Trips
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-2 space-y-2 bg-slate-50/50">
                            {busRoutes.map(r => (
                              <div
                                key={r.id}
                                onClick={() => setSelectedRouteId(r.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                  selectedRouteId === r.id ? 'border-blue-500 bg-blue-50/80 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {r.departureDate === todayStr || !r.departureDate ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> TODAY
                                        </span>
                                      ) : r.departureDate === tomorrowStr ? (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black">
                                          TOMORROW
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-slate-400" /> {r.departureDate}
                                        </span>
                                      )}
                                      {r.departureTime && (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-purple-600" /> {r.departureTime}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-blue-600 font-bold">{r.origin} → {r.destination}</p>
                                  </div>
                                  <div className="text-right text-xs">
                                    <span className="font-mono font-bold text-slate-700">LKR {(r.priceStarting || 0).toLocaleString()}</span>
                                    <p className="text-[10px] text-slate-500 font-mono">{r.seats?.filter(s => s.status === 'booked').length || 0}/{r.seats?.length || 49} Booked</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard List View with prominent Date & Time badges */
                <div className="space-y-3">
                  {filteredFleetRoutes.map(r => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedRouteId === r.id ? 'border-blue-500 bg-blue-50/70 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          {/* Top Badges: Bus No, Date, Time */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-extrabold text-slate-900 text-sm">{r.busNumber}</h4>

                            {/* Date Badge */}
                            {r.departureDate === todayStr || !r.departureDate ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> TODAY
                              </span>
                            ) : r.departureDate === tomorrowStr ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black">
                                TOMORROW
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" /> {r.departureDate}
                              </span>
                            )}

                            {/* Departure Time Badge */}
                            {r.departureTime && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black flex items-center gap-1">
                                <Clock className="w-3 h-3 text-purple-600" /> {r.departureTime}
                              </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {r.operatorRating ? Number(r.operatorRating).toFixed(1) : '4.8'}
                            </span>
                          </div>

                          <p className="text-xs text-blue-600 font-bold">{r.origin} → {r.destination}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{(r.busType || 'Super Luxury').replace(/\s*\(\d+\s*Seats.*?\)/gi, '').replace(/\s*\(Route\s*\d+\)/gi, '').trim()}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditDetailsRoute(r);
                            }}
                            title="Edit Details & Timetable"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteRoute(e, r.id)}
                            disabled={deletingRouteId === r.id}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              confirmDeleteRouteId === r.id 
                                ? 'bg-rose-600 text-white font-bold animate-pulse px-2 text-[10px]' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={confirmDeleteRouteId === r.id ? "Click again to confirm delete" : "Delete Route"}
                          >
                            {confirmDeleteRouteId === r.id ? 'Confirm?' : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-slate-700">LKR {(r.priceStarting || 0).toLocaleString()}</span>
                        <span className="font-mono font-bold text-slate-600">{r.seats?.filter(s => s.status === 'booked').length || 0}/{r.seats?.length || 49} Booked</span>
                      </div>

                      {/* Instant Mobile Actions Strip when selected */}
                      {selectedRouteId === r.id && (
                        <div className="mt-3 pt-3 border-t border-blue-200/80 space-y-2 lg:hidden">
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSeatBlockModal(true);
                              }}
                              className="py-2 px-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <Wrench className="w-3.5 h-3.5" /> Seat Lock
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowBroadcastModal(true);
                              }}
                              className="py-2 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Broadcast
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowManifestModal(true);
                              }}
                              className="py-2 px-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print A4
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFleetMobileView('manifest');
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Passenger Manifest ({manifestBookings.length} Bookings)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Passenger Manifest Panel for Selected Route */}
            <div className={`lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 ${fleetMobileView === 'routes' ? 'hidden lg:block' : 'block'}`}>
              {/* Mobile Back Button to Fleet Buses */}
              <div className="lg:hidden flex items-center justify-between bg-blue-50/90 border border-blue-200/90 p-2.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFleetMobileView('routes')}
                  className="flex items-center gap-1.5 text-xs font-black text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Fleet Buses
                </button>
                <span className="text-xs font-mono font-black text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {selectedRoute?.busNumber || 'Selected Bus'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
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
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowSeatBlockModal(true)}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      title="Block or release seats for maintenance / conductor"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Seat Lock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBroadcastModal(true)}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      title="Send WhatsApp broadcast to passengers of this bus"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Broadcast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowManifestModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                      title="Print official passenger boarding manifest"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print A4</span>
                    </button>

                    <button
                      type="button"
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
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" /> <span>CSV Export</span>
                    </button>
                  </div>
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

      {/* ─── TAB 1.5: TIMETABLES ─── */}
      {activeTab === 'timetables' && (
        <div className="space-y-8">
          <TimetableManager />
        </div>
      )}

      {/* ─── TAB 2: REVENUE & ANALYTICS ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Analytics Header with Daily Settlement Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-lg font-black text-slate-900">Revenue & Accounting Analytics</h3>
              <p className="text-xs text-slate-500">Real-time revenue metrics, daily collections & fleet operator commissions</p>
            </div>

            <button
              onClick={() => setShowDailySettlementModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Daily Settlement Sheet (Cash / Slips / Card)</span>
            </button>
          </div>

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
              <p className="text-2xl font-black text-slate-900 font-mono">{usersList.length}</p>
              <p className="text-xs text-indigo-600 font-semibold">{totalPassengersCount} Passengers • {systemAdminsCount} Admins & Staff</p>
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
          
          {/* Passenger Metrics Banner with Interactive Filtering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Passengers */}
            <div
              onClick={() => setPassengerFilter('all')}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                passengerFilter === 'all'
                  ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl ring-4 ring-blue-500/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between opacity-80">
                <span className="text-xs font-bold uppercase tracking-wider">Total Passengers</span>
                <Users className={`w-5 h-5 ${passengerFilter === 'all' ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{totalPassengersCount}</p>
              <div className="flex items-center justify-between">
                <p className={`text-[11px] font-medium ${passengerFilter === 'all' ? 'text-blue-200' : 'text-slate-500'}`}>
                  Registered in OmniBus Neon DB
                </p>
                {passengerFilter === 'all' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-400/30 text-blue-200 border border-blue-300/30">
                    Showing All
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Active Bookers */}
            <div
              onClick={() => setPassengerFilter('with-bookings')}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                passengerFilter === 'with-bookings'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl ring-4 ring-blue-400/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${passengerFilter === 'with-bookings' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Active Bookers
                </span>
                <UserCheck className={`w-5 h-5 ${passengerFilter === 'with-bookings' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{passengersWithBookingsCount}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${passengerFilter === 'with-bookings' ? 'text-blue-100' : 'text-blue-600'}`}>
                  Passengers with 1+ bookings
                </p>
                {passengerFilter === 'with-bookings' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                    Filtered
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: No Bookings Yet */}
            <div
              onClick={() => setPassengerFilter('without-bookings')}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                passengerFilter === 'without-bookings'
                  ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xl ring-4 ring-amber-400/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${passengerFilter === 'without-bookings' ? 'text-amber-100' : 'text-slate-500'}`}>
                  No Bookings Yet
                </span>
                <Sparkles className={`w-5 h-5 ${passengerFilter === 'without-bookings' ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{passengersWithoutBookingsCount}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${passengerFilter === 'without-bookings' ? 'text-amber-100' : 'text-amber-600'}`}>
                  Registered, yet to reserve
                </p>
                {passengerFilter === 'without-bookings' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                    Filtered
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Total Passenger Bookings */}
            <div
              onClick={() => setPassengerFilter('with-bookings')}
              className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl select-none ${
                passengerFilter === 'with-bookings'
                  ? 'bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-xl ring-4 ring-emerald-400/40 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${passengerFilter === 'with-bookings' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  Total Reservations
                </span>
                <Ticket className={`w-5 h-5 ${passengerFilter === 'with-bookings' ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <p className="text-3xl font-black font-mono tracking-tight my-1">{totalPassengerBookings}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${passengerFilter === 'with-bookings' ? 'text-emerald-100' : 'text-emerald-600'}`}>
                  Total seats booked by passengers
                </p>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Volume
                </span>
              </div>
            </div>

          </div>

          {/* Passenger Accounts Management Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-6 border-b border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Registered Passenger Accounts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect passenger registration details, mobile contacts, and travel booking history.
                  </p>
                </div>

                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin text-blue-600' : ''}`} />
                  <span>Refresh Passengers</span>
                </button>
              </div>

              {/* Real-time Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={usersSearchQuery}
                    onChange={(e) => setUsersSearchQuery(e.target.value)}
                    placeholder="Search passengers by name, email, or Sri Lankan phone number…"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setPassengerFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      passengerFilter === 'all'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({totalPassengersCount})
                  </button>
                  <button
                    onClick={() => setPassengerFilter('with-bookings')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      passengerFilter === 'with-bookings'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    With Bookings ({passengersWithBookingsCount})
                  </button>
                  <button
                    onClick={() => setPassengerFilter('without-bookings')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      passengerFilter === 'without-bookings'
                        ? 'bg-white text-amber-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No Bookings ({passengersWithoutBookingsCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Passengers List Data Table */}
            {usersLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                <p className="text-xs font-semibold">Loading passenger accounts from Neon DB…</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <UserX className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No passenger accounts found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {usersSearchQuery
                    ? `No passenger accounts matching "${usersSearchQuery}". Try clearing search keywords.`
                    : 'No passenger accounts recorded in database.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Passenger Details</th>
                      <th className="px-6 py-4">Mobile Phone</th>
                      <th className="px-6 py-4">Account Role</th>
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
                              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xs bg-gradient-to-tr from-blue-600 to-indigo-600">
                                {(u.name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 text-sm">{u.name || 'Passenger'}</p>
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
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 w-fit bg-blue-100 text-blue-700 border border-blue-200">
                              <UserCheck className="w-3 h-3" />
                              Passenger
                            </span>
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
                                title="View Passenger Account Details"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
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

      {/* ─── TAB: LIVE GPS FLEET TELEMETRY ─── */}
      {activeTab === 'live-gps' && (
        <div className="space-y-6 animate-fade-in-up">
          <LiveMap />
        </div>
      )}

      {/* ─── TAB 4: PAYMENT SLIPS ─── */}
      {activeTab === 'payment-slips' && (
        <div className="space-y-6">
          {/* Stats: Clickable to filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setSlipFilter(slipFilter === 'pending' ? 'all' : 'pending')}
              className={`rounded-2xl p-4 text-center cursor-pointer transition-all border-2 ${
                slipFilter === 'pending' 
                  ? 'bg-orange-100 border-orange-500 shadow-md scale-[1.02]' 
                  : 'bg-orange-50 border-orange-200 hover:border-orange-300'
              }`}
            >
              <p className="text-2xl font-black text-orange-600">{paymentSlips.filter(s => s.status === 'pending').length}</p>
              <p className="text-xs text-orange-700 font-bold mt-1">Pending Review</p>
              <span className="text-[10px] text-orange-500 font-semibold block mt-0.5">Click to filter</span>
            </div>
            <div 
              onClick={() => setSlipFilter(slipFilter === 'approved' ? 'all' : 'approved')}
              className={`rounded-2xl p-4 text-center cursor-pointer transition-all border-2 ${
                slipFilter === 'approved' 
                  ? 'bg-emerald-100 border-emerald-500 shadow-md scale-[1.02]' 
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <p className="text-2xl font-black text-emerald-600">{paymentSlips.filter(s => s.status === 'approved').length}</p>
              <p className="text-xs text-emerald-700 font-bold mt-1">Approved</p>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-0.5">Click to filter</span>
            </div>
            <div 
              onClick={() => setSlipFilter(slipFilter === 'rejected' ? 'all' : 'rejected')}
              className={`rounded-2xl p-4 text-center cursor-pointer transition-all border-2 ${
                slipFilter === 'rejected' 
                  ? 'bg-red-100 border-red-500 shadow-md scale-[1.02]' 
                  : 'bg-red-50 border-red-200 hover:border-red-300'
              }`}
            >
              <p className="text-2xl font-black text-red-600">{paymentSlips.filter(s => s.status === 'rejected').length}</p>
              <p className="text-xs text-red-700 font-bold mt-1">Rejected</p>
              <span className="text-[10px] text-red-500 font-semibold block mt-0.5">Click to filter</span>
            </div>
          </div>

          {/* Filter Bar and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterVal) => {
                const count = filterVal === 'all' 
                  ? paymentSlips.length 
                  : paymentSlips.filter(s => s.status === filterVal).length;
                const isActive = slipFilter === filterVal;
                return (
                  <button
                    key={filterVal}
                    onClick={() => setSlipFilter(filterVal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? filterVal === 'pending'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : filterVal === 'approved'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : filterVal === 'rejected'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="capitalize">{filterVal}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => fetchPaymentSlips()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {slipsLoading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              Loading slips...
            </div>
          ) : filteredSlips.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-sm font-semibold">
                {slipFilter === 'all' 
                  ? 'No payment slips yet.' 
                  : `No ${slipFilter} payment slips found.`}
              </p>
              <p className="text-xs mt-1">Slips will appear here when passengers submit bank transfers.</p>
              {slipFilter !== 'all' && (
                <button
                  onClick={() => setSlipFilter('all')}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Show All Slips
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSlips.map((slip) => (
                <div
                  key={slip.id}
                  className={`bg-white rounded-2xl border-2 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                    slip.status === 'pending' ? 'border-orange-300' :
                    slip.status === 'approved' ? 'border-emerald-300' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-stretch gap-4 p-4">
                    {/* Slip thumbnail */}
                    {slip.imageData && (
                      <div
                        className="w-24 h-24 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors flex items-center justify-center bg-slate-50"
                        onClick={() => setSelectedSlipImage({ src: `data:${slip.imageMime || 'application/pdf'};base64,${slip.imageData}`, pnr: slip.pnr, isPdf: slip.imageMime === 'application/pdf' || slip.imageData.startsWith('JVBERi0') })}
                      >
                        {slip.imageMime === 'application/pdf' || slip.imageData.startsWith('JVBERi0') ? (
                          <div className="flex flex-col items-center justify-center p-2 text-red-500 text-center">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-wider">PDF SLIP</span>
                          </div>
                        ) : (
                          <img
                            src={`data:${slip.imageMime};base64,${slip.imageData}`}
                            alt="Payment slip"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}

                    {/* Status badge + info */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          slip.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          slip.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {slip.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600">{slip.pnr}</span>
                      </div>
                      <p className="text-base font-bold text-slate-800 truncate">{slip.passengerName}</p>
                      <p className="text-lg font-extrabold text-slate-900">LKR {Number(slip.amount).toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(slip.uploadedAt).toLocaleString()}
                      </p>
                      {slip.reviewedAt && (
                        <p className="text-[11px] text-slate-400">
                          Reviewed: {new Date(slip.reviewedAt).toLocaleString()} by {slip.reviewedBy}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedSlipImage({ src: `data:${slip.imageMime || 'application/pdf'};base64,${slip.imageData}`, pnr: slip.pnr, isPdf: slip.imageMime === 'application/pdf' || slip.imageData.startsWith('JVBERi0') })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Slip
                    </button>
                    {slip.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveSlip(slip.id)}
                          disabled={processingSlipId === slip.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectSlip(slip.id)}
                          disabled={processingSlipId === slip.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: WHATSAPP AUTOMATION GATEWAY ─── */}
      {activeTab === 'whatsapp' && (
        <div className="animate-fade-in-up">
          <WhatsAppManagerSection />
        </div>
      )}

      {/* ─── TAB 7: COUNTER & PHONE BOOKING ─── */}
      {activeTab === 'counter-booking' && (
        <div className="animate-fade-in-up">
          <CounterBookingView
            onBookingComplete={() => {
              loadBookings();
              loadRoutes();
            }}
          />
        </div>
      )}

      {/* ─── TAB 8: STAFF & SUB-ADMIN MANAGEMENT (Super Admin Only) ─── */}
      {activeTab === 'staff' && isSuperAdmin && (
        <div className="animate-fade-in-up">
          <StaffManagementSection />
        </div>
      )}

      {/* ─── TAB 9: PROMO CODES & DISCOUNTS MANAGEMENT ─── */}
      {activeTab === 'promos' && (
        <div className="animate-fade-in-up">
          <PromoCodesManager />
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

      {/* Passenger Manifest Printable Modal */}
      {showManifestModal && selectedRoute && (
        <PassengerManifestModal
          route={selectedRoute}
          bookings={bookings.filter(b => b.routeId === selectedRoute.id)}
          onClose={() => setShowManifestModal(false)}
        />
      )}

      {/* WhatsApp Route Broadcast Modal */}
      {showBroadcastModal && selectedRoute && (
        <BroadcastAnnouncementModal
          route={selectedRoute}
          bookings={bookings.filter(b => b.routeId === selectedRoute.id)}
          onClose={() => setShowBroadcastModal(false)}
        />
      )}

      {/* Daily Cash & Settlement Sheet Modal */}
      {showDailySettlementModal && (
        <DailyFinancialSettlementModal
          bookings={bookings}
          onClose={() => setShowDailySettlementModal(false)}
        />
      )}

      {/* Seat Maintenance & Lock Modal */}
      {showSeatBlockModal && selectedRoute && (
        <SeatBlockManagerModal
          route={selectedRoute}
          onClose={() => setShowSeatBlockModal(false)}
        />
      )}

      {/* Slip Image Lightbox */}
      {selectedSlipImage && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSlipImage(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-slate-800">Slip — {selectedSlipImage.pnr}</p>
              <div className="flex items-center gap-2">
                <a
                  href={selectedSlipImage.src}
                  download={`slip_${selectedSlipImage.pnr}.${selectedSlipImage.src.includes('application/pdf') || selectedSlipImage.isPdf ? 'pdf' : 'jpg'}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors inline-flex items-center gap-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="w-3.5 h-3.5" /> Open / Download
                </a>
                <button
                  onClick={() => setSelectedSlipImage(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {selectedSlipImage.src.includes('application/pdf') || selectedSlipImage.isPdf ? (
              <iframe
                src={selectedSlipImage.src}
                title="Payment Slip PDF"
                className="w-full rounded-xl border border-slate-200 h-[70vh]"
              />
            ) : (
              <img
                src={selectedSlipImage.src}
                alt="Payment slip full view"
                className="w-full rounded-xl border border-slate-200 max-h-[70vh] object-contain mx-auto"
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
};
