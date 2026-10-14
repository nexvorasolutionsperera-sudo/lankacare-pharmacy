import React from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Plus, 
  Package, 
  Truck, 
  FileText, 
  ChevronRight, 
  Download,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  Pill,
  ShoppingBag,
  Activity
} from 'lucide-react';
import { formatCurrency, formatDate } from '../api';
import Logo from '../components/Logo';
import { pdfGenerator } from '../utils/pdfGenerator';

export default function Dashboard({ stats, setActiveTab, onOpenAddMed, onOpenAddGrocery, onOpenGRN, t }) {
  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="font-semibold text-sm">Loading dashboard data...</p>
      </div>
    );
  }

  const todayRevenue = stats.todaySales?.revenue || 0;
  const todayOrders = stats.todaySales?.orders || 0;
  const todayProfit = stats.todaySales?.profit || 0;
  const monthRevenue = stats.monthRevenue || 0;
  const lowStockCount = stats.lowStockCount || 0;
  const expiredCount = stats.expiredCount || 0;
  const expiringSoonCount = stats.expiringSoonCount || 0;
  const supplierDue = stats.totalSupplierDue || 0;

  const handleDownloadReport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const summaryData = {
      totalBills: todayOrders,
      grossSales: todayRevenue,
      totalDiscounts: 0,
      netSales: todayRevenue,
      totalCost: Math.max(0, todayRevenue - todayProfit),
      grossProfit: todayProfit,
      profitMargin: todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : 0,
      topMedicines: stats.lowStockItems?.map(i => ({
        medicine_name: i.name,
        total_qty_sold: i.stock_quantity,
        total_revenue: 0,
        profit: 0
      })) || []
    };
    pdfGenerator.generateSalesReportPDF(summaryData, stats.recentSales || [], todayStr, todayStr);
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-900/40">
        
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-sky-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            
            {/* Header with Logo */}
            <div className="flex items-center gap-3">
              <Logo size="lg" showText={false} />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {t.welcomeTitle}
                </h1>
              </div>
            </div>

            <p className="text-slate-300 text-xs md:text-sm max-w-xl font-medium pt-1">
              {t.welcomeSubtitle}
            </p>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs md:text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all cursor-pointer ring-1 ring-white/50"
            >
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              {t.openPosCounter}
            </button>

            {/* Separate Medicine Add */}
            <button
              onClick={onOpenAddMed}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs shadow-md border border-indigo-400/30 transition-all cursor-pointer active:scale-95"
            >
              <Pill className="w-4 h-4" />
              <span>{t.addMedicineOnly || '+ Add Medicine'}</span>
            </button>

            {/* Separate Grocery Add */}
            <button
              onClick={onOpenAddGrocery}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-bold text-xs shadow-md border border-amber-300/30 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.addGroceryOnly || '+ Add Grocery'}</span>
            </button>

            {/* Medicare / Lab Tests quick button */}
            <button
              onClick={() => setActiveTab('medicare')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-sky-500/90 hover:bg-sky-500 text-white font-bold text-xs shadow-md border border-sky-300/30 transition-all cursor-pointer active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span>{t.medicareServices || 'Lab Tests & ECG'}</span>
            </button>

            <button
              onClick={onOpenGRN}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95"
            >
              <Truck className="w-4 h-4" />
              {t.dealerStockInward}
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title={t.downloadDashboardReport}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Today Sales */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.todaySales}
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(todayRevenue)}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{todayOrders} {t.billsCompleted}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {t.netProfit}: {formatCurrency(todayProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.monthlyRevenue}
            </span>
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(monthRevenue)}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t.totalMedicines}</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {stats.totalMedicines} {t.inDatabase}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Low Stock Items */}
        <div 
          onClick={() => setActiveTab('alerts')}
          className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/50 shadow-xs hover:shadow-md transition-all cursor-pointer bg-amber-50/20 dark:bg-amber-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {t.lowStock}
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-2xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-amber-900 dark:text-amber-300">{lowStockCount}</p>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">{t.needReorder}</span>
            </div>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              {t.viewStockAlerts} <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

        {/* 4. Expiry Alerts */}
        <div 
          onClick={() => setActiveTab('alerts')}
          className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-xs hover:shadow-md transition-all cursor-pointer bg-rose-50/20 dark:bg-rose-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              {t.expiryAlerts}
            </span>
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-rose-900 dark:text-rose-300">{expiredCount + expiringSoonCount}</p>
              <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                ({expiredCount} {t.expired}, {expiringSoonCount} {t.expiringSoon})
              </span>
            </div>
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              {t.reviewCriticalBatches} <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid: Trends & Low Stock & Dealer Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Sales Trend Bar Chart & Low Stock List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Last 7 Days Visual Bar Overview */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {t.salesTrend}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.dailyPerformance}</p>
              </div>
              <button 
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
              >
                {t.detailedReport} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-6 items-end h-44">
              {stats.salesChart?.map((day, idx) => {
                const max = Math.max(...(stats.salesChart.map(d => d.total_amount) || [1000]), 100);
                const heightPercent = Math.max(12, Math.round((day.total_amount / max) * 100));
                const dateObj = new Date(day.sale_date);
                const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {day.total_amount > 0 ? `Rs. ${Math.round(day.total_amount)}` : '0'}
                    </span>
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-xl transition-all ${
                        day.total_amount > 0 
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-sm' 
                          : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Low Stock Medicines Table */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {t.criticalLowStock}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('medicines')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              >
                {t.viewAllInventory}
              </button>
            </div>

            {stats.lowStockItems?.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.lowStockItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.generic_name} • {item.dosage} • {t.shelfLocation}: {item.rack_location || 'Not set'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {item.stock_quantity} left
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Min: {item.min_stock_alert}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                All medicines are above minimum stock levels.
              </p>
            )}
          </div>

        </div>

        {/* Right Col: Dealer Dues & Recent Bills */}
        <div className="space-y-6">
          
          {/* Dealer Dues Card */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.dealerDues}
              </span>
              <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(supplierDue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.totalPendingSuppliers} ({stats.suppliersCount} active dealers)
            </p>
            
            <button
              onClick={() => setActiveTab('dealers')}
              className="mt-4 w-full py-2.5 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {t.manageDealers} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Invoices List */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">{t.recentBills}</h3>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentSales?.map((sale) => (
                <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{sale.invoice_no}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {sale.customer_name || 'Walk-in'} • {sale.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(sale.total_amount)}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(sale.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('reports')}
              className="mt-4 w-full py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-colors cursor-pointer"
            >
              {t.viewAllInvoices}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
