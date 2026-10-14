import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Heart, 
  Search, 
  Check, 
  Plus, 
  User, 
  Phone, 
  Stethoscope, 
  Calendar, 
  AlertCircle,
  FileText,
  BadgeDollarSign,
  Droplet,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { api, formatCurrency } from '../api';

export const MEDICARE_CATALOG = [
  // Blood Tests
  { id: 'fbs', name: 'Fasting Blood Sugar (FBS)', category: 'Blood Test', sample_type: 'Fluoride Plasma', price: 250, defaultFasting: 'Fasting (10-12 hrs)' },
  { id: 'rbs', name: 'Random Blood Sugar (RBS)', category: 'Blood Test', sample_type: 'Capillary / Plasma', price: 200, defaultFasting: 'Non-Fasting' },
  { id: 'ppbs', name: 'Post-Prandial Blood Sugar (PPBS)', category: 'Blood Test', sample_type: 'Fluoride Plasma', price: 250, defaultFasting: '2 hrs Post-Meal' },
  { id: 'fbc', name: 'Full Blood Count (FBC / CBC)', category: 'Blood Test', sample_type: 'EDTA Blood', price: 650, defaultFasting: 'Not Required' },
  { id: 'hba1c', name: 'HbA1c (Glycated Hemoglobin)', category: 'Blood Test', sample_type: 'EDTA Blood', price: 1600, defaultFasting: 'Not Required' },
  { id: 'lipid', name: 'Lipid Profile (Cholesterol, HDL, LDL, Trig)', category: 'Blood Test', sample_type: 'Serum', price: 1800, defaultFasting: 'Fasting (12 hrs)' },
  { id: 'creat', name: 'Serum Creatinine & eGFR (Kidney)', category: 'Blood Test', sample_type: 'Serum', price: 650, defaultFasting: 'Not Required' },
  { id: 'lft', name: 'Liver Function Test (LFT Panel)', category: 'Blood Test', sample_type: 'Serum', price: 2400, defaultFasting: 'Fasting Preferred' },
  { id: 'uric', name: 'Serum Uric Acid', category: 'Blood Test', sample_type: 'Serum', price: 600, defaultFasting: 'Not Required' },
  { id: 'electrolytes', name: 'Serum Electrolytes (Na, K, Cl)', category: 'Blood Test', sample_type: 'Serum', price: 1200, defaultFasting: 'Not Required' },
  { id: 'dengue_ns1', name: 'Dengue NS1 Antigen Rapid', category: 'Blood Test', sample_type: 'Whole Blood', price: 1500, defaultFasting: 'Not Required' },
  { id: 'dengue_ab', name: 'Dengue IgG / IgM Antibody', category: 'Blood Test', sample_type: 'Serum', price: 1600, defaultFasting: 'Not Required' },
  { id: 'esr', name: 'ESR (Erythrocyte Sedimentation)', category: 'Blood Test', sample_type: 'Citrate Blood', price: 350, defaultFasting: 'Not Required' },
  { id: 'blood_group', name: 'Blood Grouping & Rh Factor', category: 'Blood Test', sample_type: 'EDTA Blood', price: 500, defaultFasting: 'Not Required' },
  { id: 'tsh', name: 'TSH (Thyroid Stimulating Hormone)', category: 'Blood Test', sample_type: 'Serum', price: 1200, defaultFasting: 'Not Required' },
  { id: 'tft', name: 'Thyroid Panel (Free T4 & TSH)', category: 'Blood Test', sample_type: 'Serum', price: 2200, defaultFasting: 'Not Required' },
  
  // Urine Tests
  { id: 'ufr', name: 'Urine Full Report (UFR)', category: 'Urine & Other', sample_type: 'Midstream Urine', price: 400, defaultFasting: 'Not Required' },
  { id: 'hcg', name: 'Urine hCG (Pregnancy Screen)', category: 'Urine & Other', sample_type: 'Morning Urine', price: 350, defaultFasting: 'Not Required' },

  // ECG & Cardiac Care
  { id: 'ecg_12', name: '12-Lead ECG with Doctor Report', category: 'ECG & Cardiac', sample_type: 'Clinical Procedure', price: 850, defaultFasting: 'Not Required' },
  { id: 'ecg_strip', name: 'Rhythm Strip ECG Monitoring', category: 'ECG & Cardiac', sample_type: 'Clinical Procedure', price: 500, defaultFasting: 'Not Required' },

  // Clinical Nursing & Medicare Care
  { id: 'bp_check', name: 'Digital Blood Pressure & Pulse Check', category: 'Clinical Medicare', sample_type: 'Clinical Check', price: 100, defaultFasting: 'Not Required' },
  { id: 'glucometer', name: 'Quick Glucometer Blood Sugar Check', category: 'Clinical Medicare', sample_type: 'Capillary Blood', price: 150, defaultFasting: 'Not Required' },
  { id: 'nebulization', name: 'Clinical Nebulization (Adult / Child)', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 450, defaultFasting: 'Not Required' },
  { id: 'dressing_s', name: 'Minor Wound Dressing & Antiseptic Care', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 400, defaultFasting: 'Not Required' },
  { id: 'dressing_l', name: 'Major Wound Dressing & Bandaging', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 750, defaultFasting: 'Not Required' },
  { id: 'injection', name: 'IM / Subcutaneous Injection Admin', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 250, defaultFasting: 'Not Required' },
  { id: 'cannula', name: 'IV Cannula Setup & Saline Infusion', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 1200, defaultFasting: 'Not Required' },
  { id: 'suture_rem', name: 'Suture / Stitch Removal Care', category: 'Clinical Medicare', sample_type: 'Nursing Care', price: 500, defaultFasting: 'Not Required' }
];

