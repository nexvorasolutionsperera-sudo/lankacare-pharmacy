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
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  Activity,
  Smartphone
} from 'lucide-react';

export default function Sidebar({ 
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const isCashier = (currentUser?.role || '').toLowerCase() === 'cashier';
  const lowStockCount = stats?.lowStockCount || 0;
  const expiringCount = (stats?.expiredCount || 0) + (stats?.expiringSoonCount || 0);

  const allNavItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, adminOnly: true },
    { id: 'pos', label: t.posBilling, icon: ShoppingCart, highlight: true },
    { 
      id: 'medicines', 
      label: isCashier ? 'ඖෂධ & භාණ්ඩ විස්තර (Stock Check)' : (t.inventory || 'Medicines, Grocery & Books'), 
      icon: Pill,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500'
    },
    { 
      id: 'dealers', 
      label: t.dealers, 
      icon: Truck,
      adminOnly: true
    },
    { 
      id: 'alerts', 
      label: t.alerts, 
      icon: AlertTriangle,
      badge: expiringCount > 0 ? expiringCount : null,
      badgeColor: 'bg-rose-500',
      adminOnly: true
    },
    { id: 'customers', label: t.customersDocs, icon: Users },
    { id: 'medicare', label: t.medicareServices || 'Medicare & Lab Tests', icon: Activity },
    { id: 'reloads', label: t.reloadServices || 'Photocopy & Reload', icon: Smartphone },
    { id: 'reports', label: t.reports, icon: BarChart3, adminOnly: true }
  ];

  const navItems = isCashier ? allNavItems.filter(item => !item.adminOnly) : allNavItems;

  const bgThemes = [
    { id: 'theme-mint', name: t.themeMint, color: 'bg-emerald-500' },
    { id: 'theme-azure', name: t.themeAzure, color: 'bg-sky-500' },
    { id: 'theme-midnight', name: t.themeMidnight, color: 'bg-slate-700' },
    { id: 'theme-lavender', name: t.themeLavender, color: 'bg-purple-500' },
    { id: 'theme-amber', name: t.themeAmber, color: 'bg-amber-500' }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 text-white">
      
      {/* Top Section: Logo & Brand */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavClick(isCashier ? 'pos' : 'dashboard')}
          >
            <img 
              src="/pharmacy-logo.png" 
              alt="Aaush Pharmacy" 
              className="h-11 w-auto object-contain rounded-xl ring-1 ring-slate-700 shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="text-base font-black text-white leading-tight tracking-tight flex items-center gap-1.5">
                Aaush pharmacy
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block animate-pulse" />
              </div>
              <div className="text-[9px] text-sky-400 font-extrabold uppercase tracking-wider">
                GROCERY, BOOKSHOP & HEALTH MEDI CARE
              </div>
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Menu Navigation
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? item.highlight 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-white/20' 
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : item.highlight
                      ? 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/90 hover:text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-xs ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Language, Theme, User & Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        
        {/* Controls: Language & Theme & Palette */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all cursor-pointer hover:border-slate-600"
            title="Language (භාෂාව)"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate">{lang === 'en' ? 'සිංහල' : 'English'}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center py-2 px-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 transition-all cursor-pointer hover:border-slate-600"
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
              className="w-full flex items-center justify-center py-2 px-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 transition-all cursor-pointer hover:border-slate-600"
              title={t.backgroundThemes}
            >
              <Palette className="w-4 h-4 text-indigo-400" />
            </button>

            {isThemeMenuOpen && (
              <div 
                className="absolute left-0 bottom-12 w-52 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-white"
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

        </div>

        {/* User Profile Card */}
        {currentUser && (
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-750 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
                {currentUser.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.name}
                </div>
                <div className={`text-[10px] font-extrabold uppercase tracking-wider truncate flex items-center gap-1 ${
                  isCashier ? 'text-amber-400' : 'text-sky-400'
                }`}>
                  <ShieldCheck className={`w-3 h-3 shrink-0 ${isCashier ? 'text-amber-400' : 'text-sky-400'}`} />
                  {isCashier ? 'Cashier (කැෂියර්)' : 'Admin / Pharmacist (පරිපාලක)'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title={t.logout}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-650 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Branding Watermark */}
        <div className="text-center pt-1">
          <span className="text-[10px] text-slate-500 font-medium">Aaush Pharmacy System v2.0</span>
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between print:hidden">
        <div 
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveTab(isCashier ? 'pos' : 'dashboard')}
        >
          <img 
            src="/pharmacy-logo.png" 
            alt="Aaush Pharmacy" 
            className="h-9 w-auto object-contain rounded-lg ring-1 ring-slate-700"
          />
          <div>
            <div className="text-xs font-black text-white leading-tight">
              Aaush pharmacy
            </div>
            <div className="text-[8px] text-sky-400 font-extrabold uppercase tracking-wider">
              GROCERY, BOOKSHOP & HEALTH MEDI CARE
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-750 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Sidebar */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Left Sidebar (Fixed) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800/90 sticky top-0 h-screen shrink-0 z-30 shadow-xl overflow-y-auto no-scrollbar print:hidden">
        {sidebarContent}
      </aside>
    </>
  );
}
