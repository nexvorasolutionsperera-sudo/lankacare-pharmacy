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
  Check
} from 'lucide-react';
import { api, formatCurrency } from '../api';
import ReceiptModal from '../components/ReceiptModal';

export default function POSBilling({ medicines = [], customers = [], doctors = [], onRefreshData, t }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  
  // Overall bill discount
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  
  const [completedSale, setCompletedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setDiscountPercent(0);
  };

  // ==================== FINANCIAL CALCULATIONS ====================

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.gross_total || (item.unit_price * item.quantity)), 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  const postItemSubtotal = Math.max(0, rawSubtotal - totalItemDiscounts);

  // Overall bill extra discount
  const extraBillDiscount = Math.round((postItemSubtotal * (Number(discountPercent || 0) / 100)) * 100) / 100;
  const totalAllDiscounts = totalItemDiscounts + extraBillDiscount;

  const grandTotal = Math.max(0, rawSubtotal - totalAllDiscounts);
  const tendered = Number(cashTendered) || 0;
  const changeDue = tendered >= grandTotal ? (tendered - grandTotal) : 0;

  // Quick Tender buttons
  const quickTenderAmounts = [100, 500, 1000, 2000, 5000];

  // ==================== CHECKOUT SUBMISSION ====================

  const handleCheckout = async () => {
    if (!cart.length) {
      setError('බිල්පත හිස්ව පවතී. පළමුව ඖෂධ එකතු කරන්න. (Cart is empty)');
      return;
    }

    if (paymentMethod === 'Cash' && cashTendered && tendered < grandTotal) {
      setError(`දුන් මුදල (${formatCurrency(tendered)}) ශුද්ධ මුදලට (${formatCurrency(grandTotal)}) වඩා අඩුය!`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const customerObj = customers.find(c => String(c.id) === String(selectedCustomerId));
      const doctorObj = doctors.find(d => String(d.id) === String(selectedDoctorId));
      const customerName = customCustomerName.trim() || customerObj?.name || 'Walk-in Customer';

      const salePayload = {
        customer_id: selectedCustomerId ? String(selectedCustomerId) : null,
        doctor_id: selectedDoctorId ? String(selectedDoctorId) : null,
        customer_name: customerName,
        doctor_name: doctorObj ? doctorObj.name : '',
        cashier_name: 'Cashier Staff',
        subtotal: Number(rawSubtotal) || 0,
        discount: Number(totalAllDiscounts) || 0,
        total_amount: Number(grandTotal) || 0,
        paid_amount: tendered > 0 ? tendered : grandTotal,
        change_amount: changeDue,
        payment_method: paymentMethod,
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
      setCompletedSale(result);
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
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ඖෂධ නම, Generic නම හෝ කේතය සොයන්න (Search Medicine)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
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
              <p className="text-sm font-bold text-slate-500">ගැලපෙන ඖෂධ කිසිවක් හමු නොවීය</p>
              <p className="text-xs text-slate-400">No medicines found matching "{searchTerm}"</p>
            </div>
          ) : (
            filteredMedicines.map((med) => {
              const isOut = (med.stock_quantity || 0) <= 0;
              const isLow = !isOut && (med.stock_quantity || 0) <= (med.reorder_level || med.min_stock_alert || 10);
              const price = Number(med.selling_price || 0);

              return (
                <div
                  key={med.id || med._id}
                  onClick={() => !isOut && addToCart(med)}
                  className={`p-4 rounded-3xl border transition-all select-none cursor-pointer group relative overflow-hidden ${
                    isOut 
                      ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-emerald-600 transition-colors truncate">
                        {med.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                        {med.generic_name || 'Generic'} • {med.dosage || 'General'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {med.category || 'Med'}
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
                          Stock: <span className="text-emerald-600 font-extrabold">{med.stock_quantity}</span>
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
      <div className="lg:col-span-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-5 flex flex-col sticky top-20">
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-500/20">
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

        {/* Customer & Doctor Quick Linkers */}
        <div className="grid grid-cols-2 gap-2 pt-3 pb-2">
          {/* Customer select / name */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Customer (පාරිභෝගිකයා)
            </label>
            <input
              type="text"
              value={customCustomerName}
              onChange={(e) => setCustomCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Doctor select */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Doctor (වෛද්‍යවරයා)
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">No Prescription / OTC</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
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
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 my-2 pr-1 max-h-[220px] min-h-[140px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <ShoppingCart className="w-9 h-9 stroke-1 mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-500">බිල්පත හිස්ව පවතී (Cart is empty)</p>
              <p className="text-[11px] text-slate-400">වම් පසින් ඖෂධ ක්ලික් කර එක් කරන්න</p>
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

                {/* Individual Item Discount Controls (New Feature!) */}
                <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-xl text-[10px]">
                  <Tag className="w-3 h-3 text-emerald-600" />
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
                    className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold cursor-pointer"
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
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
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
            <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Customer Savings (වට්ටම්):
              </span>
              <span className="text-xs font-black text-rose-600">
                -{formatCurrency(totalAllDiscounts)}
              </span>
            </div>
          )}

          {/* NET GRAND TOTAL */}
          <div className="flex justify-between items-center py-2 px-3 rounded-2xl bg-slate-900 text-white shadow-md">
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Net Payable</span>
              <span className="text-base font-extrabold">ශුද්ධ මුදල</span>
            </div>
            <span className="text-2xl font-black text-emerald-400">
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
                    ? 'bg-emerald-600 text-white shadow-sm'
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

          {/* Cash Tender Input & Quick Amounts (Cash Mode Only) */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Tendered (දුන් මුදල):
                </span>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={grandTotal.toString()}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCashTendered(grandTotal.toString())}
                  className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Exact
                </button>
                {quickTenderAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt.toString())}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Rs.{amt}
                  </button>
                ))}
              </div>

              {/* Change Returned */}
              {tendered >= grandTotal && grandTotal > 0 && (
                <div className="flex justify-between items-center px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">Change Due (ඉතිරි මුදල):</span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Checkout Submit Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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

    </div>
  );
}
