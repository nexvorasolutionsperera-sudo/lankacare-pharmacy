import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  initHybridDatabase,
  getSystemMode,
  authenticateUser,
  getAllUsers,
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getAllCategories,
  createCategory,
  getAllSuppliers,
  createSupplier,
  paySupplier,
  getAllDealerPurchases,
  createDealerPurchase,
  getAllCustomers,
  createCustomer,
  getAllDoctors,
  createDoctor,
  getAllSales,
  createSale,
  getDashboardStats,
  getAllMedicareOrders,
  createMedicareOrder,
  updateMedicareOrder,
  deleteMedicareOrder,
  getAllReloadOrders,
  createReloadOrder,
  deleteReloadOrder
} from './hybridDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Hybrid Engine (Tries Cloud MongoDB first, falls back to local SQLite)
await initHybridDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================== SYSTEM STATUS (ONLINE / OFFLINE) ====================
app.get('/api/system/status', (req, res) => {
  res.json(getSystemMode());
});

// ==================== AUTHENTICATION ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක් (Invalid username or password)' });
    }

    res.json({
      token: `auth-token-${user.id}-${Date.now()}`,
      user,
      systemMode: getSystemMode()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MEDICINES ====================
app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await getAllMedicines();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const med = await createMedicine(req.body);
    res.status(201).json(med);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const med = await updateMedicine(req.params.id, req.body);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });
    res.json(med);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    await deleteMedicine(req.params.id);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ALERTS ====================
app.get('/api/medicines/alerts/low-stock', async (req, res) => {
  try {
    const medicines = await getAllMedicines();
    const lowStock = medicines.filter(m => (m.stock_quantity || 0) <= (m.reorder_level || m.min_stock_alert || 10));
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/medicines/alerts/expiring', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    const threeMonthsStr = threeMonthsFromNow.toISOString().split('T')[0];

    const medicines = await getAllMedicines();
    const expiring = medicines.filter(m => m.expiry_date && m.expiry_date <= threeMonthsStr);
    res.json(expiring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const cat = await createCategory(name, description);
    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SUPPLIERS (DEALERS) ====================
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await getAllSuppliers();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const sup = await createSupplier(req.body);
    res.status(201).json(sup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;
    const sup = await paySupplier(req.params.id, amount);
    if (!sup) return res.status(404).json({ error: 'Supplier not found' });
    res.json(sup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEALER PURCHASES (GRN) ====================
app.get('/api/dealer-purchases', async (req, res) => {
  try {
    const purchases = await getAllDealerPurchases();
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dealer-purchases', async (req, res) => {
  try {
    const grn = await createDealerPurchase(req.body);
    res.status(201).json(grn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CUSTOMERS & DOCTORS ====================
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const cust = await createCustomer(req.body);
    res.status(201).json(cust);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await getAllDoctors();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const doc = await createDoctor(req.body);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALES (POS BILLING) ====================
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await getAllSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const sale = await createSale(req.body);
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPORTS ====================
app.get('/api/reports/sales', async (req, res) => {
  try {
    const sales = await getAllSales();
    const totalSales = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const totalBills = sales.length;

    const medMap = {};
    sales.forEach(s => {
      if (Array.isArray(s.items)) {
        s.items.forEach(i => {
          if (!medMap[i.medicine_name]) medMap[i.medicine_name] = { name: i.medicine_name, quantity: 0, revenue: 0 };
          medMap[i.medicine_name].quantity += i.quantity || 1;
          medMap[i.medicine_name].revenue += i.total_price || (i.unit_price * i.quantity) || 0;
        });
      }
    });

    const topMedicines = Object.values(medMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    const paymentMethods = {};
    sales.forEach(s => {
      const pm = s.payment_method || 'Cash';
      paymentMethods[pm] = (paymentMethods[pm] || 0) + (s.total_amount || 0);
    });

    res.json({
      sales,
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

// ==================== MEDICARE & LAB TESTS ====================
app.get('/api/medicare', async (req, res) => {
  try {
    const orders = await getAllMedicareOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/medicare', async (req, res) => {
  try {
    const order = await createMedicareOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/medicare/:id', async (req, res) => {
  try {
    const order = await updateMedicareOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/medicare/:id', async (req, res) => {
  try {
    await deleteMedicareOrder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PHOTOCOPY & RELOAD SERVICES ====================
app.get('/api/reloads', async (req, res) => {
  try {
    const orders = await getAllReloadOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reloads', async (req, res) => {
  try {
    const order = await createReloadOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reloads/:id', async (req, res) => {
  try {
    await deleteReloadOrder(req.params.id);
    res.json({ success: true });
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
  const modeInfo = getSystemMode();
  console.log(`====================================================`);
  console.log(`  LankaCare Pharmacy Management System is LIVE!`);
  console.log(`  Engine Mode:       ${modeInfo.mode.toUpperCase()} (${modeInfo.database})`);
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
