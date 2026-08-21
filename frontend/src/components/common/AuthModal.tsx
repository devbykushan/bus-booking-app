import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { LogIn, UserCheck, ShieldCheck, X, Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login, register } = useBookingStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'passenger' | 'admin'>('passenger');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time validation touched states
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Refs for auto-focus on validation failure
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Validation helpers
  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isPasswordValid = (val: string) => val.length >= 6;
  const isNameValid = (val: string) => val.trim().length >= 3;
  const isPhoneValid = (val: string) => /^(?:0|\+94)7\d{8}$/.test(val.replace(/[\s-]/g, ''));
  const normalizedPhone = phone.replace(/[\s-]/g, '').replace(/^0/, '+94');

  const handleRoleChange = (newRole: 'passenger' | 'admin') => {
    setRole(newRole);
    setErrorMsg('');
    setNameTouched(false);
    setPhoneTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setShakeError(false);

    // Mark all fields as touched
    setNameTouched(true);
    setPhoneTouched(mode === 'register' && role === 'passenger');
    setEmailTouched(true);
    setPasswordTouched(true);

    // Front-end validation
    if (mode === 'register' && !isNameValid(name)) {
      setShakeError(true);
      setErrorMsg('Full name must be at least 3 characters.');
      nameRef.current?.focus();
      return;
    }

    if (mode === 'register' && role === 'passenger' && !isPhoneValid(phone)) {
      setShakeError(true);
      setErrorMsg('Enter a valid Sri Lankan mobile number (07XXXXXXXX).');
      phoneRef.current?.focus();
      return;
    }

    if (!isEmailValid(email)) {
      setShakeError(true);
      setErrorMsg('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    if (!isPasswordValid(password)) {
      setShakeError(true);
      setErrorMsg('Password must be at least 6 characters.');
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password, role);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
          setShakeError(true);
        }
      } else {
        const res = await register(name, email, password, role, role === 'passenger' ? normalizedPhone : undefined);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
          setShakeError(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setShakeError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-clear the shake animation after it plays
  useEffect(() => {
    if (shakeError) {
      const timer = setTimeout(() => setShakeError(false), 600);
      return () => clearTimeout(timer);
    }
  }, [shakeError]);

  // Input wrapper styling based on validation state
  const inputRingClass = (touched: boolean, valid: boolean, shakeThis: boolean) =>
    `relative flex items-center rounded-xl border py-2.5 px-3 transition-all ${
      !touched
        ? 'modern-focus-ring border-slate-200 bg-slate-50'
        : valid
          ? 'success-focus-ring border-emerald-300 bg-emerald-50/20'
          : 'error-focus-ring border-rose-300 bg-rose-50/30'
    } ${shakeThis ? 'animate-shake-float' : ''}`;

  const iconColor = (touched: boolean, valid: boolean) =>
    !touched ? 'text-slate-400' : valid ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4 transition-opacity animate-fade-in-up">
      {/* Anti-Gravity Floating Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-blue-400/20 blur-[100px] animate-blob-1" />
        <div className="absolute -bottom-[15%] -right-[15%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 blur-[120px] animate-blob-2" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-cyan-400/10 blur-[90px] animate-blob-1" />
      </div>

      {/* Entrance wrapper (bottom-up float) */}
      <div className="max-w-md w-full animate-pop-in">
        {/* Floating modal card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-antigravity-float">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shadow-sm animate-pulse-glow">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {mode === 'login' ? 'Account Sign In' : 'Create New Account'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Dewmina Super Line Sri Lanka</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Selector with Sliding Indicator */}
          <div className="relative flex p-1 rounded-2xl bg-slate-100/80 backdrop-blur-sm text-xs font-bold border border-slate-200/50">
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm transition-all duration-300 ease-out"
              style={{
                left: role === 'passenger' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
              }}
            />
            <button
              type="button"
              onClick={() => handleRoleChange('passenger')}
              className={`relative z-10 flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                role === 'passenger' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Passenger
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`relative z-10 flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                role === 'admin' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Admin & Staff
            </button>
          </div>

          {/* Error Message (floats in) */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold shadow-sm animate-fade-in-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">

            {/* Full Name (register only) */}
            {mode === 'register' && (
              <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                <label className="block text-slate-600 mb-1.5 font-semibold">Full Name</label>
                <div className={inputRingClass(nameTouched, isNameValid(name), shakeError && !isNameValid(name))}>
                  <User className={`w-4 h-4 mr-2.5 transition-colors ${iconColor(nameTouched, isNameValid(name))}`} />
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="e.g. Kushan Perera"
                    value={name}
                    onBlur={() => setNameTouched(true)}
                    onChange={(e) => { setName(e.target.value); if (!nameTouched) setNameTouched(true); }}
                    className="w-full bg-transparent text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                    required
                  />
                  {nameTouched && (
                    isNameValid(name)
                      ? <span className="text-emerald-500 font-bold ml-1 text-sm animate-fade-in-up">✓</span>
                      : <AlertCircle className="w-4 h-4 text-rose-500 ml-1 animate-fade-in-up" />
                  )}
                </div>
                {nameTouched && !isNameValid(name) && (
                  <div className="mt-1 text-[10px] text-rose-500 font-semibold animate-fade-in-up pl-1">
                    Name must be at least 3 characters.
                  </div>
                )}
              </div>
            )}

            {/* Mobile Number (passenger registration only) */}
            {mode === 'register' && role === 'passenger' && (
              <div className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
                <label className="block text-slate-600 mb-1.5 font-semibold">Mobile Number</label>
                <div className={inputRingClass(phoneTouched, isPhoneValid(phone), shakeError && !isPhoneValid(phone))}>
                  <Phone className={`w-4 h-4 mr-2.5 transition-colors ${iconColor(phoneTouched, isPhoneValid(phone))}`} />
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => { setPhone(e.target.value); if (!phoneTouched) setPhoneTouched(true); }}
                    className="w-full bg-transparent text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                    required
                  />
                  {phoneTouched && (
                    isPhoneValid(phone)
                      ? <span className="text-emerald-500 font-bold ml-1 text-sm animate-fade-in-up">✓</span>
                      : <AlertCircle className="w-4 h-4 text-rose-500 ml-1 animate-fade-in-up" />
                  )}
                </div>
                {phoneTouched && !isPhoneValid(phone) && (
                  <div className="mt-1 text-[10px] text-rose-500 font-semibold animate-fade-in-up pl-1">
                    Use 07XXXXXXXX or +947XXXXXXXX.
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            <div className="animate-fade-in-up" style={{ animationDelay: mode === 'register' ? '200ms' : '80ms' }}>
              <label className="block text-slate-600 mb-1.5 font-semibold">Email Address</label>
              <div className={inputRingClass(emailTouched, isEmailValid(email), shakeError && !isEmailValid(email))}>
                <Mail className={`w-4 h-4 mr-2.5 transition-colors ${iconColor(emailTouched, isEmailValid(email))}`} />
                <input
                  ref={emailRef}
                  type="email"
                  placeholder={role === 'admin' ? 'admin@dewminasuperline.lk' : 'passenger@dewminasuperline.lk'}
                  value={email}
                  onBlur={() => setEmailTouched(true)}
                  onChange={(e) => { setEmail(e.target.value); if (!emailTouched) setEmailTouched(true); }}
                  className="w-full bg-transparent text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                  required
                />
                {emailTouched && (
                  isEmailValid(email)
                    ? <span className="text-emerald-500 font-bold ml-1 text-sm animate-fade-in-up">✓</span>
                    : <AlertCircle className="w-4 h-4 text-rose-500 ml-1 animate-fade-in-up" />
                )}
              </div>
              {emailTouched && !isEmailValid(email) && (
                <div className="mt-1 text-[10px] text-rose-500 font-semibold animate-fade-in-up pl-1">
                  Please enter a valid email address.
                </div>
              )}
            </div>

            {/* Password */}
            <div className="animate-fade-in-up" style={{ animationDelay: mode === 'register' ? '260ms' : '140ms' }}>
              <label className="block text-slate-600 mb-1.5 font-semibold">Password</label>
              <div className={inputRingClass(passwordTouched, isPasswordValid(password), shakeError && !isPasswordValid(password))}>
                <Lock className={`w-4 h-4 mr-2.5 transition-colors ${iconColor(passwordTouched, isPasswordValid(password))}`} />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onBlur={() => setPasswordTouched(true)}
                  onChange={(e) => { setPassword(e.target.value); if (!passwordTouched) setPasswordTouched(true); }}
                  className="w-full bg-transparent text-slate-800 text-xs focus:outline-none placeholder-slate-400 pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordTouched && !isPasswordValid(password) && (
                <div className="mt-1 text-[10px] text-rose-500 font-semibold animate-fade-in-up pl-1">
                  Password must be at least 6 characters long.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Processing...
                </>
              ) : mode === 'login' ? (
                `Sign In as ${role === 'admin' ? 'Admin' : 'Passenger'}`
              ) : (
                'Register Account'
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="text-center pt-1 border-t border-slate-100/60">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg('');
                setNameTouched(false);
                setPhoneTouched(false);
                setEmailTouched(false);
                setPasswordTouched(false);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-semibold"
            >
              {mode === 'login'
                ? <>Don't have an account? <span className="underline decoration-blue-400 decoration-2 underline-offset-2">Register here</span></>
                : <>Already have an account? <span className="underline decoration-blue-400 decoration-2 underline-offset-2">Sign in</span></>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
