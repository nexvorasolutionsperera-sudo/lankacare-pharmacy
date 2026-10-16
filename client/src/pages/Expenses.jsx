import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  DollarSign, 
  TrendingDown,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import { excelExporter } from '../utils/excelExporter';
import { pdfGenerator } from '../utils/pdfGenerator';

const EXPENSE_CATEGORIES = [
  'All',
  'Shop Rent',
  'Electricity Bill',
  'Water & Utility',
  'Staff Salaries & Overtime',
  'Transport & Delivery',
  'Tea, Refreshments & Food',
  'Equipment & Maintenance',
  'Packaging & Polythene Bags',
  'Stationery & Paper Supplies',
  'Taxes & Regulatory Fees',
  'Miscellaneous / Other'
];

export default function ExpensesPage({ currentUser, t }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Shop Rent',
    amount: '',
    expense_date: todayStr,
    payment_method: 'Cash',
    cheque_no: '',
    paid_to: '',
    notes: ''
  });

  useEffect(() => {
    loadExpenses();
  }, [startDate, endDate, selectedCategory]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.getExpenses({ 
        startDate, 
        endDate, 
        category: selectedCategory 
      });
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'Shop Rent',
      amount: '',
      expense_date: todayStr,
      payment_method: 'Cash',
      cheque_no: '',
      paid_to: '',
      notes: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('වියදම් විස්තරය (Title/Description) අනිවාර්යයි');
      return;
    }

    const amt = Number(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('වලංගු මුදලක් (Valid Amount) ඇතුළත් කරන්න');
      return;
    }

    try {
      await api.createExpense({
        ...formData,
        amount: amt,
        recorded_by: currentUser?.name || 'Admin'
      });
      setSuccess('වියදම සාර්ථකව සටහන් විය (Expense recorded)');
      setIsModalOpen(false);
      loadExpenses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    }
  };

  const handleDelete = async (exp) => {
    if (window.confirm(`"${exp.title}" (${formatCurrency(exp.amount)}) වියදම් සටහන මකා දැමීමට සහතිකද?`)) {
      try {
        await api.deleteExpense(exp.id || exp._id);
        loadExpenses();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const setPresetRange = (preset) => {
    const today = new Date();
    const format = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(format(today));
      setEndDate(format(today));
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(today.getDate() - 7);
      setStartDate(format(w));
      setEndDate(format(today));
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(format(m));
      setEndDate(format(today));
    } else if (preset === 'year') {
      const y = new Date(today.getFullYear(), 0, 1);
      setStartDate(format(y));
      setEndDate(format(today));
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const q = search.toLowerCase();
    return (
      e.title?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.paid_to?.toLowerCase().includes(q) ||
      e.expense_number?.toLowerCase().includes(q)
    );
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Export handlers
  const handleExportExcel = () => {
    const exportData = filteredExpenses.map((e, idx) => ({
      '#': idx + 1,
      'Voucher #': e.expense_number,
      'Date': e.expense_date,
      'Category': e.category,
      'Description': e.title,
      'Amount (LKR)': Number(e.amount),
      'Payment Method': e.payment_method,
      'Cheque No': e.cheque_no || '-',
      'Paid To': e.paid_to || '-',
      'Notes': e.notes || '-'
    }));
    excelExporter.exportToExcel(exportData, `Expenses_${startDate}_to_${endDate}`, 'Expenses');
  };

  const handleExportPDF = () => {
    pdfGenerator.generateExpensesReportPDF(filteredExpenses, totalExpenseAmount, startDate, endDate);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-600" />
            දෛනික හා මාසික වියදම් කළමනාකරණය (Operating Expenses)
          </h2>
          <p className="text-xs text-slate-500">
            Track pharmacy overheads, rent, electricity, staff wages, and export official expense reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Export
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            PDF Export
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Expense (නව වියදමක්)
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Period Expenses</span>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(totalExpenseAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">From {filteredExpenses.length} expense vouchers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Category</span>
          <p className="text-lg font-black text-slate-900 mt-2">{selectedCategory}</p>
          <p className="text-xs text-slate-400 mt-1">Filtered overhead category</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Range</span>
          <p className="text-sm font-black text-slate-900 mt-2">{startDate} to {endDate}</p>
          <p className="text-xs text-slate-400 mt-1">Active audit interval</p>
        </div>
      </div>

      {/* Date & Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button 
              onClick={() => setPresetRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${startDate === todayStr && endDate === todayStr ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setPresetRange('week')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              This Week
            </button>
            <button 
              onClick={() => setPresetRange('month')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              This Month
            </button>
            <button 
              onClick={() => setPresetRange('year')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              This Year
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4"># Voucher</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description / Details</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    මෙම කාල සීමාව තුළ වියදම් සටහන් කිසිවක් හමු නොවීය (No expenses found in this period)
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id || exp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {exp.expense_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {exp.title}
                      {exp.notes && <p className="text-[10px] text-slate-400">{exp.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {exp.paid_to || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {exp.payment_method}
                      {exp.cheque_no && <span className="block text-[10px] text-slate-400">Chq: {exp.cheque_no}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(exp)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td colSpan="6" className="py-3 px-4 text-right text-slate-700">Total Operational Expenses:</td>
                  <td className="py-3 px-4 text-right text-rose-600 font-black text-sm">{formatCurrency(totalExpenseAmount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              නව වියදමක් ඇතුළත් කිරීම (Record New Overhead Expense)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter expense category, amount, payee, and payment method
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">වියදම් වර්ගය (Category) *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-amber-500"
                  >
                    {EXPENSE_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">දිනය (Expense Date) *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">විස්තරය (Expense Title / Description) *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. October Shop Rent / CEB Electricity Bill"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">මුදල (Amount in LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 focus:outline-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ගෙවූ ආකාරය (Payment Method)</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-amber-500"
                  >
                    <option value="Cash">Cash (මුදල්)</option>
                    <option value="Card">Bank Card / Online Transfer</option>
                    <option value="Cheque">Cheque (චෙක්පත්)</option>
                  </select>
                </div>
              </div>

              {formData.payment_method === 'Cheque' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">චෙක්පත් අංකය (Cheque Number)</label>
                  <input
                    type="text"
                    value={formData.cheque_no}
                    onChange={(e) => setFormData({ ...formData, cheque_no: e.target.value })}
                    placeholder="e.g. CHQ-992019"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-amber-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">කාටද ගෙවූයේ (Paid To / Payee)</label>
                  <input
                    type="text"
                    value={formData.paid_to}
                    onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                    placeholder="e.g. Landlord / CEB"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">අමතර සටහන් (Notes)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
