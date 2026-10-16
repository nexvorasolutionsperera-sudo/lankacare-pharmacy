import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'pharmacy.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency and speed
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_id TEXT,
      total_purchased REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      generic_name TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      dosage TEXT,
      form TEXT DEFAULT 'Tablet',
      batch_no TEXT NOT NULL,
      barcode TEXT,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER DEFAULT 10,
      expiry_date TEXT NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      rack_location TEXT,
      requires_prescription INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      allergies TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slmc_no TEXT,
      hospital TEXT,
      phone TEXT,
      specialization TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      customer_name TEXT,
      subtotal REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL,
      change_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
      medicine_name TEXT NOT NULL,
      batch_no TEXT,
      dosage TEXT,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dealer_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      purchase_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Unpaid',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dealer_purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES dealer_purchases(id) ON DELETE CASCADE,
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
      medicine_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      cost_price REAL NOT NULL,
      selling_price REAL,
      batch_no TEXT,
      expiry_date TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Pharmacist',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicare_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      patient_name TEXT NOT NULL,
      patient_age INTEGER DEFAULT 0,
      patient_gender TEXT DEFAULT 'Unspecified',
      phone TEXT,
      doctor_name TEXT DEFAULT 'Self / OTC',
      fasting_status TEXT DEFAULT 'Not Required',
      tests_json TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      status TEXT DEFAULT 'Sample Collected',
      sample_collected_at TEXT,
      report_ready_at TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS communication_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      service_name TEXT NOT NULL,
      recipient TEXT,
      details TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      cost_amount REAL DEFAULT 0,
      commission_profit REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      status TEXT DEFAULT 'Success',
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicare_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'Blood Test',
      sample_type TEXT DEFAULT 'Blood',
      price REAL NOT NULL,
      default_fasting TEXT DEFAULT 'Not Required',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_credit_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      cheque_no TEXT,
      bank_name TEXT,
      notes TEXT,
      received_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE NOT NULL,
      invoice_no TEXT,
      customer_name TEXT DEFAULT 'Walk-in Customer',
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
      medicine_name TEXT NOT NULL,
      batch_no TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      refund_amount REAL NOT NULL,
      reason TEXT DEFAULT 'Customer Request',
      condition TEXT DEFAULT 'Restock to Inventory',
      refund_method TEXT DEFAULT 'Cash',
      processed_by TEXT DEFAULT 'Admin',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      cheque_no TEXT,
      paid_to TEXT,
      notes TEXT,
      recorded_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adjustment_number TEXT UNIQUE NOT NULL,
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
      medicine_name TEXT NOT NULL,
      batch_no TEXT,
      previous_qty INTEGER NOT NULL,
      adjusted_qty INTEGER NOT NULL,
      difference INTEGER NOT NULL,
      reason TEXT NOT NULL,
      adjusted_by TEXT DEFAULT 'Admin',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe schema migrations for existing tables
  try { db.exec('ALTER TABLE customers ADD COLUMN credit_balance REAL DEFAULT 0'); } catch (e) {}
  try { db.exec('ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0'); } catch (e) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN cheque_no TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN bank_name TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN cheque_date TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE dealer_purchases ADD COLUMN payment_method TEXT DEFAULT "Cash"'); } catch (e) {}
  try { db.exec('ALTER TABLE dealer_purchases ADD COLUMN cheque_no TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE dealer_purchases ADD COLUMN cheque_date TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE dealer_purchases ADD COLUMN grn_number TEXT'); } catch (e) {}

  // Seed default users if not present
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', 'admin123', 'Pharmacist (Admin)', 'Admin');
    insertUser.run('cashier', 'cashier123', 'Counter Cashier', 'Cashier');
  }

  // Seed default medicare catalog if not present
  const catalogCount = db.prepare('SELECT COUNT(*) as count FROM medicare_catalog').get().count;
  if (catalogCount === 0) {
    seedMedicareCatalog();
  }

  seedInitialData();
}

