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
  Download,
  Pill,
  ShoppingBag,
  BookOpen,
  FileSpreadsheet,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import { pdfGenerator } from '../utils/pdfGenerator';
import { excelExporter } from '../utils/excelExporter';

export default function Medicines({ 
  medicines, 
  categories, 
  suppliers, 
  currentUser,
  isCashier = false,
  onRefresh, 
  onOpenAdd, 
  onOpenAddMed,
  onOpenAddGrocery,
  onOpenAddBookshop,
  onEditMedicine,
  t
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('all'); // 'all' | 'medicine' | 'grocery' | 'bookshop'
  const [deletingId, setDeletingId] = useState(null);

  // Stock Adjustment States
  const [isStockAdjOpen, setIsStockAdjOpen] = useState(false);
  const [adjMedId, setAdjMedId] = useState('');
  const [adjPhysicalQty, setAdjPhysicalQty] = useState('');
  const [adjReason, setAdjReason] = useState('Stock Count Correction');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjError, setAdjError] = useState('');
  const [adjSuccess, setAdjSuccess] = useState('');

  const isBookshopItem = (m) => {
    return (m.category && (m.category.includes('Book') || m.category.includes('Stationery'))) ||
           (m.category_name && (m.category_name.includes('Book') || m.category_name.includes('Stationery'))) ||
           m.form === 'Book' || m.form === 'Ream' || (m.batch_no && m.batch_no.startsWith('BK-'));
  };

  const isGroceryItem = (m) => {
    if (isBookshopItem(m)) return false;
    return m.category === 'Grocery & Essentials' || 
           m.category === 'Personal Care & Hygiene' ||
           ['Pack', 'Bottle', 'Bar', 'Box', 'Piece'].includes(m.form) ||
           (m.category_name && (m.category_name.includes('Grocery') || m.category_name.includes('Personal Care')));
  };

  const bookshopCount = medicines.filter(m => isBookshopItem(m)).length;
  const groceryCount = medicines.filter(m => isGroceryItem(m)).length;
  const medicineCount = medicines.filter(m => !isGroceryItem(m) && !isBookshopItem(m)).length;

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    try {
      setDeletingId(id);
      await api.deleteMedicine(id);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Error deleting item');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = medicines.filter(m => {
    const isB = isBookshopItem(m);
    const isG = isGroceryItem(m);

    // Item Type Filter (Medicine vs Grocery vs Bookshop)
    if (itemTypeFilter === 'medicine' && (isG || isB)) return false;
    if (itemTypeFilter === 'grocery' && !isG) return false;
    if (itemTypeFilter === 'bookshop' && !isB) return false;

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

  const handleAddMedicineClick = () => {
    if (onOpenAddMed) onOpenAddMed();
    else if (onOpenAdd) onOpenAdd();
  };

  const handleAddGroceryClick = () => {
    if (onOpenAddGrocery) onOpenAddGrocery();
    else if (onOpenAdd) onOpenAdd();
  };

  const handleAddBookshopClick = () => {
    if (onOpenAddBookshop) onOpenAddBookshop();
    else if (onOpenAdd) onOpenAdd();
  };

  return (
    <div className="space-y-5">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isCashier 
              ? 'තොග සහ මිල පරීක්ෂාව (Stock & Price Check)' 
              : (t?.inventoryTitle || 'Medicines, Grocery & Bookshop Inventory')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isCashier 
              ? `කවුන්ටර පරීක්ෂාව සඳහා භාණ්ඩ ${medicines.length} ක් ලියාපදිංචි කර ඇත (${medicineCount} Medicines, ${groceryCount} Grocery, ${bookshopCount} Books)`
              : `Total ${medicines.length} registered items (${medicineCount} Medicines, ${groceryCount} Grocery, ${bookshopCount} Books & Stationery)`}
          </p>
        </div>

        {/* Action Buttons: PDF + Excel + Stock Adjust + Separate Add Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => pdfGenerator.generateInventoryPDF(medicines)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => {
              const data = medicines.map((m, idx) => ({
                '#': idx + 1,
                'Name': m.name,
                'Generic Name': m.generic_name || '-',
                'Category': m.category || m.category_name || 'General',
                'Batch No': m.batch_no || m.batch_number || '-',
                'Barcode': m.barcode || '-',
                'Cost Price (LKR)': m.cost_price,
                'Selling Price (LKR)': m.selling_price,
                'Stock Qty': m.stock_quantity,
                'Reorder Level': m.min_stock_alert || m.reorder_level || 10,
                'Expiry Date': m.expiry_date,
                'Rack Location': m.rack_location || '-'
              }));
              excelExporter.exportToExcel(data, 'Medicine_Stock_Inventory', 'StockInventory');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          {!isCashier && (
            <>
              {/* Stock Maintenance / Adjustment Button */}
              <button
                onClick={() => {
                  setAdjMedId('');
                  setAdjPhysicalQty('');
                  setAdjReason('Stock Count Correction');
                  setAdjNotes('');
                  setAdjError('');
                  setAdjSuccess('');
                  setIsStockAdjOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Stock Adjust (තොග සංශෝධනය)</span>
              </button>

              {/* Separate Add Medicine */}
              <button
                onClick={handleAddMedicineClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Pill className="w-4 h-4" />
                <span>+ Add Medicine</span>
              </button>

              {/* Separate Add Grocery */}
              <button
                onClick={handleAddGroceryClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Add Grocery</span>
              </button>

              {/* Separate Add Book / Stationery */}
              <button
                onClick={handleAddBookshopClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>+ Add Book</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Segmented Filter Pills (All / Medicine / Grocery / Bookshop) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setItemTypeFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            itemTypeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Items ({medicines.length})
        </button>

        <button
          onClick={() => setItemTypeFilter('medicine')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            itemTypeFilter === 'medicine'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/50 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>💊 Medicines ({medicineCount})</span>
        </button>

        <button
          onClick={() => setItemTypeFilter('grocery')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            itemTypeFilter === 'grocery'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50/50 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>🛒 Grocery ({groceryCount})</span>
        </button>

        <button
          onClick={() => setItemTypeFilter('bookshop')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            itemTypeFilter === 'bookshop'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
              : 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50/50 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>📚 Books & Stationery ({bookshopCount})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Brand Name, Generic Name, Batch No..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses (තත්ත්වය)</option>
            <option value="in_stock">In Stock (Good)</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="expiring_soon">Expiring Soon (Next 60 Days)</option>
            <option value="expired">Expired Items</option>
          </select>
        </div>

      </div>

      {/* Products & Medicines Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Type & Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Batch / Shelf</th>
                {!isCashier && <th className="p-3.5">Cost (LKR)</th>}
                <th className="p-3.5">{isCashier ? 'Selling Price (LKR)' : 'Sell (LKR)'}</th>
                <th className="p-3.5 text-center">Stock Level</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Supplier / Dealer</th>
                {!isCashier && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isCashier ? 7 : 9} className="p-8 text-center text-slate-400">
                    No items match the selected search/filters.
                  </td>
                </tr>
              ) : (
                filtered.map((med) => {
                  const isB = isBookshopItem(med);
                  const isG = !isB && isGroceryItem(med);
                  const isOut = med.stock_quantity <= 0;
                  const isLow = med.stock_quantity > 0 && med.stock_quantity <= med.min_stock_alert;
                  const isExpired = med.days_to_expiry <= 0;
                  const isExpiringSoon = !isExpired && med.days_to_expiry <= 60;
                  const margin = med.selling_price > 0 
                    ? Math.round(((med.selling_price - med.cost_price) / med.selling_price) * 100) 
                    : 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      
                      {/* Name & Generic / Type Tag */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isB
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : (isG 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300')
                          }`}>
                            {isB ? 'Bookshop' : (isG ? 'Grocery' : 'Medicine')}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{med.name}</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {med.generic_name || '-'} • <span className="font-semibold text-slate-700 dark:text-slate-300">{med.dosage}</span> ({med.form})
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {med.category_name || '-'}
                      </td>

                      {/* Batch / Shelf */}
                      <td className="p-3.5">
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{med.batch_no}</span>
                        {med.rack_location && (
                          <div className="text-[10px] text-slate-400 font-sans">Loc: {med.rack_location}</div>
                        )}
                      </td>

                      {/* Buy price (Admin only) */}
                      {!isCashier && (
                        <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono font-bold">
                          {formatCurrency(med.cost_price)}
                        </td>
                      )}

                      {/* Sell price & margin */}
                      <td className="p-3.5">
                        <span className={`font-mono font-black text-xs sm:text-sm ${
                          isB 
                            ? 'text-sky-600 dark:text-sky-400' 
                            : (isG ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400')
                        }`}>
                          {formatCurrency(med.selling_price)}
                        </span>
                        {!isCashier && (
                          <div className="text-[10px] text-slate-400 font-mono">+{margin}% margin</div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black shadow-xs ${
                          isOut 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800' 
                            : isLow 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></span>
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
                              : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {formatDate(med.expiry_date)}
                        </div>
                        <div className="text-[10px]">
                          {isExpired ? (
                            <span className="text-rose-600 font-bold">EXPIRED!</span>
                          ) : isExpiringSoon ? (
                            <span className="text-amber-600 font-semibold">Expires in {med.days_to_expiry} days</span>
                          ) : (
                            <span className="text-slate-400">{med.days_to_expiry} days left</span>
                          )}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                        {med.supplier_name || '-'}
                      </td>

                      {/* Actions (Admin only) */}
                      {!isCashier && (
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => onEditMedicine(med)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(med.id, med.name)}
                            disabled={deletingId === med.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isStockAdjOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              තොග සංශෝධනය (Stock Reconciliation & Adjustment)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reconcile physical stock count with system inventory and log adjustment reasons
            </p>

            {adjError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {adjError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdjError('');
                const med = medicines.find(m => String(m.id || m._id) === String(adjMedId));
                if (!med) {
                  setAdjError('කරුණාකර ඖෂධය තෝරන්න (Please select item)');
                  return;
                }
                const newQty = Number(adjPhysicalQty);
                if (isNaN(newQty) || newQty < 0) {
                  setAdjError('වලංගු තොග ප්‍රමාණයක් ඇතුළත් කරන්න (Valid quantity required)');
                  return;
                }

                try {
                  await api.createStockAdjustment({
                    medicine_id: med.id || med._id,
                    medicine_name: med.name,
                    batch_no: med.batch_no || med.batch_number || '',
                    previous_qty: med.stock_quantity,
                    adjusted_qty: newQty,
                    reason: adjReason,
                    adjusted_by: currentUser?.name || 'Admin',
                    notes: adjNotes
                  });
                  setIsStockAdjOpen(false);
                  if (onRefresh) onRefresh();
                } catch (err) {
                  setAdjError(err.message || 'Stock adjustment failed');
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  භාණ්ඩය / ඖෂධය (Select Item) *
                </label>
                <select
                  required
                  value={adjMedId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAdjMedId(id);
                    const m = medicines.find(x => String(x.id || x._id) === String(id));
                    if (m) setAdjPhysicalQty(String(m.stock_quantity));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-purple-500"
                >
                  <option value="">-- Choose Item from Inventory --</option>
                  {medicines.map(m => (
                    <option key={m.id || m._id} value={m.id || m._id}>
                      {m.name} (Current: {m.stock_quantity} units)
                    </option>
                  ))}
                </select>
              </div>

              {adjMedId && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex justify-between">
                  <span className="text-slate-500">පද්ධතියේ ඇති තොගය (Current):</span>
                  <span className="font-black text-slate-800 dark:text-white">
                    {medicines.find(m => String(m.id || m._id) === String(adjMedId))?.stock_quantity} units
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  නව භෞතික තොගය (New Physical Count) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjPhysicalQty}
                  onChange={(e) => setAdjPhysicalQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-purple-600 focus:outline-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  හේතුව (Reason for Adjustment) *
                </label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-purple-500"
                >
                  <option value="Stock Count Correction">Stock Count Correction (භෞතික ගණන්කිරීමේ නිවැරදි කිරීම)</option>
                  <option value="Damaged Stock">Damaged Stock (කල් ඉකුත් නොවී හානිවීම්)</option>
                  <option value="Expired Goods">Expired Goods (කල් ඉකුත් වූ තොග ඉවත් කිරීම)</option>
                  <option value="Returned to Supplier">Returned to Supplier (ඩීලර්ට ආපසු යැවීම)</option>
                  <option value="Theft or Lost">Theft or Lost (අස්ථානගත වීම්)</option>
                  <option value="Internal Pharmacy Use">Internal Pharmacy Use (සායනික භාවිතය)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  අමතර සටහන් (Notes)
                </label>
                <input
                  type="text"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockAdjOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
