import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import {
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  UserCheck,
  ArrowLeft,
  Check,
  Bell,
  MessageSquare,
  HelpCircle,
  PhoneCall,
  FileText,
  AlertTriangle,
  Ticket,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Camera,
  Upload,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';

export const PassengerSettings: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    changePassword,
    deleteAccount,
    tripStats,
    loadTripStats,
    setShowAuthModal,
    setCurrentView,
    goToHome,
    bookings,
    language,
    t,
  } = useBookingStore();

  // Active tab: 'profile' | 'security' | 'support'
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'support'>('profile');

  // Profile Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [emergencyName, setEmergencyName] = useState(currentUser?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser?.emergencyContactPhone || '');
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(currentUser?.notifyWhatsapp !== false);
  const [notifySms, setNotifySms] = useState(currentUser?.notifySms !== false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cancellation Policy modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Load stats on mount
  useEffect(() => {
    if (currentUser) {
      loadTripStats();
    }
  }, [currentUser]);

  // Keep form in sync if currentUser updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setEmergencyName(currentUser.emergencyContactName || '');
      setEmergencyPhone(currentUser.emergencyContactPhone || '');
      setNotifyWhatsapp(currentUser.notifyWhatsapp !== false);
      setNotifySms(currentUser.notifySms !== false);
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  const compressAndResizeImage = (file: File, maxDim = 320, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileError('Image file size must be under 10MB.');
      return;
    }

    setAvatarUploading(true);
    setProfileError(null);
    try {
      const resizedBase64 = await compressAndResizeImage(file, 320, 0.85);
      setAvatarUrl(resizedBase64);
      const res = await updateProfile({
        name: currentUser.name,
        avatarUrl: resizedBase64,
      });
      if (res.success) {
        setProfileSuccess(language === 'sinhala' ? 'පැතිකඩ ඡායාරූපය සාර්ථකව යාවත්කාලීන විය!' : 'Profile picture updated successfully!');
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.message);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to process image.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser) return;
    if (!confirm(language === 'sinhala' ? 'ඔබගේ පැතිකඩ ඡායාරූපය ඉවත් කිරීමට අවශ්‍යද?' : 'Remove your profile picture?')) return;
    setAvatarUploading(true);
    setProfileError(null);
    try {
      setAvatarUrl('');
      const res = await updateProfile({
        name: currentUser!.name,
        avatarUrl: null,
      });
      if (res.success) {
        setProfileSuccess(language === 'sinhala' ? 'පැතිකඩ ඡායාරූපය ඉවත් කරන ලදී.' : 'Profile photo removed.');
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.message);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveImageUrl = async () => {
    if (!currentUser || !customImageUrl.trim()) return;
    setAvatarUploading(true);
    setShowUrlModal(false);
    setProfileError(null);
    try {
      const url = customImageUrl.trim();
      setAvatarUrl(url);
      const res = await updateProfile({
        name: currentUser!.name,
        avatarUrl: url,
      });
      if (res.success) {
        setProfileSuccess(language === 'sinhala' ? 'පැතිකඩ ඡායාරූපය සාර්ථකව යාවත්කාලීන විය!' : 'Profile picture updated successfully!');
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.message);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update photo URL.');
    } finally {
      setAvatarUploading(false);
      setCustomImageUrl('');
    }
  };

  // ─── Validation Helpers ──────────────────────────────────────────────────
  const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
  const isNameValid = (val: string) => {
    const trimmed = val.trim();
    return trimmed.length >= 3 && trimmed.length <= 50 && NAME_REGEX.test(trimmed);
  };

  const isPhoneValid = (val: string) => {
    if (!val || !val.trim()) return true; // Phone is optional
    const clean = val.trim().replace(/[\s-]/g, '');
    return /^(?:0|\+94|94)7[01245678]\d{7}$/.test(clean);
  };

  const isCurrentPassValid = (val: string) => val.length > 0;
  const isNewPassValid = (val: string) => val.length >= 6 && val.length <= 64;
  const isPassMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  // Password strength logic
  const getPasswordStrength = (val: string) => {
    if (!val || val.length < 6) return { label: 'Weak', score: 1, color: 'bg-rose-500', textColor: 'text-rose-600' };
    const hasLetters = /[a-zA-Z]/.test(val);
    const hasNumbers = /\d/.test(val);
    const hasSpecial = /[^a-zA-Z0-9]/.test(val);
    
    if (val.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { label: 'Strong', score: 3, color: 'bg-emerald-500', textColor: 'text-emerald-600' };
    }
    if (hasLetters && hasNumbers) {
      return { label: 'Medium', score: 2, color: 'bg-amber-500', textColor: 'text-amber-600' };
    }
    return { label: 'Weak', score: 1, color: 'bg-rose-500', textColor: 'text-rose-600' };
  };

  // If not logged in
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-10 shadow-xl max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">Authentication Required</h2>
            <p className="text-slate-500 text-sm">
              Please sign in to your passenger account to manage your profile and security settings.
            </p>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
          >
            {t('signIn')}
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats from bookings if tripStats is loading or fallback
  const userBookings = bookings.filter(
    (b) =>
      b.passenger?.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
      (currentUser.phone && b.passenger?.phone && b.passenger?.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, ''))
  );
  const completedCount = tripStats?.completedTrips ?? userBookings.filter((b) => b.bookingStatus === 'boarded' || b.bookingStatus === 'confirmed').length;
  const upcomingCount = tripStats?.upcomingTrips ?? userBookings.filter((b) => b.bookingStatus === 'confirmed').length;

  // Handle Profile & Emergency Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    const cleanName = name.trim();
    if (!isNameValid(cleanName)) {
      setProfileError('Full Name must be between 3 and 50 characters, containing only letters, spaces, dots, or hyphens.');
      return;
    }

    if (!isPhoneValid(phone)) {
      setProfileError('Please enter a valid Sri Lankan mobile number (e.g. 0771234567).');
      return;
    }

    if (emergencyPhone && !isPhoneValid(emergencyPhone)) {
      setProfileError('Please enter a valid Sri Lankan mobile number for emergency contact (07XXXXXXXX).');
      return;
    }

    setProfileLoading(true);
    const res = await updateProfile({
      name: cleanName,
      phone,
      emergencyContactName: emergencyName.trim() || null,
      emergencyContactPhone: emergencyPhone.trim() || null,
      notifyWhatsapp,
      notifySms,
      avatarUrl: avatarUrl || null,
    });
    setProfileLoading(false);

    if (res.success) {
      setProfileSuccess(t('profileUpdatedSuccess'));
      setTimeout(() => setProfileSuccess(null), 5000);
    } else {
      setProfileError(res.message);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (!isCurrentPassValid(currentPassword)) {
      setPassError('Current password is required.');
      return;
    }

    if (!isNewPassValid(newPassword)) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setPassError('New password must be different from your current password.');
      return;
    }

    if (!isPassMatch) {
      setPassError(t('passwordsDoNotMatch'));
      return;
    }

    setPassLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPassLoading(false);

    if (res.success) {
      setPassSuccess(t('passwordChangedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 5000);
    } else {
      setPassError(res.message);
    }
  };

  // Handle Delete Account
  const handleDeleteAccountConfirm = async () => {
    setDeleteLoading(true);
    const res = await deleteAccount();
    setDeleteLoading(false);
    if (!res.success) {
      alert(res.message || 'Failed to delete account');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={goToHome}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all cursor-pointer group"
              title={t('backToHome')}
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="relative group flex-shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/20 ring-2 ring-white/10"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/20">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-90 border border-white/30 cursor-pointer disabled:opacity-50"
                title={language === 'sinhala' ? 'ඡායාරූපය වෙනස් කරන්න' : 'Change Profile Picture'}
              >
                {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/30 border border-blue-400/40 text-blue-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-200">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Account</span>
          </div>
        </div>
      </div>

      {/* ── 1. Travel Summary (Quick Stats Row) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Completed Trips */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t('completedTrips')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {completedCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/40">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Upcoming Trips */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t('upcomingTrips')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {upcomingCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Quick My Tickets Shortcut */}
        <div
          onClick={() => setCurrentView('my-bookings')}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 rounded-3xl shadow-md shadow-blue-600/20 text-white flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
        >
          <div>
            <span className="text-[11px] font-extrabold text-blue-100 uppercase tracking-wider block">
              {t('myTickets')}
            </span>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5 group-hover:underline">
              <span>{t('viewMyTickets')}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
            <Ticket className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('profileInformation')}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{t('changePasswordTitle')}</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'support'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('helpSupport')}</span>
        </button>
      </div>

      {/* ── TAB 1: Profile & Emergency Contact ── */}
      {activeTab === 'profile' && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-white/10 pb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              {t('profileInformation')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Update your account name, contact details, and emergency next-of-kin information.
            </p>
          </div>

          {/* Success Banner */}
          {profileSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {profileError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Profile Avatar Management Card */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-md">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'sinhala' ? 'පැතිකඩ ඡායාරූපය (Avatar / DP)' : language === 'tamil' ? 'சுயவிவரப் படம் (DP)' : 'Profile Picture (Avatar / DP)'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentUser.avatarUrl 
                      ? (language === 'sinhala' ? 'ඔබගේ ඡායාරූපය හෝ Gmail DP දර්ශනය වේ' : 'Custom / Gmail profile picture active') 
                      : (language === 'sinhala' ? 'ඔබ කැමති ඡායාරූපයක් එක් කරන්න හෝ Gmail DP භාවිතා කරන්න' : 'Upload any picture or use your Gmail DP')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{language === 'sinhala' ? 'ඡායාරූපයක් තෝරන්න' : 'Upload Photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlModal(true)}
                  disabled={avatarUploading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Image URL"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>URL</span>
                </button>

                {currentUser.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-200 dark:border-rose-800/50 cursor-pointer disabled:opacity-50"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'sinhala' ? 'ඉවත් කරන්න' : 'Remove'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('usernameLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('phoneLabelSettings')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="07XXXXXXXX"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Used for ticket WhatsApp delivery and booking contact.</p>
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('accountEmail')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-500 font-medium text-sm cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Account Role (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('accountRole')}
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-500 font-medium text-sm cursor-not-allowed select-none capitalize"
                  />
                </div>
              </div>
            </div>

            {/* ── Emergency Contact Details Section ── */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{t('emergencyContact')}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('emergencyContactDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('emergencyNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Nimal Perera (Father / Spouse)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('emergencyPhoneLabel')}
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                    placeholder="07XXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('saveProfile')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Security, Alerts & Danger Zone ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Notification & Alert Preferences */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                {t('notificationAlerts')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize how you receive e-tickets, boarding passes, and departure reminders.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{t('notifyWhatsappTitle')}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifyWhatsappDesc')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => {
                      setNotifyWhatsapp(e.target.checked);
                      updateProfile({ name: currentUser.name, notifyWhatsapp: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>


            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                {t('changePasswordTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ensure your account is using a long, random password to stay secure.
              </p>
            </div>

            {passSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('currentPasswordLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('newPasswordLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Enter new password (min. 6 chars)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className={`h-full ${getPasswordStrength(newPassword).color} transition-all`} style={{ width: `${(getPasswordStrength(newPassword).score / 3) * 100}%` }}></div>
                      </div>
                      <span className={`text-[10px] font-bold ${getPasswordStrength(newPassword).textColor}`}>
                        {getPasswordStrength(newPassword).label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('confirmPasswordLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Re-type new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {passLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t('updatePassword')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-black">{t('dangerZone')}</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('deleteAccountWarning')}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
              >
                {t('deleteAccountBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Help & Support (Item 6) ── */}
      {activeTab === 'support' && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              {t('helpSupport')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('helpSupportDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* 24/7 Hotline Call */}
            <a
              href="tel:0762581841"
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 flex items-center gap-4 transition-all group cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{t('callHotline')}</h4>
                <p className="text-xs text-blue-600 dark:text-cyan-400 font-mono font-bold mt-0.5">076 258 1841 / 071 143 3520</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Available 24 hours for booking & seat inquiries</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </a>

            {/* WhatsApp Chat Support */}
            <a
              href="https://wa.me/94762581841?text=Hi%20Dewmina%20Travels,%20I%20need%20help%20with%20my%20bus%20booking"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 flex items-center gap-4 transition-all group cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{t('whatsappSupport')}</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">+94 76 258 1841</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Instant chat with online dispatch conductor</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            </a>
          </div>

          {/* Cancellation Policy Trigger Card */}
          <div
            onClick={() => setShowPolicyModal(true)}
            className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{t('refundPolicy')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Read rules regarding ticket rescheduling, cancellations, and bank refunds.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{t('deleteAccountBtn')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('confirmDeleteAccount')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancellation Policy Modal ── */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{t('refundPolicy')}</span>
              </h3>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <h5 className="font-black text-blue-900 dark:text-blue-300">⏳ Cancellation Timeframes:</h5>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>Over 24 hours prior to departure:</strong> 90% refund or free date rescheduling.</li>
                  <li><strong>12 - 24 hours prior:</strong> 75% refund.</li>
                  <li><strong>Less than 12 hours:</strong> Non-refundable. Please call hotline for emergency seat swaps.</li>
                </ul>
              </div>
              <p>
                Bank transfer refunds are credited to the originating account within 2-3 business days upon verification by the Dewmina Super Line finance desk.
              </p>
              <p>
                In the rare event of bus breakdown or route alteration, passengers are guaranteed alternative premium seat placement or a 100% full instant refund.
              </p>
            </div>
            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Image URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <span>{language === 'sinhala' ? 'ඡායාරූප සබැඳිය (Image URL)' : 'Enter Image URL'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'sinhala' 
                ? 'ඔබගේ Gmail DP සබැඳිය හෝ වෙනත් ඕනෑම ඡායාරූප සබැඳියක් (URL) මෙහි ඇතුළත් කරන්න:'
                : 'Paste a direct link to any image (e.g. Google profile picture or web image URL):'}
            </p>
            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowUrlModal(false); setCustomImageUrl(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {language === 'sinhala' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveImageUrl}
                disabled={!customImageUrl.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {language === 'sinhala' ? 'සුරකින්න' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerSettings;
