import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { authApi } from '../../services/api';
import {
  Shield, UserPlus, Trash2, Edit3, Check, X,
  Mail, Phone, User, CheckSquare, Square,
  ShieldCheck, AlertTriangle, RefreshCw, Lock
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  phone?: string;
  permissions: string[];
  createdAt: string;
}

const AVAILABLE_PERMISSIONS: { key: string; label: string; desc: string; icon: string }[] = [
  {
    key: 'counter_booking',
    label: 'Counter Booking',
    desc: 'Issue physical counter tickets for walk-in passengers with cash handling',
    icon: '🎫',
  },
  {
    key: 'slips_approval',
    label: 'Payment Slips Approval',
    desc: 'Verify and approve/reject bank transfer payment slips uploaded by passengers',
    icon: '📝',
  },
  {
    key: 'qr_scanner',
    label: 'QR Scanner & Ticket Check',
    desc: 'Scan passenger QR tickets at bus entrance to verify boarding',
    icon: '📷',
  },
  {
    key: 'manifest_view',
    label: 'Passenger Manifest',
    desc: 'View passenger lists, contact numbers, and download trip manifests',
    icon: '📋',
  },
  {
    key: 'fleet_management',
    label: 'Fleet & Bus Routes',
    desc: 'Deploy bus routes, customize seat layouts, and modify fares',
    icon: '🚌',
  },
  {
    key: 'timetable_management',
    label: 'Timetable Schedules',
    desc: 'Manage bus timetable rotations, recurring schedules and anchor dates',
    icon: '⏱️',
  },
  {
    key: 'analytics',
    label: 'Financial & Revenue Analytics',
    desc: 'Access total revenue, sales metrics, and business financial statistics',
    icon: '📊',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Gateway & Bot',
    desc: 'Manage WhatsApp QR session connection and automated notifications',
    icon: '💬',
  },
];

