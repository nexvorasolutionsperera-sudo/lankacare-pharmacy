import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed data
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================== AUTHENTICATION ====================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password = ?').get(username.trim(), password);

    if (!user) {
      return res.status(401).json({ error: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක් (Invalid username or password)' });
    }

    res.json({
      token: `auth-token-${user.id}-${Date.now()}`,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY id ASC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for date string
const getTodayStr = () => new Date().toISOString().split('T')[0];

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const today = getTodayStr();

    // Today sales
    const todaySales = db.prepare(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sales
      WHERE date(created_at) = date('now', 'localtime')
    `).get();

    // Today Profit: sum of (item unit_price - cost_price) * quantity for today's sales
    const todayProfit = db.prepare(`
      SELECT 
        COALESCE(SUM((si.unit_price - si.cost_price) * si.quantity), 0) as profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE date(s.created_at) = date('now', 'localtime')
    `).get();

    // Monthly revenue
    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as month_revenue
      FROM sales
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
    `).get();

    // Inventory counts
    const totalMedicines = db.prepare('SELECT COUNT(*) as count FROM medicines').get().count;
    
    // Low stock count (stock <= min_stock_alert)
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM medicines WHERE stock_quantity <= min_stock_alert').get().count;

    // Expired count
    const expiredCount = db.prepare('SELECT COUNT(*) as count FROM medicines WHERE date(expiry_date) < date(?)').get(today).count;

    // Expiring in next 60 days
    const expiringSoonCount = db.prepare(`
      SELECT COUNT(*) as count FROM medicines 
      WHERE date(expiry_date) >= date(?) AND date(expiry_date) <= date(?, '+60 days')
    `).get(today, today).count;

    // Total suppliers & total due
    const suppliersStats = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_purchased - total_paid), 0) as total_due
      FROM suppliers
    `).get();

    // Recent 5 sales
    const recentSales = db.prepare(`
      SELECT id, invoice_no, customer_name, total_amount, payment_method, created_at
      FROM sales
      ORDER BY id DESC
      LIMIT 5
    `).all();

    // Top low stock medicines
    const lowStockItems = db.prepare(`
      SELECT id, name, generic_name, dosage, stock_quantity, min_stock_alert, rack_location
      FROM medicines
      WHERE stock_quantity <= min_stock_alert
      ORDER BY stock_quantity ASC
      LIMIT 5
    `).all();

    // Expiring soon medicines
    const expiringItems = db.prepare(`
      SELECT id, name, generic_name, batch_no, stock_quantity, expiry_date,
             CAST((julianday(expiry_date) - julianday(?)) AS INTEGER) as days_left
      FROM medicines
      WHERE date(expiry_date) <= date(?, '+60 days')
      ORDER BY expiry_date ASC
      LIMIT 5
    `).all(today, today);

    // Last 7 days sales chart
    const last7Days = db.prepare(`
      WITH RECURSIVE dates(d) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(d, '+1 day') FROM dates WHERE d < date('now')
      )
      SELECT 
        dates.d as sale_date,
        COALESCE(SUM(sales.total_amount), 0) as total_amount,
        COUNT(sales.id) as orders
      FROM dates
      LEFT JOIN sales ON date(sales.created_at) = dates.d
      GROUP BY dates.d
      ORDER BY dates.d ASC
    `).all();

    res.json({
      todaySales: {
        orders: todaySales.order_count,
        revenue: todaySales.total_revenue,
        profit: todayProfit.profit
      },
      monthRevenue: monthSales.month_revenue,
      totalMedicines,
      lowStockCount,
      expiredCount,
      expiringSoonCount,
      suppliersCount: suppliersStats.count,
      totalSupplierDue: suppliersStats.total_due,
      recentSales,
      lowStockItems,
      expiringItems,
      salesChart: last7Days
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== MEDICINES INVENTORY ====================
app.get('/api/medicines', (req, res) => {
  try {
    const { search, category, status } = req.query;
    const today = getTodayStr();

    let query = `
      SELECT 
        m.*, 
        c.name as category_name,
        s.name as supplier_name,
        CAST((julianday(m.expiry_date) - julianday(?)) AS INTEGER) as days_to_expiry
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [today];

    if (search && search.trim()) {
      query += ` AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.batch_no LIKE ? OR m.barcode LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category && category !== 'all') {
      query += ` AND m.category_id = ?`;
      params.push(category);
    }

    if (status === 'low_stock') {
      query += ` AND m.stock_quantity <= m.min_stock_alert`;
    } else if (status === 'expired') {
      query += ` AND date(m.expiry_date) < date(?)`;
      params.push(today);
    } else if (status === 'expiring_soon') {
      query += ` AND date(m.expiry_date) >= date(?) AND date(m.expiry_date) <= date(?, '+60 days')`;
      params.push(today, today);
    } else if (status === 'in_stock') {
      query += ` AND m.stock_quantity > m.min_stock_alert AND date(m.expiry_date) >= date(?)`;
      params.push(today);
    }

    query += ` ORDER BY m.name ASC`;
    const medicines = db.prepare(query).all(...params);
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/medicines', (req, res) => {
  try {
    const {
      name, generic_name, category_id, dosage, form, batch_no,
      barcode, cost_price, selling_price, stock_quantity,
      min_stock_alert, expiry_date, supplier_id, rack_location, requires_prescription
    } = req.body;

    if (!name || !batch_no || !cost_price || !selling_price || !expiry_date) {
      return res.status(400).json({ error: 'Medicine name, batch no, cost price, selling price, and expiry date are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO medicines (
        name, generic_name, category_id, dosage, form, batch_no,
        barcode, cost_price, selling_price, stock_quantity,
        min_stock_alert, expiry_date, supplier_id, rack_location, requires_prescription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, generic_name || '', category_id || null, dosage || '', form || 'Tablet',
      batch_no, barcode || '', Number(cost_price), Number(selling_price),
      Number(stock_quantity) || 0, Number(min_stock_alert) || 10, expiry_date,
      supplier_id || null, rack_location || '', requires_prescription ? 1 : 0
    );

    const newMed = db.prepare('SELECT * FROM medicines WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newMed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/medicines/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, generic_name, category_id, dosage, form, batch_no,
      barcode, cost_price, selling_price, stock_quantity,
      min_stock_alert, expiry_date, supplier_id, rack_location, requires_prescription
    } = req.body;

    const stmt = db.prepare(`
      UPDATE medicines SET
        name = ?, generic_name = ?, category_id = ?, dosage = ?, form = ?,
        batch_no = ?, barcode = ?, cost_price = ?, selling_price = ?,
        stock_quantity = ?, min_stock_alert = ?, expiry_date = ?,
        supplier_id = ?, rack_location = ?, requires_prescription = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      name, generic_name || '', category_id || null, dosage || '', form || 'Tablet',
      batch_no, barcode || '', Number(cost_price), Number(selling_price),
      Number(stock_quantity) || 0, Number(min_stock_alert) || 10, expiry_date,
      supplier_id || null, rack_location || '', requires_prescription ? 1 : 0,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const updated = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/medicines/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(m.id) as medicine_count 
      FROM categories c
      LEFT JOIN medicines m ON c.id = m.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description || '');
    const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEALERS / SUPPLIERS ====================
app.get('/api/suppliers', (req, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT 
        s.*,
        (s.total_purchased - s.total_paid) as balance_due,
        COUNT(m.id) as total_medicines_supplied
      FROM suppliers s
      LEFT JOIN medicines m ON s.id = m.supplier_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const { name, contact_person, phone, email, address, tax_id, total_purchased, total_paid } = req.body;
    if (!name) return res.status(400).json({ error: 'Dealer/Supplier name is required' });

    const result = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, tax_id, total_purchased, total_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, contact_person || '', phone || '', email || '',
      address || '', tax_id || '', Number(total_purchased) || 0, Number(total_paid) || 0
    );

    const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, tax_id, total_purchased, total_paid } = req.body;

    db.prepare(`
      UPDATE suppliers SET
        name = ?, contact_person = ?, phone = ?, email = ?,
        address = ?, tax_id = ?, total_purchased = ?, total_paid = ?
      WHERE id = ?
    `).run(
      name, contact_person || '', phone || '', email || '',
      address || '', tax_id || '', Number(total_purchased) || 0, Number(total_paid) || 0, id
    );

    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pay dealer balance
app.post('/api/suppliers/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid payment amount is required' });

    db.prepare(`
      UPDATE suppliers 
      SET total_paid = total_paid + ?
      WHERE id = ?
    `).run(Number(amount), id);

    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEALER PURCHASES / STOCK INWARD ====================
