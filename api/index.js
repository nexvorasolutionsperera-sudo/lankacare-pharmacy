import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://lankacare_user:EnABcd343%23Damith321@cluster0.uuksd4z.mongodb.net/pharmacy?retryWrites=true&w=majority&appName=Cluster0";

// Global cached connection for Serverless environments (prevents connection leaks and cold start crashes)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: true,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (m) => {
      console.log('✅ Connected to MongoDB Atlas');
      try {
        await seedServerlessDB();
      } catch (e) {
        console.warn('Seed non-critical error:', e.message);
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e.message);
    throw e;
  }

  return cached.conn;
}

// Schemas & Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'cashier'], default: 'cashier' }
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
  balance_due: { type: Number, default: 0 }
}, { timestamps: true });

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  generic_name: { type: String, default: '' },
  category: { type: String, default: 'General' },
  dosage: { type: String, default: '' },
  cost_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  stock_quantity: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 10 },
  expiry_date: { type: String, required: true },
  batch_number: { type: String, default: '' },
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
  medicine_id: { type: mongoose.Schema.Types.Mixed },
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
  customer_id: { type: mongoose.Schema.Types.Mixed, default: null },
  customer_name: { type: String, default: 'Walking Customer' },
  doctor_id: { type: mongoose.Schema.Types.Mixed, default: null },
  doctor_name: { type: String, default: '' },
  user_id: { type: mongoose.Schema.Types.Mixed, default: null },
  cashier_name: { type: String, default: 'Admin' },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  change_amount: { type: Number, default: 0 },
  payment_method: { type: String, default: 'Cash' },
  card_last4: { type: String, default: '' },
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
  cost_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  total_cost: { type: Number, required: true }
});

const DealerPurchaseSchema = new mongoose.Schema({
  grn_number: { type: String, required: true, unique: true },
  supplier_name: { type: String, required: true },
  invoice_number: { type: String, default: '' },
  total_amount: { type: Number, required: true },
  amount_paid: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
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
  status: { type: String, enum: ['Sample Collected', 'Processing', 'Report Ready', 'Completed', 'Cancelled'], default: 'Sample Collected' },
  sample_collected_at: { type: String, default: '' },
  report_ready_at: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

// Customer Credit Payments
const CustomerCreditPaymentSchema = new mongoose.Schema({
  payment_number: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.Mixed, required: true },
  customer_name: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, default: 'Cash' },
  cheque_no: { type: String, default: '' },
  bank_name: { type: String, default: '' },
  notes: { type: String, default: '' },
  received_by: { type: String, default: 'Admin' }
}, { timestamps: true });

