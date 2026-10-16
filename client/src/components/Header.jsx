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
  Command,
  Cloud,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  X,
  Zap
} from 'lucide-react';
import { api } from '../api';

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
  const [systemStatus, setSystemStatus] = useState({
    configuredMode: 'auto',
    currentMode: 'online',
    cloudConnected: true,
    lastSyncTime: null,
    sqliteStats: null
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll system status periodically
  const fetchStatus = async () => {
    try {
      const res = await api.getSystemStatus();
      if (res && res.success) {
        setSystemStatus(res);
      }
    } catch {
      // offline fallback
      setSystemStatus(prev => ({ ...prev, currentMode: 'offline', cloudConnected: false }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncCloud();
      await fetchStatus();
      setSyncFeedback(res.message || 'Sync completed successfully!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      setSyncFeedback('Sync notice: Operating locally on SQLite.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSetMode = async (mode) => {
    try {
      await api.setSystemMode(mode);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to change system mode:', err);
    }
  };

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
  const isOnline = systemStatus.currentMode === 'online';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 transition-colors print:hidden">
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

          {/* Center: Live Hybrid System Beacon & Sync Action */}
          <div className="flex items-center gap-2 sm:gap-3 py-1 px-2.5 sm:px-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750">
            
            {/* Status Pill Button */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white dark:hover:bg-slate-700/60 transition-all cursor-pointer group"
              title="Click to view Dual-Engine status and switch Online/Offline mode"
            >
              <span className="relative flex h-2.5 w-2.5">
                {isOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </>
                )}
              </span>
              
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {isOnline ? (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Cloud Online</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 text-amber-500" />
                      <span>Local SQLite</span>
                    </>
                  )}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 group-hover:text-indigo-500 hidden sm:inline">
                  {systemStatus.configuredMode === 'auto' ? 'Auto-Sync Active' : `Mode: ${systemStatus.configuredMode}`}
                </span>
              </div>
            </button>

            {/* Quick Sync Button */}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isSyncing
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-650 border border-slate-200/80 dark:border-slate-600'
              }`}
              title="Sync local data with Cloud database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden lg:block"></div>

            {/* Clock */}
            <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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

        {/* Sync feedback banner if active */}
        {syncFeedback && (
          <div className="max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {syncFeedback}
            </span>
            <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Dual-Engine Hybrid System Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Hybrid Dual-Engine System
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Online Cloud (Atlas) + 100% Local (SQLite)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Engine Status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Storage:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  isOnline 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isOnline ? 'Cloud Online (Atlas)' : 'Offline Local (SQLite)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Cloud Connection:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {systemStatus.cloudConnected ? '🟢 Connected to MongoDB' : '🔴 Internet Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Local Database:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  pharmacy.db (Instant Local Cache)
                </span>
              </div>

              {systemStatus.sqliteStats && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800">
                    <span className="text-slate-400 block">SQLite Sales</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{systemStatus.sqliteStats.sales || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800">
                    <span className="text-slate-400 block">SQLite Medicines</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{systemStatus.sqliteStats.medicines || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Operating Mode (ක්‍රියාකාරී ආකාරය)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'auto', label: 'Auto Hybrid', desc: 'Auto Fallback' },
                  { id: 'online', label: 'Online Only', desc: 'Cloud Atlas' },
                  { id: 'offline', label: 'Offline Only', desc: 'Fast Local DB' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSetMode(m.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      systemStatus.configuredMode === m.id
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black">{m.label}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronizing Cloud...' : 'Sync Local & Cloud Now'}
              </button>
              
              <button
                onClick={() => setShowStatusModal(false)}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
