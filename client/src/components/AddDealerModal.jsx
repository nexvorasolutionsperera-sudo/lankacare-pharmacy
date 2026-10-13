import React, { useState, useEffect } from 'react';
import { X, Truck, Save, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AddDealerModal({ isOpen, onClose, onSaved, dealerToEdit }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    total_purchased: 0,
    total_paid: 0
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dealerToEdit) {
      setFormData({
        name: dealerToEdit.name || '',
        contact_person: dealerToEdit.contact_person || '',
        phone: dealerToEdit.phone || '',
        email: dealerToEdit.email || '',
        address: dealerToEdit.address || '',
        tax_id: dealerToEdit.tax_id || '',
        total_purchased: dealerToEdit.total_purchased || 0,
        total_paid: dealerToEdit.total_paid || 0
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_id: '',
        total_purchased: 0,
        total_paid: 0
      });
    }
    setError('');
  }, [dealerToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company / Dealer name is required.');
      return;
    }

    try {
      setLoading(true);
      if (dealerToEdit) {
        await api.updateSupplier(dealerToEdit.id, formData);
      } else {
        await api.createSupplier(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {dealerToEdit ? 'ඩීලර් විස්තර වෙනස් කිරීම' : 'නව ඩීලර් / සැපයුම්කරු (Add Dealer)'}
              </h2>
              <p className="text-xs text-slate-500">Register distributor details and contact info</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Dealer Name (සමාගමේ නම) *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Hemas Pharmaceuticals, SPC"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person (නියෝජිතයා)</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="e.g. Sunil Perera"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (දුරකථන) *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 011-2345678"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sales@dealer.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BR / Tax VAT No</label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address (ලිපිනය)</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. No 40, Bristol St, Colombo 01"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

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
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Dealer'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
