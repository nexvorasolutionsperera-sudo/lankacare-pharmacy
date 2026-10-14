import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import sqliteDb, { initDatabase as initSqlite } from './database.js';
import { connectMongoDB } from './mongoDatabase.js';
import { User, Category, Supplier, Medicine, Customer, Doctor, Sale, DealerPurchase } from './models.js';

let currentMode = 'offline'; // 'online' | 'offline'

// ==================== DUAL-WRITE SYNC HELPERS (Save into SQLite) ====================

function syncMedicineToSQLite(data) {
  try {
    const existing = sqliteDb.prepare('SELECT id FROM medicines WHERE name = ?').get(data.name);
    if (existing) {
      sqliteDb.prepare(`
        UPDATE medicines SET 
          generic_name = ?, dosage = ?, cost_price = ?, selling_price = ?, 
          stock_quantity = ?, min_stock_alert = ?, expiry_date = ?, batch_no = ?
        WHERE id = ?
      `).run(
        data.generic_name || '',
        data.dosage || '',
        Number(data.cost_price || 0),
        Number(data.selling_price || 0),
        Number(data.stock_quantity || 0),
        Number(data.reorder_level || data.min_stock_alert || 10),
        data.expiry_date || '',
        data.batch_number || data.batch_no || '',
        existing.id
      );
    } else {
      sqliteDb.prepare(`
        INSERT INTO medicines (name, generic_name, dosage, cost_price, selling_price, stock_quantity, min_stock_alert, expiry_date, batch_no)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.name,
        data.generic_name || '',
        data.dosage || '',
        Number(data.cost_price || 0),
        Number(data.selling_price || 0),
        Number(data.stock_quantity || 0),
        Number(data.reorder_level || data.min_stock_alert || 10),
        data.expiry_date || '',
        data.batch_number || data.batch_no || ''
      );
    }
  } catch (err) {
    console.warn('⚠️ SQLite Medicine Sync error:', err.message);
  }
}

function syncSaleToSQLite(saleData) {
  try {
    const billNo = saleData.bill_number || `INV-${Date.now().toString().slice(-6)}`;
    const existing = sqliteDb.prepare('SELECT id FROM sales WHERE invoice_no = ?').get(billNo);
    if (existing) return;

    const stmtSale = sqliteDb.prepare(`
      INSERT INTO sales (invoice_no, customer_name, subtotal, discount_amount, total_amount, paid_amount, change_amount, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const saleInfo = stmtSale.run(
      billNo,
      saleData.customer_name || 'Walk-in Customer',
      Number(saleData.subtotal || 0),
      Number(saleData.discount || 0),
      Number(saleData.total_amount || 0),
      Number(saleData.paid_amount || saleData.total_amount || 0),
      Number(saleData.change_amount || 0),
      saleData.payment_method || 'Cash'
    );
    const saleId = saleInfo.lastInsertRowid;

    const stmtItem = sqliteDb.prepare(`
      INSERT INTO sale_items (sale_id, medicine_id, medicine_name, unit_price, cost_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `);
    const stmtReduceStock = sqliteDb.prepare(`
      UPDATE medicines SET stock_quantity = MAX(0, stock_quantity - ?) WHERE name = ?
    `);

    if (Array.isArray(saleData.items)) {
      for (const item of saleData.items) {
        stmtItem.run(saleId, null, item.medicine_name, Number(item.unit_price || 0), Number(item.quantity || 1), Number(item.total_price || 0));
        stmtReduceStock.run(Number(item.quantity || 1), item.medicine_name);
      }
    }
    console.log(`💾 Auto-Synced Sale [${billNo}] into Local SQLite database.`);
  } catch (err) {
    console.warn('⚠️ SQLite Sale Sync error:', err.message);
  }
}

function syncSupplierToSQLite(data) {
  try {
    const existing = sqliteDb.prepare('SELECT id FROM suppliers WHERE name = ?').get(data.name);
    if (existing) {
      sqliteDb.prepare('UPDATE suppliers SET phone = ?, email = ?, address = ? WHERE id = ?')
        .run(data.phone || '', data.email || '', data.address || '', existing.id);
    } else {
      sqliteDb.prepare(`
        INSERT INTO suppliers (name, contact_person, phone, email, address, total_purchased, total_paid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(data.name, data.contact_person || '', data.phone || '', data.email || '', data.address || '', Number(data.balance_due || 0), 0);
    }
  } catch (err) {
    console.warn('⚠️ SQLite Supplier Sync error:', err.message);
  }
}

// Background sync: pulls latest medicines from MongoDB into SQLite on startup
async function mirrorMongoToSQLite() {
  try {
    console.log('🔄 Mirroring Cloud (MongoDB) Data into Local SQLite...');
    const meds = await Medicine.find();
    for (const m of meds) {
      syncMedicineToSQLite(m);
    }
    const sups = await Supplier.find();
    for (const s of sups) {
      syncSupplierToSQLite(s);
    }
    console.log(`✅ Mirrored ${meds.length} Medicines & ${sups.length} Suppliers into Local SQLite!`);
  } catch (err) {
    console.warn('⚠️ Mirroring Warning:', err.message);
  }
}

// ==================== INITIALIZATION ====================

export async function initHybridDatabase() {
  // 1. Initialize local SQLite database
  console.log('📦 Initializing Local SQLite Engine...');
  try {
    initSqlite();
    console.log('✅ Local SQLite Ready.');
  } catch (err) {
    console.error('⚠️ SQLite Init Warning:', err.message);
  }

  // 2. Try connecting to MongoDB Atlas
  console.log('🌐 Checking Cloud Database (MongoDB Atlas)...');
  const mongoConnected = await connectMongoDB();

  if (mongoConnected) {
    currentMode = 'online';
    console.log('🟢 SYSTEM RUNNING IN: [ONLINE CLOUD MODE] (MongoDB Atlas)');
    // Background mirror into SQLite so offline is always 100% up-to-date!
    mirrorMongoToSQLite();
  } else {
    currentMode = 'offline';
    console.log('🟠 SYSTEM RUNNING IN: [OFFLINE STANDALONE MODE] (Local SQLite)');
  }

  return currentMode;
}

export function getSystemMode() {
  return {
    mode: currentMode,
    isOnline: currentMode === 'online',
    database: currentMode === 'online' ? 'MongoDB Atlas (Cloud) + SQLite Auto-Sync' : 'Local SQLite (Offline)',
    dualWriteEnabled: true
  };
}

// ==================== HYBRID CRUD METHODS ====================

// --- AUTH ---
export async function authenticateUser(username, password) {
  if (currentMode === 'online') {
    const user = await User.findOne({ username: username.trim(), password });
    if (!user) return null;
    return {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    };
  } else {
    const user = sqliteDb.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password = ?')
      .get(username.trim(), password);
    return user || null;
  }
}

export async function getAllUsers() {
  if (currentMode === 'online') {
    return await User.find({}, 'username name role createdAt').sort({ createdAt: 1 });
  } else {
    return sqliteDb.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY id ASC').all();
  }
}

// --- MEDICINES ---
export async function getAllMedicines() {
  if (currentMode === 'online') {
    const list = await Medicine.find().sort({ name: 1 });
    return list.map(m => ({
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
      reorder_level: m.reorder_level || 10,
      min_stock_alert: m.reorder_level || 10,
      expiry_date: m.expiry_date,
      batch_no: m.batch_number,
      batch_number: m.batch_number,
      supplier_name: m.supplier_name
    }));
  } else {
    const list = sqliteDb.prepare(`
      SELECT m.*, c.name as category_name, s.name as supplier_name 
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      ORDER BY m.name ASC
    `).all();
    return list.map(m => ({
      ...m,
      reorder_level: m.min_stock_alert || 10,
      category: m.category_name || 'General',
      batch_number: m.batch_no
    }));
  }
}

export async function createMedicine(data) {
  // 1. Dual-Write: Always save into local SQLite
  syncMedicineToSQLite(data);

  if (currentMode === 'online') {
    const med = await Medicine.create({
      name: data.name,
      generic_name: data.generic_name || '',
      category: data.category || 'General',
      dosage: data.dosage || '',
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
      stock_quantity: Number(data.stock_quantity || 0),
      reorder_level: Number(data.reorder_level || data.min_stock_alert || 10),
      expiry_date: data.expiry_date,
      batch_number: data.batch_no || data.batch_number || '',
      supplier_name: data.supplier_name || ''
    });
    return { id: med._id, ...med.toObject() };
  } else {
    const row = sqliteDb.prepare('SELECT id FROM medicines WHERE name = ?').get(data.name);
    return { id: row ? row.id : Date.now(), ...data };
  }
}

export async function updateMedicine(id, data) {
  // Dual-write to SQLite
  syncMedicineToSQLite(data);

  if (currentMode === 'online') {
    const med = await Medicine.findByIdAndUpdate(id, data, { new: true });
    return med ? { id: med._id, ...med.toObject() } : null;
  } else {
    return { id, ...data };
  }
}

export async function deleteMedicine(id) {
  if (currentMode === 'online') {
    const med = await Medicine.findById(id);
    if (med) {
      sqliteDb.prepare('DELETE FROM medicines WHERE name = ?').run(med.name);
    }
    await Medicine.findByIdAndDelete(id);
  } else {
    sqliteDb.prepare('DELETE FROM medicines WHERE id = ?').run(id);
  }
  return true;
}

// --- CATEGORIES ---
export async function getAllCategories() {
  if (currentMode === 'online') {
    return await Category.find().sort({ name: 1 });
  } else {
    return sqliteDb.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  }
}

export async function createCategory(name, description = '') {
  try {
    sqliteDb.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)').run(name, description);
  } catch (e) {}

  if (currentMode === 'online') {
    return await Category.create({ name, description });
  } else {
    const row = sqliteDb.prepare('SELECT id FROM categories WHERE name = ?').get(name);
    return { id: row ? row.id : Date.now(), name, description };
  }
}

// --- SUPPLIERS ---
export async function getAllSuppliers() {
  if (currentMode === 'online') {
    return await Supplier.find().sort({ name: 1 });
  } else {
    return sqliteDb.prepare('SELECT *, (total_purchased - total_paid) as balance_due FROM suppliers ORDER BY name ASC').all();
  }
}

export async function createSupplier(data) {
  syncSupplierToSQLite(data);

  if (currentMode === 'online') {
    return await Supplier.create(data);
  } else {
    const row = sqliteDb.prepare('SELECT id FROM suppliers WHERE name = ?').get(data.name);
    return { id: row ? row.id : Date.now(), ...data };
  }
}

export async function paySupplier(id, amount) {
  const payAmt = Number(amount || 0);
  if (currentMode === 'online') {
    const sup = await Supplier.findById(id);
    if (!sup) return null;
    sup.balance_due = Math.max(0, (sup.balance_due || 0) - payAmt);
    await sup.save();

    // Sync to SQLite
    sqliteDb.prepare('UPDATE suppliers SET total_paid = total_paid + ? WHERE name = ?').run(payAmt, sup.name);
    return sup;
  } else {
    sqliteDb.prepare('UPDATE suppliers SET total_paid = total_paid + ? WHERE id = ?').run(payAmt, id);
    return sqliteDb.prepare('SELECT *, (total_purchased - total_paid) as balance_due FROM suppliers WHERE id = ?').get(id);
  }
}

// --- DEALER PURCHASES (GRN) ---
export async function getAllDealerPurchases() {
  if (currentMode === 'online') {
    return await DealerPurchase.find().sort({ createdAt: -1 });
  } else {
    return sqliteDb.prepare(`
      SELECT dp.*, s.name as supplier_name 
      FROM dealer_purchases dp
      JOIN suppliers s ON dp.supplier_id = s.id
      ORDER BY dp.created_at DESC
    `).all();
  }
}

export async function createDealerPurchase(data) {
  const { supplier_id, invoice_number, items, amount_paid } = data;
  const safeItems = Array.isArray(items) ? items : [];
  let total_amount = 0;

  const formattedItems = safeItems.map(item => {
    const cost = Number(item.cost_price || 0);
    const qty = Number(item.quantity || 1);
    const itemTotal = cost * qty;
    total_amount += itemTotal;
    return {
      medicine_name: item.medicine_name,
      dosage: item.dosage || '',
      batch_number: item.batch_number || item.batch_no || '',
      expiry_date: item.expiry_date,
      quantity: qty,
      cost_price: cost,
      selling_price: Number(item.selling_price || 0),
      total_cost: itemTotal
    };
  });

  const paid = Number(amount_paid || 0);
  const balance_due = total_amount - paid;
  const grn_number = `GRN-${Date.now().toString().slice(-6)}`;

  // Dual-Write Stock into Local SQLite
  for (const item of formattedItems) {
    syncMedicineToSQLite({
      name: item.medicine_name,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      stock_quantity: item.quantity,
      expiry_date: item.expiry_date,
      batch_number: item.batch_number
    });
  }

  if (currentMode === 'online') {
    const supplier = await Supplier.findById(supplier_id);
    const supName = supplier ? supplier.name : 'Unknown';

    for (const item of formattedItems) {
      let med = await Medicine.findOne({ name: item.medicine_name });
      if (med) {
        med.stock_quantity += item.quantity;
        med.cost_price = item.cost_price;
        med.selling_price = item.selling_price;
        med.expiry_date = item.expiry_date;
        await med.save();
      } else {
        await Medicine.create({
          name: item.medicine_name,
          category: 'General',
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          stock_quantity: item.quantity,
          expiry_date: item.expiry_date,
          supplier_name: supName
        });
      }
    }

    const grn = await DealerPurchase.create({
      grn_number,
      supplier_name: supName,
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
    return { id: grn._id, ...grn.toObject() };
  } else {
    // Local SQLite transaction
    const sup = sqliteDb.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id);
    const supName = sup ? sup.name : 'Unknown';

    const insertGRN = sqliteDb.prepare(`
      INSERT INTO dealer_purchases (invoice_no, supplier_id, purchase_date, total_amount, paid_amount, payment_status)
      VALUES (?, ?, date('now'), ?, ?, ?)
    `);
    const status = balance_due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');
    const grnInfo = insertGRN.run(invoice_number || grn_number, supplier_id, total_amount, paid, status);

    return { id: grnInfo.lastInsertRowid, grn_number, total_amount, status };
  }
}

// --- CUSTOMERS & DOCTORS ---
export async function getAllCustomers() {
  if (currentMode === 'online') {
    return await Customer.find().sort({ name: 1 });
  } else {
    return sqliteDb.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  }
}

export async function createCustomer(data) {
  try {
    sqliteDb.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)')
      .run(data.name, data.phone || '', data.address || '');
  } catch (e) {}

  if (currentMode === 'online') {
    return await Customer.create(data);
  } else {
    const row = sqliteDb.prepare('SELECT id FROM customers WHERE name = ?').get(data.name);
    return { id: row ? row.id : Date.now(), ...data };
  }
}

export async function getAllDoctors() {
  if (currentMode === 'online') {
    return await Doctor.find().sort({ name: 1 });
  } else {
    return sqliteDb.prepare('SELECT * FROM doctors ORDER BY name ASC').all();
  }
}

export async function createDoctor(data) {
  try {
    sqliteDb.prepare('INSERT INTO doctors (name, specialization, hospital, phone, slmc_no) VALUES (?, ?, ?, ?, ?)')
      .run(data.name, data.specialization || '', data.hospital || '', data.phone || '', data.reg_number || data.slmc_no || '');
  } catch (e) {}

  if (currentMode === 'online') {
    return await Doctor.create(data);
  } else {
    const row = sqliteDb.prepare('SELECT id FROM doctors WHERE name = ?').get(data.name);
    return { id: row ? row.id : Date.now(), ...data };
  }
}

// --- SALES (POS BILLING WITH DUAL-WRITE) ---
export async function getAllSales() {
  if (currentMode === 'online') {
    return await Sale.find().sort({ createdAt: -1 }).limit(50);
  } else {
    return sqliteDb.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 50').all();
  }
}

export async function createSale(data) {
  const { customer_name, doctor_name, cashier_name, subtotal, discount, total_amount, paid_amount, change_amount, payment_method, items } = data;
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
      batch_number: i.batch_number || i.batch_no || '',
      unit_price: price,
      quantity: qty,
      total_price: total
    };
  });

  const finalSubtotal = (!isNaN(Number(subtotal)) && Number(subtotal) > 0) ? Number(subtotal) : calculatedSubtotal;
  const finalDiscount = Number(discount) || 0;
  const finalTotal = (!isNaN(Number(total_amount)) && Number(total_amount) > 0) ? Number(total_amount) : Math.max(0, finalSubtotal - finalDiscount);
  const finalPaid = (!isNaN(Number(paid_amount)) && Number(paid_amount) > 0) ? Number(paid_amount) : finalTotal;
  const finalChange = (!isNaN(Number(change_amount))) ? Number(change_amount) : (finalPaid > finalTotal ? Math.max(0, finalPaid - finalTotal) : 0);
  const bill_number = `INV-${Date.now().toString().slice(-6)}`;

  const salePayload = {
    bill_number,
    customer_name: customer_name || 'Walk-in Customer',
    doctor_name: doctor_name || '',
    cashier_name: cashier_name || 'Staff',
    subtotal: finalSubtotal,
    discount: finalDiscount,
    total_amount: finalTotal,
    paid_amount: finalPaid,
    change_amount: finalChange,
    payment_method: payment_method || 'Cash',
    items: formattedItems
  };

  // 🔥 1. Dual-Write: Always save into Local SQLite immediately!
  syncSaleToSQLite(salePayload);

  // 2. If Online, save into MongoDB Atlas
  if (currentMode === 'online') {
    for (const item of formattedItems) {
      if (item.medicine_id) {
        const med = await Medicine.findById(item.medicine_id);
        if (med) {
          med.stock_quantity = Math.max(0, med.stock_quantity - item.quantity);
          await med.save();
        }
      }
    }

    const sale = await Sale.create(salePayload);
    return { id: sale._id, ...sale.toObject() };
  } else {
    // Offline mode return
    const row = sqliteDb.prepare('SELECT id FROM sales WHERE invoice_no = ?').get(bill_number);
    return {
      id: row ? row.id : Date.now(),
      ...salePayload
    };
  }
}

// --- DASHBOARD STATS ---
export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  if (currentMode === 'online') {
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

    return {
      todayRevenue,
      todayBillsCount,
      todayProfit: Math.round(todayRevenue * 0.25),
      totalMedicines,
      lowStockCount: lowStockMeds.length,
      expiredCount: expiredMeds.length,
      expiringSoonCount: expiringSoonMeds.length,
      totalDealerDue,
      weeklySales: []
    };
  } else {
    // Offline SQLite Stats
    const todaySales = sqliteDb.prepare("SELECT * FROM sales WHERE date(created_at) = date('now')").all();
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const todayBillsCount = todaySales.length;

    const totalMedicinesRow = sqliteDb.prepare('SELECT COUNT(*) as count FROM medicines').get();
    const totalMedicines = totalMedicinesRow ? totalMedicinesRow.count : 0;

    const lowStockRow = sqliteDb.prepare('SELECT COUNT(*) as count FROM medicines WHERE stock_quantity <= min_stock_alert').get();
    const lowStockCount = lowStockRow ? lowStockRow.count : 0;

    const expiredRow = sqliteDb.prepare("SELECT COUNT(*) as count FROM medicines WHERE date(expiry_date) < date('now')").get();
    const expiredCount = expiredRow ? expiredRow.count : 0;

    const expiringSoonRow = sqliteDb.prepare("SELECT COUNT(*) as count FROM medicines WHERE date(expiry_date) >= date('now') AND date(expiry_date) <= date('now', '+90 days')").get();
    const expiringSoonCount = expiringSoonRow ? expiringSoonRow.count : 0;

    const dealerDueRow = sqliteDb.prepare('SELECT SUM(total_purchased - total_paid) as totalDue FROM suppliers').get();
    const totalDealerDue = dealerDueRow && dealerDueRow.totalDue ? dealerDueRow.totalDue : 0;

    return {
      todayRevenue,
      todayBillsCount,
      todayProfit: Math.round(todayRevenue * 0.25),
      totalMedicines,
      lowStockCount,
      expiredCount,
      expiringSoonCount,
      totalDealerDue,
      weeklySales: []
    };
  }
}
