import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Package, 
  DollarSign,
  Download
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import { pdfGenerator } from '../utils/pdfGenerator';

export default function Medicines({ 
  medicines, 
  categories, 
  suppliers, 
  onRefresh, 
  onOpenAdd, 
  onEditMedicine,
  t
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    try {
      setDeletingId(id);
      await api.deleteMedicine(id);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Error deleting medicine');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = medicines.filter(m => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      m.name.toLowerCase().includes(term) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(term)) ||
      (m.batch_no && m.batch_no.toLowerCase().includes(term));

    // Category
    const matchesCat = selectedCategory === 'all' || String(m.category_id) === String(selectedCategory);

    // Status
    let matchesStatus = true;
    const today = new Date().toISOString().split('T')[0];
    const isExpired = m.expiry_date < today;
    const isExpiringSoon = !isExpired && m.days_to_expiry <= 60;
    const isLow = m.stock_quantity <= m.min_stock_alert;

    if (statusFilter === 'low_stock') matchesStatus = isLow;
    else if (statusFilter === 'expired') matchesStatus = isExpired;
    else if (statusFilter === 'expiring_soon') matchesStatus = isExpiringSoon;
    else if (statusFilter === 'in_stock') matchesStatus = !isLow && !isExpired;

    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-5">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t?.inventoryTitle || 'Medicine Inventory Management'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {medicines.length} {t?.totalRegisteredMeds || 'registered medicines in catalog'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => pdfGenerator.generateInventoryPDF(medicines)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {t?.exportStockPdf || 'Export Stock PDF'}
          </button>

          <button
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t?.addNewMedicine || 'Add New Medicine'}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Brand Name, Generic Name, Batch No..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories (සියලු කාණ්ඩ)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses (තත්ත්වය)</option>
            <option value="in_stock">In Stock (Good)</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="expiring_soon">Expiring Soon (Next 60 Days)</option>
            <option value="expired">Expired Medicines</option>
          </select>
        </div>

      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Medicine & Generic</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Batch / Shelf</th>
                <th className="p-3.5">Cost (LKR)</th>
                <th className="p-3.5">Sell (LKR)</th>
                <th className="p-3.5 text-center">Stock Level</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Supplier / Dealer</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No medicines match the selected search/filters.
                  </td>
                </tr>
              ) : (
                filtered.map((med) => {
                  const isOut = med.stock_quantity <= 0;
                  const isLow = med.stock_quantity > 0 && med.stock_quantity <= med.min_stock_alert;
                  const isExpired = med.days_to_expiry <= 0;
                  const isExpiringSoon = !isExpired && med.days_to_expiry <= 60;
                  const margin = med.selling_price > 0 
                    ? Math.round(((med.selling_price - med.cost_price) / med.selling_price) * 100) 
                    : 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Name & Generic */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                        <div className="text-slate-500 text-[11px]">
                          {med.generic_name || '-'} • <span className="font-semibold text-emerald-700">{med.dosage}</span> ({med.form})
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-medium text-slate-600">
                        {med.category_name || '-'}
                      </td>

                      {/* Batch / Shelf */}
                      <td className="p-3.5">
                        <span className="font-mono text-slate-700">{med.batch_no}</span>
                        {med.rack_location && (
                          <div className="text-[10px] text-slate-400 font-sans">Loc: {med.rack_location}</div>
                        )}
                      </td>

                      {/* Buy price */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        {formatCurrency(med.cost_price)}
                      </td>

                      {/* Sell price & margin */}
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700">{formatCurrency(med.selling_price)}</span>
                        <div className="text-[10px] text-slate-400">+{margin}% margin</div>
                      </td>

                      {/* Stock Level */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOut 
                            ? 'bg-rose-100 text-rose-800' 
                            : isLow 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut && <AlertTriangle className="w-3 h-3" />}
                          {med.stock_quantity}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Min: {med.min_stock_alert}</div>
                      </td>

                      {/* Expiry Date */}
                      <td className="p-3.5">
                        <div className={`font-medium ${
                          isExpired 
                            ? 'text-rose-600 font-bold' 
                            : isExpiringSoon 
                              ? 'text-amber-600 font-bold' 
                              : 'text-slate-700'
                        }`}>
                          {formatDate(med.expiry_date)}
                        </div>
                        <div className="text-[10px]">
                          {isExpired ? (
                            <span className="text-rose-600 font-bold">EXPIRED!</span>
                          ) : isExpiringSoon ? (
                            <span className="text-amber-600">Expires in {med.days_to_expiry} days</span>
                          ) : (
                            <span className="text-slate-400">{med.days_to_expiry} days left</span>
                          )}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="p-3.5 text-slate-600 font-medium truncate max-w-[140px]">
                        {med.supplier_name || '-'}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => onEditMedicine(med)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Edit medicine"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(med.id, med.name)}
                          disabled={deletingId === med.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete medicine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
