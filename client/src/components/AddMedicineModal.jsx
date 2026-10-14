import React, { useState, useEffect } from 'react';
import { X, Pill, ShoppingBag, BookOpen, Save, AlertCircle, Camera, QrCode } from 'lucide-react';
import { api } from '../api';
import CameraScannerModal from './CameraScannerModal';

export default function AddMedicineModal({ isOpen, onClose, onSaved, medicineToEdit, categories, suppliers, initialType = 'medicine' }) {
  if (!isOpen) return null;

  const [itemType, setItemType] = useState(initialType || 'medicine'); // 'medicine' | 'grocery'

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (medicineToEdit) {
      const isBook = (medicineToEdit.category && (medicineToEdit.category.includes('Book') || medicineToEdit.category.includes('Stationery'))) ||
                     medicineToEdit.form === 'Book' || medicineToEdit.form === 'Ream';
      const isGrocery = !isBook && (medicineToEdit.category === 'Grocery & Essentials' || 
                        medicineToEdit.category === 'Personal Care & Hygiene' ||
                        ['Pack', 'Bottle', 'Bar', 'Box', 'Piece'].includes(medicineToEdit.form));
      
      setItemType(isBook ? 'bookshop' : (isGrocery ? 'grocery' : 'medicine'));

      setFormData({
        name: medicineToEdit.name || '',
        generic_name: medicineToEdit.generic_name || '',
        category_id: medicineToEdit.category_id || '',
        dosage: medicineToEdit.dosage || '',
        form: medicineToEdit.form || (isBook ? 'Book' : (isGrocery ? 'Pack' : 'Tablet')),
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
      const currentType = initialType || 'medicine';
      setItemType(currentType);
      const defaultGroceryCat = categories.find(c => c.name?.toLowerCase().includes('grocery'))?.id;
      const defaultBookCat = categories.find(c => c.name?.toLowerCase().includes('book') || c.name?.toLowerCase().includes('stationery'))?.id;
      const defaultMedCat = categories.find(c => !c.name?.toLowerCase().includes('grocery') && !c.name?.toLowerCase().includes('book'))?.id;

      const chosenCat = currentType === 'bookshop' 
        ? (defaultBookCat || categories?.[0]?.id || '') 
        : (currentType === 'grocery' ? (defaultGroceryCat || categories?.[0]?.id || '') : (defaultMedCat || categories?.[0]?.id || ''));

      setFormData({
        name: '',
        generic_name: '',
        category_id: chosenCat,
        dosage: currentType === 'bookshop' ? 'Stationery / Book' : (currentType === 'grocery' ? 'Standard Pack' : ''),
        form: currentType === 'bookshop' ? 'Book' : (currentType === 'grocery' ? 'Pack' : 'Tablet'),
        batch_no: currentType === 'bookshop' 
          ? `BK-${Math.floor(1000 + Math.random() * 9000)}` 
          : (currentType === 'grocery' ? `GR-${Math.floor(1000 + Math.random() * 9000)}` : `BT-${Math.floor(1000 + Math.random() * 9000)}`),
        barcode: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        min_stock_alert: '10',
        expiry_date: currentType === 'bookshop' ? '2099-12-31' : '',
        supplier_id: suppliers?.[0]?.id || '',
        rack_location: currentType === 'bookshop' ? 'Book Rack A' : (currentType === 'grocery' ? 'Grocery Shelf' : 'Rack A-1'),
        requires_prescription: 0
      });
    }
    setError('');
  }, [medicineToEdit, isOpen, initialType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleTypeSwitch = (type) => {
    setItemType(type);
    if (type === 'bookshop') {
      const bCat = categories.find(c => c.name?.toLowerCase().includes('book') || c.name?.toLowerCase().includes('stationery'))?.id;
      setFormData(prev => ({
        ...prev,
        form: 'Book',
        category_id: bCat || prev.category_id,
        dosage: 'Stationery / Book',
        rack_location: 'Book Rack A',
        expiry_date: prev.expiry_date || '2099-12-31',
        batch_no: prev.batch_no.startsWith('BK-') ? prev.batch_no : `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        requires_prescription: 0
      }));
    } else if (type === 'grocery') {
      const gCat = categories.find(c => c.name?.toLowerCase().includes('grocery'))?.id;
      setFormData(prev => ({
        ...prev,
        form: 'Pack',
        category_id: gCat || prev.category_id,
        dosage: prev.dosage === 'Stationery / Book' ? 'Standard Pack' : prev.dosage || 'Standard Pack',
        rack_location: 'Grocery Shelf',
        batch_no: prev.batch_no.startsWith('GR-') ? prev.batch_no : `GR-${Math.floor(1000 + Math.random() * 9000)}`,
        requires_prescription: 0
      }));
    } else {
      const mCat = categories.find(c => !c.name?.toLowerCase().includes('grocery') && !c.name?.toLowerCase().includes('book'))?.id;
      setFormData(prev => ({
        ...prev,
        form: 'Tablet',
        category_id: mCat || prev.category_id,
        dosage: (prev.dosage === 'Standard Pack' || prev.dosage === 'Stationery / Book') ? '' : prev.dosage,
        rack_location: 'Rack A-1',
        batch_no: prev.batch_no.startsWith('BT-') ? prev.batch_no : `BT-${Math.floor(1000 + Math.random() * 9000)}`
      }));
    }
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
      setError(err.message || 'Error saving item');
    } finally {
      setLoading(false);
    }
  };

  const isGrocery = itemType === 'grocery';
  const isBookshop = itemType === 'bookshop';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${
          isBookshop ? 'bg-sky-50/70' : (isGrocery ? 'bg-amber-50/70' : 'bg-indigo-50/70')
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-xs text-white ${
              isBookshop ? 'bg-sky-600' : (isGrocery ? 'bg-amber-500' : 'bg-indigo-600')
            }`}>
              {isBookshop ? <BookOpen className="w-5 h-5" /> : (isGrocery ? <ShoppingBag className="w-5 h-5" /> : <Pill className="w-5 h-5" />)}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {medicineToEdit 
                  ? (isBookshop 
                      ? 'පොත්පත් / ස්ටේෂනරි වෙනස් කිරීම (Edit Book / Stationery)' 
                      : (isGrocery ? 'Grocery භාණ්ඩ තොරතුරු වෙනස් කිරීම (Edit Grocery Item)' : 'ඖෂධ තොරතුරු වෙනස් කිරීම (Edit Medicine)'))
                  : (isBookshop 
                      ? 'නව පොත්පත් / ස්ටේෂනරි එකතු කිරීම (Add Book / Stationery)' 
                      : (isGrocery ? 'නව Grocery භාණ්ඩයක් එකතු කිරීම (Add Grocery Item)' : 'නව ඖෂධයක් එකතු කිරීම (Add Medicine)'))}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isBookshop 
                  ? 'Add CR books, exercise books, pens, stationery & school/office supplies'
                  : (isGrocery 
                      ? 'Add food, beverages, hygiene or retail consumer goods to stock' 
                      : 'Add pharmaceutical drugs, syrups, tablets or clinical medicines to inventory')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Type Switcher Tabs (Only if creating new item) */}
        {!medicineToEdit && (
          <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeSwitch('medicine')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                itemType === 'medicine'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>💊 ඖෂධ (Medicine)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('grocery')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                itemType === 'grocery' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>🛒 Grocery / සිල්ලර</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('bookshop')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                itemType === 'bookshop' 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📚 පොත්පත් & ස්ටේෂනරි</span>
            </button>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Product / Brand Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBookshop 
                  ? 'Book / Stationery Item Name (භාණ්ඩයේ නම) *' 
                  : (isGrocery ? 'Product / Item Name (භාණ්ඩයේ නම) *' : 'Medicine Brand Name (වෙළඳ නාමය) *')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={isBookshop 
                  ? "e.g. Atlas CR Book 120 Pages Ruled, Lexi Blue Pen" 
                  : (isGrocery ? "e.g. Anchor Milk Powder 400g, Sunlight Soap" : "e.g. Panadol Actifast 500mg")}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold"
              />
            </div>

            {/* Generic Name / Manufacturer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBookshop 
                  ? 'Brand / Publisher (සමාගම / ප්‍රකාශකයා)' 
                  : (isGrocery ? 'Brand / Manufacturer (සමාගම / වෙළඳනාමය)' : 'Generic Name (ජෙනරික් නම)')}
              </label>
              <input
                type="text"
                name="generic_name"
                value={formData.generic_name}
                onChange={handleChange}
                placeholder={isBookshop 
                  ? "e.g. Atlas, Richard, Lexi, Nataraj, Double A" 
                  : (isGrocery ? "e.g. Fonterra, Unilever, Nestle" : "e.g. Paracetamol, Amoxicillin")}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category (කාණ්ඩය)</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm bg-white"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Dosage & Form */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBookshop 
                    ? 'Pages / Specs (පිටු/විස්තර)' 
                    : (isGrocery ? 'Net Weight / Pack Size (බර)' : 'Dosage (මාත්‍රාව)')}
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder={isBookshop 
                    ? "e.g. 120 Pages, 0.7mm Blue, 80 GSM" 
                    : (isGrocery ? "e.g. 400g, 1L, 100g" : "e.g. 500mg, 10ml")}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Packaging / Form (වර්ගය)</label>
                <select
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm bg-white"
                >
                  {isBookshop ? (
                    <>
                      <option value="Book">Book (CR/අභ්‍යාස පොත්)</option>
                      <option value="Piece">Piece / Item (පෑන්/උපකරණ)</option>
                      <option value="Pack">Pack / Packet (පැකට්)</option>
                      <option value="Box">Box (පෙට්ටි)</option>
                      <option value="Ream">Ream (කඩදාසි රීම්)</option>
                      <option value="Bundle">Bundle (මිටි)</option>
                      <option value="Set">Set (කට්ටල)</option>
                      <option value="Roll">Roll (ටේප්/රෝල්)</option>
                    </>
                  ) : isGrocery ? (
                    <>
                      <option value="Pack">Pack / Packet (පැකට්)</option>
                      <option value="Bottle">Bottle / Tin / Can (බෝතල්/ටින්)</option>
                      <option value="Bar">Bar / Piece / Cake (කෑලි/සබන්)</option>
                      <option value="Box">Box / Carton (පෙට්ටි)</option>
                      <option value="Piece">Piece / Item (තනි භාණ්ඩ)</option>
                    </>
                  ) : (
                    <>
                      <option value="Tablet">Tablet (පෙති)</option>
                      <option value="Capsule">Capsule (කරල්)</option>
                      <option value="Syrup">Syrup / Liquid (පැණි/ද්‍රාවණ)</option>
                      <option value="Injection">Injection (එන්නත්)</option>
                      <option value="Ointment">Ointment / Cream (ආලේපන)</option>
                      <option value="Drops">Eye/Ear Drops (බිංදු)</option>
                      <option value="Device">Medical Device / Strip</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batch / Lot No (කාණ්ඩ අංකය) *</label>
              <input
                type="text"
                name="batch_no"
                value={formData.batch_no}
                onChange={handleChange}
                placeholder={isBookshop ? "e.g. BK-4012" : (isGrocery ? "e.g. GR-4521" : "e.g. BT-9812")}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-mono"
              />
            </div>

            {/* Barcode */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Barcode / QR Code (බාර්කෝඩ්)</label>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan via Camera</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Scan barcode or enter manually"
                  className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  title="Scan with Camera"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buying & Selling Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className={`w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-bold ${
                    isBookshop ? 'text-sky-700' : (isGrocery ? 'text-amber-700' : 'text-indigo-700')
                  }`}
                />
              </div>
            </div>

            {/* Stock Quantity & Reorder Alert */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity (ප්‍රමාණය) *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Alert Level</label>
                <input
                  type="number"
                  name="min_stock_alert"
                  value={formData.min_stock_alert}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (කල් ඉකුත්වීමේ දිනය) *</label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Dealer (සැපයුම්කරු)</label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm bg-white"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Shelf Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rack / Shelf Location (රාක්කය)</label>
              <input
                type="text"
                name="rack_location"
                value={formData.rack_location}
                onChange={handleChange}
                placeholder={isBookshop ? "e.g. Book Rack A, Stationery Shelf" : (isGrocery ? "e.g. Grocery Shelf 1, Cooler" : "e.g. Rack A-1, Fridge")}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
              />
            </div>

            {/* Prescription Requirement (Only shown for medicines) */}
            {!isGrocery && !isBookshop && (
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    name="requires_prescription"
                    checked={formData.requires_prescription === 1}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  Requires Doctor's Prescription (වෛද්‍ය නිර්දේශය අවශ්‍යයි)
                </label>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                isBookshop
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
                  : (isGrocery 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30')
              }`}
            >
              <Save className="w-4 h-4" />
              {loading 
                ? 'Saving...' 
                : (medicineToEdit 
                    ? (isBookshop ? 'Update Book / Stationery' : (isGrocery ? 'Update Grocery Item' : 'Update Medicine')) 
                    : (isBookshop ? 'Save Book / Stationery (සුරකින්න)' : (isGrocery ? 'Save Grocery Item (භාණ්ඩය සුරකින්න)' : 'Save Medicine (ඖෂධය සුරකින්න)')))}
            </button>
          </div>
        </form>

      </div>

      {/* Camera QR & Barcode Scanner for Intake */}
      {isCameraOpen && (
        <CameraScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={(code) => {
            setFormData(prev => ({ ...prev, barcode: code }));
            setIsCameraOpen(false);
          }}
        />
      )}
    </div>
  );
}
