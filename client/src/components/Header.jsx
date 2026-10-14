import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Globe, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Menu,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab,
  stats, 
  currentUser, 
  theme, 
  setTheme, 
  lang, 
  setLang, 
  onOpenMobileSidebar,
  t 
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCashier = (currentUser?.role || '').toLowerCase() === 'cashier';
  const lowStockCount = stats?.lowStockCount || 0;
  const expiringCount = (stats?.expiredCount || 0) + (stats?.expiringSoonCount || 0);

  // Friendly page title mapping
  const pageTitles = {
    dashboard: { title: 'Executive Dashboard (ප්‍රධාන පුවරුව)', category: 'Analytics & Management' },
    pos: { title: 'Point of Sale Billing (කවුන්ටර බිල්පත්)', category: 'Sales Counter' },
    medicines: { title: isCashier ? 'Stock & Price Check (මිල සහ තොග විස්තර)' : 'Inventory Catalog (ඖෂධ & භාණ්ඩ)', category: 'Inventory' },
    dealers: { title: 'Suppliers & GRN Orders (සැපයුම්කරුවන්)', category: 'Supply Chain' },
    alerts: { title: 'Inventory & Expiry Alerts (අනතුරු ඇඟවීම්)', category: 'Quality Control' },
    customers: { title: 'Patients & Prescribers (පාරිභෝගිකයින් & වෛද්‍යවරුන්)', category: 'Relations' },
    medicare: { title: 'Medicare & Clinical Diagnostics (සායනික පරීක්ෂණ)', category: 'Healthcare Services' },
    reloads: { title: 'Photocopy & Digital Reloads (රීලෝඩ් & සේවා)', category: 'Utility Services' },
    reports: { title: 'Financial Reports & Profit Audits (මූල්‍ය වාර්තා)', category: 'Auditing' }
  };

  const currentPage = pageTitles[activeTab] || { title: 'Aaush Enterprise', category: 'General' };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Mobile Menu Trigger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Aaush ERP</span>
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentPage.category}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
              {currentPage.title}
            </h1>
          </div>
        </div>

        {/* Center: System Status & Live Clock (Desktop) */}
        <div className="hidden md:flex items-center gap-4 py-1.5 px-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-750">
          
          {/* Online Beacon */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              System Live
            </span>
          </div>

          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700"></div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-slate-400 font-sans font-normal ml-1 hidden lg:inline">
              {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Alerts notification icon if admin */}
          {!isCashier && (lowStockCount > 0 || expiringCount > 0) && (
            <button
              onClick={() => setActiveTab('alerts')}
              className="relative p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
              title="Stock & Expiry Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {lowStockCount + expiringCount}
              </span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">{lang === 'en' ? 'සිංහල' : 'English'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-500" />
            )}
          </button>

          {/* User Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-1 ring-white/30">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className={`text-[9px] font-black uppercase tracking-wider ${
                  isCashier ? 'text-amber-500 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'
                }`}>
                  {isCashier ? 'Cashier' : 'Admin'}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
