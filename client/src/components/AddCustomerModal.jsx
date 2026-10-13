import React, { useState } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AddCustomerModal({ isOpen, onClose, onSaved }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Patient / Customer name is required');
      return;
    }
    try {
      setLoading(true);
      await api.createCustomer(formData);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">නව පාරිභෝගිකයා (Add Patient/Customer)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (සම්පූර්ණ නම) *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Nimal Perera"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (දුරකථන)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="077-XXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="patient@gmail.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">Known Drug Allergies (ඖෂධ අසාත්මිකතා)</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => setFormData(p => ({ ...p, allergies: e.target.value }))}
              placeholder="e.g. Penicillin, Aspirin, Sulfa drugs"
              className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/30 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Notes</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
              placeholder="Address or medical remarks"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md">
              <Save className="w-3.5 h-3.5 inline mr-1" />
              {loading ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
