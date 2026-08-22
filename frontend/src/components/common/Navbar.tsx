import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { AuthModal } from './AuthModal';
import { Bus, MapPin, Ticket, Clock, ShieldCheck, LogOut, LogIn, Menu, X, ChevronDown, Sparkles, Globe, Route } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    goToHome,
    goToSearchSchedules,
    currentUser,
    userRole, 
    setUserRole, 
    logout,
    lockActive, 
    lockExpirySeconds,
    selectedSeatIds,
    showAuthModal,
    setShowAuthModal,
    language,
    setLanguage,
    t
  } = useBookingStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Track scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile and language dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 3D tilt effect on mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -10;
    const tiltY = (x - 0.5) * 10;
    navRef.current.style.setProperty('--tilt-x', `${tiltX}deg`);
    navRef.current.style.setProperty('--tilt-y', `${tiltY}deg`);
    navRef.current.style.setProperty('--mouse-x', `${x * 100}%`);
    navRef.current.style.setProperty('--mouse-y', `${y * 100}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!navRef.current) return;
    navRef.current.style.setProperty('--tilt-x', '0deg');
    navRef.current.style.setProperty('--tilt-y', '0deg');
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const navItems = [
    { key: 'passenger-search', translationKey: 'findBuses', icon: Bus, activeOn: ['passenger-search'] },
    { key: 'schedules-dashboard', translationKey: 'journeys', icon: Route, activeOn: ['schedules-dashboard', 'seat-selection', 'checkout', 'ticket-confirmation'] },
    { key: 'live-tracking', translationKey: 'liveGps', icon: MapPin, activeOn: ['live-tracking'] },
    { key: 'my-bookings', translationKey: 'myTickets', icon: Ticket, activeOn: ['my-bookings'] },
  ];

  const isActive = (activeOn: string[]) => activeOn.includes(currentView);

  const handleNavItemClick = (view: string) => {
    const requiresAuth = view === 'live-tracking' || view === 'my-bookings';
    if (requiresAuth && !currentUser) {
      setMobileOpen(false);
      setShowAuthModal(true);
      return;
    }

    if (view === 'passenger-search') {
      goToHome();
      setMobileOpen(false);
      return;
    }

    if (view === 'schedules-dashboard') {
      goToSearchSchedules();
      setMobileOpen(false);
      return;
    }

    setCurrentView(view as any);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="nav3d-perspective fixed top-0 left-0 right-0 z-50 w-full">
        <nav
          ref={navRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`nav3d-root transition-all duration-500 ${
            scrolled ? 'nav3d-scrolled' : 'nav3d-top'
          }`}
        >
          {/* Animated gradient line at top */}
          <div className="nav3d-gradient-line" />

          {/* 3D Depth layers - background visual effects */}
          <div className="nav3d-bg-layer">
            {/* Floating orbs */}
            <div className="nav3d-orb nav3d-orb-1" />
            <div className="nav3d-orb nav3d-orb-2" />
            <div className="nav3d-orb nav3d-orb-3" />
            {/* Mouse-following spotlight */}
            <div className="nav3d-spotlight" />
          </div>

          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
            <div className="flex items-center justify-between h-16 md:h-[72px]">
              
              {/* ── Brand with 3D float ── */}
              <div
                onClick={() => { goToHome(); setMobileOpen(false); }}
                className="nav3d-brand group cursor-pointer flex items-center gap-3"
              >
                <div className="nav3d-logo-wrapper">
                  <img
                    src="/dewmina-logo.png"
                    alt="Dewmina Super Line"
                    className="h-11 md:h-14 w-auto object-contain transition-transform duration-500"
                  />
                  <div className="nav3d-logo-depth" />
                  <div className="nav3d-logo-shine" />
                  <div className="nav3d-logo-glow" />
                </div>
              </div>

              {/* ── Desktop Nav with 3D card buttons ── */}
              <div className="hidden md:flex items-center gap-2">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isActive(item.activeOn);
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavItemClick(item.key)}
                      className={`nav3d-link group ${active ? 'nav3d-link-active' : 'nav3d-link-inactive'}`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* 3D icon container */}
                      <div className={`nav3d-icon-cube ${active ? 'nav3d-icon-active' : ''}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="relative z-10">{t(item.translationKey)}</span>

                      {/* Active glow underline */}
                      {active && (
                        <>
                          <span className="nav3d-active-bar" />
                          <span className="nav3d-active-reflection" />
                        </>
                      )}

                      {/* Hover 3D shine sweep */}
                      <span className="nav3d-shine" />
                    </button>
                  );
                })}

                {/* Admin tab with 3D */}
                {(userRole === 'admin' || currentUser?.role === 'admin') && (
                  <button
                    onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); }}
                    className={`nav3d-link nav3d-admin ${
                      currentView === 'admin-panel' ? 'nav3d-admin-active' : 'nav3d-admin-inactive'
                    }`}
                  >
                    <div className={`nav3d-icon-cube ${currentView === 'admin-panel' ? 'nav3d-icon-admin-active' : ''}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="relative z-10">{t('adminPortal')}</span>
                    {currentView === 'admin-panel' && <span className="nav3d-active-bar nav3d-bar-purple" />}
                    <span className="nav3d-shine" />
                  </button>
                )}
              </div>

              {/* ── Right side ── */}
              <div className="flex items-center gap-3">

                {/* 3D Language Selector */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="nav3d-lang-btn group"
                  >
                    <Globe className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-xs font-bold text-white uppercase hidden sm:inline">
                      {language === 'english' ? 'EN' : language === 'sinhala' ? 'සිං' : 'த'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 3D Dropdown */}
                  {langOpen && (
                    <div className="nav3d-dropdown w-32">
                      <div className="py-1">
                        <button
                          onClick={() => { setLanguage('english'); setLangOpen(false); }}
                          className={`nav3d-dropdown-item justify-between ${language === 'english' ? 'text-blue-400 bg-white/5 font-bold' : ''}`}
                        >
                          <span>English</span>
                          {language === 'english' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </button>
                        <button
                          onClick={() => { setLanguage('sinhala'); setLangOpen(false); }}
                          className={`nav3d-dropdown-item justify-between ${language === 'sinhala' ? 'text-blue-400 bg-white/5 font-bold' : ''}`}
                        >
                          <span>සිංහල</span>
                          {language === 'sinhala' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </button>
                        <button
                          onClick={() => { setLanguage('tamil'); setLangOpen(false); }}
                          className={`nav3d-dropdown-item justify-between ${language === 'tamil' ? 'text-blue-400 bg-white/5 font-bold' : ''}`}
                        >
                          <span>தமிழ்</span>
                          {language === 'tamil' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seat hold countdown with 3D depth */}
                {lockActive && selectedSeatIds.length > 0 && (
                  <div className="nav3d-seat-lock">
                    <div className="nav3d-lock-ring" />
                    <div className="nav3d-lock-ring nav3d-lock-ring-2" />
                    <Clock className="w-3.5 h-3.5 text-amber-300 relative z-10" />
                    <span className="text-amber-100 text-xs font-medium hidden sm:inline relative z-10">
                      {selectedSeatIds.length} {t('held')}
                    </span>
                    <span className="font-mono font-black text-amber-300 text-sm tabular-nums relative z-10">
                      {formatTimer(lockExpirySeconds)}
                    </span>
                  </div>
                )}

                {/* Auth / Profile with 3D avatar */}
                {currentUser ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="nav3d-profile-btn group flex items-center gap-2"
                    >
                      <div className="nav3d-avatar">
                        <span className="nav3d-avatar-text">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="nav3d-avatar-ring" />
                      </div>
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                          {currentUser.name}
                        </span>
                        <span className={`text-[10px] font-mono uppercase leading-tight ${
                          currentUser.role === 'admin' ? 'text-purple-300' : 'text-blue-300'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 3D Dropdown */}
                    {profileOpen && (
                      <div className="nav3d-dropdown">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-bold text-white">{currentUser.name}</p>
                          <p className="text-xs text-slate-400">{currentUser.phone || currentUser.role}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { setCurrentView('my-bookings'); setProfileOpen(false); }}
                            className="nav3d-dropdown-item"
                          >
                            <Ticket className="w-4 h-4" />
                            {t('myTickets')}
                          </button>
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className="nav3d-dropdown-item nav3d-dropdown-danger"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('signOut')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="nav3d-signin group"
                  >
                    {/* 3D layered button */}
                    <span className="nav3d-signin-bg" />
                    <span className="nav3d-signin-shine" />
                    <Sparkles className="w-3.5 h-3.5 relative z-10 nav3d-sparkle" />
                    <LogIn className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 hidden sm:inline font-bold">{t('signIn')}</span>
                  </button>
                )}

                {/* Mobile hamburger with 3D flip */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden nav3d-hamburger"
                >
                  <div className={`nav3d-hamburger-inner ${mobileOpen ? 'nav3d-hamburger-open' : ''}`}>
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </div>
                </button>
              </div>

            </div>
          </div>

          {/* ── Mobile Menu with 3D slide ── */}
          <div className={`md:hidden nav3d-mobile ${mobileOpen ? 'nav3d-mobile-open' : 'nav3d-mobile-closed'}`}>
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = isActive(item.activeOn);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavItemClick(item.key)}
                    className={`nav3d-mobile-item ${active ? 'nav3d-mobile-active' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className={`nav3d-icon-cube nav3d-icon-sm ${active ? 'nav3d-icon-active' : ''}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {t(item.translationKey)}
                  </button>
                );
              })}
              {(userRole === 'admin' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); setMobileOpen(false); }}
                  className={`nav3d-mobile-item ${currentView === 'admin-panel' ? 'nav3d-mobile-admin-active' : ''}`}
                >
                  <div className={`nav3d-icon-cube nav3d-icon-sm ${currentView === 'admin-panel' ? 'nav3d-icon-admin-active' : ''}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  {t('adminPortal')}
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