// Item Returns
const SaleReturnSchema = new mongoose.Schema({
  return_number: { type: String, required: true, unique: true },
  invoice_no: { type: String, default: '' },
  customer_name: { type: String, default: 'Walking Customer' },
  medicine_id: { type: mongoose.Schema.Types.Mixed },
  medicine_name: { type: String, required: true },
  batch_no: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  refund_amount: { type: Number, required: true },
  reason: { type: String, default: 'Customer Request' },
  condition: { type: String, enum: ['Restock to Inventory', 'Damaged / Discard'], default: 'Restock to Inventory' },
  refund_method: { type: String, default: 'Cash' },
  processed_by: { type: String, default: 'Admin' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Expenses
const ExpenseSchema = new mongoose.Schema({
  expense_number: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true, default: 'General' },
  amount: { type: Number, required: true },
  expense_date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  payment_method: { type: String, default: 'Cash' },
  cheque_no: { type: String, default: '' },
  paid_to: { type: String, default: '' },
  notes: { type: String, default: '' },
  recorded_by: { type: String, default: 'Admin' }
}, { timestamps: true });

// Stock Adjustments
const StockAdjustmentSchema = new mongoose.Schema({
  adjustment_number: { type: String, required: true, unique: true },
  medicine_id: { type: mongoose.Schema.Types.Mixed, required: true },
  medicine_name: { type: String, required: true },
  batch_no: { type: String, default: '' },
  previous_qty: { type: Number, required: true },
  adjusted_qty: { type: Number, required: true },
  difference: { type: Number, required: true },
  reason: { type: String, required: true },
  adjusted_by: { type: String, default: 'Admin' },
  notes: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
const DealerPurchase = mongoose.models.DealerPurchase || mongoose.model('DealerPurchase', DealerPurchaseSchema);
const MedicareOrder = mongoose.models.MedicareOrder || mongoose.model('MedicareOrder', MedicareOrderSchema);
const CustomerCreditPayment = mongoose.models.CustomerCreditPayment || mongoose.model('CustomerCreditPayment', CustomerCreditPaymentSchema);
const SaleReturn = mongoose.models.SaleReturn || mongoose.model('SaleReturn', SaleReturnSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
const StockAdjustment = mongoose.models.StockAdjustment || mongoose.model('StockAdjustment', StockAdjustmentSchema);

const MedicareCatalogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Blood Test' },
  sample_type: { type: String, default: 'Blood' },
  price: { type: Number, required: true },
  default_fasting: { type: String, default: 'Not Required' }
}, { timestamps: true });

const MedicareCatalog = mongoose.models.MedicareCatalog || mongoose.model('MedicareCatalog', MedicareCatalogSchema);

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

const ReloadOrder = mongoose.models.ReloadOrder || mongoose.model('ReloadOrder', ReloadOrderSchema);

async function seedServerlessDB() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial users into MongoDB Atlas...');
      await User.create([
        { username: 'admin', password: 'admin123', name: 'Pharmacist (Admin)', role: 'admin' },
        { username: 'cashier', password: 'cashier123', name: 'Counter Cashier', role: 'cashier' }
      ]);
    } else {
      await User.updateOne({ username: 'admin', name: 'Dr. Kasun Perera' }, { $set: { name: 'Pharmacist (Admin)' } });
    }

    const bookCat = await Category.findOne({ name: 'Bookshop & Stationery' });
    if (!bookCat) {
      await Category.create({ name: 'Bookshop & Stationery', description: 'Books, exercise books, pens, stationery and office supplies' });
    }
  } catch (e) {
    console.warn('Seed error:', e.message);
  }
}

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB Connection middleware error:', err.message);
    res.status(503).json({ error: 'Database connection failed. Please verify MongoDB Atlas Network Access (Allow 0.0.0.0/0).' });
  }
});

// Helper
const getTodayStr = () => new Date().toISOString().split('T')[0];

