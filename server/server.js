import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { connectMongoDB } from './mongoDatabase.js';
import { User, Category, Supplier, Medicine, Customer, Doctor, Sale, DealerPurchase } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize MongoDB Atlas connection
await connectMongoDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================== AUTHENTICATION ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim(), password });

    if (!user) {
      return res.status(401).json({ error: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක් (Invalid username or password)' });
    }

    res.json({
      token: `auth-token-${user._id}-${Date.now()}`,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username name role createdAt').sort({ createdAt: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for date string
const getTodayStr = () => new Date().toISOString().split('T')[0];

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = getTodayStr();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Today sales
    const todaySales = await Sale.find({ createdAt: { $gte: startOfToday } });
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total_amount, 0);
    const todayBillsCount = todaySales.length;

    // Total Medicines count
    const totalMedicines = await Medicine.countDocuments();

    // Low stock count (stock_quantity <= reorder_level)
    const lowStockMeds = await Medicine.find({ $expr: { $lte: ['$stock_quantity', '$reorder_level'] } });
    const lowStockCount = lowStockMeds.length;

    // Expired & Expiring soon count
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    const threeMonthsStr = threeMonthsFromNow.toISOString().split('T')[0];

    const expiredMeds = await Medicine.find({ expiry_date: { $lt: today } });
    const expiringSoonMeds = await Medicine.find({ expiry_date: { $gte: today, $lte: threeMonthsStr } });

    // Total suppliers balance due
    const suppliers = await Supplier.find();
    const totalDealerDue = suppliers.reduce((acc, s) => acc + (s.balance_due || 0), 0);

    // Estimated profit today
    let todayProfit = 0;
    for (const sale of todaySales) {
      for (const item of sale.items) {
        // approximate profit if cost price known
        const med = await Medicine.findById(item.medicine_id);
        const cost = med ? med.cost_price : item.unit_price * 0.7;
        todayProfit += (item.unit_price - cost) * item.quantity;
      }
    }

    // Weekly sales (last 7 days)
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

    const weeklySales = Object.values(weeklySalesMap);

    res.json({
      todayRevenue,
      todayBillsCount,
      todayProfit: Math.max(0, todayProfit),
      totalMedicines,
      lowStockCount,
      expiredCount: expiredMeds.length,
      expiringSoonCount: expiringSoonMeds.length,
      totalDealerDue,
      weeklySales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MEDICINES ====================
app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    // Map _id to id for frontend compatibility
    const formatted = medicines.map(m => ({
      id: m._id,
      _id: m._id,
      name: m.name,
      generic_name: m.generic_name,
      category: m.category,
      category_id: m.category_id,
      dosage: m.dosage,
      cost_price: m.cost_price,
      selling_price: m.selling_price,
      stock_quantity: m.stock_quantity,
      reorder_level: m.reorder_level,
      expiry_date: m.expiry_date,
      batch_number: m.batch_number,
      supplier_id: m.supplier_id,
      supplier_name: m.supplier_name
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const {
      name, generic_name, category, dosage, cost_price, selling_price,
      stock_quantity, reorder_level, expiry_date, batch_number, supplier_id, supplier_name
    } = req.body;

    const med = await Medicine.create({
      name, generic_name, category, dosage,
      cost_price: Number(cost_price),
      selling_price: Number(selling_price),
      stock_quantity: Number(stock_quantity || 0),
      reorder_level: Number(reorder_level || 10),
      expiry_date, batch_number, supplier_id, supplier_name
    });

    res.status(201).json({ id: med._id, ...med.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!med) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ id: med._id, ...med.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ALERTS ====================
app.get('/api/medicines/alerts/low-stock', async (req, res) => {
  try {
    const lowStock = await Medicine.find({ $expr: { $lte: ['$stock_quantity', '$reorder_level'] } }).sort({ stock_quantity: 1 });
    res.json(lowStock.map(m => ({ id: m._id, ...m.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/medicines/alerts/expiring', async (req, res) => {
  try {
    const today = getTodayStr();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    const threeMonthsStr = threeMonthsFromNow.toISOString().split('T')[0];

    const expiring = await Medicine.find({ expiry_date: { $lte: threeMonthsStr } }).sort({ expiry_date: 1 });
    res.json(expiring.map(m => ({ id: m._id, ...m.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map(c => ({ id: c._id, ...c.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ id: cat._id, ...cat.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SUPPLIERS (DEALERS) ====================
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers.map(s => ({ id: s._id, ...s.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const sup = await Supplier.create(req.body);
    res.status(201).json({ id: sup._id, ...sup.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const sup = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ id: sup._id, ...sup.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;
    const sup = await Supplier.findById(req.params.id);
    if (!sup) return res.status(404).json({ error: 'Supplier not found' });
    sup.balance_due = Math.max(0, sup.balance_due - Number(amount));
    await sup.save();
    res.json({ id: sup._id, ...sup.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEALER PURCHASES (GRN) ====================
app.get('/api/dealer-purchases', async (req, res) => {
  try {
    const purchases = await DealerPurchase.find().sort({ createdAt: -1 });
    res.json(purchases.map(p => ({ id: p._id, ...p.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dealer-purchases', async (req, res) => {
  try {
    const { supplier_id, invoice_number, items, amount_paid } = req.body;
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

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

      // Update or create medicine inventory
      let med = await Medicine.findOne({ name: item.medicine_name });
      if (med) {
        med.stock_quantity += Number(item.quantity);
        med.cost_price = Number(item.cost_price);
        med.selling_price = Number(item.selling_price);
        med.expiry_date = item.expiry_date;
        med.batch_number = item.batch_number || med.batch_number;
        await med.save();
      } else {
        await Medicine.create({
          name: item.medicine_name,
          category: 'General',
          dosage: item.dosage || '',
          cost_price: Number(item.cost_price),
          selling_price: Number(item.selling_price),
          stock_quantity: Number(item.quantity),
          reorder_level: 10,
          expiry_date: item.expiry_date,
          batch_number: item.batch_number || '',
          supplier_id: supplier._id,
          supplier_name: supplier.name
        });
      }
    }

    const paid = Number(amount_paid || 0);
    const balance_due = total_amount - paid;
    const grn_number = `GRN-${Date.now().toString().slice(-6)}`;

    const grn = await DealerPurchase.create({
      grn_number,
      supplier_id: supplier._id,
      supplier_name: supplier.name,
      invoice_number,
      total_amount,
      amount_paid: paid,
      balance_due,
      status: balance_due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
      items: formattedItems
    });

    // Update supplier balance
    supplier.balance_due = (supplier.balance_due || 0) + balance_due;
    await supplier.save();

    res.status(201).json({ id: grn._id, ...grn.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CUSTOMERS & DOCTORS ====================
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers.map(c => ({ id: c._id, ...c.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const cust = await Customer.create(req.body);
    res.status(201).json({ id: cust._id, ...cust.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json(doctors.map(d => ({ id: d._id, ...d.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const doc = await Doctor.create(req.body);
    res.status(201).json({ id: doc._id, ...doc.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALES (POS BILLING) ====================
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 }).limit(50);
    res.json(sales.map(s => ({ id: s._id, ...s.toObject() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { customer_id, customer_name, doctor_id, doctor_name, cashier_name, subtotal, discount, total_amount, payment_method, items } = req.body;

    const bill_number = `INV-${Date.now().toString().slice(-6)}`;

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

    // Decrement stock for each item
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
      bill_number,
      customer_id: customer_id || null,
      customer_name: customer_name || 'Walking Customer',
      doctor_id: doctor_id || null,
      doctor_name: doctor_name || '',
      cashier_name: cashier_name || 'Staff',
      subtotal: finalSubtotal,
      discount: finalDiscount,
      total_amount: finalTotal,
      payment_method: payment_method || 'Cash',
      items: formattedItems
    });

    // Update customer spent
    if (customer_id) {
      const cust = await Customer.findById(customer_id);
      if (cust) {
        cust.total_spent = (cust.total_spent || 0) + Number(total_amount);
        await cust.save();
      }
    }

    res.status(201).json({ id: sale._id, ...sale.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPORTS ====================
app.get('/api/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const sales = await Sale.find(query).sort({ createdAt: -1 });

    const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
    const totalBills = sales.length;

    // Top medicines sold
    const medMap = {};
    sales.forEach(s => {
      s.items.forEach(i => {
        if (!medMap[i.medicine_name]) medMap[i.medicine_name] = { name: i.medicine_name, quantity: 0, revenue: 0 };
        medMap[i.medicine_name].quantity += i.quantity;
        medMap[i.medicine_name].revenue += i.total_price;
      });
    });

    const topMedicines = Object.values(medMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Payment methods
    const paymentMethods = {};
    sales.forEach(s => {
      paymentMethods[s.payment_method] = (paymentMethods[s.payment_method] || 0) + s.total_amount;
    });

    res.json({
      sales: sales.map(s => ({ id: s._id, ...s.toObject() })),
      summary: {
        totalSales,
        totalBills,
        averageBill: totalBills > 0 ? totalSales / totalBills : 0
      },
      topMedicines,
      paymentMethods
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend static build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  LankaCare Pharmacy Management System is LIVE!`);
  console.log(`  Database:          MongoDB Atlas (Cloud) ☁️`);
  console.log(`  Local Access:      http://localhost:${PORT}`);
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`  Wi-Fi / LAN Access: http://${net.address}:${PORT}`);
        }
      }
    }
  } catch (e) {}
  console.log(`====================================================`);
});
