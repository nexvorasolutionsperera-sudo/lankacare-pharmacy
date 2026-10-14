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

export async function initHybridDatabase() {
  // 1. Always initialize local SQLite database (for offline fallback)
  console.log('📦 Initializing Local SQLite Engine...');
  try {
    initSqlite();
    console.log('✅ Local SQLite Ready.');
  } catch (err) {
    console.error('⚠️ SQLite Init Warning:', err.message);
  }

  // 2. Try connecting to MongoDB Atlas (Internet check)
  console.log('🌐 Checking Cloud Database (MongoDB Atlas)...');
  const mongoConnected = await connectMongoDB();

  if (mongoConnected) {
    currentMode = 'online';
    console.log('🟢 SYSTEM RUNNING IN: [ONLINE CLOUD MODE] (MongoDB Atlas)');
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
    database: currentMode === 'online' ? 'MongoDB Atlas (Cloud)' : 'Local SQLite (Offline)'
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
    const stmt = sqliteDb.prepare(`
      INSERT INTO medicines (name, generic_name, dosage, cost_price, selling_price, stock_quantity, min_stock_alert, expiry_date, batch_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.name,
      data.generic_name || '',
      data.dosage || '',
      Number(data.cost_price),
      Number(data.selling_price),
      Number(data.stock_quantity || 0),
      Number(data.min_stock_alert || data.reorder_level || 10),
      data.expiry_date,
      data.batch_no || data.batch_number || ''
    );
    return { id: info.lastInsertRowid, ...data };
  }
}

export async function updateMedicine(id, data) {
  if (currentMode === 'online') {
    const med = await Medicine.findByIdAndUpdate(id, data, { new: true });
    return med ? { id: med._id, ...med.toObject() } : null;
  } else {
    const stmt = sqliteDb.prepare(`
      UPDATE medicines SET
        name = COALESCE(?, name),
        cost_price = COALESCE(?, cost_price),
        selling_price = COALESCE(?, selling_price),
        stock_quantity = COALESCE(?, stock_quantity),
        expiry_date = COALESCE(?, expiry_date)
      WHERE id = ?
    `);
    stmt.run(data.name, data.cost_price, data.selling_price, data.stock_quantity, data.expiry_date, id);
    return { id, ...data };
  }
}

export async function deleteMedicine(id) {
  if (currentMode === 'online') {
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
  if (currentMode === 'online') {
    return await Category.create({ name, description });
  } else {
    const info = sqliteDb.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description);
    return { id: info.lastInsertRowid, name, description };
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
  if (currentMode === 'online') {
    return await Supplier.create(data);
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, total_purchased, total_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.name,
      data.contact_person || '',
      data.phone || '',
      data.email || '',
      data.address || '',
      Number(data.balance_due || 0),
      0
    );
    return { id: info.lastInsertRowid, ...data };
  }
}

export async function paySupplier(id, amount) {
  const payAmt = Number(amount || 0);
  if (currentMode === 'online') {
    const sup = await Supplier.findById(id);
    if (!sup) return null;
    sup.balance_due = Math.max(0, (sup.balance_due || 0) - payAmt);
    await sup.save();
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

  if (currentMode === 'online') {
    const supplier = await Supplier.findById(supplier_id);
    const supName = supplier ? supplier.name : 'Unknown';

    // Update medicines stock in Mongo
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
    const purchaseId = grnInfo.lastInsertRowid;

    // Items and stock update
    const insertItem = sqliteDb.prepare(`
      INSERT INTO dealer_purchase_items (purchase_id, medicine_name, quantity, cost_price, selling_price, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateStock = sqliteDb.prepare(`
      UPDATE medicines SET stock_quantity = stock_quantity + ?, cost_price = ?, selling_price = ?, expiry_date = ?
      WHERE name = ?
    `);

    for (const item of formattedItems) {
      insertItem.run(purchaseId, item.medicine_name, item.quantity, item.cost_price, item.selling_price, item.expiry_date);
      const res = updateStock.run(item.quantity, item.cost_price, item.selling_price, item.expiry_date, item.medicine_name);
      if (res.changes === 0) {
        sqliteDb.prepare(`
          INSERT INTO medicines (name, cost_price, selling_price, stock_quantity, expiry_date, batch_no)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(item.medicine_name, item.cost_price, item.selling_price, item.quantity, item.expiry_date, item.batch_number);
      }
    }

    // Update supplier balance
    sqliteDb.prepare('UPDATE suppliers SET total_purchased = total_purchased + ?, total_paid = total_paid + ? WHERE id = ?')
      .run(total_amount, paid, supplier_id);

    return { id: purchaseId, grn_number, total_amount, status };
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
  if (currentMode === 'online') {
    return await Customer.create(data);
  } else {
    const stmt = sqliteDb.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)');
    const info = stmt.run(data.name, data.phone || '', data.address || '');
    return { id: info.lastInsertRowid, ...data };
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
  if (currentMode === 'online') {
    return await Doctor.create(data);
  } else {
    const stmt = sqliteDb.prepare('INSERT INTO doctors (name, specialization, hospital, phone, slmc_no) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(data.name, data.specialization || '', data.hospital || '', data.phone || '', data.reg_number || data.slmc_no || '');
    return { id: info.lastInsertRowid, ...data };
  }
}

// --- SALES (POS BILLING) ---
export async function getAllSales() {
  if (currentMode === 'online') {
    return await Sale.find().sort({ createdAt: -1 }).limit(50);
  } else {
    return sqliteDb.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 50').all();
  }
}

export async function createSale(data) {
  const { customer_name, doctor_name, cashier_name, subtotal, discount, total_amount, payment_method, items } = data;
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
  const bill_number = `INV-${Date.now().toString().slice(-6)}`;

  if (currentMode === 'online') {
    // Online: Decrement in Mongo
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
      customer_name: customer_name || 'Walking Customer',
      doctor_name: doctor_name || '',
      cashier_name: cashier_name || 'Staff',
      subtotal: finalSubtotal,
      discount: finalDiscount,
      total_amount: finalTotal,
      payment_method: payment_method || 'Cash',
      items: formattedItems
    });
    return { id: sale._id, ...sale.toObject() };
  } else {
    // Offline: SQLite Transaction
    const stmtSale = sqliteDb.prepare(`
      INSERT INTO sales (invoice_no, customer_name, subtotal, discount_amount, total_amount, paid_amount, change_amount, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);
    const saleInfo = stmtSale.run(bill_number, customer_name || 'Walking Customer', finalSubtotal, finalDiscount, finalTotal, finalTotal, payment_method || 'Cash');
    const saleId = saleInfo.lastInsertRowid;

    const stmtItem = sqliteDb.prepare(`
      INSERT INTO sale_items (sale_id, medicine_id, medicine_name, unit_price, cost_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `);
    const stmtReduceStock = sqliteDb.prepare(`
      UPDATE medicines SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ? OR name = ?
    `);

    for (const item of formattedItems) {
      stmtItem.run(saleId, item.medicine_id || null, item.medicine_name, item.unit_price, item.quantity, item.total_price);
      stmtReduceStock.run(item.quantity, item.medicine_id || 0, item.medicine_name);
    }

    return {
      id: saleId,
      bill_number,
      invoice_no: bill_number,
      subtotal: finalSubtotal,
      total_amount: finalTotal,
      items: formattedItems
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
