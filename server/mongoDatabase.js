import mongoose from 'mongoose';
import { User, Category, Supplier, Medicine, Customer, Doctor } from './models.js';

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables!');
    return false;
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ Connected to MongoDB Atlas successfully!');
    await seedMongoDatabase();
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    return false;
  }
}

async function seedMongoDatabase() {
  try {
    // 1. Seed or Update Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial users...');
      await User.create([
        { username: 'admin', password: 'admin123', name: 'Pharmacist (Admin)', role: 'admin' },
        { username: 'cashier', password: 'cashier123', name: 'Counter Cashier', role: 'cashier' }
      ]);
    } else {
      // Ensure default admin name is updated if it was previously Dr. Kasun Perera
      await User.updateOne({ username: 'admin', name: 'Dr. Kasun Perera' }, { $set: { name: 'Pharmacist (Admin)' } });
    }

    // 2. Seed Categories
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      console.log('🌱 Seeding default categories...');
      await Category.create([
        { name: 'Antibiotics', description: 'Bacterial infection medications' },
        { name: 'Pain Relief', description: 'Analgesics and antipyretics' },
        { name: 'Cardiovascular', description: 'Heart and blood pressure' },
        { name: 'Diabetes', description: 'Blood sugar management' },
        { name: 'Respiratory', description: 'Asthma, cough, and allergy' },
        { name: 'Gastrointestinal', description: 'Stomach and digestive' },
        { name: 'Vitamins & Supplements', description: 'Daily nutrients' },
        { name: 'Dermatological', description: 'Skin creams and lotions' },
        { name: 'Grocery & Essentials', description: 'Daily grocery, baby foods, milk powder & health snacks' },
        { name: 'Personal Care & Hygiene', description: 'Soaps, shampoos, oral care and hygiene items' }
      ]);
    } else {
      // Ensure Grocery categories exist
      await Category.updateOne({ name: 'Grocery & Essentials' }, { $setOnInsert: { description: 'Daily grocery, baby foods, milk powder & health snacks' } }, { upsert: true });
      await Category.updateOne({ name: 'Personal Care & Hygiene' }, { $setOnInsert: { description: 'Soaps, shampoos, oral care and hygiene items' } }, { upsert: true });
    }

    // Ensure sample grocery items exist in Medicine / Product catalog
    const groceryExists = await Medicine.findOne({ category: 'Grocery & Essentials' });
    if (!groceryExists) {
      console.log('🛒 Adding sample Grocery & Wellness items...');
      await Medicine.create([
        {
          name: 'Anchor Full Cream Milk Powder 400g',
          generic_name: 'Dairy Milk Powder',
          category: 'Grocery & Essentials',
          dosage: '400g Pack',
          cost_price: 1050,
          selling_price: 1180,
          stock_quantity: 45,
          reorder_level: 10,
          expiry_date: '2027-06-30',
          batch_number: 'ANC-8821'
        },
        {
          name: 'Nestomalt Energy Drink 400g',
          generic_name: 'Malt Food Drink',
          category: 'Grocery & Essentials',
          dosage: '400g Refill',
          cost_price: 820,
          selling_price: 940,
          stock_quantity: 35,
          reorder_level: 8,
          expiry_date: '2027-04-15',
          batch_number: 'NST-4412'
        },
        {
          name: 'Dettol Original Soap 100g',
          generic_name: 'Antiseptic Soap',
          category: 'Personal Care & Hygiene',
          dosage: '100g Bar',
          cost_price: 180,
          selling_price: 220,
          stock_quantity: 60,
          reorder_level: 15,
          expiry_date: '2028-01-01',
          batch_number: 'DET-1029'
        }
      ]);
    }

    // 3. Seed Suppliers
    const supCount = await Supplier.countDocuments();
    let sampleSupplier;
    if (supCount === 0) {
      console.log('🌱 Seeding default suppliers...');
      const createdSups = await Supplier.create([
        { name: 'State Pharmaceuticals Corp (SPC)', contact_person: 'Mr. Silva', phone: '0112345678', email: 'orders@spc.lk', balance_due: 15400 },
        { name: 'Emerchemie NB (Ceylon) Ltd', contact_person: 'Mr. Fernando', phone: '0112876543', email: 'sales@emerchemie.lk', balance_due: 34200 },
        { name: 'A. Baur & Co. (Pvt) Ltd', contact_person: 'Ms. Jayasinghe', phone: '0112456789', email: 'pharma@baurs.lk', balance_due: 0 },
        { name: 'George Steuart Health', contact_person: 'Mr. Perera', phone: '0112678901', email: 'info@gshealth.lk', balance_due: 8900 }
      ]);
      sampleSupplier = createdSups[0];
    } else {
      sampleSupplier = await Supplier.findOne();
    }

    // 4. Seed Doctors
    const docCount = await Doctor.countDocuments();
    if (docCount === 0) {
      await Doctor.create([
        { name: 'Dr. Sunil Wickramasinghe', specialization: 'Consultant Physician', hospital: 'National Hospital Colombo', phone: '0771234567', reg_number: 'SLMC-14285' },
        { name: 'Dr. Anoma Gunawardena', specialization: 'Pediatrician', hospital: 'Lady Ridgeway Hospital', phone: '0719876543', reg_number: 'SLMC-19834' },
        { name: 'Dr. Chaminda Bandara', specialization: 'Cardiologist', hospital: 'Kandy General Hospital', phone: '0765554433', reg_number: 'SLMC-22410' }
      ]);
    }

    // 5. Seed Customers
    const custCount = await Customer.countDocuments();
    if (custCount === 0) {
      await Customer.create([
        { name: 'Kamal Gunarathne', phone: '0772233445', address: '12 Galle Rd, Colombo 03', total_spent: 4500 },
        { name: 'Sunethra Peiris', phone: '0713344556', address: '45 Kandy Rd, Kelaniya', total_spent: 12400 },
        { name: 'Mahinda Ranasinghe', phone: '0764455667', address: '88 High Level Rd, Nugegoda', total_spent: 890 }
      ]);
    }

    // 6. Seed Medicines
    const medCount = await Medicine.countDocuments();
    if (medCount === 0) {
      console.log('🌱 Seeding initial medicines...');
      const supId = sampleSupplier ? sampleSupplier._id : null;
      const supName = sampleSupplier ? sampleSupplier.name : 'State Pharmaceuticals Corp';

      await Medicine.create([
        { name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', category: 'Antibiotics', dosage: '500mg Capsule', cost_price: 12.50, selling_price: 18.00, stock_quantity: 450, reorder_level: 100, expiry_date: '2027-08-31', batch_number: 'AMX-2024-01', supplier_id: supId, supplier_name: supName },
        { name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', category: 'Pain Relief', dosage: '500mg Tablet', cost_price: 2.20, selling_price: 4.50, stock_quantity: 1200, reorder_level: 200, expiry_date: '2027-12-31', batch_number: 'PCM-2024-08', supplier_id: supId, supplier_name: supName },
        { name: 'Metformin 500mg', generic_name: 'Metformin HCl', category: 'Diabetes', dosage: '500mg Tablet', cost_price: 5.50, selling_price: 9.00, stock_quantity: 65, reorder_level: 150, expiry_date: '2026-11-30', batch_number: 'MET-2024-03', supplier_id: supId, supplier_name: supName },
        { name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin', category: 'Cardiovascular', dosage: '20mg Tablet', cost_price: 22.00, selling_price: 35.00, stock_quantity: 180, reorder_level: 50, expiry_date: '2026-12-15', batch_number: 'ATV-2024-05', supplier_id: supId, supplier_name: supName },
        { name: 'Omeprazole 20mg', generic_name: 'Omeprazole', category: 'Gastrointestinal', dosage: '20mg Capsule', cost_price: 6.80, selling_price: 12.00, stock_quantity: 400, reorder_level: 100, expiry_date: '2027-04-30', batch_number: 'OMP-2024-02', supplier_id: supId, supplier_name: supName },
        { name: 'Cetirizine 10mg', generic_name: 'Cetirizine HCl', category: 'Respiratory', dosage: '10mg Tablet', cost_price: 3.50, selling_price: 7.00, stock_quantity: 320, reorder_level: 80, expiry_date: '2026-10-31', batch_number: 'CTZ-2024-09', supplier_id: supId, supplier_name: supName },
        { name: 'Azithromycin 500mg', generic_name: 'Azithromycin', category: 'Antibiotics', dosage: '500mg Tablet', cost_price: 65.00, selling_price: 95.00, stock_quantity: 40, reorder_level: 50, expiry_date: '2027-01-20', batch_number: 'AZM-2024-07', supplier_id: supId, supplier_name: supName },
        { name: 'Salbutamol Inhaler', generic_name: 'Salbutamol', category: 'Respiratory', dosage: '100mcg/dose', cost_price: 650.00, selling_price: 880.00, stock_quantity: 25, reorder_level: 15, expiry_date: '2027-06-30', batch_number: 'SBL-2024-11', supplier_id: supId, supplier_name: supName },
        { name: 'Vitamin C 500mg', generic_name: 'Ascorbic Acid', category: 'Vitamins & Supplements', dosage: '500mg Chewable', cost_price: 4.00, selling_price: 8.00, stock_quantity: 550, reorder_level: 100, expiry_date: '2027-09-30', batch_number: 'VTC-2024-04', supplier_id: supId, supplier_name: supName },
        { name: 'Losartan Potassium 50mg', generic_name: 'Losartan', category: 'Cardiovascular', dosage: '50mg Tablet', cost_price: 11.00, selling_price: 18.50, stock_quantity: 15, reorder_level: 60, expiry_date: '2026-11-15', batch_number: 'LSR-2024-06', supplier_id: supId, supplier_name: supName }
      ]);
    }

    console.log('✅ MongoDB database verified & ready!');
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
}
