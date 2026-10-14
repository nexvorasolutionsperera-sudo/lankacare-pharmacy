import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import POSBilling from './pages/POSBilling';
import Medicines from './pages/Medicines';
import Suppliers from './pages/Suppliers';
import Alerts from './pages/Alerts';
import CustomersDoctors from './pages/CustomersDoctors';
import MedicareServices from './pages/MedicareServices';
import ReloadServices from './pages/ReloadServices';
import Reports from './pages/Reports';
import LoginPage from './pages/LoginPage';

import AddMedicineModal from './components/AddMedicineModal';
import AddDealerModal from './components/AddDealerModal';
import DealerStockInwardModal from './components/DealerStockInwardModal';
import AddCustomerModal from './components/AddCustomerModal';
import AddDoctorModal from './components/AddDoctorModal';

import { api } from './api';
import { translations } from './translations';

export default function App() {
  // Authentication
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmacy_auth');
      return saved ? JSON.parse(saved).user : null;
    } catch {
      return null;
    }
  });

  // Language & Theme Customizations
  const [lang, setLang] = useState(() => localStorage.getItem('pharmacy_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('pharmacy_theme') || 'light');
  const [bgTheme, setBgTheme] = useState(() => localStorage.getItem('pharmacy_bg_theme') || 'theme-mint');

  const isCashier = (currentUser?.role || '').toLowerCase() === 'cashier';

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmacy_auth');
      const user = saved ? JSON.parse(saved).user : null;
      return (user?.role || '').toLowerCase() === 'cashier' ? 'pos' : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  // Role Guard: Automatically switch Cashier away from Admin-only screens
  useEffect(() => {
    if (isCashier && ['dashboard', 'dealers', 'alerts', 'reports'].includes(activeTab)) {
      setActiveTab('pos');
    }
  }, [currentUser, isCashier, activeTab]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Modals state
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [addModalType, setAddModalType] = useState('medicine'); // 'medicine' | 'grocery'
  const [medicineToEdit, setMedicineToEdit] = useState(null);
  const [isAddDealerOpen, setIsAddDealerOpen] = useState(false);
  const [dealerToEdit, setDealerToEdit] = useState(null);
  const [isGRNOpen, setIsGRNOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  // Sync language with localStorage
  useEffect(() => {
    localStorage.setItem('pharmacy_lang', lang);
  }, [lang]);

  // Sync theme (Dark / Light)
  useEffect(() => {
    localStorage.setItem('pharmacy_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync Background Theme preset
  useEffect(() => {
    localStorage.setItem('pharmacy_bg_theme', bgTheme);
    document.body.className = `${bgTheme} transition-colors duration-300`;
  }, [bgTheme]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [statsData, medsData, catsData, suppsData, custsData, docsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getMedicines().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getDoctors().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      setMedicines(medsData);
      setCategories(catsData);
      setSuppliers(suppsData);
      setCustomers(custsData);
      setDoctors(docsData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  };

  const handleOpenAddMed = () => {
    setMedicineToEdit(null);
    setAddModalType('medicine');
    setIsAddMedOpen(true);
  };

  const handleOpenAddGrocery = () => {
    setMedicineToEdit(null);
    setAddModalType('grocery');
    setIsAddMedOpen(true);
  };

  const handleOpenAddBookshop = () => {
    setMedicineToEdit(null);
    setAddModalType('bookshop');
    setIsAddMedOpen(true);
  };

  const handleEditMedicine = (med) => {
    setMedicineToEdit(med);
    setIsAddMedOpen(true);
  };

  const handleOpenAddDealer = () => {
    setDealerToEdit(null);
    setIsAddDealerOpen(true);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out? (පද්ධතියෙන් ඉවත් වීමට අවශ්‍යද?)')) {
      localStorage.removeItem('pharmacy_auth');
      setCurrentUser(null);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    const cashierCheck = (user?.role || '').toLowerCase() === 'cashier';
    setActiveTab(cashierCheck ? 'pos' : 'dashboard');
  };

  const t = translations[lang] || translations.en;

  // If not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        stats={stats} 
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        bgTheme={bgTheme}
        setBgTheme={setBgTheme}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        t={t}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-auto lg:h-screen lg:overflow-y-auto">
        
        {/* Top Header Navigation Bar */}
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          currentUser={currentUser}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          t={t}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {!isCashier && activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              setActiveTab={setActiveTab}
              onOpenAddMed={handleOpenAddMed}
              onOpenAddGrocery={handleOpenAddGrocery}
              onOpenAddBookshop={handleOpenAddBookshop}
              onOpenGRN={() => setIsGRNOpen(true)}
              t={t}
            />
          )}

          {activeTab === 'pos' && (
            <POSBilling
              medicines={medicines}
              customers={customers}
              doctors={doctors}
              currentUser={currentUser}
              onRefreshData={loadAllData}
              t={t}
            />
          )}

          {activeTab === 'medicines' && (
            <Medicines
              medicines={medicines}
              categories={categories}
              suppliers={suppliers}
              currentUser={currentUser}
              isCashier={isCashier}
              onRefresh={loadAllData}
              onOpenAddMed={handleOpenAddMed}
              onOpenAddGrocery={handleOpenAddGrocery}
              onOpenAddBookshop={handleOpenAddBookshop}
              onEditMedicine={handleEditMedicine}
              t={t}
            />
          )}

          {!isCashier && activeTab === 'dealers' && (
            <Suppliers
              suppliers={suppliers}
              medicines={medicines}
              onRefresh={loadAllData}
              onOpenAddDealer={handleOpenAddDealer}
              onOpenGRN={() => setIsGRNOpen(true)}
              t={t}
            />
          )}

          {!isCashier && activeTab === 'alerts' && (
            <Alerts
              medicines={medicines}
              onOpenGRN={() => setIsGRNOpen(true)}
              onEditMedicine={handleEditMedicine}
              t={t}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersDoctors
              customers={customers}
              doctors={doctors}
              currentUser={currentUser}
              isCashier={isCashier}
              onRefresh={loadAllData}
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
              onOpenAddDoctor={() => setIsAddDoctorOpen(true)}
              t={t}
            />
          )}

          {activeTab === 'medicare' && (
            <MedicareServices
              customers={customers}
              doctors={doctors}
              currentUser={currentUser}
              isCashier={isCashier}
              t={t}
            />
          )}

          {activeTab === 'reloads' && (
            <ReloadServices
              currentUser={currentUser}
              isCashier={isCashier}
              t={t}
            />
          )}

          {!isCashier && activeTab === 'reports' && (
            <Reports t={t} />
          )}
        </main>

        {/* Footer — Created by Nexvora Solutions */}
        <footer className="print:hidden mt-auto py-3 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Software Created by</span>
            <img 
              src="/nexvora-logo.png" 
              alt="Nexvora Solutions" 
              className="h-5 w-auto object-contain opacity-70 dark:opacity-50"
            />
          </div>
        </footer>
      </div>

      {/* MODALS */}
      {isAddMedOpen && (
        <AddMedicineModal
          isOpen={isAddMedOpen}
          medicineToEdit={medicineToEdit}
          categories={categories}
          suppliers={suppliers}
          initialType={addModalType}
          onClose={() => {
            setIsAddMedOpen(false);
            setMedicineToEdit(null);
          }}
          onSaved={loadAllData}
        />
      )}

      {isAddDealerOpen && (
        <AddDealerModal
          isOpen={isAddDealerOpen}
          dealerToEdit={dealerToEdit}
          onClose={() => {
            setIsAddDealerOpen(false);
            setDealerToEdit(null);
          }}
          onSaved={loadAllData}
        />
      )}

      {isGRNOpen && (
        <DealerStockInwardModal
          isOpen={isGRNOpen}
          suppliers={suppliers}
          medicines={medicines}
          onClose={() => setIsGRNOpen(false)}
          onSaved={loadAllData}
        />
      )}

      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onSaved={loadAllData}
        />
      )}

      {isAddDoctorOpen && (
        <AddDoctorModal
          isOpen={isAddDoctorOpen}
          onClose={() => setIsAddDoctorOpen(false)}
          onSaved={loadAllData}
        />
      )}

    </div>
  );
}
