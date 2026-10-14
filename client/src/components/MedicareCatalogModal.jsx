import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Droplet, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  AlertCircle, 
  Check, 
  Activity,
  Heart,
  Clock,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { api, formatCurrency } from '../api';

const DEFAULT_CATEGORIES = ['All', 'Blood Test', 'Urine & Other', 'ECG & Cardiac', 'Clinical Medicare'];

export default function MedicareCatalogModal({ 
  isOpen, 
  onClose, 
  isCashier = false, 
  onCatalogUpdated 
}) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Add / Edit Modal or Form State
  const [editingItem, setEditingItem] = useState(null); // null if closed, {} if new, or existing item object
  const [formData, setFormData] = useState({
    name: '',
    category: 'Blood Test',
    sample_type: 'Blood',
    price: '',
    default_fasting: 'Not Required'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMedicareCatalog();
      setCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('මිල දර්ශකය ලබා ගැනීමට අපොහොසත් විය (Failed to load price catalog)');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingItem({ isNew: true });
    setFormData({
      name: '',
      category: 'Blood Test',
      sample_type: 'Blood',
      price: '',
      default_fasting: 'Not Required'
    });
    setError('');
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'Blood Test',
      sample_type: item.sample_type || 'Blood',
      price: item.price,
      default_fasting: item.default_fasting || item.defaultFasting || 'Not Required'
    });
    setError('');
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price === '' || isNaN(Number(formData.price))) {
      setError('කරුණාකර පරීක්ෂණයේ නම සහ වලංගු මිලක් ඇතුළත් කරන්න (Please enter valid test name and price)');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingItem.isNew) {
        await api.createMedicareCatalogItem(formData);
        showToast(`✅ "${formData.name}" සාර්ථකව මිල දර්ශකයට එක් කරන ලදී!`);
      } else {
        await api.updateMedicareCatalogItem(editingItem.id, formData);
        showToast(`✅ "${formData.name}" සාර්ථකව යාවත්කාලීන කරන ලදී!`);
      }

      setEditingItem(null);
      await loadCatalog();
      if (onCatalogUpdated) onCatalogUpdated();
    } catch (err) {
      setError(err.message || 'Error saving test');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`මෙම පරීක්ෂණය මිල දර්ශකයෙන් ඉවත් කිරීමට අවශ්‍යද?\n"${item.name}" (Price: ${formatCurrency(item.price)})`)) {
      return;
    }

    try {
      await api.deleteMedicareCatalogItem(item.id);
      showToast(`🗑️ "${item.name}" ඉවත් කරන ලදී.`);
      await loadCatalog();
      if (onCatalogUpdated) onCatalogUpdated();
    } catch (err) {
      alert(`Error deleting test: ${err.message}`);
    }
  };

  // Filtered List
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        item.name?.toLowerCase().includes(q) ||
        item.sample_type?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
      return matchCat && matchQuery;
    });
  }, [catalog, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-2xl text-rose-600 shadow-sm">
              <Droplet className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                  Aaush Medicare & Diagnostics Catalog
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {catalog.length} Tests
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                සායනික, රුධිර සහ රෝග විනිශ්චය පරීක්ෂණ මිල දර්ශකය (Standard Test Fees & Sample Guidelines)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Add New Test Button */}
            {!isCashier && !editingItem && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Test (නව පරීක්ෂණයක්)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success or Error Toast */}
        {successToast && (
          <div className="my-2 p-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast('')}>✕</button>
          </div>
        )}

        {error && (
          <div className="my-2 p-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Add / Edit Form Panel (if editing or adding) */}
        {editingItem && (
          <form onSubmit={handleSaveItem} className="my-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                {editingItem.isNew ? 'නව පරීක්ෂණයක් ඇතුළත් කිරීම (Add New Test)' : 'පරීක්ෂණ විස්තර සංස්කරණය (Edit Test)'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                Cancel (අවලංගු කරන්න)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Name (පරීක්ෂණයේ නම) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Troponin I, Lipid Profile, RBS"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category (කාණ්ඩය)
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Blood Test">Blood Test (රුධිර පරීක්ෂණ)</option>
                  <option value="Urine & Other">Urine & Stool (මුත්‍රා/මල පරීක්ෂණ)</option>
                  <option value="ECG & Cardiac">ECG & Cardiac (හෘද පරීක්ෂණ)</option>
                  <option value="Clinical Medicare">Clinical Medicare (හෙද සායනික සත්කාර)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sample Type / Requirement (නියැදි වර්ගය)
                </label>
                <input
                  type="text"
                  value={formData.sample_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, sample_type: e.target.value }))}
                  placeholder="e.g. EDTA Blood, Serum, Urine, Procedure"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Fee / Price (මිල - රු.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g. 650.00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fasting / Preparation Guidelines (නිරාහාර සටහන)
                </label>
                <input
                  type="text"
                  value={formData.default_fasting}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_fasting: e.target.value }))}
                  placeholder="e.g. Fasting (10-12 hrs), Non-Fasting, Not Required"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : (editingItem.isNew ? 'Save Test (සුරකින්න)' : 'Update Test (යාවත්කාලීන කරන්න)')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Search & Filters */}
        <div className="py-3 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="පරීක්ෂණ සොයන්න (Search test name, sample type, or category)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-white"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {DEFAULT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tests List Scroll */}
        <div className="overflow-y-auto flex-1 py-1 space-y-2 pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              දත්ත ලබාගනිමින් පවතී... (Loading Test Catalog)
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Droplet className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-bold">ගැලපෙන පරීක්ෂණ කිසිවක් හමු නොවීය (No tests found)</p>
            </div>
          ) : (
            filteredCatalog.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 transition-all text-xs group"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                      {item.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                      item.category === 'ECG & Cardiac' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                        : (item.category === 'Clinical Medicare' 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' 
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300')
                    }`}>
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Sample: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.sample_type}</strong></span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{item.default_fasting || item.defaultFasting || 'Not Required'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm sm:text-base">
                      {formatCurrency(item.price)}
                    </div>
                  </div>

                  {/* Admin Edit & Delete Actions */}
                  {!isCashier && (
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Price & Details (සංස්කරණය)"
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        title="Delete Test (ඉවත් කරන්න)"
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>
            {!isCashier ? '👑 Admin Mode: You can Add, Edit, or Delete any test in this catalog.' : '💳 Cashier Mode: Test fees and sample guidelines view.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            වසන්න (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