// ==================== API ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username: username.trim(), password });
    if (!user) {
      return res.status(401).json({ error: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක් (Invalid credentials)' });
    }
    res.json({
      token: `auth-token-${user._id}-${Date.now()}`,
      user: { id: user._id, username: user.username, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username name role createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/users', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }
    const exists = await User.findOne({ username: username.trim() });
    if (exists) return res.status(400).json({ error: 'Username already taken' });
    const user = await User.create({ username: username.trim(), password, name, role: role || 'cashier' });
    res.status(201).json({ id: user._id, username: user.username, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status & Mode (For Vercel Cloud Serverless)
app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    mode: 'online',
    isOnline: true,
    configuredMode: 'online',
    currentMode: 'online',
    database: 'MongoDB Atlas (Cloud Vercel)',
    cloudConnected: true,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/system/mode', (req, res) => {
  res.json({ success: true, mode: req.body.mode || 'online' });
});

app.post('/api/system/sync', (req, res) => {
  res.json({
    success: true,
    mode: 'online',
    message: '☁️ Cloud database is synchronized with MongoDB Atlas!'
  });
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = getTodayStr();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySales = await Sale.find({ createdAt: { $gte: startOfToday } });
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total_amount, 0);
    const todayBillsCount = todaySales.length;

    const totalMedicines = await Medicine.countDocuments();
    const lowStockMeds = await Medicine.find({ $expr: { $lte: ['$stock_quantity', '$reorder_level'] } });

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    const threeMonthsStr = threeMonthsFromNow.toISOString().split('T')[0];

    const expiredMeds = await Medicine.find({ expiry_date: { $lt: today } });
    const expiringSoonMeds = await Medicine.find({ expiry_date: { $gte: today, $lte: threeMonthsStr } });

    const suppliers = await Supplier.find();
    const totalDealerDue = suppliers.reduce((acc, s) => acc + (s.balance_due || 0), 0);

    let todayProfit = 0;
    for (const sale of todaySales) {
      for (const item of sale.items) {
        todayProfit += item.total_price * 0.25; // estimated 25% margin
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const pastSales = await Sale.find({ createdAt: { $gte: sevenDaysAgo } });
    const weeklySalesMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      weeklySalesMap[key] = { date: key, total: 0, bills: 0 };
    }
    pastSales.forEach(s => {
      const dKey = s.createdAt.toISOString().split('T')[0];
      if (weeklySalesMap[dKey]) {
        weeklySalesMap[dKey].total += s.total_amount;
        weeklySalesMap[dKey].bills += 1;
      }
    });

    res.json({
      todayRevenue,
      todayBillsCount,
      todayProfit: Math.max(0, todayProfit),
      totalMedicines,
      lowStockCount: lowStockMeds.length,
      expiredCount: expiredMeds.length,
      expiringSoonCount: expiringSoonMeds.length,
      totalDealerDue,
      weeklySales: Object.values(weeklySalesMap)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines.map(m => ({ id: m._id, ...m.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const med = await Medicine.create(req.body);
    res.status(201).json({ id: med._id, ...med.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ id: med._id, ...med.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/medicines/alerts/low-stock', async (req, res) => {
  try {
    const lowStock = await Medicine.find({ $expr: { $lte: ['$stock_quantity', '$reorder_level'] } });
    res.json(lowStock.map(m => ({ id: m._id, ...m.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/medicines/alerts/expiring', async (req, res) => {
  try {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    const expiring = await Medicine.find({ expiry_date: { $lte: threeMonthsFromNow.toISOString().split('T')[0] } });
    res.json(expiring.map(m => ({ id: m._id, ...m.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map(c => ({ id: c._id, ...c.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers.map(s => ({ id: s._id, ...s.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const sup = await Supplier.create(req.body);
    res.status(201).json({ id: sup._id, ...sup.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers/:id/pay', async (req, res) => {
  try {
    const sup = await Supplier.findById(req.params.id);
    if (!sup) return res.status(404).json({ error: 'Not found' });
    sup.balance_due = Math.max(0, sup.balance_due - Number(req.body.amount));
    await sup.save();
    res.json({ id: sup._id, ...sup.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dealer-purchases', async (req, res) => {
  try {
    const purchases = await DealerPurchase.find().sort({ createdAt: -1 });
    res.json(purchases.map(p => ({ id: p._id, ...p.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dealer-purchases', async (req, res) => {
  try {
    const { supplier_id, invoice_number, items, amount_paid } = req.body;
    const supplier = await Supplier.findById(supplier_id);
    let total_amount = 0;
    const formattedItems = [];

    for (const item of items) {
      const itemTotal = Number(item.cost_price) * Number(item.quantity);
      total_amount += itemTotal;
      formattedItems.push({
        medicine_name: item.medicine_name,
        dosage: item.dosage || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date,
        quantity: Number(item.quantity),
        cost_price: Number(item.cost_price),
        selling_price: Number(item.selling_price),
        total_cost: itemTotal
      });

      let med = await Medicine.findOne({ name: item.medicine_name });
      if (med) {
        med.stock_quantity += Number(item.quantity);
        med.cost_price = Number(item.cost_price);
        med.selling_price = Number(item.selling_price);
        await med.save();
      } else {
        await Medicine.create({
          name: item.medicine_name,
          category: 'General',
          cost_price: Number(item.cost_price),
          selling_price: Number(item.selling_price),
          stock_quantity: Number(item.quantity),
          expiry_date: item.expiry_date,
          supplier_name: supplier ? supplier.name : ''
        });
      }
    }

    const paid = Number(amount_paid || 0);
    const balance_due = total_amount - paid;
    const grn = await DealerPurchase.create({
      grn_number: `GRN-${Date.now().toString().slice(-6)}`,
      supplier_name: supplier ? supplier.name : 'Unknown',
      invoice_number,
      total_amount,
      amount_paid: paid,
      balance_due,
      status: balance_due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
      items: formattedItems
    });

    if (supplier) {
      supplier.balance_due = (supplier.balance_due || 0) + balance_due;
      await supplier.save();
    }

    res.status(201).json({ id: grn._id, ...grn.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers.map(c => ({ id: c._id, ...c.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const cust = await Customer.create(req.body);
    res.status(201).json({ id: cust._id, ...cust.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json(doctors.map(d => ({ id: d._id, ...d.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const doc = await Doctor.create(req.body);
    res.status(201).json({ id: doc._id, ...doc.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 }).limit(50);
    res.json(sales.map(s => ({ id: s._id, ...s.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { 
      customer_id,
      customer_name, 
      doctor_id,
      doctor_name, 
      cashier_name, 
      subtotal, 
      discount, 
      total_amount, 
      paid_amount, 
      change_amount, 
      payment_method, 
      card_last4,
      cheque_no,
      bank_name,
      cheque_date,
      items 
    } = req.body;

    const safeItems = Array.isArray(items) ? items : [];
    let calculatedSubtotal = 0;
    const formattedItems = safeItems.map(i => {
      const qty = Number(i.quantity) || 1;
      const price = Number(i.unit_price) || 0;
      const cost = Number(i.cost_price) || 0;
      const total = Number(i.total_price) || (price * qty);
      calculatedSubtotal += total;
      return {
        medicine_id: i.medicine_id,
        medicine_name: i.medicine_name,
        batch_number: i.batch_number || '',
        dosage: i.dosage || '',
        unit_price: price,
        cost_price: cost,
        quantity: qty,
        discount_amount: Number(i.discount_amount) || 0,
        total_price: total
      };
    });

    const finalSubtotal = (!isNaN(Number(subtotal)) && Number(subtotal) > 0) ? Number(subtotal) : calculatedSubtotal;
    const finalDiscount = Number(discount) || 0;
    const finalTotal = (!isNaN(Number(total_amount)) && Number(total_amount) > 0) ? Number(total_amount) : Math.max(0, finalSubtotal - finalDiscount);
    const finalPaid = (!isNaN(Number(paid_amount)) && Number(paid_amount) > 0) ? Number(paid_amount) : (payment_method === 'Credit' ? 0 : finalTotal);
    const finalChange = (!isNaN(Number(change_amount))) ? Number(change_amount) : (finalPaid > finalTotal ? Math.max(0, finalPaid - finalTotal) : 0);

    for (const item of formattedItems) {
      if (item.medicine_id) {
        try {
          const med = await Medicine.findById(item.medicine_id);
          if (med) {
            med.stock_quantity = Math.max(0, med.stock_quantity - item.quantity);
            await med.save();
          }
        } catch (e) {
          // In case item.medicine_id is not a valid ObjectId (e.g. SQLite ID or string)
          await Medicine.updateOne(
            { name: item.medicine_name },
            { $inc: { stock_quantity: -item.quantity } }
          );
        }
      }
    }

    const sale = await Sale.create({
      bill_number: `INV-${Date.now().toString().slice(-6)}`,
      customer_id: customer_id || null,
      customer_name: customer_name || 'Walking Customer',
      doctor_id: doctor_id || null,
      doctor_name: doctor_name || '',
      cashier_name: cashier_name || 'Staff',
      subtotal: finalSubtotal,
      discount: finalDiscount,
      total_amount: finalTotal,
      paid_amount: finalPaid,
      change_amount: finalChange,
      payment_method: payment_method || 'Cash',
      card_last4: card_last4 || '',
      cheque_no: cheque_no || '',
      bank_name: bank_name || '',
      cheque_date: cheque_date || '',
      items: formattedItems
    });

    // If Credit, update customer credit_balance
    if (payment_method === 'Credit' && customer_id) {
      try {
        await Customer.findByIdAndUpdate(customer_id, {
          $inc: { credit_balance: finalTotal, total_spent: finalTotal }
        });
      } catch (e) {
        await Customer.updateOne({ name: customer_name }, {
          $inc: { credit_balance: finalTotal, total_spent: finalTotal }
        });
      }
    } else if (customer_id) {
      try {
        await Customer.findByIdAndUpdate(customer_id, {
          $inc: { total_spent: finalTotal }
        });
      } catch (e) {}
    }

    res.status(201).json({ id: sale._id, ...sale.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/sales', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
    const totalBills = sales.length;

    const medMap = {};
    sales.forEach(s => {
      s.items.forEach(i => {
        if (!medMap[i.medicine_name]) medMap[i.medicine_name] = { name: i.medicine_name, quantity: 0, revenue: 0 };
        medMap[i.medicine_name].quantity += i.quantity;
        medMap[i.medicine_name].revenue += i.total_price;
      });
    });

    const topMedicines = Object.values(medMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    const paymentMethods = {};
    sales.forEach(s => {
      paymentMethods[s.payment_method] = (paymentMethods[s.payment_method] || 0) + s.total_amount;
    });

    res.json({
      sales: sales.map(s => ({ id: s._id, ...s.toObject() })),
      summary: { totalSales, totalBills, averageBill: totalBills > 0 ? totalSales / totalBills : 0 },
      topMedicines,
      paymentMethods
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MEDICARE & LAB TESTS ====================
app.get('/api/medicare', async (req, res) => {
  try {
    await connectDB();
    const orders = await MedicareOrder.find().sort({ createdAt: -1 });
    res.json(orders.map(o => ({ id: o._id, ...o.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medicare', async (req, res) => {
  try {
    await connectDB();
    const {
      patient_name,
      patient_age,
      patient_gender,
      phone,
      doctor_name,
      fasting_status,
      tests,
      subtotal,
      discount,
      total_amount,
      paid_amount,
      balance_due,
      payment_method,
      status,
      sample_collected_at,
      report_ready_at,
      remarks
    } = req.body;

    const orderNumber = req.body.order_number || `MED-${Date.now().toString().slice(-6)}`;
    const tot = Number(total_amount) || 0;
    const paid = Number(paid_amount) || 0;
    const bal = Number(balance_due !== undefined ? balance_due : Math.max(0, tot - paid));

    const order = await MedicareOrder.create({
      order_number: orderNumber,
      patient_name,
      patient_age: Number(patient_age) || 0,
      patient_gender: patient_gender || 'Unspecified',
      phone: phone || '',
      doctor_name: doctor_name || 'Self / OTC',
      fasting_status: fasting_status || 'Not Required',
      tests: Array.isArray(tests) ? tests : [],
      subtotal: Number(subtotal) || tot,
      discount: Number(discount) || 0,
      total_amount: tot,
      paid_amount: paid,
      balance_due: bal,
      payment_method: payment_method || 'Cash',
      status: status || 'Sample Collected',
      sample_collected_at: sample_collected_at || new Date().toISOString(),
      report_ready_at: report_ready_at || '',
      remarks: remarks || ''
    });

    res.status(201).json({ id: order._id, ...order.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medicare/:id', async (req, res) => {
  try {
    await connectDB();
    const updated = await MedicareOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ id: updated._id, ...updated.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/medicare/:id', async (req, res) => {
  try {
    await connectDB();
    await MedicareOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MEDICARE CATALOG (TESTS & PRICING) ====================
app.get('/api/medicare/catalog', async (req, res) => {
  try {
    await connectDB();
    let catalog = await MedicareCatalog.find().sort({ category: 1, name: 1 });
    
    // Seed default tests if empty
    if (catalog.length === 0) {
      const defaultTests = [
        { name: 'Fasting Blood Sugar (FBS)', category: 'Blood Test', sample_type: 'Fluoride Plasma', price: 250, default_fasting: 'Fasting (10-12 hrs)' },
        { name: 'Random Blood Sugar (RBS)', category: 'Blood Test', sample_type: 'Capillary / Plasma', price: 200, default_fasting: 'Non-Fasting' },
        { name: 'Post-Prandial Blood Sugar (PPBS)', category: 'Blood Test', sample_type: 'Fluoride Plasma', price: 250, default_fasting: '2 hrs Post-Meal' },
        { name: 'Full Blood Count (FBC / CBC)', category: 'Blood Test', sample_type: 'EDTA Blood', price: 650, default_fasting: 'Not Required' },
        { name: 'HbA1c (Glycated Hemoglobin)', category: 'Blood Test', sample_type: 'EDTA Blood', price: 1600, default_fasting: 'Not Required' },
        { name: 'Lipid Profile (Cholesterol, HDL, LDL, Trig)', category: 'Blood Test', sample_type: 'Serum', price: 1800, default_fasting: 'Fasting (12 hrs)' },
        { name: 'Serum Creatinine & eGFR (Kidney)', category: 'Blood Test', sample_type: 'Serum', price: 650, default_fasting: 'Not Required' },
        { name: 'Liver Function Test (LFT Panel)', category: 'Blood Test', sample_type: 'Serum', price: 2400, default_fasting: 'Fasting Preferred' },
        { name: 'Serum Uric Acid', category: 'Blood Test', sample_type: 'Serum', price: 600, default_fasting: 'Not Required' },
        { name: 'Serum Electrolytes (Na, K, Cl)', category: 'Blood Test', sample_type: 'Serum', price: 1200, default_fasting: 'Not Required' },
        { name: 'Dengue NS1 Antigen Rapid', category: 'Blood Test', sample_type: 'Whole Blood', price: 1500, default_fasting: 'Not Required' },
        { name: 'Dengue IgG / IgM Antibody', category: 'Blood Test', sample_type: 'Serum', price: 1600, default_fasting: 'Not Required' },
        { name: 'ESR (Erythrocyte Sedimentation)', category: 'Blood Test', sample_type: 'Citrate Blood', price: 350, default_fasting: 'Not Required' },
        { name: 'Blood Grouping & Rh Factor', category: 'Blood Test', sample_type: 'EDTA Blood', price: 500, default_fasting: 'Not Required' },
        { name: 'TSH (Thyroid Stimulating Hormone)', category: 'Blood Test', sample_type: 'Serum', price: 1200, default_fasting: 'Not Required' },
        { name: 'Thyroid Panel (Free T4 & TSH)', category: 'Blood Test', sample_type: 'Serum', price: 2200, default_fasting: 'Not Required' },
        { name: 'Urine Full Report (UFR)', category: 'Urine & Other', sample_type: 'Midstream Urine', price: 400, default_fasting: 'Not Required' },
        { name: 'Urine hCG (Pregnancy Screen)', category: 'Urine & Other', sample_type: 'Morning Urine', price: 350, default_fasting: 'Not Required' },
        { name: '12-Lead ECG with Doctor Report', category: 'ECG & Cardiac', sample_type: 'Clinical Procedure', price: 850, default_fasting: 'Not Required' },
        { name: 'Rhythm Strip ECG Monitoring', category: 'ECG & Cardiac', sample_type: 'Clinical Procedure', price: 500, default_fasting: 'Not Required' },
        { name: 'Digital Blood Pressure & Pulse Check', category: 'Clinical Medicare', sample_type: 'Clinical Check', price: 100, default_fasting: 'Not Required' },
        { name: 'Quick Glucometer Blood Sugar Check', category: 'Clinical Medicare', sample_type: 'Capillary Blood', price: 150, default_fasting: 'Not Required' },
        { name: 'Clinical Nebulization (Adult / Child)', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 450, default_fasting: 'Not Required' },
        { name: 'Minor Wound Dressing & Antiseptic Care', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 400, default_fasting: 'Not Required' },
        { name: 'Major Wound Dressing & Bandaging', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 750, default_fasting: 'Not Required' },
        { name: 'IM / Subcutaneous Injection Admin', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 250, default_fasting: 'Not Required' },
        { name: 'IV Cannula Setup & Saline Infusion', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 1200, default_fasting: 'Not Required' },
        { name: 'Suture / Stitch Removal Care', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 500, default_fasting: 'Not Required' }
      ];
      await MedicareCatalog.insertMany(defaultTests);
      catalog = await MedicareCatalog.find().sort({ category: 1, name: 1 });
    }

    res.json(catalog.map(c => ({ id: c._id, ...c.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medicare/catalog', async (req, res) => {
  try {
    await connectDB();
    const item = await MedicareCatalog.create({
      name: req.body.name,
      category: req.body.category || 'Blood Test',
      sample_type: req.body.sample_type || 'Blood',
      price: Number(req.body.price) || 0,
      default_fasting: req.body.default_fasting || 'Not Required'
    });
    res.status(201).json({ id: item._id, ...item.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medicare/catalog/:id', async (req, res) => {
  try {
    await connectDB();
    const itemData = {
      name: req.body.name,
      category: req.body.category || 'Blood Test',
      sample_type: req.body.sample_type || 'Blood',
      price: Number(req.body.price) || 0,
      default_fasting: req.body.default_fasting || 'Not Required'
    };
    const updated = await MedicareCatalog.findByIdAndUpdate(req.params.id, itemData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json({ id: updated._id, ...updated.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/medicare/catalog/:id', async (req, res) => {
  try {
    await connectDB();
    await MedicareCatalog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PHOTOCOPY & RELOAD SERVICES ====================
app.get('/api/reloads', async (req, res) => {
  try {
    await connectDB();
    const orders = await ReloadOrder.find().sort({ createdAt: -1 });
    res.json(orders.map(o => ({ id: o._id, ...o.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reloads', async (req, res) => {
  try {
    await connectDB();
    const prefix = req.body.type === 'photocopy' ? 'COP' : req.body.type === 'bill_payment' ? 'BIL' : 'REL';
    const txId = req.body.transaction_id || `${prefix}-${Date.now().toString().slice(-6)}`;
    const order = await ReloadOrder.create({
      transaction_id: txId,
      type: req.body.type || 'reload',
      category: req.body.category || 'Mobile Reload',
      service_name: req.body.service_name,
      recipient: req.body.recipient || '',
      details: req.body.details || '',
      quantity: Number(req.body.quantity || 1),
      unit_price: Number(req.body.unit_price || 0),
      amount: Number(req.body.amount || 0),
      cost_amount: Number(req.body.cost_amount || 0),
      commission_profit: Number(req.body.commission_profit || 0),
      payment_method: req.body.payment_method || 'Cash',
      status: req.body.status || 'Success',
      operator: req.body.operator || ''
    });
    res.status(201).json({ id: order._id, ...order.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CUSTOMER CREDIT & PAYMENTS ====================
app.get('/api/customers/:id/payments', async (req, res) => {
  try {
    await connectDB();
    const payments = await CustomerCreditPayment.find({ customer_id: req.params.id }).sort({ createdAt: -1 });
    res.json(payments.map(p => ({ id: p._id, ...p.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customer-payments', async (req, res) => {
  try {
    await connectDB();
    const payments = await CustomerCreditPayment.find().sort({ createdAt: -1 });
    res.json(payments.map(p => ({ id: p._id, ...p.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/:id/payments', async (req, res) => {
  try {
    await connectDB();
    const { amount, payment_method, cheque_no, bank_name, notes, received_by } = req.body;
    let customer = null;
    try {
      customer = await Customer.findById(req.params.id);
    } catch (e) {}

    const payment = await CustomerCreditPayment.create({
      payment_number: `PAY-${Date.now().toString().slice(-6)}`,
      customer_id: req.params.id,
      customer_name: customer ? customer.name : (req.body.customer_name || 'Customer'),
      amount: Number(amount) || 0,
      payment_method: payment_method || 'Cash',
      cheque_no: cheque_no || '',
      bank_name: bank_name || '',
      notes: notes || '',
      received_by: received_by || 'Staff'
    });

    if (customer) {
      customer.credit_balance = Math.max(0, (customer.credit_balance || 0) - (Number(amount) || 0));
      await customer.save();
    }

    res.status(201).json({ id: payment._id, ...payment.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/:id/pay-credit', async (req, res) => {
  try {
    await connectDB();
    const { amount, payment_method, notes } = req.body;
    let customer = null;
    try {
      customer = await Customer.findById(req.params.id);
    } catch (e) {}

    const payment = await CustomerCreditPayment.create({
      payment_number: `PAY-${Date.now().toString().slice(-6)}`,
      customer_id: req.params.id,
      customer_name: customer ? customer.name : 'Customer',
      amount: Number(amount) || 0,
      payment_method: payment_method || 'Cash',
      notes: notes || '',
      received_by: 'Staff'
    });

    if (customer) {
      customer.credit_balance = Math.max(0, (customer.credit_balance || 0) - (Number(amount) || 0));
      await customer.save();
    }

    res.status(201).json({ id: payment._id, ...payment.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ITEM RETURNS & REFUNDS ====================
app.get('/api/returns', async (req, res) => {
  try {
    await connectDB();
    const returns = await SaleReturn.find().sort({ createdAt: -1 });
    res.json(returns.map(r => ({ id: r._id, ...r.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/returns', async (req, res) => {
  try {
    await connectDB();
    const { invoice_no, customer_name, medicine_id, medicine_name, batch_no, quantity, unit_price, refund_amount, reason, condition, refund_method, processed_by, notes } = req.body;

    const ret = await SaleReturn.create({
      return_number: `RET-${Date.now().toString().slice(-6)}`,
      invoice_no: invoice_no || '',
      customer_name: customer_name || 'Walking Customer',
      medicine_id: medicine_id || null,
      medicine_name: medicine_name || 'Item',
      batch_no: batch_no || '',
      quantity: Number(quantity) || 1,
      unit_price: Number(unit_price) || 0,
      refund_amount: Number(refund_amount) || 0,
      reason: reason || 'Customer Request',
      condition: condition || 'Restock to Inventory',
      refund_method: refund_method || 'Cash',
      processed_by: processed_by || 'Staff',
      notes: notes || ''
    });

    // If restocking, increment medicine stock
    if (condition !== 'Damaged / Discard' && medicine_id) {
      try {
        await Medicine.findByIdAndUpdate(medicine_id, {
          $inc: { stock_quantity: Number(quantity) || 1 }
        });
      } catch (e) {
        await Medicine.updateOne(
          { name: medicine_name },
          { $inc: { stock_quantity: Number(quantity) || 1 } }
        );
      }
    }

    res.status(201).json({ id: ret._id, ...ret.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/returns/:id', async (req, res) => {
  try {
    await connectDB();
    await SaleReturn.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== OPERATIONAL EXPENSES ====================
app.get('/api/expenses', async (req, res) => {
  try {
    await connectDB();
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses.map(e => ({ id: e._id, ...e.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    await connectDB();
    const { title, category, amount, expense_date, payment_method, cheque_no, paid_to, notes, recorded_by } = req.body;
    const expense = await Expense.create({
      expense_number: `EXP-${Date.now().toString().slice(-6)}`,
      title: title || 'Expense',
      category: category || 'General',
      amount: Number(amount) || 0,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      payment_method: payment_method || 'Cash',
      cheque_no: cheque_no || '',
      paid_to: paid_to || '',
      notes: notes || '',
      recorded_by: recorded_by || 'Staff'
    });
    res.status(201).json({ id: expense._id, ...expense.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    await connectDB();
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json({ id: updated._id, ...updated.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await connectDB();
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STOCK ADJUSTMENTS ====================
app.get('/api/stock/adjustments', async (req, res) => {
  try {
    await connectDB();
    const adjs = await StockAdjustment.find().sort({ createdAt: -1 });
    res.json(adjs.map(a => ({ id: a._id, ...a.toObject() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock/adjust', async (req, res) => {
  try {
    await connectDB();
    const { medicine_id, medicine_name, batch_no, previous_qty, adjusted_qty, difference, reason, notes, adjusted_by } = req.body;

    const adj = await StockAdjustment.create({
      adjustment_number: `ADJ-${Date.now().toString().slice(-6)}`,
      medicine_id: medicine_id,
      medicine_name: medicine_name || 'Medicine',
      batch_no: batch_no || '',
      previous_qty: Number(previous_qty) || 0,
      adjusted_qty: Number(adjusted_qty) || 0,
      difference: Number(difference) || 0,
      reason: reason || 'Manual Stock Count',
      adjusted_by: adjusted_by || 'Staff',
      notes: notes || ''
    });

    if (medicine_id) {
      try {
        await Medicine.findByIdAndUpdate(medicine_id, {
          $set: { stock_quantity: Number(adjusted_qty) }
        });
      } catch (e) {
        await Medicine.updateOne(
          { name: medicine_name },
          { $set: { stock_quantity: Number(adjusted_qty) } }
        );
      }
    }

    res.status(201).json({ id: adj._id, ...adj.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COMPREHENSIVE REPORTS ====================
app.get('/api/reports/comprehensive', async (req, res) => {
  try {
    await connectDB();
    const { period = 'daily', date, month, year } = req.query;

    const allSales = await Sale.find().sort({ createdAt: -1 });
    const allExpenses = await Expense.find().sort({ createdAt: -1 });
    const allPurchases = await DealerPurchase.find().sort({ createdAt: -1 });
    const allReturns = await SaleReturn.find().sort({ createdAt: -1 });
    const allMeds = await Medicine.find().sort({ name: 1 });

    const totalSales = allSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPurchases = allPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const totalReturns = allReturns.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    const netRevenue = totalSales - totalReturns;
    const grossProfit = totalSales * 0.25; // estimated 25% margin
    const netProfit = grossProfit - totalExpenses;

    const totalStockValue = allMeds.reduce((sum, m) => sum + ((m.cost_price || 0) * (m.stock_quantity || 0)), 0);
    const totalRetailValue = allMeds.reduce((sum, m) => sum + ((m.selling_price || 0) * (m.stock_quantity || 0)), 0);

    res.json({
      summary: {
        totalSales,
        totalBills: allSales.length,
        totalExpenses,
        totalPurchases,
        totalReturns,
        netRevenue,
        grossProfit: Math.max(0, grossProfit),
        netProfit,
        totalStockValue,
        totalRetailValue,
        totalItemsCount: allMeds.length
      },
      sales: allSales.slice(0, 100).map(s => ({ id: s._id, ...s.toObject() })),
      expenses: allExpenses.slice(0, 100).map(e => ({ id: e._id, ...e.toObject() })),
      purchases: allPurchases.slice(0, 100).map(p => ({ id: p._id, ...p.toObject() })),
      returns: allReturns.slice(0, 100).map(r => ({ id: r._id, ...r.toObject() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
