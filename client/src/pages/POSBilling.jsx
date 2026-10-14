import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  RotateCcw, 
  User, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Tag,
  CreditCard,
  Banknote,
  DollarSign,
  UserPlus,
  Percent,
  Sparkles,
  Zap,
  Check,
  Calculator,
  Camera,
  QrCode
} from 'lucide-react';
import { api, formatCurrency } from '../api';
import ReceiptModal from '../components/ReceiptModal';
import CameraScannerModal from '../components/CameraScannerModal';
import { playScannerBeep } from '../utils/scannerSound';

export default function POSBilling({ medicines = [], customers = [], doctors = [], currentUser, onRefreshData, t }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  
  // Overall bill discount
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  
  // Customer & Doctor inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [customDoctorName, setCustomDoctorName] = useState('');
  
  // Numpad Calculator Toggle
  const [showCalculator, setShowCalculator] = useState(false);

  const [completedSale, setCompletedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // QR & Barcode Scanner States
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState(null);

  const searchInputRef = useRef(null);

  // Auto focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter medicines
  const filteredMedicines = medicines.filter(med => {
    const term = searchTerm.toLowerCase();
    const matchQuery = (
      med.name?.toLowerCase().includes(term) ||
      med.generic_name?.toLowerCase().includes(term) ||
      (med.barcode && med.barcode.includes(term))
    );
    const matchCat = selectedCategory === 'All' || med.category === selectedCategory || med.category_name === selectedCategory;
    return matchQuery && matchCat;
  });

  // Unique categories
  const categories = ['All', ...new Set(medicines.map(m => m.category || m.category_name || 'General'))];

  // ==================== CART ACTIONS ====================

  const addToCart = (med) => {
    if (med.stock_quantity <= 0) {
      setError(`"${med.name}" තොග අවසන්ව ඇත (Out of stock)`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock_quantity) {
          setError(`Cannot add more than available stock (${med.stock_quantity})`);
          return prev;
        }
        const newQty = existing.quantity + 1;
        const gross = newQty * existing.unit_price;
        const discAmt = existing.discount_type === 'percent' 
          ? (gross * (existing.discount_val / 100)) 
          : existing.discount_val;
        return prev.map(item => 
          item.medicine_id === med.id 
            ? { 
                ...item, 
                quantity: newQty, 
                gross_total: gross,
                discount_amount: Math.min(gross, discAmt),
                subtotal: Math.max(0, gross - discAmt)
              }
            : item
        );
      } else {
        const gross = Number(med.selling_price || 0);
        return [
          ...prev,
          {
            medicine_id: med.id,
            medicine_name: med.name,
            dosage: med.dosage || '',
            batch_no: med.batch_no || med.batch_number || '',
            unit_price: Number(med.selling_price || 0),
            cost_price: Number(med.cost_price || 0),
            quantity: 1,
            max_stock: med.stock_quantity,
            discount_type: 'percent', // 'percent' or 'amount'
            discount_val: 0,
            discount_amount: 0,
            gross_total: gross,
            subtotal: gross
          }
        ];
      }
    });
    setError('');
  };

  const triggerScanAlert = (message, type = 'success') => {
    setScanToast({ message, type });
    playScannerBeep(type);
    setTimeout(() => {
      setScanToast(null);
    }, 3000);
  };

  const handleBarcodeOrQrScan = (rawCode) => {
    if (!rawCode) return;
    const code = String(rawCode).trim();
    if (!code) return;

    // 1. Check for JSON format (Prescription QR / Digital Item QR)
    if ((code.startsWith('{') && code.endsWith('}')) || (code.startsWith('[') && code.endsWith(']'))) {
      try {
        const parsed = JSON.parse(code);
        
        // Customer or Doctor in QR
        if (parsed.customer || parsed.patient) {
          setCustomCustomerName(parsed.customer || parsed.patient);
        }
        if (parsed.doctor) {
          setCustomDoctorName(parsed.doctor);
        }

        // Items in QR
        const itemsToScan = Array.isArray(parsed.items) 
          ? parsed.items 
          : (parsed.barcode || parsed.id || parsed.sku ? [parsed] : []);

        if (itemsToScan.length > 0) {
          let addedCount = 0;
          itemsToScan.forEach(itemObj => {
            const itemCode = String(itemObj.barcode || itemObj.id || itemObj.code || itemObj).trim();
            const found = medicines.find(m => 
              (m.barcode && m.barcode.toLowerCase() === itemCode.toLowerCase()) ||
              String(m.id) === itemCode ||
              m.name.toLowerCase() === itemCode.toLowerCase()
            );
            if (found && found.stock_quantity > 0) {
              const qtyToAdd = Number(itemObj.quantity || itemObj.qty || 1);
              for (let i = 0; i < qtyToAdd; i++) {
                addToCart(found);
              }
              addedCount++;
            }
          });

          if (addedCount > 0) {
            triggerScanAlert(`ඩිජිටල් QR එකෙන් අයිතම ${addedCount} ක් බිල්පතට ඇතුළත් විය!`, 'success');
            setSearchTerm('');
            return;
          }
        }
      } catch (e) {
        // Fall through to plain text match
      }
    }

    // 2. Direct Item Lookup:
    // a) By exact barcode
    const barcodeMatch = medicines.find(m => 
      m.barcode && m.barcode.trim().toLowerCase() === code.toLowerCase()
    );

    // b) By exact ID or batch number
    const idOrBatchMatch = !barcodeMatch && medicines.find(m => 
      String(m.id) === code || 
      (m.batch_no && m.batch_no.trim().toLowerCase() === code.toLowerCase())
    );

    // c) By exact name / generic name
    const nameMatch = !barcodeMatch && !idOrBatchMatch && medicines.find(m => 
      m.name.trim().toLowerCase() === code.toLowerCase() ||
      (m.generic_name && m.generic_name.trim().toLowerCase() === code.toLowerCase())
    );

    const targetItem = barcodeMatch || idOrBatchMatch || nameMatch;

    if (targetItem) {
      if (targetItem.stock_quantity <= 0) {
        triggerScanAlert(`"${targetItem.name}" තොග අවසන්ව ඇත (Out of stock)`, 'error');
        return;
      }
      addToCart(targetItem);
      triggerScanAlert(`✅ "${targetItem.name}" ස්කෑන් කර බිල්පතට එකතු විය!`, 'success');
      setSearchTerm('');
    } else {
      // Check partial match if single result
      const matches = medicines.filter(m => 
        m.name?.toLowerCase().includes(code.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(code.toLowerCase()) ||
        (m.barcode && m.barcode.includes(code))
      );

      if (matches.length === 1 && matches[0].stock_quantity > 0) {
        addToCart(matches[0]);
        triggerScanAlert(`✅ "${matches[0].name}" බිල්පතට එකතු විය!`, 'success');
        setSearchTerm('');
      } else {
        triggerScanAlert(`"${code}" කේතය සඳහා කිසිදු භාණ්ඩයක් හමු නොවීය! (Item not found)`, 'error');
      }
    }
  };

  // Keyboard wedge listener for handheld barcode scanner guns
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      const isSearchInput = document.activeElement === searchInputRef.current;

      if (isSearchInput) return; // Handled directly by input onKeyDown

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2 && timeDiff < 100) {
          e.preventDefault();
          handleBarcodeOrQrScan(buffer);
          buffer = '';
        } else {
          buffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timeDiff > 120) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [medicines]);

  const updateQuantity = (medId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(medId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.medicine_id === medId) {
        if (newQty > item.max_stock) {
          setError(`Stock limited to ${item.max_stock} units for ${item.medicine_name}`);
          return item;
        }
        const gross = newQty * item.unit_price;
        const discAmt = item.discount_type === 'percent' 
          ? (gross * (item.discount_val / 100)) 
          : item.discount_val;
        return {
          ...item,
          quantity: newQty,
          gross_total: gross,
          discount_amount: Math.min(gross, discAmt),
          subtotal: Math.max(0, gross - discAmt)
        };
      }
      return item;
    }));
    setError('');
  };

  // Specific Item Discount Handler
  const updateItemDiscount = (medId, val, type = 'percent') => {
    const numVal = Math.max(0, Number(val) || 0);
    setCart(prev => prev.map(item => {
      if (item.medicine_id === medId) {
        const gross = item.quantity * item.unit_price;
        let discAmt = 0;
        if (type === 'percent') {
          const clampedPercent = Math.min(100, numVal);
          discAmt = Math.round((gross * (clampedPercent / 100)) * 100) / 100;
          return {
            ...item,
            discount_type: 'percent',
            discount_val: clampedPercent,
            discount_amount: discAmt,
            subtotal: Math.max(0, gross - discAmt)
          };
        } else {
          discAmt = Math.min(gross, numVal);
          return {
            ...item,
            discount_type: 'amount',
            discount_val: discAmt,
            discount_amount: discAmt,
            subtotal: Math.max(0, gross - discAmt)
          };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (medId) => {
    setCart(prev => prev.filter(item => item.medicine_id !== medId));
  };

  const clearCart = () => {
    setCart([]);
    setError('');
    setCashTendered('');
    setCardLast4('');
    setDiscountPercent(0);
    setCustomCustomerName('');
    setSelectedCustomerId('');
    setCustomDoctorName('');
    setSelectedDoctorId('');
  };

  // ==================== FINANCIAL CALCULATIONS ====================

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.gross_total || (item.unit_price * item.quantity)), 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  const postItemSubtotal = Math.max(0, rawSubtotal - totalItemDiscounts);

  // Overall bill extra discount
  const extraBillDiscount = Math.round((postItemSubtotal * (Number(discountPercent || 0) / 100)) * 100) / 100;
  const totalAllDiscounts = totalItemDiscounts + extraBillDiscount;

  const grandTotal = Math.max(0, Math.round((rawSubtotal - totalAllDiscounts) * 100) / 100);
  
  // Real-time Tendered and Change calculations
  const tendered = paymentMethod === 'Card' ? grandTotal : (cashTendered !== '' ? Number(cashTendered) : 0);
  const changeDue = paymentMethod === 'Card' ? 0 : (tendered >= grandTotal ? Math.round((tendered - grandTotal) * 100) / 100 : 0);
  const shortAmount = paymentMethod === 'Cash' && cashTendered !== '' && tendered < grandTotal ? Math.round((grandTotal - tendered) * 100) / 100 : 0;

  // ==================== CALCULATOR & NUMPAD ACTIONS ====================

  const handleCalcDigit = (digit) => {
    if (digit === '.' && cashTendered.includes('.')) return;
    setCashTendered(prev => (prev === '0' && digit !== '.' ? digit : prev + digit));
  };

  const handleCalcBackspace = () => {
    setCashTendered(prev => prev.slice(0, -1));
  };

  const handleCalcClear = () => {
    setCashTendered('');
  };

  const handleCalcAddAmount = (amt) => {
    const curr = Number(cashTendered) || 0;
    setCashTendered((curr + amt).toString());
  };

  // ==================== CHECKOUT SUBMISSION ====================

  const handleCheckout = async () => {
    if (!cart.length) {
      setError('බිල්පත හිස්ව පවතී. පළමුව ඖෂධ එකතු කරන්න. (Cart is empty)');
      return;
    }

    const effectiveTendered = paymentMethod === 'Card' 
      ? grandTotal 
      : (cashTendered !== '' ? Number(cashTendered) : grandTotal);

    if (paymentMethod === 'Cash' && cashTendered !== '' && effectiveTendered < grandTotal) {
      setError(`දුන් මුදල (${formatCurrency(effectiveTendered)}) ශුද්ධ මුදලට (${formatCurrency(grandTotal)}) වඩා අඩුය! තවත් ${formatCurrency(grandTotal - effectiveTendered)} ක් අවශ්‍යයි.`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const customerObj = customers.find(c => String(c.id) === String(selectedCustomerId));
      const doctorObj = doctors.find(d => String(d.id) === String(selectedDoctorId));
      const customerName = customCustomerName.trim() || customerObj?.name || 'Walk-in Customer';
      const doctorName = customDoctorName.trim() || doctorObj?.name || '';

      const salePayload = {
        customer_id: selectedCustomerId ? String(selectedCustomerId) : null,
        doctor_id: selectedDoctorId ? String(selectedDoctorId) : null,
        customer_name: customerName,
        doctor_name: doctorName,
        cashier_name: currentUser?.name || 'Cashier Staff',
        subtotal: Number(rawSubtotal.toFixed(2)) || 0,
        discount: Number(totalAllDiscounts.toFixed(2)) || 0,
        total_amount: Number(grandTotal.toFixed(2)) || 0,
        paid_amount: Number(effectiveTendered.toFixed(2)),
        change_amount: paymentMethod === 'Card' ? 0 : Math.max(0, Number((effectiveTendered - grandTotal).toFixed(2))),
        payment_method: paymentMethod,
        card_last4: paymentMethod === 'Card' ? cardLast4 : null,
        items: cart.map(item => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          batch_number: item.batch_no || '',
          unit_price: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 1,
          discount_amount: Number(item.discount_amount || 0),
          total_price: Number(item.subtotal) || 0
        }))
      };

      const result = await api.createSale(salePayload);
      setCompletedSale({ 
        ...salePayload, 
        ...(result || {}), 
        paid_amount: salePayload.paid_amount, 
        change_amount: salePayload.change_amount 
      });
      clearCart();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-12">
      
      {/* ==================== LEFT 7 COLS: Medicine Catalog ==================== */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search Bar & Categories Header */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          
          {/* Real-time Scan Notification Toast */}
          {scanToast && (
            <div className={`p-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-in slide-in-from-top-2 duration-200 ${
              scanToast.type === 'error' 
                ? 'bg-rose-600 text-white shadow-rose-600/30' 
                : 'bg-emerald-600 text-white shadow-emerald-600/30'
            }`}>
              <div className="flex items-center gap-2">
                {scanToast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                <span>{scanToast.message}</span>
              </div>
              <button 
                onClick={() => setScanToast(null)} 
                className="text-white/80 hover:text-white text-xs font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchTerm.trim()) {
                      handleBarcodeOrQrScan(searchTerm);
                    }
                  }
                }}
                placeholder="ඖෂධ, Grocery, පොත්පත් හෝ Barcode / QR ස්කෑන් කරන්න (Type or Scan Barcode/QR)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Clear Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            {/* Camera QR & Barcode Scanner Button */}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              title="Open Webcam / Camera Scanner for QR & Barcodes"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Camera Scan (QR)</span>
            </button>
          </div>

          {/* Quick Hardware Scanner status pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Handheld USB / Bluetooth Scanner Gun Ready (කවුන්ටර ස්කෑනරය සක්‍රියයි)</span>
            </span>
            <span className="hidden md:inline text-[10px] text-slate-400">
              Press Enter or Scan Gun to instant add
            </span>
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Medicine Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredMedicines.length === 0 ? (
            <div className="col-span-2 py-16 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
              <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">ගැලපෙන භාණ්ඩ කිසිවක් හමු නොවීය</p>
              <p className="text-xs text-slate-400">No items found matching "{searchTerm}"</p>
            </div>
          ) : (
            filteredMedicines.map((med) => {
              const isOut = (med.stock_quantity || 0) <= 0;
              const isLow = !isOut && (med.stock_quantity || 0) <= (med.reorder_level || med.min_stock_alert || 10);
              const price = Number(med.selling_price || 0);
              const isB = (med.category && (med.category.includes('Book') || med.category.includes('Stationery'))) ||
                          med.form === 'Book' || med.form === 'Ream' || med.batch_no?.startsWith('BK-');
              const isG = !isB && (med.category === 'Grocery & Essentials' || 
                          med.category === 'Personal Care & Hygiene' ||
                          ['Pack', 'Bottle', 'Bar', 'Box', 'Piece'].includes(med.form));

              return (
                <div
                  key={med.id || med._id}
                  onClick={() => !isOut && addToCart(med)}
                  className={`p-4 rounded-3xl border transition-all select-none cursor-pointer group relative overflow-hidden ${
                    isOut 
                      ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed' 
                      : `bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 ${
                          isB 
                            ? 'hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10' 
                            : isG 
                              ? 'hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10' 
                              : 'hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'
                        } active:scale-[0.98]`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-extrabold text-slate-900 dark:text-white text-sm leading-tight transition-colors truncate ${
                        isB ? 'group-hover:text-sky-600' : (isG ? 'group-hover:text-amber-600' : 'group-hover:text-indigo-600')
                      }`}>
                        {med.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                        {med.generic_name || 'Generic'} • {med.dosage || 'General'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                      isB 
                        ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300' 
                        : (isG 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300')
                    }`}>
                      {med.category || (isB ? 'Bookshop' : (isG ? 'Grocery' : 'Medicine'))}
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Price (මිල)</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(price)}
                      </span>
                    </div>

                    <div className="text-right">
                      {isOut ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          Low: {med.stock_quantity} left
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Stock: <span className={`${
                            isB ? 'text-sky-600 dark:text-sky-400' : (isG ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400')
                          } font-extrabold`}>{med.stock_quantity}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ==================== RIGHT 5 COLS: Modern Smart Cart ==================== */}
      <div className="lg:col-span-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-5 flex flex-col sticky top-4">
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">කවුන්ටරය (Billing Cart)</h3>
              <p className="text-xs text-slate-400 font-medium">{cart.length} items in current bill</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-bold py-1 px-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {/* ==================== CUSTOMER & DOCTOR SECTION ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          
          {/* Customer Input & Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-500" />
                Customer (පාරිභෝගිකයා)
              </label>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId('');
                  setCustomCustomerName('Walk-in Customer');
                }}
                className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                + Walk-in
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customCustomerName}
                onChange={(e) => {
                  setCustomCustomerName(e.target.value);
                  setSelectedCustomerId('');
                }}
                placeholder="Walk-in Customer"
                className="flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {customers.length > 0 && (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCustomerId(cId);
                    if (cId) {
                      const c = customers.find(x => String(x.id) === String(cId));
                      if (c) setCustomCustomerName(c.name);
                    }
                  }}
                  className="w-7 px-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  title="Select from saved customers"
                >
                  <option value="">▼</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Doctor Input & Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-sky-500" />
                Doctor (වෛද්‍යවරයා)
              </label>
              <button
                type="button"
                onClick={() => {
                  setSelectedDoctorId('');
                  setCustomDoctorName('');
                }}
                className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear (OTC)
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customDoctorName}
                onChange={(e) => {
                  setCustomDoctorName(e.target.value);
                  setSelectedDoctorId('');
                }}
                placeholder="Prescribing Dr / OTC"
                className="flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {doctors.length > 0 && (
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    const dId = e.target.value;
                    setSelectedDoctorId(dId);
                    if (dId) {
                      const d = doctors.find(x => String(x.id) === String(dId));
                      if (d) setCustomDoctorName(d.name);
                    }
                  }}
                  className="w-7 px-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  title="Select from saved doctors"
                >
                  <option value="">▼</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} {d.slmc_reg_no ? `(${d.slmc_reg_no})` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

        </div>

        {/* Error Notification */}
        {error && (
          <div className="my-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 my-2 pr-1 max-h-[220px] min-h-[120px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <ShoppingCart className="w-9 h-9 stroke-1 mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-500">බිල්පත හිස්ව පවතී (Cart is empty)</p>
              <p className="text-[11px] text-slate-400">වම් පසින් භාණ්ඩ ක්ලික් කර එක් කරන්න</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.medicine_id} className="py-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {item.medicine_name}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      @{formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
                      className="p-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 shadow-xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-black text-xs text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
                      className="p-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Subtotal & Delete */}
                  <div className="text-right w-20">
                    <p className="font-black text-xs text-slate-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.medicine_id)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Individual Item Discount Controls */}
                <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-1 rounded-xl text-[10px]">
                  <Tag className="w-3 h-3 text-indigo-600" />
                  <span className="font-bold text-slate-600 dark:text-slate-300">Item Disc:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={item.discount_val || ''}
                    onChange={(e) => updateItemDiscount(item.medicine_id, e.target.value, item.discount_type)}
                    className="w-12 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                  />
                  <button
                    onClick={() => updateItemDiscount(item.medicine_id, item.discount_val, item.discount_type === 'percent' ? 'amount' : 'percent')}
                    className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold cursor-pointer"
                  >
                    {item.discount_type === 'percent' ? '%' : 'Rs.'}
                  </button>
                  {item.discount_amount > 0 && (
                    <span className="ml-auto font-bold text-rose-600">
                      -Rs.{item.discount_amount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ==================== BILL TOTALS & DISCOUNTS ==================== */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          
          {/* Subtotal */}
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Subtotal (දළ එකතුව):</span>
            <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(rawSubtotal)}</span>
          </div>

          {/* Overall Bill Extra Discount */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-indigo-600" />
              Overall Bill Discount:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                placeholder="0"
                className="w-14 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold text-xs"
              />
              <span className="font-bold text-slate-500">%</span>
            </div>
          </div>

          {/* Total Savings Pill (if discount applied) */}
          {totalAllDiscounts > 0 && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
              <span className="text-[11px] font-extrabold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Customer Savings (වට්ටම්):
              </span>
              <span className="text-xs font-black text-rose-600">
                -{formatCurrency(totalAllDiscounts)}
              </span>
            </div>
          )}

          {/* NET GRAND TOTAL */}
          <div className="flex justify-between items-center py-2.5 px-3.5 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
            <div>
              <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wider block">Net Payable</span>
              <span className="text-base font-extrabold">ශුද්ධ මුදල</span>
            </div>
            <span className="text-2xl font-black text-sky-400 font-mono">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['Cash', 'Card', 'Credit'].map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentMethod(pm)}
                className={`py-1.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === pm
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {pm === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                {pm === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                {pm === 'Credit' && <FileText className="w-3.5 h-3.5" />}
                <span>{pm}</span>
              </button>
            ))}
          </div>

          {/* Card Payment Info Box (Card Mode) */}
          {paymentMethod === 'Card' && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Card Payment (කාඩ්පත් ගෙවීම)
                </span>
                <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-lg">
                  Exact: {formatCurrency(grandTotal)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Card Last 4 Digits (අවසාන අංක 4):
                </span>
                <input
                  type="text"
                  maxLength="4"
                  placeholder="e.g. 4242 (Optional)"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                  className="w-32 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-center text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                * ස්වයංක්‍රීයව ශුද්ධ මුදලට සමාන මුදලක් ගෙවූ බව සටහන් වේ. ඉතිරි මුදලක් ගණනය නොවේ.
              </p>
            </div>
          )}

          {/* ==================== CASH TENDER & INTERACTIVE CALCULATOR ==================== */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              
              {/* Tender Header & Calculator Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-indigo-500" />
                  Tendered (දුන් මුදල):
                </span>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                    showCalculator 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{showCalculator ? 'Hide Numpad' : '🧮 POS Calculator'}</span>
                </button>
              </div>

              {/* Tender Input Box */}
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={grandTotal > 0 ? grandTotal.toFixed(2) : "0.00"}
                  className="w-full pl-8 pr-16 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rs.
                </span>
                {cashTendered && (
                  <button
                    type="button"
                    onClick={() => setCashTendered('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Cash Note Denomination Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCashTendered(grandTotal.toFixed(2))}
                  className="px-2.5 py-1.5 bg-indigo-100 dark:bg-indigo-950/70 hover:bg-indigo-200 text-indigo-900 dark:text-indigo-200 text-[11px] font-black rounded-xl cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
                  title="Exact Cash Amount"
                >
                  Exact (නියම)
                </button>
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt.toString())}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-xl cursor-pointer whitespace-nowrap border border-slate-200 dark:border-slate-700 active:scale-95"
                  >
                    Rs.{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Interactive POS Numpad Calculator (Collapsible / Toggleable) */}
              {showCalculator && (
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner animate-in fade-in zoom-in-95 duration-100 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('7')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      7
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('8')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      8
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('9')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      9
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcAddAmount(100)}
                      className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold shadow-xs hover:bg-indigo-100 active:scale-95"
                    >
                      +100
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCalcDigit('4')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      4
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('5')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('6')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      6
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcAddAmount(500)}
                      className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold shadow-xs hover:bg-indigo-100 active:scale-95"
                    >
                      +500
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCalcDigit('1')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('2')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('3')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      3
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcAddAmount(1000)}
                      className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold shadow-xs hover:bg-indigo-100 active:scale-95"
                    >
                      +1000
                    </button>

                    <button
                      type="button"
                      onClick={handleCalcClear}
                      className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl font-bold shadow-xs hover:bg-rose-200 active:scale-95"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('0')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcDigit('.')}
                      className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-800 dark:text-white shadow-xs hover:bg-indigo-50 active:scale-95"
                    >
                      .
                    </button>
                    <button
                      type="button"
                      onClick={handleCalcBackspace}
                      className="p-2.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold shadow-xs hover:bg-slate-300 active:scale-95"
                      title="Backspace"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Change Due OR Short Amount Display */}
              {cashTendered !== '' && (
                <>
                  {tendered >= grandTotal && grandTotal > 0 && (
                    <div className="flex justify-between items-center px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-black shadow-xs animate-in fade-in">
                      <span className="text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Change Due (ඉතිරි මුදල):
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-300 text-base font-black font-mono">
                        {formatCurrency(changeDue)}
                      </span>
                    </div>
                  )}

                  {tendered < grandTotal && (
                    <div className="flex justify-between items-center px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-black shadow-xs animate-in fade-in">
                      <span className="text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Short / Due (තවත් අවශ්‍යයි):
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 text-base font-black font-mono">
                        {formatCurrency(shortAmount)}
                      </span>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {/* Checkout Submit Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <Printer className="w-4 h-4" />
            {loading ? 'බිල්පත නිකුත් වෙමින් පවතී...' : `බිල්පත මුද්‍රණය කරන්න (Print Bill) • ${formatCurrency(grandTotal)}`}
          </button>
        </div>

      </div>

      {/* ==================== COMPLETED RECEIPT MODAL ==================== */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* ==================== CAMERA QR & BARCODE SCANNER ==================== */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleBarcodeOrQrScan}
      />

    </div>
  );
}
