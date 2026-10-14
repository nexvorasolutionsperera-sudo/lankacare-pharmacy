import React, { useState, useEffect } from 'react';
import { X, Pill, Save, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AddMedicineModal({ isOpen, onClose, onSaved, medicineToEdit, categories, suppliers }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    dosage: '',
    form: 'Tablet',
    batch_no: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    min_stock_alert: '10',
    expiry_date: '',
    supplier_id: '',
    rack_location: '',
    requires_prescription: 0
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medicineToEdit) {
      setFormData({
        name: medicineToEdit.name || '',
        generic_name: medicineToEdit.generic_name || '',
        category_id: medicineToEdit.category_id || '',
        dosage: medicineToEdit.dosage || '',
        form: medicineToEdit.form || 'Tablet',
        batch_no: medicineToEdit.batch_no || '',
        barcode: medicineToEdit.barcode || '',
        cost_price: medicineToEdit.cost_price || '',
        selling_price: medicineToEdit.selling_price || '',
        stock_quantity: medicineToEdit.stock_quantity ?? '',
        min_stock_alert: medicineToEdit.min_stock_alert ?? '10',
        expiry_date: medicineToEdit.expiry_date || '',
        supplier_id: medicineToEdit.supplier_id || '',
        rack_location: medicineToEdit.rack_location || '',
        requires_prescription: medicineToEdit.requires_prescription ? 1 : 0
      });
    } else {
      setFormData({
        name: '',
        generic_name: '',
        category_id: categories?.[0]?.id || '',
        dosage: '',
        form: 'Tablet',
        batch_no: `BT-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        min_stock_alert: '10',
        expiry_date: '',
        supplier_id: suppliers?.[0]?.id || '',
        rack_location: 'Rack A-1',
        requires_prescription: 0
      });
    }
    setError('');
  }, [medicineToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.batch_no.trim() || !formData.cost_price || !formData.selling_price || !formData.expiry_date) {
      setError('Please fill in required fields: Name, Batch No, Buying/Selling Price, and Expiry Date.');
      return;
    }

    if (Number(formData.selling_price) < Number(formData.cost_price)) {
      if (!confirm('Warning: Selling price is less than Cost price. Do you wish to continue?')) {
        return;
      }
    }

    try {
      setLoading(true);
      if (medicineToEdit) {
        await api.updateMedicine(medicineToEdit.id, formData);
      } else {
        await api.createMedicine(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {medicineToEdit ? 'භාණ්ඩ / බෙහෙත් තොරතුරු වෙනස් කිරීම (Edit Product / Medicine)' : 'නව ඖෂධයක් හෝ Grocery භාණ්ඩයක් එකතු කිරීම (Add Medicine / Grocery)'}
              </h2>
              <p className="text-xs text-slate-500">Add medicines, healthcare or grocery products to inventory stock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name (වෙළඳ නාමය) *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Panadol Actifast"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name (ජෙනරික් නම)</label>
              <input
                type="text"
                name="generic_name"
                value={formData.generic_name}
                onChange={handleChange}
                placeholder="e.g. Paracetamol"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category (කාණ්ඩය)</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage (මාත්‍රාව)</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 500mg, 10ml"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form / Type (වර්ගය)</label>
                <select
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="Tablet">Tablet (පෙති)</option>
                  <option value="Capsule">Capsule (කරල්)</option>
                  <option value="Syrup">Syrup (පැණි)</option>
                  <option value="Pack">Pack / Packet (පැකට්)</option>
                  <option value="Bottle">Bottle / Tin (බෝතල්/ටින්)</option>
                  <option value="Bar">Bar / Piece (කෑලි/සබන්)</option>
                  <option value="Box">Box / Carton (පෙට්ටි)</option>
                  <option value="Ointment">Ointment / Cream</option>
                  <option value="Drops">Eye/Ear Drops</option>
                  <option value="Device">Medical / Grocery Item</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number (කාණ්ඩ අංකය) *</label>
              <input
                type="text"
                name="batch_no"
                value={formData.batch_no}
                onChange={handleChange}
                placeholder="e.g. BT-9812"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode / Code</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Optional scanner barcode"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity (ප්‍රමාණය)</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Alert Level</label>
                <input
                  type="number"
                  name="min_stock_alert"
                  value={formData.min_stock_alert}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (කල් ඉකුත්වීමේ දිනය) *</label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer / Supplier (සැපයුම්කරු)</label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rack / Shelf Location</label>
              <input
                type="text"
                name="rack_location"
                value={formData.rack_location}
                onChange={handleChange}
                placeholder="e.g. Rack A-2, Fridge"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  name="requires_prescription"
                  checked={formData.requires_prescription === 1}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                Requires Doctor's Prescription (වෛද්‍ය නිර්දේශය අවශ්‍යයි)
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : (medicineToEdit ? 'Update Medicine' : 'Save Medicine')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
