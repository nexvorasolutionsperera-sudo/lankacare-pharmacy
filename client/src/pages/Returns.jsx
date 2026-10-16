import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import { excelExporter } from '../utils/excelExporter';

export default function ReturnsPage({ medicines, currentUser, t }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    invoice_no: '',
    customer_name: 'Walk-in Customer',
    medicine_id: '',
    medicine_name: '',
    batch_no: '',
    quantity: 1,
    unit_price: '',
    refund_amount: '',
    reason: 'Customer Changed Mind',
    condition: 'Restock to Inventory',
    refund_method: 'Cash',
    notes: ''
  });

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const data = await api.getReturns();
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineSelect = (e) => {
    const medId = e.target.value;
    const med = medicines.find(m => String(m.id || m._id) === String(medId));
    if (med) {
      const price = Number(med.selling_price || 0);
      const qty = Number(formData.quantity) || 1;
      setFormData(prev => ({
        ...prev,
        medicine_id: med.id || med._id,
        medicine_name: med.name,
        batch_no: med.batch_number || med.batch_no || '',
        unit_price: price,
        refund_amount: (price * qty).toFixed(2)
      }));
    }
  };

  const handleQtyChange = (newQty) => {
    const q = Math.max(1, Number(newQty) || 1);
    const unitPrice = Number(formData.unit_price) || 0;
    setFormData(prev => ({
      ...prev,
      quantity: q,
      refund_amount: (unitPrice * q).toFixed(2)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.medicine_name.trim()) {
      setError('ආපසු භාරගන්නා ඖෂධය තෝරන්න (Select medicine to return)');
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('වලංගු ප්‍රමාණයක් ඇතුළත් කරන්න (Valid quantity required)');
      return;
    }

    try {
      await api.createReturn({
        ...formData,
        quantity: qty,
        unit_price: Number(formData.unit_price || 0),
        refund_amount: Number(formData.refund_amount || (qty * Number(formData.unit_price || 0))),
        processed_by: currentUser?.name || 'Admin'
      });

      setSuccess('භාණ්ඩය සාර්ථකව ආපසු භාරගන්නා ලදී (Item return recorded)');
      setIsModalOpen(false);
      loadReturns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Return processing failed');
    }
  };

  const handleDelete = async (ret) => {
    if (window.confirm(`Return record "${ret.return_number}" මකා දැමීමට සහතිකද?`)) {
      try {
        await api.deleteReturn(ret.id || ret._id);
        loadReturns();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredReturns = returns.filter(r => {
    const q = search.toLowerCase();
    return (
      r.return_number?.toLowerCase().includes(q) ||
      r.invoice_no?.toLowerCase().includes(q) ||
      r.medicine_name?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q)
    );
  });

  const totalRefundAmount = filteredReturns.reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);

  const handleExportExcel = () => {
    const exportData = filteredReturns.map((r, idx) => ({
      '#': idx + 1,
      'Return #': r.return_number,
      'Date': r.created_at?.split('T')[0] || '-',
      'Invoice #': r.invoice_no || '-',
      'Customer': r.customer_name,
      'Medicine / Item': r.medicine_name,
      'Batch': r.batch_no || '-',
      'Qty': r.quantity,
      'Unit Price (LKR)': r.unit_price,
      'Refund Amount (LKR)': r.refund_amount,
      'Reason': r.reason,
      'Condition': r.condition,
      'Refund Method': r.refund_method
    }));
    excelExporter.exportToExcel(exportData, 'Sales_Returns_Log', 'Returns');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            ඖෂධ සහ භාණ්ඩ ආපසු භාරගැනීම (Item Returns & Refunds)
          </h2>
          <p className="text-xs text-slate-500">
            Process customer returns, restock inventory automatically, and track refunds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Export
          </button>

          <button
            onClick={() => {
              setFormData({
                invoice_no: '',
                customer_name: 'Walk-in Customer',
                medicine_id: '',
                medicine_name: '',
                batch_no: '',
                quantity: 1,
                unit_price: '',
                refund_amount: '',
                reason: 'Customer Changed Mind',
                condition: 'Restock to Inventory',
                refund_method: 'Cash',
                notes: ''
              });
              setError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Process Return (නව Return එකක්)
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Refunded Value</span>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(totalRefundAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">Total customer refunds paid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Returns Count</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{filteredReturns.length} Items</p>
          <p className="text-xs text-slate-400 mt-1">Processed return transactions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Restocked to Shelves</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {filteredReturns.filter(r => r.condition === 'Restock to Inventory').length} Records
          </p>
          <p className="text-xs text-slate-400 mt-1">Returned directly into active stock</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Return #, Invoice #, medicine or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-rose-500"
        />
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4"># Return</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item Returned</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    ආපසු භාරගත් භාණ්ඩ කිසිවක් හමු නොවීය (No returns recorded)
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id || ret._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {ret.return_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {ret.invoice_no || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {ret.customer_name}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {ret.medicine_name}
                      {ret.batch_no && <span className="block text-[10px] text-slate-400 font-mono">B: {ret.batch_no}</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {ret.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      {formatCurrency(ret.refund_amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ret.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ret.condition === 'Restock to Inventory'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {ret.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(ret)}
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
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              භාණ්ඩ ආපසු භාරගැනීම (Process Sales Return)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select medicine, quantity, return reason, and stock restoration choice
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">බිල්පත් අංකය (Invoice #)</label>
                  <input
                    type="text"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    placeholder="e.g. INV-10023"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">පාරිභෝගිකයා (Customer)</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Walk-in Customer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ඖෂධය / භාණ්ඩය (Select Medicine) *</label>
                <select
                  value={formData.medicine_id}
                  onChange={handleMedicineSelect}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-rose-500"
                >
                  <option value="">-- Choose Item from Inventory --</option>
                  {medicines.map(m => (
                    <option key={m.id || m._id} value={m.id || m._id}>
                      {m.name} {m.dosage ? `(${m.dosage})` : ''} - Selling: {formatCurrency(m.selling_price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ප්‍රමාණය (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ඒකක මිල (Unit Price)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => {
                      const p = Number(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        unit_price: p,
                        refund_amount: (p * formData.quantity).toFixed(2)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Refund Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.refund_amount}
                    onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-rose-600 focus:outline-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">හේතුව (Reason for Return) *</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-rose-500"
                  >
                    <option value="Customer Changed Mind">Customer Changed Mind</option>
                    <option value="Wrong Item Dispensed">Wrong Item Dispensed</option>
                    <option value="Expired / Near Expiry">Expired / Near Expiry</option>
                    <option value="Damaged / Broken Seal">Damaged / Broken Seal</option>
                    <option value="Doctor Changed Prescription">Doctor Changed Prescription</option>
                    <option value="Adverse Reaction">Adverse Reaction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">තොගයට එක්කිරීම (Condition) *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-rose-500"
                  >
                    <option value="Restock to Inventory">Restock to Inventory (තොගයට නැවත එක්කරන්න)</option>
                    <option value="Damaged / Discard">Damaged / Discard (හානිවූ බැවින් ඉවත්කරන්න)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">මුදල් ආපසු ගෙවීම (Refund Method)</label>
                  <select
                    value={formData.refund_method}
                    onChange={(e) => setFormData({ ...formData, refund_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-rose-500"
                  >
                    <option value="Cash">Cash (මුදල්)</option>
                    <option value="Bank Card">Bank Card Refund</option>
                    <option value="Store Credit">Store Credit Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">අමතර සටහන් (Notes)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Complete Return & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
