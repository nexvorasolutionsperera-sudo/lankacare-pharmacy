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
  address: { type: String, default: '' },
  total_spent: { type: Number, default: 0 }
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
  unit_price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total_price: { type: Number, required: true }
});

const SaleSchema = new mongoose.Schema({
  bill_number: { type: String, required: true, unique: true },
  customer_name: { type: String, default: 'Walking Customer' },
  doctor_name: { type: String, default: '' },
  cashier_name: { type: String, default: 'Admin' },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, default: 'Cash' },
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
const DealerPurchase = mongoose.models.DealerPurchase || mongoose.model('DealerPurchase', DealerPurchaseSchema);

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
    const { customer_name, doctor_name, cashier_name, subtotal, discount, total_amount, payment_method, items } = req.body;

    const safeItems = Array.isArray(items) ? items : [];
    let calculatedSubtotal = 0;
    const formattedItems = safeItems.map(i => {
      const qty = Number(i.quantity) || 1;
      const price = Number(i.unit_price) || 0;
      const total = Number(i.total_price) || (price * qty);
      calculatedSubtotal += total;
      return {
        medicine_id: i.medicine_id,
        medicine_name: i.medicine_name,
        batch_number: i.batch_number || '',
        unit_price: price,
        quantity: qty,
        total_price: total
      };
    });

    const finalSubtotal = (!isNaN(Number(subtotal)) && Number(subtotal) > 0) ? Number(subtotal) : calculatedSubtotal;
    const finalDiscount = Number(discount) || 0;
    const finalTotal = (!isNaN(Number(total_amount)) && Number(total_amount) > 0) ? Number(total_amount) : Math.max(0, finalSubtotal - finalDiscount);

    for (const item of formattedItems) {
      if (item.medicine_id) {
        const med = await Medicine.findById(item.medicine_id);
        if (med) {
          med.stock_quantity = Math.max(0, med.stock_quantity - item.quantity);
          await med.save();
        }
      }
    }

    const sale = await Sale.create({
      bill_number: `INV-${Date.now().toString().slice(-6)}`,
      customer_name: customer_name || 'Walking Customer',
      doctor_name: doctor_name || '',
      cashier_name: cashier_name || 'Staff',
      subtotal: finalSubtotal,
      discount: finalDiscount,
      total_amount: finalTotal,
      payment_method: payment_method || 'Cash',
      items: formattedItems
    });

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

export default app;
