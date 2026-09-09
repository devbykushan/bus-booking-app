import re

with open('frontend/src/components/common/Navbar.tsx', 'r') as f:
    content = f.read()

# 1. Remove the mobile hamburger button
mobile_btn_pattern = r"\{\/\* Mobile hamburger button \*\/\}.*?<\/button>"
content = re.sub(mobile_btn_pattern, "", content, flags=re.DOTALL)

# 2. Replace the mobile menu dropdown with the bottom nav bar
mobile_dropdown_pattern = r"\{\/\* ── Mobile Menu Dropdown ── \*\/\}.*?<\/nav>"
bottom_nav_code = """</nav>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe transition-colors duration-300">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.activeOn);
            return (
              <button
                key={item.key}
                onClick={() => handleNavItemClick(item.key)}
                className={`flex flex-col items-center justify-center w-16 gap-1 p-1 rounded-xl transition-all ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'fill-blue-100 dark:fill-blue-900/50' : ''}`} />
                <span className="text-[10px] font-bold text-center leading-tight truncate w-full">
                  {t(item.translationKey)}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={() => {
              if (currentUser) {
                if (currentUser.role === 'admin' || userRole === 'admin') {
                  setCurrentView('admin-panel');
                } else {
                  setCurrentView('passenger-settings');
                }
              } else {
                setShowAuthModal(true);
              }
            }}
            className={`flex flex-col items-center justify-center w-16 gap-1 p-1 rounded-xl transition-all ${
              currentView === 'passenger-settings' || currentView === 'admin-panel'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {currentUser ? (
              (currentUser.role === 'admin' || userRole === 'admin') ? (
                <ShieldCheck className={`w-5 h-5 ${currentView === 'admin-panel' ? 'fill-blue-100 dark:fill-blue-900/50' : ''}`} />
              ) : (
                <Settings className={`w-5 h-5 ${currentView === 'passenger-settings' ? 'fill-blue-100 dark:fill-blue-900/50' : ''}`} />
              )
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span className="text-[10px] font-bold text-center leading-tight truncate w-full">
              {currentUser ? (
                (currentUser.role === 'admin' || userRole === 'admin') ? t('adminPortal') : t('passengerSettings')
              ) : (
                t('signIn')
              )}
            </span>
          </button>
        </div>"""

content = re.sub(mobile_dropdown_pattern, bottom_nav_code, content, flags=re.DOTALL)

with open('frontend/src/components/common/Navbar.tsx', 'w') as f:
    f.write(content)

print("Replaced dropdown with bottom nav")