app.get('/api/purchases', (req, res) => {
  try {
    const purchases = db.prepare(`
      SELECT 
        dp.*,
        s.name as supplier_name,
        s.phone as supplier_phone
      FROM dealer_purchases dp
      JOIN suppliers s ON dp.supplier_id = s.id
      ORDER BY dp.id DESC
    `).all();

    for (const p of purchases) {
      p.items = db.prepare('SELECT * FROM dealer_purchase_items WHERE purchase_id = ?').all(p.id);
    }

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/purchases', (req, res) => {
  const transaction = db.transaction((purchaseData) => {
    const { supplier_id, invoice_no, purchase_date, paid_amount, notes, items } = purchaseData;

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (Number(item.quantity) * Number(item.cost_price));
    }

    const paid = Number(paid_amount) || 0;
    const paymentStatus = paid >= totalAmount ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

    const purchaseStmt = db.prepare(`
      INSERT INTO dealer_purchases (invoice_no, supplier_id, purchase_date, total_amount, paid_amount, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const purchaseResult = purchaseStmt.run(
      invoice_no || `GRN-${Date.now().toString().slice(-6)}`,
      supplier_id,
      purchase_date || getTodayStr(),
      totalAmount,
      paid,
      paymentStatus,
      notes || ''
    );

    const purchaseId = purchaseResult.lastInsertRowid;

    // Update supplier totals
    db.prepare(`
      UPDATE suppliers 
      SET total_purchased = total_purchased + ?,
          total_paid = total_paid + ?
      WHERE id = ?
    `).run(totalAmount, paid, supplier_id);

    // Insert purchase items & increase medicine stock!
    const itemStmt = db.prepare(`
      INSERT INTO dealer_purchase_items (purchase_id, medicine_id, medicine_name, quantity, cost_price, selling_price, batch_no, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateMedStock = db.prepare(`
      UPDATE medicines 
      SET stock_quantity = stock_quantity + ?,
          cost_price = ?,
          selling_price = COALESCE(?, selling_price),
          batch_no = COALESCE(?, batch_no),
          expiry_date = COALESCE(?, expiry_date)
      WHERE id = ?
    `);

    for (const it of items) {
      itemStmt.run(
        purchaseId,
        it.medicine_id || null,
        it.medicine_name,
        Number(it.quantity),
        Number(it.cost_price),
        it.selling_price ? Number(it.selling_price) : null,
        it.batch_no || '',
        it.expiry_date || ''
      );

      if (it.medicine_id) {
        updateMedStock.run(
          Number(it.quantity),
          Number(it.cost_price),
          it.selling_price ? Number(it.selling_price) : null,
          it.batch_no || null,
          it.expiry_date || null,
          it.medicine_id
        );
      }
    }

    return purchaseId;
  });

  try {
    const purchaseId = transaction(req.body);
    const result = db.prepare('SELECT * FROM dealer_purchases WHERE id = ?').get(purchaseId);
    result.items = db.prepare('SELECT * FROM dealer_purchase_items WHERE purchase_id = ?').all(purchaseId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Purchase creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CUSTOMERS & DOCTORS ====================
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT c.*, COUNT(s.id) as total_orders, COALESCE(SUM(s.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, email, address, allergies, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, address, allergies, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, phone || '', email || '', address || '', allergies || '', notes || '');
    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctors', (req, res) => {
  try {
    const doctors = db.prepare('SELECT * FROM doctors ORDER BY name ASC').all();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/doctors', (req, res) => {
  try {
    const { name, slmc_no, hospital, phone, specialization } = req.body;
    if (!name) return res.status(400).json({ error: 'Doctor name is required' });
    const result = db.prepare(`
      INSERT INTO doctors (name, slmc_no, hospital, phone, specialization)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, slmc_no || '', hospital || '', phone || '', specialization || '');
    const newDoctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newDoctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POS SALES & BILLING ====================
app.get('/api/sales', (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    let query = `
      SELECT 
        s.*,
        c.phone as customer_phone,
        d.name as doctor_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN doctors d ON s.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND date(s.created_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(s.created_at) <= date(?)`;
      params.push(endDate);
    }

    query += ` ORDER BY s.id DESC LIMIT ?`;
    params.push(Number(limit));

    const sales = db.prepare(query).all(...params);

    for (const sale of sales) {
      sale.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
    }

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sales/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sale = db.prepare(`
      SELECT 
        s.*,
        c.phone as customer_phone,
        c.address as customer_address,
        d.name as doctor_name,
        d.slmc_no as doctor_slmc
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN doctors d ON s.doctor_id = d.id
      WHERE s.id = ?
    `).get(id);

    if (!sale) return res.status(404).json({ error: 'Invoice not found' });
    sale.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POS Checkout: Atomic Transaction
app.post('/api/sales', (req, res) => {
  const transaction = db.transaction((saleData) => {
    const {
      customer_id, doctor_id, customer_name,
      items, discount_percent = 0, tax_amount = 0,
      paid_amount, payment_method = 'Cash', notes
    } = saleData;

    if (!items || !items.length) {
      throw new Error('No items in invoice cart');
    }

    // 1. Verify stock availability for all items
    for (const item of items) {
      const med = db.prepare('SELECT id, name, stock_quantity, cost_price, selling_price FROM medicines WHERE id = ?').get(item.medicine_id);
      if (!med) {
        throw new Error(`Medicine "${item.medicine_name}" not found`);
      }
      if (med.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${med.name}". Available: ${med.stock_quantity}, Requested: ${item.quantity}`);
      }
    }

    // 2. Calculate subtotal & totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += (Number(item.unit_price) * Number(item.quantity));
    }

    const discountRate = Number(discount_percent) || 0;
    const discountAmount = Math.round((subtotal * (discountRate / 100)) * 100) / 100;
    const tax = Number(tax_amount) || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + tax);
    const paid = Number(paid_amount) || totalAmount;
    const change = Math.max(0, paid - totalAmount);

    // 3. Generate Sequential Invoice Number (INV-YYYYMMDD-XXXX)
    const todayNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = db.prepare("SELECT COUNT(*) as count FROM sales WHERE strftime('%Y%m%d', created_at) = ?").get(todayNum).count + 1;
    const invoiceNo = `INV-${todayNum}-${String(countToday).padStart(4, '0')}`;

    // 4. Insert into sales
    const insertSale = db.prepare(`
      INSERT INTO sales (
        invoice_no, customer_id, doctor_id, customer_name,
        subtotal, discount_percent, discount_amount, tax_amount,
        total_amount, paid_amount, change_amount, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const saleResult = insertSale.run(
      invoiceNo,
      customer_id || null,
      doctor_id || null,
      customer_name || 'Walk-in Customer',
      subtotal,
      discountRate,
      discountAmount,
      tax,
      totalAmount,
      paid,
      change,
      payment_method,
      notes || ''
    );

    const saleId = saleResult.lastInsertRowid;

    // 5. Insert items & deduct stock
    const insertItem = db.prepare(`
      INSERT INTO sale_items (
        sale_id, medicine_id, medicine_name, batch_no, dosage,
        unit_price, cost_price, quantity, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deductStock = db.prepare(`
      UPDATE medicines 
      SET stock_quantity = stock_quantity - ? 
      WHERE id = ?
    `);

    for (const item of items) {
      const med = db.prepare('SELECT cost_price FROM medicines WHERE id = ?').get(item.medicine_id);
      const itemSubtotal = Number(item.unit_price) * Number(item.quantity);

      insertItem.run(
        saleId,
        item.medicine_id,
        item.medicine_name,
        item.batch_no || '',
        item.dosage || '',
        Number(item.unit_price),
        med.cost_price,
        Number(item.quantity),
        itemSubtotal
      );

      deductStock.run(Number(item.quantity), item.medicine_id);
    }

    return saleId;
  });

  try {
    const saleId = transaction(req.body);
    const sale = db.prepare(`
      SELECT s.*, c.phone as customer_phone, d.name as doctor_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN doctors d ON s.doctor_id = d.id 
      WHERE s.id = ?
    `).get(saleId);
    sale.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
    res.status(201).json(sale);
  } catch (error) {
    console.error('POS Checkout error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== REPORTS & ANALYTICS ====================
app.get('/api/reports/sales-summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || getTodayStr();
    const end = endDate || getTodayStr();

    // Summary metrics
    const summary = db.prepare(`
      SELECT 
        COUNT(DISTINCT s.id) as total_bills,
        COALESCE(SUM(s.subtotal), 0) as gross_sales,
        COALESCE(SUM(s.discount_amount), 0) as total_discounts,
        COALESCE(SUM(s.total_amount), 0) as net_sales,
        COALESCE(SUM(si.cost_price * si.quantity), 0) as total_cogs
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE date(s.created_at) >= date(?) AND date(s.created_at) <= date(?)
    `).get(start, end);

    const grossProfit = summary.net_sales - summary.total_cogs;
    const profitMargin = summary.net_sales > 0 ? ((grossProfit / summary.net_sales) * 100).toFixed(1) : 0;

    // Top selling medicines
    const topMedicines = db.prepare(`
      SELECT 
        si.medicine_name,
        SUM(si.quantity) as total_qty_sold,
        SUM(si.subtotal) as total_revenue,
        SUM((si.unit_price - si.cost_price) * si.quantity) as profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE date(s.created_at) >= date(?) AND date(s.created_at) <= date(?)
      GROUP BY si.medicine_name
      ORDER BY total_qty_sold DESC
      LIMIT 10
    `).all(start, end);

    // Sales grouped by payment method
    const paymentMethods = db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total_amount) as amount
      FROM sales
      WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
      GROUP BY payment_method
    `).all(start, end);

    res.json({
      startDate: start,
      endDate: end,
      totalBills: summary.total_bills,
      grossSales: summary.gross_sales,
      totalDiscounts: summary.total_discounts,
      netSales: summary.net_sales,
      totalCost: summary.total_cogs,
      grossProfit,
      profitMargin,
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
