import React, { useState } from 'react';
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
} from 'lucide-react';

export const PassengerSettings: React.FC = () => {
  const { currentUser, updateProfile, changePassword, setShowAuthModal, goToHome, t } =
    useBookingStore();

  // Active tab: 'profile' | 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassTouched, setCurrentPassTouched] = useState(false);
  const [newPassTouched, setNewPassTouched] = useState(false);
  const [confirmPassTouched, setConfirmPassTouched] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

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

  // Handle Profile Update (Username change & Phone)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);
    setProfileSuccess(null);
    setProfileError(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 3) {
      setProfileError('Full Name / Username must be at least 3 characters long.');
      return;
    }

    if (!NAME_REGEX.test(cleanName)) {
      setProfileError('Name can only contain letters, spaces, dots, hyphens, and apostrophes.');
      return;
    }

    if (!isPhoneValid(phone)) {
      setProfileError('Please enter a valid Sri Lankan mobile number (e.g. 0771234567).');
      return;
    }

    setProfileLoading(true);
    const res = await updateProfile(cleanName, phone);
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
    setCurrentPassTouched(true);
    setNewPassTouched(true);
    setConfirmPassTouched(true);
    setPassSuccess(null);
    setPassError(null);

    if (!currentPassword) {
      setPassError('Current password is required.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setPassError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
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
      setCurrentPassTouched(false);
      setNewPassTouched(false);
      setConfirmPassTouched(false);
      setTimeout(() => setPassSuccess(null), 5000);
    } else {
      setPassError(res.message);
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/20">
              {currentUser.name.charAt(0).toUpperCase()}
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

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('changeUsername')}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{t('changePasswordTitle')}</span>
        </button>
      </div>

      {/* ── Tab Content: Profile Settings (Username & Phone) ── */}
      {activeTab === 'profile' && (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {t('profileInformation')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Update your account username, display name, and mobile contact details.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {profileSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name / Username Input */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {t('usernameLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    nameTouched ? (isNameValid(name) ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={name}
                    onBlur={() => setNameTouched(true)}
                    onChange={(e) => { setName(e.target.value); setNameTouched(true); }}
                    placeholder="e.g. Kushan Perera"
                    className={`w-full pl-10 pr-10 py-3 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none transition-all ${
                      !nameTouched
                        ? 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
                        : isNameValid(name)
                          ? 'bg-emerald-50/30 border border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                          : 'bg-rose-50/30 border border-rose-300 focus:ring-2 focus:ring-rose-500'
                    }`}
                    required
                  />
                  {nameTouched && (
                    isNameValid(name) ? (
                      <Check className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )
                  )}
                </div>
                {nameTouched && !isNameValid(name) && (
                  <p className="text-[11px] text-rose-600 font-semibold pl-1">
                    {name.trim().length < 3
                      ? 'Full Name / Username must be at least 3 characters.'
                      : !NAME_REGEX.test(name.trim())
                        ? 'Name can only contain letters, spaces, dots, hyphens, and apostrophes.'
                        : 'Name is too long (max 50 characters).'}
                  </p>
                )}
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {t('phoneLabelSettings')}
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    phoneTouched ? (isPhoneValid(phone) ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-400'
                  }`} />
                  <input
                    type="tel"
                    value={phone}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => { setPhone(e.target.value); setPhoneTouched(true); }}
                    placeholder="e.g. 0771234567"
                    className={`w-full pl-10 pr-10 py-3 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none transition-all ${
                      !phoneTouched
                        ? 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
                        : isPhoneValid(phone)
                          ? 'bg-emerald-50/30 border border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                          : 'bg-rose-50/30 border border-rose-300 focus:ring-2 focus:ring-rose-500'
                    }`}
                  />
                  {phoneTouched && phone.trim() && (
                    isPhoneValid(phone) ? (
                      <Check className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )
                  )}
                </div>
                {phoneTouched && !isPhoneValid(phone) && (
                  <p className="text-[11px] text-rose-600 font-semibold pl-1">
                    Enter a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567).
                  </p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  {t('accountEmail')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full pl-10 pr-10 py-3 bg-slate-100 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Role (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  {t('accountRole')}
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={currentUser.role.toUpperCase()}
                    disabled
                    className="w-full pl-10 pr-10 py-3 bg-slate-100 border border-slate-200/80 rounded-2xl text-sm font-extrabold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading || !isNameValid(name) || !isPhoneValid(phone)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('saveProfile')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab Content: Password Change ── */}
      {activeTab === 'security' && (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                {t('changePasswordTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ensure your account is using a strong password of at least 6 characters.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {passSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {passError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t('currentPasswordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onBlur={() => setCurrentPassTouched(true)}
                  onChange={(e) => { setCurrentPassword(e.target.value); setCurrentPassTouched(true); }}
                  placeholder="Enter current password"
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none transition-all ${
                    !currentPassTouched
                      ? 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
                      : isCurrentPassValid(currentPassword)
                        ? 'bg-emerald-50/30 border border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'bg-rose-50/30 border border-rose-300 focus:ring-2 focus:ring-rose-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t('newPasswordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onBlur={() => setNewPassTouched(true)}
                  onChange={(e) => { setNewPassword(e.target.value); setNewPassTouched(true); }}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none transition-all ${
                    !newPassTouched
                      ? 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
                      : isNewPassValid(newPassword) && newPassword !== currentPassword
                        ? 'bg-emerald-50/30 border border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'bg-rose-50/30 border border-rose-300 focus:ring-2 focus:ring-rose-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Password Strength:</span>
                    <span className={getPasswordStrength(newPassword).textColor}>
                      {getPasswordStrength(newPassword).label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      getPasswordStrength(newPassword).score >= 1 ? getPasswordStrength(newPassword).color : 'bg-transparent'
                    } w-1/3`} />
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      getPasswordStrength(newPassword).score >= 2 ? getPasswordStrength(newPassword).color : 'bg-transparent'
                    } w-1/3`} />
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      getPasswordStrength(newPassword).score >= 3 ? getPasswordStrength(newPassword).color : 'bg-transparent'
                    } w-1/3`} />
                  </div>
                </div>
              )}

              {newPassTouched && newPassword === currentPassword && (
                <p className="text-[11px] text-rose-600 font-semibold pl-1">
                  New password cannot be the same as your current password.
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t('confirmPasswordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onBlur={() => setConfirmPassTouched(true)}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPassTouched(true); }}
                  placeholder="Re-enter new password"
                  className={`w-full pl-10 pr-10 py-3 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none transition-all ${
                    !confirmPassTouched || confirmPassword.length === 0
                      ? 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
                      : isPassMatch
                        ? 'bg-emerald-50/30 border border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'bg-rose-50/30 border border-rose-300 focus:ring-2 focus:ring-rose-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Match Feedback */}
              {confirmPassword.length > 0 && (
                <p className={`text-[11px] font-semibold pl-1 flex items-center gap-1 ${
                  isPassMatch ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {isPassMatch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('passwordsDoNotMatch')}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passLoading || !isCurrentPassValid(currentPassword) || !isNewPassValid(newPassword) || !isPassMatch || newPassword === currentPassword}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>{t('updatePassword')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PassengerSettings;
