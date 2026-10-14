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
    <header className="bg-slate-900 text-white border-b border-slate-800/80 sticky top-0 z-40 shadow-lg backdrop-blur-md transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div 
              className="cursor-pointer py-1 flex items-center gap-2.5 group"
              onClick={() => setActiveTab('dashboard')}
            >
              <img 
                src="/pharmacy-logo.png" 
                alt="Aaush Pharmacy" 
                className="h-10 w-auto object-contain rounded-lg ring-1 ring-slate-700 group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-black text-white leading-tight tracking-tight flex items-center gap-1.5">
                  Aaush pharmacy
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block animate-pulse" />
                </div>
                <div className="text-[9px] text-sky-400 font-extrabold uppercase tracking-wider">
                  GROCERY & HEALTH MEDI CARE
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5">
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
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-white/20' 
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : item.highlight
                        ? 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/80 hover:text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all cursor-pointer hover:border-slate-600"
              title="Change Language (භාෂාව වෙනස් කරන්න)"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'en' ? 'සිංහල' : 'English'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 text-slate-200 transition-all cursor-pointer hover:border-slate-600"
              title={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-400" />
              )}
            </button>

            {/* Background Theme Menu */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 text-slate-200 transition-all cursor-pointer hover:border-slate-600"
                title={t.backgroundThemes}
              >
                <Palette className="w-4 h-4 text-indigo-400" />
              </button>

              {/* Theme Dropdown */}
              {isThemeMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-white"
                  onMouseLeave={() => setIsThemeMenuOpen(false)}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
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
                            ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title={t.logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.logout}</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span className={`text-[9px] px-1 rounded-full text-white ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
