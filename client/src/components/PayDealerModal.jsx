import React, { useState } from 'react';
import { X, DollarSign, Save, AlertCircle } from 'lucide-react';
import { api, formatCurrency } from '../api';

export default function PayDealerModal({ isOpen, onClose, onSaved, dealer }) {
  if (!isOpen || !dealer) return null;

  const balanceDue = (Number(dealer.total_purchased) || 0) - (Number(dealer.total_paid) || 0);
  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toString() : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    try {
      setLoading(true);
      await api.paySupplier(dealer.id, Number(amount));
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ඩීලර් ගෙවීම් පියවීම (Pay Dealer)
              </h2>
              <p className="text-xs text-slate-500">{dealer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total Goods Purchased:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(dealer.total_purchased)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Already Paid:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(dealer.total_paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t border-slate-200">
              <span>Current Outstanding Due:</span>
              <span className="text-rose-600">{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount to Settle (LKR) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
