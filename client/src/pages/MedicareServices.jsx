import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Heart, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Phone, 
  Stethoscope, 
  Trash2, 
  Filter, 
  Calendar, 
  Droplet, 
  Eye,
  FileText,
  BadgeDollarSign
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import { pdfGenerator } from '../utils/pdfGenerator';
import AddMedicareOrderModal, { MEDICARE_CATALOG } from '../components/AddMedicareOrderModal';
import MedicareTokenModal from '../components/MedicareTokenModal';

export default function MedicareServices({ customers = [], doctors = [], t = {}, currentUser, isCashier = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOrderForToken, setSelectedOrderForToken] = useState(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getMedicareOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load Medicare orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = (newOrder) => {
    setIsAddOpen(false);
    loadOrders();
    // Prompt instant token receipt
    setSelectedOrderForToken(newOrder);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === 'Report Ready') {
        payload.report_ready_at = new Date().toISOString();
      }
      await api.updateMedicareOrder(orderId, payload);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
    } catch (err) {
      alert(`Error updating order status: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('මෙම පරීක්ෂණ ඇණවුම පද්ධතියෙන් ඉවත් කිරීමට අවශ්‍යද? (Are you sure you want to delete this order?)')) {
      return;
    }
    try {
      await api.deleteMedicareOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert(`Error deleting order: ${err.message}`);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const d = o.createdAt || o.created_at;
      return d && d.startsWith(todayStr);
    });

    const totalRevenueToday = todayOrders.reduce((sum, o) => sum + (Number(o.paid_amount) || Number(o.total_amount) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'Sample Collected' || o.status === 'Processing').length;
    const readyCount = orders.filter(o => o.status === 'Report Ready').length;
    const completedCount = orders.filter(o => o.status === 'Completed').length;

    return {
      todayCount: todayOrders.length,
      totalRevenueToday,
      pendingCount,
      readyCount,
      completedCount
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchStatus;

      const matchName = (o.patient_name || '').toLowerCase().includes(query);
      const matchPhone = (o.phone || '').includes(query);
      const matchOrderNo = (o.order_number || '').toLowerCase().includes(query);
      const matchDoctor = (o.doctor_name || '').toLowerCase().includes(query);

      return matchStatus && (matchName || matchPhone || matchOrderNo || matchDoctor);
    });
  }, [orders, statusFilter, searchQuery]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Sample Collected':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Processing':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'Report Ready':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 animate-pulse';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.medicareTitle || 'Medicare & Clinical Diagnostics (සායනික & රුධිර පරීක්ෂණ)'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.medicareSubtitle || 'Full blood profiles, 12-lead ECG, rapid diagnostic screening, and nursing clinical care'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <Droplet className="w-4 h-4 text-rose-500" />
            මිල දර්ශකය (Price Catalog)
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.bookNewTest || 'නව පරීක්ෂණයක් ලියාපදිංචි කරන්න (Book Test)'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.totalOrdersToday || 'අද දින පරීක්ෂණ (Today)'}
            </span>
            <span className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats.todayCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Revenue: <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{formatCurrency(stats.totalRevenueToday)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.pendingReports || 'සැකසෙමින් පවතින (Processing)'}
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.pendingCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Samples collected & in lab
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.readyReports || 'වාර්තා සූදානම් (Ready)'}
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.readyCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Ready for patient collection
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.completedTests || 'නිකුත් කළ වාර්තා (Completed)'}
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.completedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Delivered to patient
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Sample Collected', 'Processing', 'Report Ready', 'Completed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'All' ? 'සියල්ල (All)' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchOrders || 'Search by Patient name, phone or Order ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
          />
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Token / ID</th>
                <th className="py-3 px-4">Patient (රෝගියා)</th>
                <th className="py-3 px-4">Doctor (වෛද්‍යවරයා)</th>
                <th className="py-3 px-4">Tests / Procedures</th>
                <th className="py-3 px-4">Fasting</th>
                <th className="py-3 px-4">Fee / Paid</th>
                <th className="py-3 px-4">Status (තත්ත්වය)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 italic">
                    දත්ත ප්‍රවේශ වෙමින් පවතී... (Loading Medicare Orders)
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-medium">{t.noOrdersFound || 'කිසිදු පරීක්ෂණ ඇණවුමක් හමු නොවීය (No Orders Found)'}</p>
                    <p className="text-[11px] text-slate-500 mt-1">නව පරීක්ෂණයක් එක් කිරීමට ඉහත බොත්තම ක්ලික් කරන්න</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const testsList = Array.isArray(order.tests) ? order.tests : [];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Order Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-sky-600 dark:text-sky-400 text-xs">
                          {order.order_number}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.patient_name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{order.patient_age ? `${order.patient_age}y` : '-'}</span>
                          <span>•</span>
                          <span>{order.patient_gender || 'Unspecified'}</span>
                          {order.phone && (
                            <>
                              <span>•</span>
                              <span>{order.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {order.doctor_name || 'Self / OTC'}
                        </div>
                      </td>

                      {/* Tests */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {testsList.slice(0, 2).map((t, i) => (
                            <span 
                              key={i} 
                              className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium truncate max-w-[140px]"
                            >
                              {t.name}
                            </span>
                          ))}
                          {testsList.length > 2 && (
                            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded">
                              +{testsList.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fasting */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.fasting_status && order.fasting_status.includes('Fasting')
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            : 'text-slate-500'
                        }`}>
                          {order.fasting_status || 'Not Required'}
                        </span>
                      </td>

                      {/* Fee / Paid */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(order.total_amount)}
                        </div>
                        {Number(order.balance_due) > 0 ? (
                          <div className="text-[10px] text-rose-500 font-bold">
                            Due: {formatCurrency(order.balance_due)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-500 font-medium">
                            Paid ({order.payment_method || 'Cash'})
                          </div>
                        )}
                      </td>

                      {/* Lifecycle Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status || 'Sample Collected'}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-xl border focus:outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                        >
                          <option value="Sample Collected">Sample Collected</option>
                          <option value="Processing">Processing</option>
                          <option value="Report Ready">Report Ready</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Print Token */}
                          <button
                            onClick={() => setSelectedOrderForToken(order)}
                            title="Print Thermal Token / Receipt"
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF Work Order */}
                          <button
                            onClick={() => pdfGenerator.generateMedicareOrderPDF(order)}
                            title="Download A4 Medical Work Order PDF"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (Admin only) */}
                          {!isCashier && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete Order"
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

      {/* Catalog Quick Reference Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 dark:bg-sky-950/60 rounded-xl text-sky-600">
                  <Droplet className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Aaush Medicare & Diagnostics Catalog
                  </h3>
                  <p className="text-xs text-slate-500">Standard Test Fees & Sample Requirements</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-2">
              {MEDICARE_CATALOG.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.category} • Sample: <span className="font-medium text-slate-700 dark:text-slate-300">{item.sample_type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="text-[10px] text-amber-600 font-medium">
                      {item.defaultFasting}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                වසන්න (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Medicare Order Modal */}
      {isAddOpen && (
        <AddMedicareOrderModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          customers={customers}
          doctors={doctors}
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* Token Print / View Modal */}
      {selectedOrderForToken && (
        <MedicareTokenModal
          order={selectedOrderForToken}
          onClose={() => setSelectedOrderForToken(null)}
        />
      )}

    </div>
  );
}
