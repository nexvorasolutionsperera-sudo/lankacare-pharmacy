import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'cashier', 'pharmacist'], default: 'cashier' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' }
}, { timestamps: true });

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact_person: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  balance_due: { type: Number, default: 0 },
  tax_id: { type: String, default: '' },
  total_purchased: { type: Number, default: 0 },
  total_paid: { type: Number, default: 0 }
}, { timestamps: true });

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  generic_name: { type: String, default: '' },
  category: { type: String, default: 'General' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  dosage: { type: String, default: '' },
  form: { type: String, default: 'Tablet' },
  cost_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  stock_quantity: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 10 },
  expiry_date: { type: String, required: true },
  batch_number: { type: String, default: '' },
  barcode: { type: String, default: '' },
  rack_location: { type: String, default: '' },
  requires_prescription: { type: Boolean, default: false },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplier_name: { type: String, default: '' }
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  allergies: { type: String, default: '' },
  notes: { type: String, default: '' },
  total_spent: { type: Number, default: 0 },
  credit_balance: { type: Number, default: 0 },
  credit_limit: { type: Number, default: 0 }
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, default: 'General Practitioner' },
  hospital: { type: String, default: '' },
  phone: { type: String, default: '' },
  reg_number: { type: String, default: '' }
}, { timestamps: true });

const SaleItemSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicine_name: { type: String, required: true },
  batch_number: { type: String, default: '' },
  dosage: { type: String, default: '' },
  unit_price: { type: Number, required: true },
  cost_price: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  total_price: { type: Number, required: true }
});

const SaleSchema = new mongoose.Schema({
  bill_number: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String, default: 'Walking Customer' },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  doctor_name: { type: String, default: '' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashier_name: { type: String, default: 'Admin' },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  change_amount: { type: Number, default: 0 },
  payment_method: { type: String, default: 'Cash' }, // Cash, Card, Cheque, Credit
  cheque_no: { type: String, default: '' },
  bank_name: { type: String, default: '' },
  cheque_date: { type: String, default: '' },
  notes: { type: String, default: '' },
  items: [SaleItemSchema]
}, { timestamps: true });

const DealerPurchaseItemSchema = new mongoose.Schema({
  medicine_name: { type: String, required: true },
  dosage: { type: String, default: '' },
  batch_number: { type: String, default: '' },
  expiry_date: { type: String, required: true },
  quantity: { type: Number, required: true },
  bonus_quantity: { type: Number, default: 0 },
  cost_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  total_cost: { type: Number, required: true }
});

const DealerPurchaseSchema = new mongoose.Schema({
  grn_number: { type: String, required: true, unique: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplier_name: { type: String, required: true },
  invoice_number: { type: String, default: '' },
  purchase_date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  total_amount: { type: Number, required: true },
  amount_paid: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  payment_status: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
  payment_method: { type: String, default: 'Cash' },
  cheque_no: { type: String, default: '' },
  cheque_date: { type: String, default: '' },
  notes: { type: String, default: '' },
  items: [DealerPurchaseItemSchema]
}, { timestamps: true });

const MedicareOrderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  patient_name: { type: String, required: true },
  patient_age: { type: Number, default: 0 },
  patient_gender: { type: String, default: 'Unspecified' },
  phone: { type: String, default: '' },
  doctor_name: { type: String, default: 'Self / OTC' },
  fasting_status: { type: String, default: 'Not Required' },
  tests: [{
    name: { type: String, required: true },
    category: { type: String, default: 'Blood Test' },
    sample_type: { type: String, default: 'Blood' },
    price: { type: Number, required: true }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  payment_method: { type: String, default: 'Cash' },
  cheque_no: { type: String, default: '' },
  status: { type: String, enum: ['Sample Collected', 'Processing', 'Report Ready', 'Completed', 'Cancelled'], default: 'Sample Collected' },
  sample_collected_at: { type: String, default: '' },
  report_ready_at: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

const ReloadOrderSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['reload', 'bill_payment', 'photocopy', 'printing', 'laminating', 'other'], default: 'reload' },
  category: { type: String, default: 'Mobile Reload' },
  service_name: { type: String, required: true },
  recipient: { type: String, default: '' },
  details: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  cost_amount: { type: Number, default: 0 },
  commission_profit: { type: Number, default: 0 },
  payment_method: { type: String, default: 'Cash' },
  status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
  operator: { type: String, default: '' }
}, { timestamps: true });

const MedicareCatalogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Blood Test' },
  sample_type: { type: String, default: 'Blood' },
  price: { type: Number, required: true },
  default_fasting: { type: String, default: 'Not Required' }
}, { timestamps: true });

// ==================== NEW MODULE SCHEMAS ====================

// 1. Customer Credit Payments
const CustomerCreditPaymentSchema = new mongoose.Schema({
  payment_number: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customer_name: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, default: 'Cash' }, // Cash, Card, Cheque
  cheque_no: { type: String, default: '' },
  bank_name: { type: String, default: '' },
  notes: { type: String, default: '' },
  received_by: { type: String, default: 'Admin' }
}, { timestamps: true });

// 2. Item / Sale Returns
const SaleReturnSchema = new mongoose.Schema({
  return_number: { type: String, required: true, unique: true },
  invoice_no: { type: String, default: '' },
  customer_name: { type: String, default: 'Walk-in Customer' },
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicine_name: { type: String, required: true },
  batch_no: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  refund_amount: { type: Number, required: true },
  reason: { type: String, default: 'Customer Request' }, // Expired, Damaged, Wrong Medicine, Customer Changed Mind, etc.
  condition: { type: String, enum: ['Restock to Inventory', 'Damaged / Discard'], default: 'Restock to Inventory' },
  refund_method: { type: String, default: 'Cash' }, // Cash, Card, Store Credit
  processed_by: { type: String, default: 'Admin' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// 3. Operating Expenses
const ExpenseSchema = new mongoose.Schema({
  expense_number: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    default: 'General' 
  }, // Shop Rent, Electricity, Water, Salaries, Transport, Refreshments, Maintenance, Packaging, Stationery, Other
  amount: { type: Number, required: true },
  expense_date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  payment_method: { type: String, default: 'Cash' }, // Cash, Card, Cheque
  cheque_no: { type: String, default: '' },
  paid_to: { type: String, default: '' },
  notes: { type: String, default: '' },
  recorded_by: { type: String, default: 'Admin' }
}, { timestamps: true });

// 4. Stock Adjustments (Inventory Reconciliation)
const StockAdjustmentSchema = new mongoose.Schema({
  adjustment_number: { type: String, required: true, unique: true },
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicine_name: { type: String, required: true },
  batch_no: { type: String, default: '' },
  previous_qty: { type: Number, required: true },
  adjusted_qty: { type: Number, required: true },
  difference: { type: Number, required: true },
  reason: { type: String, required: true }, // Damaged, Expired, Stock Count Correction, Theft/Lost, Supplier Return
  adjusted_by: { type: String, default: 'Admin' },
  notes: { type: String, default: '' }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
export const Category = mongoose.model('Category', CategorySchema);
export const Supplier = mongoose.model('Supplier', SupplierSchema);
export const Medicine = mongoose.model('Medicine', MedicineSchema);
export const Customer = mongoose.model('Customer', CustomerSchema);
export const Doctor = mongoose.model('Doctor', DoctorSchema);
export const Sale = mongoose.model('Sale', SaleSchema);
export const DealerPurchase = mongoose.model('DealerPurchase', DealerPurchaseSchema);
export const MedicareOrder = mongoose.model('MedicareOrder', MedicareOrderSchema);
export const ReloadOrder = mongoose.model('ReloadOrder', ReloadOrderSchema);
export const MedicareCatalog = mongoose.model('MedicareCatalog', MedicareCatalogSchema);

export const CustomerCreditPayment = mongoose.model('CustomerCreditPayment', CustomerCreditPaymentSchema);
export const SaleReturn = mongoose.model('SaleReturn', SaleReturnSchema);
export const Expense = mongoose.model('Expense', ExpenseSchema);
export const StockAdjustment = mongoose.model('StockAdjustment', StockAdjustmentSchema);
