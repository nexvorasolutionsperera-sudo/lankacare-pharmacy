import React, { useState } from 'react';
import { X, Stethoscope, Save, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AddDoctorModal({ isOpen, onClose, onSaved }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    slmc_no: '',
    hospital: '',
    phone: '',
    specialization: 'General Physician'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Doctor name is required');
      return;
    }
    try {
      setLoading(true);
      await api.createDoctor(formData);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">නව වෛද්‍යවරයා (Register Doctor)</h3>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name (වෛද්‍යවරයාගේ නම) *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Dr. Nimal Jayawardena"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SLMC Reg No (ලියාපදිංචි අංකය)</label>
              <input
                type="text"
                value={formData.slmc_no}
                onChange={(e) => setFormData(p => ({ ...p, slmc_no: e.target.value }))}
                placeholder="SLMC-XXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (දුරකථන)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="07X-XXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Clinic</label>
            <input
              type="text"
              value={formData.hospital}
              onChange={(e) => setFormData(p => ({ ...p, hospital: e.target.value }))}
              placeholder="e.g. Colombo National Hospital / Asiri"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization (විශේෂඥතාව)</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))}
              placeholder="e.g. Consultant Physician, Pediatrician, ENT"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md">
              <Save className="w-3.5 h-3.5 inline mr-1" />
              {loading ? 'Saving...' : 'Save Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
