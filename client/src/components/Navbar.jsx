import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  Truck, 
  Users, 
  BarChart3, 
  AlertTriangle,
  Sun,
  Moon,
  Globe,
  Palette,
  LogOut,
  ChevronDown
} from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  stats, 
  currentUser, 
  onLogout,
  lang,
  setLang,
  theme,
  setTheme,
  bgTheme,
  setBgTheme,
  t
}) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const lowStockCount = stats?.lowStockCount || 0;
  const expiringCount = (stats?.expiredCount || 0) + (stats?.expiringSoonCount || 0);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'pos', label: t.posBilling, icon: ShoppingCart, highlight: true },
    { 
      id: 'medicines', 
      label: t.inventory, 
      icon: Pill,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500'
    },
    { 
      id: 'dealers', 
      label: t.dealers, 
      icon: Truck 
    },
    { 
      id: 'alerts', 
      label: t.alerts, 
      icon: AlertTriangle,
      badge: expiringCount > 0 ? expiringCount : null,
      badgeColor: 'bg-rose-500'
    },
    { id: 'customers', label: t.customersDocs, icon: Users },
    { id: 'reports', label: t.reports, icon: BarChart3 }
  ];

  const bgThemes = [
    { id: 'theme-mint', name: t.themeMint, color: 'bg-emerald-500' },
    { id: 'theme-azure', name: t.themeAzure, color: 'bg-sky-500' },
    { id: 'theme-midnight', name: t.themeMidnight, color: 'bg-slate-700' },
    { id: 'theme-lavender', name: t.themeLavender, color: 'bg-purple-500' },
    { id: 'theme-amber', name: t.themeAmber, color: 'bg-amber-500' }
  ];

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            className="cursor-pointer py-1"
            onClick={() => setActiveTab('dashboard')}
          >
            <Logo size="md" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? item.highlight 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25' 
                        : 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                      : item.highlight
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold text-white ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Language + Theme + Background + User */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Language Switcher (සිංහල / English) */}
            <button
              onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="Change Language (භාෂාව වෙනස් කරන්න)"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'en' ? 'සිංහල' : 'English'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Background Theme Menu */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={t.backgroundThemes}
              >
                <Palette className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </button>

              {/* Theme Dropdown */}
              {isThemeMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsThemeMenuOpen(false)}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                    {t.backgroundThemes}
                  </p>
                  <div className="space-y-1">
                    {bgThemes.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBgTheme(b.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition-all ${
                          bgTheme === b.id 
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${b.color} shrink-0 ring-1 ring-white/50`} />
                        <span className="truncate">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title={t.logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.logout}</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
