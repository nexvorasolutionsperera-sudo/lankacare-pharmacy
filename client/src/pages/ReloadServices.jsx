import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Printer, 
  Copy, 
  Zap, 
  DollarSign, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  Trash2, 
  FileText, 
  Calendar, 
  Check, 
  Layers, 
  Sparkles,
  PhoneCall,
  Wifi,
  Tv,
  Droplet,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import ReloadReceiptModal from '../components/ReloadReceiptModal';

// Pre-defined Telecom Operators & Utility Providers in Sri Lanka
const OPERATORS = [
  { id: 'dialog', name: 'Dialog Axiata', type: 'reload', defaultCommissionRate: 0.045, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { id: 'mobitel', name: 'SLT Mobitel', type: 'reload', defaultCommissionRate: 0.045, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { id: 'airtel', name: 'Airtel Lanka', type: 'reload', defaultCommissionRate: 0.05, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { id: 'hutch', name: 'Hutch 078/072', type: 'reload', defaultCommissionRate: 0.05, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { id: 'ceb', name: 'CEB Electricity Bill', type: 'bill_payment', fixedCommission: 15, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { id: 'water', name: 'Water Board (NWSDB)', type: 'bill_payment', fixedCommission: 15, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { id: 'slt', name: 'SLT Broadband / Fiber', type: 'bill_payment', fixedCommission: 20, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' }
];

// Pre-defined Photocopy & Print Services
const PHOTOCOPY_SERVICES = [
  { id: 'bw_single', name: 'A4 B&W Photocopy (Single)', defaultRate: 15, cost: 4, type: 'photocopy' },
  { id: 'bw_double', name: 'A4 B&W Photocopy (Double Side)', defaultRate: 25, cost: 6, type: 'photocopy' },
  { id: 'color_single', name: 'A4 Color Photocopy', defaultRate: 50, cost: 15, type: 'photocopy' },
  { id: 'print_bw', name: 'A4 Document Printout (B&W)', defaultRate: 25, cost: 5, type: 'printing' },
  { id: 'print_color', name: 'A4 Color Printout', defaultRate: 60, cost: 20, type: 'printing' },
  { id: 'laminate_a4', name: 'A4 Laminating', defaultRate: 100, cost: 30, type: 'laminating' },
  { id: 'laminate_id', name: 'ID Card / Driving License Laminate', defaultRate: 50, cost: 15, type: 'laminating' },
  { id: 'scan_doc', name: 'Document Scanning (PDF / WhatsApp)', defaultRate: 30, cost: 0, type: 'other' },
  { id: 'binding', name: 'Spiral / Tape Book Binding', defaultRate: 200, cost: 60, type: 'other' }
];

export default function ReloadServices({ currentUser, isCashier = false, t = {} }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'reload' | 'photocopy'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState(null);

  // Reload Form State
  const [selectedOperator, setSelectedOperator] = useState(OPERATORS[0]);
  const [reloadPhone, setReloadPhone] = useState('');
  const [reloadAmount, setReloadAmount] = useState('');
  const [reloadPaymentMethod, setReloadPaymentMethod] = useState('Cash');
  const [isSubmittingReload, setIsSubmittingReload] = useState(false);

  // Photocopy Form State
  const [selectedPrintService, setSelectedPrintService] = useState(PHOTOCOPY_SERVICES[0]);
  const [copyCount, setCopyCount] = useState(1);
  const [copyRate, setCopyRate] = useState(PHOTOCOPY_SERVICES[0].defaultRate);
  const [customerNote, setCustomerNote] = useState('');
  const [printPaymentMethod, setPrintPaymentMethod] = useState('Cash');
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getReloadOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reload orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick denomination helper
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Handle service selection change
  const handlePrintServiceChange = (service) => {
    setSelectedPrintService(service);
    setCopyRate(service.defaultRate);
  };

  // Submit Reload / Bill Payment
  const handleSubmitReload = async (e) => {
    e.preventDefault();
    const amountVal = Number(reloadAmount);
    if (!reloadPhone.trim() || !amountVal || amountVal <= 0) {
      alert('කරුණාකර දුරකථන/ගිණුම් අංකය සහ මුදල ඇතුළත් කරන්න (Please enter valid number and amount)');
      return;
    }

    try {
      setIsSubmittingReload(true);

      // Commission calculation
      let commission = 0;
      if (selectedOperator.fixedCommission) {
        commission = selectedOperator.fixedCommission;
      } else if (selectedOperator.defaultCommissionRate) {
        commission = Math.round(amountVal * selectedOperator.defaultCommissionRate);
      }

      const payload = {
        transaction_id: `REL-${Date.now().toString().slice(-6)}`,
        type: selectedOperator.type,
        category: selectedOperator.type === 'bill_payment' ? 'Utility Bill' : 'Mobile Reload',
        service_name: `${selectedOperator.name} ${selectedOperator.type === 'bill_payment' ? 'Bill Pay' : 'Reload'}`,
        operator: selectedOperator.name,
        recipient: reloadPhone.trim(),
        details: `Paid via ${reloadPaymentMethod}`,
        quantity: 1,
        unit_price: amountVal,
        amount: amountVal,
        cost_amount: Math.max(0, amountVal - commission),
        commission_profit: commission,
        payment_method: reloadPaymentMethod,
        status: 'Success'
      };

      const created = await api.createReloadOrder(payload);
      setOrders(prev => [created, ...prev]);
      
      // Reset form
      setReloadPhone('');
      setReloadAmount('');
      
      // Open printable slip
      setSelectedOrderForSlip(created);
    } catch (err) {
      alert(`Error processing reload: ${err.message}`);
    } finally {
      setIsSubmittingReload(false);
    }
  };

  // Submit Photocopy / Print
  const handleSubmitPrint = async (e) => {
    e.preventDefault();
    const qty = Number(copyCount);
    const rate = Number(copyRate);
    if (qty <= 0 || rate < 0) {
      alert('කරුණාකර පිටපත් ගණන සහ මිල නිවැරදිව ඇතුළත් කරන්න (Invalid quantity or rate)');
      return;
    }

    try {
      setIsSubmittingPrint(true);
      const totalAmount = qty * rate;
      const totalCost = qty * (selectedPrintService.cost || 0);
      const profit = Math.max(0, totalAmount - totalCost);

      const payload = {
        transaction_id: `COP-${Date.now().toString().slice(-6)}`,
        type: selectedPrintService.type,
        category: 'Photocopy & Printing',
        service_name: selectedPrintService.name,
        operator: 'Print Center',
        recipient: customerNote.trim() || 'Walk-in Customer',
        details: `${qty} copies @ ${formatCurrency(rate)}`,
        quantity: qty,
        unit_price: rate,
        amount: totalAmount,
        cost_amount: totalCost,
        commission_profit: profit,
        payment_method: printPaymentMethod,
        status: 'Success'
      };

      const created = await api.createReloadOrder(payload);
      setOrders(prev => [created, ...prev]);

      // Reset form
      setCopyCount(1);
      setCustomerNote('');

      // Open printable slip
      setSelectedOrderForSlip(created);
    } catch (err) {
      alert(`Error processing photocopy: ${err.message}`);
    } finally {
      setIsSubmittingPrint(false);
    }
  };

  // Delete transaction
  const handleDeleteOrder = async (id) => {
    if (!window.confirm('මෙම ගනුදෙනු වාර්තාව ඉවත් කිරීමට අවශ්‍යද? (Are you sure you want to delete this record?)')) {
      return;
    }
    try {
      await api.deleteReloadOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const d = o.createdAt || o.created_at;
      return d && d.startsWith(todayStr);
    });

    const reloadOrders = todayOrders.filter(o => o.type === 'reload' || o.type === 'bill_payment');
    const totalReloadsToday = reloadOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    const printOrders = todayOrders.filter(o => o.type === 'photocopy' || o.type === 'printing' || o.type === 'laminating' || o.type === 'other');
    const totalPrintToday = printOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalPagesToday = printOrders.reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);

    const totalProfitCommission = todayOrders.reduce((sum, o) => sum + (Number(o.commission_profit) || 0), 0);

    return {
      totalReloadsToday,
      reloadCount: reloadOrders.length,
      totalPrintToday,
      totalPagesToday,
      totalProfitCommission,
      todayTotalCount: todayOrders.length
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      let matchTab = true;
      if (activeTab === 'reload') {
        matchTab = o.type === 'reload' || o.type === 'bill_payment';
      } else if (activeTab === 'photocopy') {
        matchTab = o.type === 'photocopy' || o.type === 'printing' || o.type === 'laminating' || o.type === 'other';
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchTab;

      const matchRecipient = (o.recipient || '').toLowerCase().includes(q);
      const matchTx = (o.transaction_id || '').toLowerCase().includes(q);
      const matchService = (o.service_name || '').toLowerCase().includes(q);
      const matchOp = (o.operator || '').toLowerCase().includes(q);

      return matchTab && (matchRecipient || matchTx || matchService || matchOp);
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.reloadTitle || 'ෆොටෝකොපි, මුද්‍රණ සහ මොබයිල් රීලෝඩ් (Photocopy & Reload)'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.reloadSubtitle || 'Instant mobile reloads, utility bill settlements, photocopying, laminating and document scanning'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={`grid gap-4 ${isCashier ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        
        {/* Total Reloads Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.totalReloadsToday || 'අද රීලෝඩ් එකතුව (Reloads)'}
            </span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <Smartphone className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(stats.totalReloadsToday)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.reloadCount} reloads & bills completed
          </div>
        </div>

        {/* Total Photocopy Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.totalPhotocopyToday || 'ෆොටෝකොපි ආදායම (Print/Copy)'}
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <Printer className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(stats.totalPrintToday)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.totalPagesToday} copies & pages printed
          </div>
        </div>

        {/* Total Profit / Commission (Admin only) */}
        {!isCashier && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t.totalCommissionToday || 'මුළු කොමිස් ලාභය (Commission)'}
              </span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalProfitCommission)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Net earnings from services today
            </div>
          </div>
        )}

        {/* Transactions Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ගනුදෙනු ගණන (Transactions)
            </span>
            <span className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats.todayTotalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Total service slips processed
          </div>
        </div>

      </div>

      {/* DUAL COUNTER INTERFACE: Mobile Reload (Left) + Photocopy (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COUNTER 1: Mobile Reload & Bill Payments */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  මොබයිල් රීලෝඩ් සහ බිල්පත් (Reload & Bill Pay)
                </h2>
              </div>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                Commission: ~4.5% - 5%
              </span>
            </div>

            {/* Operator Pills */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                සම්බන්ධතාවය තෝරන්න (Select Operator / Utility):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {OPERATORS.map(op => {
                  const isSelected = selectedOperator.id === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setSelectedOperator(op)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer truncate ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {op.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input: Mobile / Account Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                දුරකථන / ගිණුම් අංකය (Mobile / Account Number) *
              </label>
              <div className="relative">
                <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 077 1234567 or Acc No"
                  value={reloadPhone}
                  onChange={(e) => setReloadPhone(e.target.value)}
                  className="w-full text-sm font-mono font-bold pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Input: Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  රීලෝඩ් මුදල (Reload Amount - LKR) *
                </label>
                {reloadAmount > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Est. Commission: Rs. {
                      selectedOperator.fixedCommission || Math.round(Number(reloadAmount) * (selectedOperator.defaultCommissionRate || 0.045))
                    }
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">Rs.</span>
                <input
                  type="number"
                  min="20"
                  step="10"
                  required
                  placeholder="e.g. 100"
                  value={reloadAmount}
                  onChange={(e) => setReloadAmount(e.target.value)}
                  className="w-full text-base font-mono font-black pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600 dark:text-blue-400"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setReloadAmount(amt.toString())}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Rs. {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                ගෙවීම් ක්‍රමය (Payment):
              </span>
              <div className="flex gap-2">
                {['Cash', 'Card', 'Online QR'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setReloadPaymentMethod(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reloadPaymentMethod === m
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSubmitReload}
              disabled={isSubmittingReload || !reloadPhone || !reloadAmount}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs md:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmittingReload ? (
                <span>ක්‍රියාත්මක වෙමින් පවතී...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>රීලෝඩ් කරන්න & රිසිට්පත දෙන්න (Process Reload & Print Slip)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* COUNTER 2: Photocopy, Print & Laminating */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                  <Printer className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  ෆොටෝකොපි සහ මුද්‍රණ (Photocopy & Printing)
                </h2>
              </div>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                High Margin Service
              </span>
            </div>

            {/* Service Type Dropdown / Grid */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                සේවාව තෝරන්න (Select Service):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PHOTOCOPY_SERVICES.slice(0, 6).map(svc => {
                  const isSelected = selectedPrintService.id === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handlePrintServiceChange(svc)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer truncate ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate">{svc.name}</div>
                      <div className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Rs. {svc.defaultRate}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Other services dropdown */}
              <div className="mt-2">
                <select
                  value={selectedPrintService.id}
                  onChange={(e) => {
                    const found = PHOTOCOPY_SERVICES.find(s => s.id === e.target.value);
                    if (found) handlePrintServiceChange(found);
                  }}
                  className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">තවත් සේවා බලන්න (View All Services)...</option>
                  {PHOTOCOPY_SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - Rs. {s.defaultRate}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Copies Counter & Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  පිටපත් ගණන (Copies / Pages) *
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCopyCount(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-l-xl font-bold text-slate-700 dark:text-white hover:bg-slate-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={copyCount}
                    onChange={(e) => setCopyCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full text-center font-mono font-black text-sm py-1.5 bg-slate-50 dark:bg-slate-800 border-y border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCopyCount(prev => prev + 1)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-r-xl font-bold text-slate-700 dark:text-white hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  පිටපතකට මිල (Rate per Copy)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    min="1"
                    value={copyRate}
                    onChange={(e) => setCopyRate(Number(e.target.value) || 0)}
                    className="w-full text-sm font-mono font-bold pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Note & Calculation */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                මුළු මුදල (Total Amount):
              </span>
              <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(copyCount * copyRate)}
              </span>
            </div>

            <div>
              <input
                type="text"
                placeholder="Customer Name or Note (optional)..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSubmitPrint}
              disabled={isSubmittingPrint || copyCount <= 0}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs md:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmittingPrint ? (
                <span>ක්‍රියාත්මක වෙමින් පවතී...</span>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>බිල්පත නිකුත් කරන්න (Print Photocopy Slip)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* RECENT TRANSACTIONS LOG TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Table Filter Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              සියලුම සේවා (All Services)
            </button>
            <button
              onClick={() => setActiveTab('reload')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              රීලෝඩ් සහ බිල්පත් (Reloads)
            </button>
            <button
              onClick={() => setActiveTab('photocopy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'photocopy'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              ෆොටෝකොපි සහ මුද්‍රණ (Photocopy)
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Phone, Ref ID, Operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
            />
          </div>

        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Service & Provider</th>
                <th className="py-3 px-4">Recipient / Customer</th>
                <th className="py-3 px-4">Quantity / Details</th>
                <th className="py-3 px-4">Total Amount (රු.)</th>
                {!isCashier && <th className="py-3 px-4">Profit / Commission</th>}
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isCashier ? "7" : "8"} className="py-8 text-center text-slate-400 italic">
                    දත්ත ප්‍රවේශ වෙමින් පවතී... (Loading Transactions)
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isCashier ? "7" : "8"} className="py-12 text-center text-slate-400">
                    <Smartphone className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-medium">කිසිදු ගනුදෙනු වාර්තාවක් හමු නොවීය (No Transactions Found)</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isReload = order.type === 'reload' || order.type === 'bill_payment';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Ref ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                          {order.transaction_id}
                        </span>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-lg ${isReload ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {isReload ? <Smartphone className="w-3.5 h-3.5" /> : <Printer className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{order.service_name}</div>
                            <div className="text-[10px] text-slate-400">{order.operator || order.category}</div>
                          </div>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {order.recipient || 'Walk-in'}
                        </div>
                      </td>

                      {/* Quantity & Details */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {order.details || `${order.quantity || 1} unit`}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(order.amount)}
                      </td>

                      {/* Commission */}
                      {!isCashier && (
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(order.commission_profit)}
                          </span>
                        </td>
                      )}

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(order.createdAt || order.created_at || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForSlip(order)}
                            title="Print Thermal Slip"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isCashier && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Thermal Receipt Modal */}
      {selectedOrderForSlip && (
        <ReloadReceiptModal
          order={selectedOrderForSlip}
          onClose={() => setSelectedOrderForSlip(null)}
        />
      )}

    </div>
  );
}
