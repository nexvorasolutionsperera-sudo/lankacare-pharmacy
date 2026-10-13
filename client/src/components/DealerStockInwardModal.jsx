import React, { useState } from 'react';
import { X, PackageCheck, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { api, formatCurrency } from '../api';

export default function DealerStockInwardModal({ isOpen, onClose, onSaved, suppliers, medicines }) {
  if (!isOpen) return null;

  const [supplierId, setSupplierId] = useState(suppliers?.[0]?.id || '');
  const [invoiceNo, setInvoiceNo] = useState(`GRN-${Date.now().toString().slice(-6)}`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState('0');
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState([
    {
      medicine_id: medicines?.[0]?.id || '',
      medicine_name: medicines?.[0]?.name || '',
      quantity: 50,
      cost_price: medicines?.[0]?.cost_price || 10,
      selling_price: medicines?.[0]?.selling_price || 15,
      batch_no: `BT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiry_date: ''
    }
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMedicineSelect = (index, medId) => {
    const med = medicines.find(m => String(m.id) === String(medId));
    setItems(prev => {
      const copy = [...prev];
      if (med) {
        copy[index] = {
          ...copy[index],
          medicine_id: med.id,
          medicine_name: med.name,
          cost_price: med.cost_price,
          selling_price: med.selling_price,
          batch_no: med.batch_no || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
          expiry_date: med.expiry_date || ''
        };
      }
      return copy;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        medicine_id: medicines?.[0]?.id || '',
        medicine_name: medicines?.[0]?.name || '',
        quantity: 50,
        cost_price: medicines?.[0]?.cost_price || 10,
        selling_price: medicines?.[0]?.selling_price || 15,
        batch_no: `BT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiry_date: ''
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.cost_price || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a dealer / supplier.');
      return;
    }
    if (!items.length) {
      setError('At least one item is required.');
      return;
    }

    try {
      setLoading(true);
      await api.createPurchase({
        supplier_id: supplierId,
        invoice_no: invoiceNo,
        purchase_date: purchaseDate,
        paid_amount: Number(paidAmount) || 0,
        notes,
        items
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record stock inward');
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                බෙහෙත් තොග භාරගැනීම (Dealer Stock Inward / GRN)
              </h2>
              <p className="text-xs text-slate-500">Receive new delivery from dealer & increase inventory quantities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Dealer / Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer Invoice / GRN No *</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Medicines Received Table */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Received Medicines (ලැබුණු ඖෂධ)
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Drug
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Medicine Name</th>
                    <th className="p-2.5 w-24">Batch No</th>
                    <th className="p-2.5 w-28">Expiry Date</th>
                    <th className="p-2.5 w-20">Inward Qty</th>
                    <th className="p-2.5 w-24">Buy Price</th>
                    <th className="p-2.5 w-24">Sell Price</th>
                    <th className="p-2.5 w-24 text-right">Subtotal</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-2">
                        <select
                          value={row.medicine_id}
                          onChange={(e) => handleMedicineSelect(idx, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                        >
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.dosage || '-'})</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.batch_no}
                          onChange={(e) => handleItemChange(idx, 'batch_no', e.target.value)}
                          placeholder="Batch"
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={row.expiry_date}
                          onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          min="1"
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-bold text-blue-700"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={row.cost_price}
                          onChange={(e) => handleItemChange(idx, 'cost_price', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={row.selling_price}
                          onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-emerald-700"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-800">
                        {formatCurrency(Number(row.quantity || 0) * Number(row.cost_price || 0))}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment info & Totals */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paid to Dealer Now (LKR)</label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500">Outstanding Balance to Dealer:</p>
              <p className="text-base font-bold text-rose-600">
                {formatCurrency(Math.max(0, grandTotal - Number(paidAmount || 0)))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Grand Delivery Total</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Recording Inward...' : 'Confirm Delivery & Update Stock'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