function seedMedicareCatalog() {
  const insertTest = db.prepare(`
    INSERT INTO medicare_catalog (name, category, sample_type, price, default_fasting)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialTests = [
    ['Fasting Blood Sugar (FBS)', 'Blood Test', 'Fluoride Plasma', 250, 'Fasting (10-12 hrs)'],
    ['Random Blood Sugar (RBS)', 'Blood Test', 'Capillary / Plasma', 200, 'Non-Fasting'],
    ['Post-Prandial Blood Sugar (PPBS)', 'Blood Test', 'Fluoride Plasma', 250, '2 hrs Post-Meal'],
    ['Full Blood Count (FBC / CBC)', 'Blood Test', 'EDTA Blood', 650, 'Not Required'],
    ['HbA1c (Glycated Hemoglobin)', 'Blood Test', 'EDTA Blood', 1600, 'Not Required'],
    ['Lipid Profile (Cholesterol, HDL, LDL, Trig)', 'Blood Test', 'Serum', 1800, 'Fasting (12 hrs)'],
    ['Serum Creatinine & eGFR (Kidney)', 'Blood Test', 'Serum', 650, 'Not Required'],
    ['Liver Function Test (LFT Panel)', 'Blood Test', 'Serum', 2400, 'Fasting Preferred'],
    ['Serum Uric Acid', 'Blood Test', 'Serum', 600, 'Not Required'],
    ['Serum Electrolytes (Na, K, Cl)', 'Blood Test', 'Serum', 1200, 'Not Required'],
    ['Dengue NS1 Antigen Rapid', 'Blood Test', 'Whole Blood', 1500, 'Not Required'],
    ['Dengue IgG / IgM Antibody', 'Blood Test', 'Serum', 1600, 'Not Required'],
    ['ESR (Erythrocyte Sedimentation)', 'Blood Test', 'Citrate Blood', 350, 'Not Required'],
    ['Blood Grouping & Rh Factor', 'Blood Test', 'EDTA Blood', 500, 'Not Required'],
    ['TSH (Thyroid Stimulating Hormone)', 'Blood Test', 'Serum', 1200, 'Not Required'],
    ['Thyroid Panel (Free T4 & TSH)', 'Blood Test', 'Serum', 2200, 'Not Required'],
    ['Urine Full Report (UFR)', 'Urine & Other', 'Midstream Urine', 400, 'Not Required'],
    ['Urine hCG (Pregnancy Screen)', 'Urine & Other', 'Morning Urine', 350, 'Not Required'],
    ['12-Lead ECG with Doctor Report', 'ECG & Cardiac', 'Clinical Procedure', 850, 'Not Required'],
    ['Rhythm Strip ECG Monitoring', 'ECG & Cardiac', 'Clinical Procedure', 500, 'Not Required'],
    ['Digital Blood Pressure & Pulse Check', 'Clinical Medicare', 'Clinical Check', 100, 'Not Required'],
    ['Quick Glucometer Blood Sugar Check', 'Clinical Medicare', 'Capillary Blood', 150, 'Not Required'],
    ['Clinical Nebulization (Adult / Child)', 'Clinical Medicare', 'Nursing Care', 450, 'Not Required'],
    ['Minor Wound Dressing & Antiseptic Care', 'Clinical Medicare', 'Nursing Care', 400, 'Not Required'],
    ['Major Wound Dressing & Bandaging', 'Clinical Medicare', 'Nursing Care', 750, 'Not Required'],
    ['IM / Subcutaneous Injection Admin', 'Clinical Medicare', 'Nursing Care', 250, 'Not Required'],
    ['IV Cannula Setup & Saline Infusion', 'Clinical Medicare', 'Nursing Care', 1200, 'Not Required'],
    ['Suture / Stitch Removal Care', 'Clinical Medicare', 'Nursing Care', 500, 'Not Required']
  ];

  for (const t of initialTests) {
    insertTest.run(t[0], t[1], t[2], t[3], t[4]);
  }
}

function seedInitialData() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount > 0) return;

  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  insertCategory.run('Antibiotics', 'Medicines that fight bacterial infections');
  insertCategory.run('Pain Relief & Analgesics', 'Pain management and fever reducing medications');
  insertCategory.run('Cardiovascular', 'Heart and blood pressure management medications');
  insertCategory.run('Antihistamines & Allergy', 'Allergy relief, cough and cold treatments');
  insertCategory.run('Gastrointestinal', 'Stomach, antacid, and acid reflux treatments');
  insertCategory.run('Vitamins & Supplements', 'Nutritional and dietary supplements');
  insertCategory.run('Diabetes Care', 'Blood glucose regulation medications');
  insertCategory.run('Topical & Skin Care', 'Ointments, antiseptic creams, and lotions');
  insertCategory.run('Grocery & Essentials', 'Daily grocery, baby food, milk powder & healthy snacks');
  insertCategory.run('Personal Care & Hygiene', 'Soaps, baby care, sanitizers and oral hygiene');
  insertCategory.run('Bookshop & Stationery', 'CR exercise books, pens, pencils, photocopy paper, files and office supplies');
  insertCategory.run('School & Educational', 'Geometry boxes, drawing books, past papers, coloring & school stationery');

  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, contact_person, phone, email, address, tax_id, total_purchased, total_paid) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSupplier.run('Hemas Pharmaceuticals Pvt Ltd', 'Sunil Perera', '011-2484000', 'orders@hemaspharma.lk', 'No. 36, Bristol Street, Colombo 01', 'BR102938', 125000, 100000);
  insertSupplier.run('State Pharmaceuticals Corp (SPC)', 'Nimal Dharmadasa', '011-2320356', 'spc@spc.gov.lk', '75 Sir Baron Jayathilake Mawatha, Colombo 01', 'BR994821', 85000, 85000);
  insertSupplier.run('A. Baur & Co. Pharmaceuticals', 'Kamal Fernando', '011-4728700', 'healthcare@baurs.com', '62 Jethawana Road, Colombo 14', 'BR482019', 45000, 30000);
  insertSupplier.run('George Steuart Health Pvt Ltd', 'Dulan Wickramasinghe', '011-4702500', 'health@georgesteuart.com', 'No. 19, St. Michael’s Road, Colombo 03', 'BR771920', 60000, 60000);

  const insertDoctor = db.prepare('INSERT INTO doctors (name, slmc_no, hospital, phone, specialization) VALUES (?, ?, ?, ?, ?)');
  insertDoctor.run('Dr. Asela Gunawardena', 'SLMC-14285', 'National Hospital Colombo', '077-1234567', 'Consultant Physician');
  insertDoctor.run('Dr. Dilini Rajapaksa', 'SLMC-19842', 'Asiri Central Hospital', '071-9876543', 'Pediatrician');
  insertDoctor.run('Dr. K. S. Bandara', 'SLMC-09432', 'General Hospital Kandy', '076-5544332', 'Cardiologist');

  const insertCustomer = db.prepare('INSERT INTO customers (name, phone, email, address, allergies, notes) VALUES (?, ?, ?, ?, ?, ?)');
  insertCustomer.run('Kasun Wijesinghe', '077-4455667', 'kasun@gmail.com', '12/A, Kandy Road, Kiribathgoda', 'Penicillin Allergy', 'Regular BP checkup');
  insertCustomer.run('Priyantha Kumara', '071-3322110', 'priyantha@yahoo.com', '88, Galle Road, Dehiwala', 'None', 'Asthmatic patient');
  insertCustomer.run('Sanduni Wickramasinghe', '076-8899001', 'sanduni.w@gmail.com', '45, High Level Rd, Nugegoda', 'Sulfa drugs', 'Frequent customer');

  // Today's date calculations for realistic expiry testing
  const today = new Date();
  const format = (d) => d.toISOString().split('T')[0];
  
  const future1Year = new Date(today); future1Year.setFullYear(today.getFullYear() + 1);
  const future6Months = new Date(today); future6Months.setMonth(today.getMonth() + 6);
  const expiringSoon20Days = new Date(today); expiringSoon20Days.setDate(today.getDate() + 20);
  const expiringSoon45Days = new Date(today); expiringSoon45Days.setDate(today.getDate() + 45);
  const expired15DaysAgo = new Date(today); expired15DaysAgo.setDate(today.getDate() - 15);

  const insertMed = db.prepare(`
    INSERT INTO medicines (
      name, generic_name, category_id, dosage, form, batch_no, barcode, 
      cost_price, selling_price, stock_quantity, min_stock_alert, expiry_date, 
      supplier_id, rack_location, requires_prescription
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMed.run('Panadol Actifast', 'Paracetamol', 2, '500mg', 'Tablet', 'BT-9021', '890103001', 4.50, 7.00, 240, 50, format(future1Year), 1, 'Rack A-1', 0);
  insertMed.run('Augmentin', 'Amoxicillin + Clavulanate', 1, '625mg', 'Tablet', 'BT-8842', '890103002', 85.00, 120.00, 45, 20, format(future6Months), 1, 'Rack B-3', 1);
  insertMed.run('Cetirizine (Alatrol)', 'Cetirizine Dihydrochloride', 4, '10mg', 'Tablet', 'BT-7721', '890103003', 6.00, 10.00, 18, 25, format(expiringSoon20Days), 2, 'Rack A-4', 0); // Low stock + Expiring soon!
  insertMed.run('Omeprazole (Omez)', 'Omeprazole', 5, '20mg', 'Capsule', 'BT-6619', '890103004', 12.00, 20.00, 8, 30, format(future1Year), 2, 'Rack C-2', 0); // Low stock!
  insertMed.run('Metformin (Glucophage)', 'Metformin Hydrochloride', 7, '500mg', 'Tablet', 'BT-5511', '890103005', 8.50, 14.00, 180, 50, format(future1Year), 3, 'Rack C-5', 1);
  insertMed.run('Losartan Potassium', 'Losartan', 3, '50mg', 'Tablet', 'BT-4402', '890103006', 15.00, 25.00, 95, 30, format(future6Months), 3, 'Rack D-1', 1);
  insertMed.run('Amoxil Syrup', 'Amoxicillin', 1, '125mg/5ml', 'Syrup', 'BT-3320', '890103007', 190.00, 260.00, 12, 10, format(expiringSoon45Days), 1, 'Fridge 1', 1);
  insertMed.run('Ventolin Inhaler', 'Salbutamol', 4, '100mcg', 'Inhaler', 'BT-2291', '890103008', 520.00, 750.00, 22, 15, format(future1Year), 4, 'Rack E-2', 1);
  insertMed.run('Vitamin C (Cebion)', 'Ascorbic Acid', 6, '500mg', 'Chewable', 'BT-1120', '890103009', 10.00, 18.00, 110, 30, format(future1Year), 4, 'Rack A-2', 0);
  insertMed.run('Betadine Antiseptic', 'Povidone Iodine 10%', 8, '15ml', 'Liquid', 'BT-0099', '890103010', 140.00, 210.00, 5, 10, format(expired15DaysAgo), 2, 'Rack F-1', 0); // Expired & Low stock!

  // Seed sample initial sale
  const saleStmt = db.prepare(`
    INSERT INTO sales (invoice_no, customer_id, doctor_id, customer_name, subtotal, discount_percent, discount_amount, tax_amount, total_amount, paid_amount, change_amount, payment_method, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))
  `);
  const saleInfo = saleStmt.run('INV-10001', 1, 1, 'Kasun Wijesinghe', 254.00, 0, 0, 0, 254.00, 300.00, 46.00, 'Cash', 'Walk-in prescription sale');
  
  const saleItemStmt = db.prepare(`
    INSERT INTO sale_items (sale_id, medicine_id, medicine_name, batch_no, dosage, unit_price, cost_price, quantity, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  saleItemStmt.run(saleInfo.lastInsertRowid, 1, 'Panadol Actifast', 'BT-9021', '500mg', 7.00, 4.50, 20, 140.00);
  saleItemStmt.run(saleInfo.lastInsertRowid, 6, 'Losartan Potassium', 'BT-4402', '50mg', 25.00, 15.00, 4, 100.00);
  saleItemStmt.run(saleInfo.lastInsertRowid, 9, 'Vitamin C (Cebion)', 'BT-1120', '500mg', 18.00, 10.00, 1, 14.00);
}

export default db;