export default function AddMedicareOrderModal({ 
  isOpen, 
  onClose, 
  customers = [], 
  doctors = [], 
  onOrderCreated 
}) {
  if (!isOpen) return null;

  // Form states
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [doctorName, setDoctorName] = useState('Self / OTC');
  const [fastingStatus, setFastingStatus] = useState('Not Required');
  const [remarks, setRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Selected tests (IDs)
  const [selectedTests, setSelectedTests] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');

  // Catalog filtering & live dynamic tests
  const [catalogList, setCatalogList] = useState(MEDICARE_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api.getMedicareCatalog()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalogList(data);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Auto-calculated totals
  const subtotal = useMemo(() => {
    return selectedTests.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [selectedTests]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0));
  }, [subtotal, discount]);

  const effectivePaid = useMemo(() => {
    if (paidAmount === '' || isNaN(Number(paidAmount))) return totalAmount;
    return Number(paidAmount);
  }, [paidAmount, totalAmount]);

  const balanceDue = useMemo(() => {
    return Math.max(0, totalAmount - effectivePaid);
  }, [totalAmount, effectivePaid]);

  const changeDue = useMemo(() => {
    return Math.max(0, effectivePaid - totalAmount);
  }, [totalAmount, effectivePaid]);

  // Categories list
  const categories = ['All', 'Blood Test', 'ECG & Cardiac', 'Clinical Medicare', 'Urine & Other'];

  const filteredCatalog = useMemo(() => {
    return catalogList.filter(item => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory;
      const matchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.sample_type && item.sample_type.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [catalogList, searchQuery, activeCategory]);

  const toggleTest = (testItem) => {
    setSelectedTests(prev => {
      const exists = prev.some(t => t.id === testItem.id);
      if (exists) {
        return prev.filter(t => t.id !== testItem.id);
      } else {
        // If adding a test with recommended fasting, auto update fasting status if still Not Required
        const fastingInfo = testItem.default_fasting || testItem.defaultFasting || '';
        if (fastingInfo.includes('Fasting') && fastingStatus === 'Not Required') {
          setFastingStatus(fastingInfo);
        }
        return [...prev, {
          id: testItem.id,
          name: testItem.name,
          category: testItem.category,
          sample_type: testItem.sample_type,
          price: testItem.price
        }];
      }
    });
  };

  const handleSelectCustomer = (e) => {
    const val = e.target.value;
    if (!val) return;
    const found = customers.find(c => c.id.toString() === val || c.name === val);
    if (found) {
      setPatientName(found.name);
      if (found.phone) setPhone(found.phone);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('කරුණාකර රෝගියාගේ නම ඇතුළත් කරන්න (Please enter patient name)');
      return;
    }
    if (selectedTests.length === 0) {
      alert('කරුණාකර අවම වශයෙන් එක් පරීක්ෂණයක් තෝරන්න (Please select at least one test/procedure)');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        order_number: `MED-${Date.now().toString().slice(-6)}`,
        patient_name: patientName.trim(),
        patient_age: Number(patientAge) || 0,
        patient_gender: patientGender,
        phone: phone.trim(),
        doctor_name: doctorName || 'Self / OTC',
        fasting_status: fastingStatus,
        tests: selectedTests,
        subtotal,
        discount: Number(discount) || 0,
        total_amount: totalAmount,
        paid_amount: effectivePaid,
        balance_due: balanceDue,
        payment_method: paymentMethod,
        status: 'Sample Collected',
        sample_collected_at: new Date().toISOString(),
        remarks: remarks.trim()
      };

      const created = await api.createMedicareOrder(payload);
      onOrderCreated(created);
    } catch (err) {
      alert(`Error creating Medicare order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-xs">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold leading-tight">
                නව පරීක්ෂණයක් / ප්‍රතිකාරයක් ලියාපදිංචි කිරීම (New Lab & Medicare Booking)
              </h2>
              <p className="text-[11px] text-sky-100 font-medium">
                Blood Tests, 12-Lead ECG, Diagnostic Screening & Clinical Procedures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Patient & Doctor Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" />
                රෝගියාගේ සහ වෛද්‍ය තොරතුරු (Patient & Prescriber Details)
              </h3>
              
              {customers.length > 0 && (
                <select
                  onChange={handleSelectCustomer}
                  className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">ලියාපදිංචි පාරිභෝගිකයින්ගෙන් තෝරන්න...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  රෝගියාගේ නම (Patient Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamal Perera"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  වයස (Age)
                </label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  placeholder="e.g. 45"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ස්ත්‍රී / පුරුෂ (Gender)
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                >
                  <option value="Male">පුරුෂ (Male)</option>
                  <option value="Female">ස්ත්‍රී (Female)</option>
                  <option value="Child">ළමා (Child)</option>
                  <option value="Unspecified">නොදක්වා ඇත</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  දුරකථන අංකය (Phone)
                </label>
                <input
                  type="tel"
                  placeholder="07X XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  නියම කළ වෛද්‍යවරයා (Prescribing Doctor)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. Silva / Self / OTC"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="flex-1 text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  />
                  {doctors.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setDoctorName(e.target.value);
                      }}
                      className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">වෛද්‍යවරයා තෝරන්න...</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  නිරාහාර තත්ත්වය (Fasting Status)
                </label>
                <select
                  value={fastingStatus}
                  onChange={(e) => setFastingStatus(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                >
                  <option value="Not Required">අවශ්‍ය නැත (Not Required)</option>
                  <option value="Fasting (10-12 hrs)">පැය 10-12 නිරාහාරව (Fasting 10-12 hrs)</option>
                  <option value="Non-Fasting">නිරාහාර නොවේ (Random / Non-Fasting)</option>
                  <option value="2 hrs Post-Meal">ආහාර ගෙන පැය 2කට පසු (2 hrs Post-Meal)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Test Catalog Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-rose-500" />
                පරීක්ෂණ සහ ප්‍රතිකාර තෝරන්න (Select Diagnostic Tests & Clinical Services)
                <span className="text-[10px] bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  {selectedTests.length} Selected
                </span>
              </h3>

              {/* Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search test name, sample..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white w-52"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'All' ? 'සියල්ල (All)' : cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              {filteredCatalog.map(item => {
                const isSelected = selectedTests.some(t => t.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleTest(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </span>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="truncate max-w-[120px]">
                        {item.sample_type || item.category}
                      </span>
                      <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xs">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pricing, Discount & Payment Calculation */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Selected items chip list */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                තෝරාගත් ලැයිස්තුව (Selected List):
              </span>
              {selectedTests.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  කිසිදු පරීක්ෂණයක් තෝරාගෙන නැත
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedTests.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{t.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(t.price)}</span>
                        <button
                          type="button"
                          onClick={() => toggleTest(t)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Remarks */}
              <div className="mt-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  විශේෂ සටහන් / රෝග ලක්ෂණ (Clinical Remarks)
                </label>
                <input
                  type="text"
                  placeholder="e.g. History of Diabetes, Urgent report requested"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Calculations & Tendered */}
            <div className="space-y-2.5 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                <span>Subtotal (එකතුව):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Discount (වට්ටම්):</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 text-right text-xs font-mono font-bold px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">
                <span>Total Amount (මුළු මුදල):</span>
                <span className="font-mono text-sky-600 dark:text-sky-400">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    ගෙවූ මුදල (Paid)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={totalAmount.toString()}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    ගෙවීම් ක්‍රමය (Method)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Cash">Cash (මුදල්)</option>
                    <option value="Card">Card (කාඩ්පත්)</option>
                    <option value="Online QR">Online QR</option>
                  </select>
                </div>
              </div>

              {balanceDue > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
                  <span>Balance Due (ඉතිරි හිඟ මුදල):</span>
                  <span className="font-mono">{formatCurrency(balanceDue)}</span>
                </div>
              )}

              {changeDue > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span>Change Due (ඉතිරි දුන් මුදල):</span>
                  <span className="font-mono">{formatCurrency(changeDue)}</span>
                </div>
              )}
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              අවලංගු කරන්න (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTests.length === 0}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>ලියාපදිංචි වෙමින් පවතී...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  ලියාපදිංචි කර ටෝකනය නිකුත් කරන්න (Book & Print Token)
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