export const StaffManagementSection: React.FC = () => {
  const { currentUser } = useBookingStore();
  const token = localStorage.getItem('auth_token') || '';

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [modalName, setModalName] = useState<string>('');
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalPassword, setModalPassword] = useState<string>('');
  const [modalPermissions, setModalPermissions] = useState<string[]>([]);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authApi.getStaff(token);
      if (res.success && Array.isArray(res.staff)) {
        setStaffList(res.staff);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setModalName('');
    setModalEmail('');
    setModalPhone('');
    setModalPassword('');
    // Default permissions for new staff: Counter & Manifest
    setModalPermissions(['counter_booking', 'manifest_view']);
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setModalName(staff.name);
    setModalEmail(staff.email);
    setModalPhone(staff.phone || '');
    setModalPassword(''); // Blank means keep existing password
    setModalPermissions(staff.permissions || []);
    setModalError(null);
    setShowModal(true);
  };

  const togglePermission = (key: string) => {
    if (editingStaff?.role === 'super_admin') return; // Super admin has everything permanently
    setModalPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const applyPreset = (preset: 'all' | 'counter' | 'conductor' | 'accounts' | 'none') => {
    if (editingStaff?.role === 'super_admin') return;
    switch (preset) {
      case 'all':
        setModalPermissions(AVAILABLE_PERMISSIONS.map((p) => p.key));
        break;
      case 'counter':
        setModalPermissions(['counter_booking', 'manifest_view']);
        break;
      case 'conductor':
        setModalPermissions(['qr_scanner', 'manifest_view']);
        break;
      case 'accounts':
        setModalPermissions(['slips_approval']);
        break;
      case 'none':
        setModalPermissions([]);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalName.trim() || modalName.trim().length < 2) {
      setModalError('Please enter a valid staff name.');
      return;
    }

    if (!editingStaff) {
      if (!modalEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalEmail.trim())) {
        setModalError('Please enter a valid email address.');
        return;
      }
      if (!modalPassword || modalPassword.length < 6) {
        setModalError('Password must be at least 6 characters long.');
        return;
      }
    } else {
      if (modalPassword && modalPassword.length < 6) {
        setModalError('New password must be at least 6 characters long.');
        return;
      }
    }

    setModalSubmitting(true);
    try {
      if (!editingStaff) {
        // Create new staff member
        const res = await authApi.createStaff(token, {
          name: modalName.trim(),
          email: modalEmail.trim().toLowerCase(),
          password: modalPassword,
          phone: modalPhone.trim() || undefined,
          permissions: modalPermissions,
        });

        if (res.success) {
          setShowModal(false);
          setSuccessMsg(`Staff account for ${res.staff.email} created successfully!`);
          setTimeout(() => setSuccessMsg(null), 5000);
          await fetchStaff();
        }
      } else {
        // Update existing staff member
        const payload: any = {
          name: modalName.trim(),
          phone: modalPhone.trim(),
          permissions: editingStaff.role === 'super_admin' ? undefined : modalPermissions,
        };
        if (modalPassword && modalPassword.length >= 6) {
          payload.password = modalPassword;
        }

        const res = await authApi.updateStaff(token, editingStaff.id, payload);
        if (res.success) {
          setShowModal(false);
          setSuccessMsg(`Staff member ${editingStaff.email} updated successfully!`);
          setTimeout(() => setSuccessMsg(null), 5000);
          await fetchStaff();
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Operation failed. Please try again.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await authApi.deleteStaff(token, id);
      if (res.success) {
        setConfirmDeleteId(null);
        setSuccessMsg('Staff account removed successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchStaff();
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Staff & Administrator Access Control</h2>
          </div>
          <p className="text-emerald-100/80 text-sm max-w-2xl">
            As <strong className="text-white">Super Administrator</strong>, you can create and manage sub-admin accounts,
            assign granular permissions, and restrict access to specific operational modules.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Staff / Admin</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Accounts Cards / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Active System Administrators ({staffList.length})</h3>
          </div>
          <button
            onClick={fetchStaff}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm">Loading staff accounts...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p>No staff members found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {staffList.map((staff) => {
              const isSuper = staff.role === 'super_admin';
              const isCurrentUser = currentUser?.id === staff.id;

              return (
                <div
                  key={staff.id}
                  className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Left: User details */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0 ${
                        isSuper
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40'
                      }`}
                    >
                      {isSuper ? '👑' : '🛡️'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{staff.name}</h4>
                        {isSuper ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <span>★</span> Super Administrator
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Sub-Admin
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            (You)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {staff.email}
                        </span>
                        {staff.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {staff.phone}
                          </span>
                        )}
                      </div>

                      {/* Permissions tags */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {isSuper ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            ✨ Full Master Privileges (All Access)
                          </span>
                        ) : staff.permissions && staff.permissions.length > 0 ? (
                          staff.permissions.map((pKey) => {
                            const pInfo = AVAILABLE_PERMISSIONS.find((p) => p.key === pKey);
                            return (
                              <span
                                key={pKey}
                                className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1"
                              >
                                <span>{pInfo?.icon || '•'}</span>
                                {pInfo?.label || pKey}
                              </span>
                            );
                          })
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs text-rose-600 bg-rose-50 border border-rose-200">
                            No permissions assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => openEditModal(staff)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Edit Access</span>
                    </button>

                    {!isSuper && (
                      <button
                        onClick={() => setConfirmDeleteId(staff.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
              Remove Staff Member?
            </h3>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
              This will permanently revoke all administrative access for this account. They will no longer be able to log in to the staff portal.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStaff(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-900/40 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {editingStaff ? `Edit Access: ${editingStaff.name}` : 'Add New Staff Administrator'}
                  </h3>
                  <p className="text-xs text-emerald-200/70">
                    {editingStaff ? 'Update profile, reset password or adjust permissions' : 'Create an administrative user and assign custom roles'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      placeholder="e.g. Kasun Fernando"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      disabled={!!editingStaff}
                      value={modalEmail}
                      onChange={(e) => setModalEmail(e.target.value)}
                      placeholder="e.g. kasun.counter@dewminasuperline.lk"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        editingStaff ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Contact Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={modalPhone}
                      onChange={(e) => setModalPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    {editingStaff ? 'Reset Password (Optional)' : 'Staff Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={modalPassword}
                      onChange={(e) => setModalPassword(e.target.value)}
                      placeholder={editingStaff ? 'Leave blank to keep unchanged' : 'Min 6 characters'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Module Permissions
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {editingStaff?.role === 'super_admin'
                        ? 'Super Admin permanently has access to all modules.'
                        : 'Select which tabs and features this staff member is allowed to access.'}
                    </p>
                  </div>

                  {editingStaff?.role !== 'super_admin' && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => applyPreset('counter')}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        Counter Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('conductor')}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        Conductor
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('all')}
                        className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium"
                      >
                        Select All
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editingStaff?.role === 'super_admin' || modalPermissions.includes(perm.key);
                    const isDisabled = editingStaff?.role === 'super_admin';

                    return (
                      <div
                        key={perm.key}
                        onClick={() => !isDisabled && togglePermission(perm.key)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        } ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{perm.icon}</span>
                            <span className="text-xs font-bold">{perm.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {perm.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50"
                >
                  {modalSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingStaff ? 'Update Staff Member' : 'Create Staff Member'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
