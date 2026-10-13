import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  User, 
  Stethoscope, 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  QrCode, 
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import ReceiptModal from '../components/ReceiptModal';

export default function POSBilling({ medicines, customers, doctors, onRefreshData, t }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  
  // Sale form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [cashTendered, setCashTendered] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedSale, setCompletedSale] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    // Focus search on load
    searchInputRef.current?.focus();
  }, []);

  // Filter medicines by search input
  const filteredMedicines = medicines.filter(m => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      m.name.toLowerCase().includes(term) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(term)) ||
      (m.barcode && m.barcode.toLowerCase().includes(term)) ||
      (m.batch_no && m.batch_no.toLowerCase().includes(term))
    );
  });

  const addToCart = (med) => {
    if (med.stock_quantity <= 0) {
      setError(`"${med.name}" is out of stock!`);
      return;
    }

    // Check if expired
    const today = new Date().toISOString().split('T')[0];
    if (med.expiry_date < today) {
      if (!confirm(`Warning: "${med.name}" expired on ${med.expiry_date}! Are you sure you want to add it?`)) {
        return;
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock_quantity) {
          setError(`Cannot add more than available stock (${med.stock_quantity})`);
          return prev;
        }
        return prev.map(item => 
          item.medicine_id === med.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicine_id: med.id,
            medicine_name: med.name,
            dosage: med.dosage,
            batch_no: med.batch_no,
            unit_price: Number(med.selling_price),
            cost_price: Number(med.cost_price),
            quantity: 1,
            max_stock: med.stock_quantity,
            subtotal: Number(med.selling_price)
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
          setError(`Stock limited to ${item.max_stock} units`);
          return item;
        }
        return {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.unit_price
        };
      }
      return item;
    }));
    setError('');
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

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = Math.round((subtotal * (Number(discountPercent) / 100)) * 100) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  
  const tendered = Number(cashTendered) || 0;
  const changeDue = tendered >= grandTotal ? (tendered - grandTotal) : 0;

  const handleCheckout = async () => {
    if (!cart.length) {
      setError('Cart is empty. Add medicines first.');
      return;
    }

    if (paymentMethod === 'Cash' && cashTendered && tendered < grandTotal) {
      setError(`Cash tendered (${formatCurrency(tendered)}) is less than total amount (${formatCurrency(grandTotal)})`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const customerObj = customers.find(c => String(c.id) === String(selectedCustomerId));
      const customerName = customCustomerName.trim() || customerObj?.name || 'Walk-in Customer';

      const salePayload = {
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        doctor_id: selectedDoctorId ? Number(selectedDoctorId) : null,
        customer_name: customerName,
        items: cart,
        discount_percent: Number(discountPercent) || 0,
        tax_amount: 0,
        paid_amount: tendered > 0 ? tendered : grandTotal,
        payment_method: paymentMethod,
        notes: ''
      };

      const result = await api.createSale(salePayload);
      setCompletedSale(result);
      clearCart();
      onRefreshData();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT 7 COLS: Product Search & Medicine Catalog */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicine by name, generic name, barcode (F2)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Clear
            </button>
          )}
        </div>

        {/* Medicine Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredMedicines.map((med) => {
            const isOut = med.stock_quantity <= 0;
            const isLow = med.stock_quantity > 0 && med.stock_quantity <= med.min_stock_alert;
            const isExpired = med.days_to_expiry <= 0;
            const isExpiringSoon = med.days_to_expiry > 0 && med.days_to_expiry <= 60;

            return (
              <div
                key={med.id}
                onClick={() => !isOut && addToCart(med)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isOut 
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' 
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-98'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{med.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{med.generic_name || 'No generic'} • {med.dosage}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                    {med.form}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-base font-black text-emerald-700">
                      {formatCurrency(med.selling_price)}
                    </p>
                    <p className="text-[10px] text-slate-400">Batch: {med.batch_no}</p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isOut 
                        ? 'bg-rose-100 text-rose-800' 
                        : isLow 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isOut ? 'Out of Stock' : `${med.stock_quantity} in stock`}
                    </span>

                    {/* Expiry Badge */}
                    {isExpired && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">Expired!</p>
                    )}
                    {isExpiringSoon && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Exp: {formatDate(med.expiry_date)}</p>
                    )}
                  </div>
                </div>

                {med.rack_location && (
                  <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                    Shelf Location: <span className="font-medium text-slate-600">{med.rack_location}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* RIGHT 5 COLS: Cart & Billing Desk */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col max-h-[calc(100vh-120px)] sticky top-20">
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">කවුන්ටරය (Billing Cart)</h3>
              <p className="text-xs text-slate-400">{cart.length} items in bill</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold py-1 px-2 rounded-lg hover:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Cart
            </button>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 my-3 pr-1 min-h-[160px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <ShoppingCart className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-semibold">බිල්පත හිස්ව පවතී</p>
              <p className="text-xs">Click medicines on the left to add to cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.medicine_id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-xs text-slate-800 truncate">{item.medicine_name}</h5>
                  <p className="text-[10px] text-slate-400">
                    {item.dosage} • Unit: {formatCurrency(item.unit_price)}
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
                    className="p-1 rounded-md bg-white text-slate-700 hover:bg-slate-200 shadow-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
                    className="p-1 rounded-md bg-white text-slate-700 hover:bg-slate-200 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right w-20">
                  <p className="font-bold text-xs text-slate-900">{formatCurrency(item.subtotal)}</p>
                  <button
                    onClick={() => removeFromCart(item.medicine_id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Doctor Selection */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 mb-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Patient / Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  if (e.target.value) setCustomCustomerName('');
                }}
                className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Doctor Prescription</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="">No Doctor Ref</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedCustomerId && (
            <input
              type="text"
              placeholder="Or enter walk-in customer name..."
              value={customCustomerName}
              onChange={(e) => setCustomCustomerName(e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            />
          )}
        </div>

        {/* Payment Methods */}
        <div className="flex gap-2 mb-3">
          {[
            { id: 'Cash', label: 'Cash (මුදල්)', icon: Banknote },
            { id: 'Card', label: 'Card (කාඩ්)', icon: CreditCard },
            { id: 'Online/QR', label: 'Online QR', icon: QrCode }
          ].map((m) => {
            const Icon = m.icon;
            const isSel = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Calculation summary */}
        <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2 mb-3">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Discount (%):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-14 p-1 rounded-md border border-slate-300 text-right text-xs"
              />
              <span className="font-semibold text-rose-600">-{formatCurrency(discountAmount)}</span>
            </div>
          </div>

          <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
            <span>Grand Total (මුළු එකතුව):</span>
            <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
          </div>

          {paymentMethod === 'Cash' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cash Tendered (LKR)</label>
                <input
                  type="number"
                  placeholder={grandTotal ? grandTotal.toFixed(2) : '0.00'}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>
              <div className="text-right">
                <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Change (ඉතිරි මුදල)</span>
                <p className="text-sm font-black text-blue-600 pt-1">
                  {formatCurrency(changeDue)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit & Print Button */}
        <button
          onClick={handleCheckout}
          disabled={loading || !cart.length}
          className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          {loading ? 'Processing Sale...' : 'Complete Sale & Print Bill (F10)'}
        </button>

      </div>

      {/* Printable Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

    </div>
  );
}
