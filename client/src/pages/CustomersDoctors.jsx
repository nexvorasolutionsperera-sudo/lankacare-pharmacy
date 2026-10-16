import React, { useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  Plus, 
  Phone, 
  Mail, 
  AlertOctagon, 
  MapPin, 
  Building,
  CreditCard,
  Banknote,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import { excelExporter } from '../utils/excelExporter';

export default function CustomersDoctors({ 
  customers, 
  doctors, 
  onRefresh, 
  onOpenAddCustomer, 
  onOpenAddDoctor,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'credit' | 'doctors'
  const [search, setSearch] = useState('');
  const [settlingCustomer, setSettlingCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalCreditAll = customers.reduce((sum, c) => sum + (Number(c.credit_balance) || 0), 0);
  const customersWithCredit = customers.filter(c => Number(c.credit_balance || 0) > 0);

  const handleOpenSettle = (customer) => {
    setSettlingCustomer(customer);
    setPaymentAmount(customer.credit_balance ? String(customer.credit_balance) : '');
    setPaymentMethod('Cash');
    setChequeNo('');
    setBankName('');
    setNotes('');
    setError('');
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('වලංගු මුදලක් (Valid Amount) ඇතුළත් කරන්න');
      return;
    }

    try {
      await api.createCustomerPayment(settlingCustomer.id || settlingCustomer._id, {
        customer_name: settlingCustomer.name,
        amount: amt,
        payment_method: paymentMethod,
        cheque_no: chequeNo,
        bank_name: bankName,
        notes,
        received_by: currentUser?.name || 'Admin'
      });

      setSuccess(`Rs. ${amt.toFixed(2)} සාර්ථකව පියවන ලදී! (Credit settled successfully)`);
      setSettlingCustomer(null);
      if (onRefresh) onRefresh();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Settlement failed');
    }
  };

  const handleExportCreditLedger = () => {
    const data = customersWithCredit.map((c, idx) => ({
      '#': idx + 1,
      'Customer Name': c.name,
      'Phone': c.phone || '-',
      'Address': c.address || '-',
      'Credit Balance Due (LKR)': Number(c.credit_balance || 0),
      'Total Lifetime Spent (LKR)': Number(c.total_spent || 0)
    }));
    excelExporter.exportToExcel(data, 'Customer_Credit_Dues_Ledger', 'CreditBalances');
  };

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  const filteredCreditCustomers = customersWithCredit.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            පාරිභෝගිකයින්, ණය ගිණුම් සහ වෛද්‍යවරුන් (Patients & Credit Khata)
          </h2>
          <p className="text-xs text-slate-500">
            Maintain customer records, credit dues, settlement payments, and registered doctor references
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'credit' && (
            <button
              onClick={handleExportCreditLedger}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Credit Ledger
            </button>
          )}

          {activeTab === 'doctors' ? (
            <button
              onClick={onOpenAddDoctor}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Doctor (නව වෛද්‍යවරයා)
            </button>
          ) : (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Customer (නව පාරිභෝගිකයා)
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered Patients</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{customers.length}</p>
          <p className="text-xs text-slate-400 mt-1">Active customer base</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Customer Credit Due (හිඟ ණය)</span>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(totalCreditAll)}</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">Pending from {customersWithCredit.length} credit customers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Doctors</span>
          <p className="text-2xl font-black text-blue-600 mt-2">{doctors.length}</p>
          <p className="text-xs text-slate-400 mt-1">Prescribers & Specialists</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'customers'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Patients & Customers ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab('credit')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'credit'
              ? 'text-rose-600 border-b-2 border-rose-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Credit Ledger & Balances (හිඟ ණය පියවීම්) ({customersWithCredit.length})
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'doctors'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Doctors & Specialists ({doctors.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-emerald-500"
        />
      </div>

      {/* Patients Tab */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const creditDue = Number(c.credit_balance || 0);
            return (
              <div key={c.id || c._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{c.name}</h3>
                      <p className="text-[11px] text-slate-400">Patient #{c.id || c._id?.toString().slice(-4)}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  {creditDue > 0 && (
                    <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-800">ණය හිඟ ශේෂය (Credit):</span>
                      <span className="font-black text-rose-600">{formatCurrency(creditDue)}</span>
                    </div>
                  )}

                  {/* Drug allergy alert */}
                  {c.allergies && (
                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                      <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Drug Allergy (අසාත්මිකතා):</span>
                        <p className="font-semibold text-rose-900">{c.allergies}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-500">{c.address}</span>
                      </div>
                    )}
                    {c.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1">Note: {c.notes}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Spent: {formatCurrency(c.total_spent)}</span>
                  {creditDue > 0 && (
                    <button
                      onClick={() => handleOpenSettle(c)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      Settle Credit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Credit Ledger Tab */}
      {activeTab === 'credit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Lifetime Purchases</th>
                  <th className="py-3 px-4 text-right">Outstanding Credit Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCreditCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      හිඟ ණය පවතින පාරිභෝගිකයින් කිසිවෙක් නොමැත (No outstanding customer credits)
                    </td>
                  </tr>
                ) : (
                  filteredCreditCustomers.map((c) => (
                    <tr key={c.id || c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {c.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.address || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(c.total_spent)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                        {formatCurrency(c.credit_balance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenSettle(c)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          Settle Credit (ණය පියවීම)
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div key={d.id || d._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{d.name}</h3>
                    <p className="text-[11px] text-blue-600 font-bold">{d.specialization}</p>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {d.slmc_no && (
                    <div className="text-[11px] text-slate-400">
                      SLMC Reg: <span className="font-mono font-semibold text-slate-700">{d.slmc_no}</span>
                    </div>
                  )}
                  {d.hospital && (
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.hospital}</span>
                    </div>
                  )}
                  {d.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settle Customer Credit Modal */}
      {settlingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              පාරිභෝගික ණය පියවීම (Settle Credit)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: <span className="font-bold text-slate-800">{settlingCustomer.name}</span> | Current Due: <span className="font-bold text-rose-600">{formatCurrency(settlingCustomer.credit_balance)}</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {error}
              </div>
            )}

            <form onSubmit={handleSettleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ගෙවන මුදල (Amount to Settle in LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-emerald-600 text-base focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ගෙවීම් ක්‍රමය (Payment Method)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-rose-500"
                >
                  <option value="Cash">Cash (මුදල්)</option>
                  <option value="Card">Bank Card</option>
                  <option value="Cheque">Cheque (චෙක්පත්)</option>
                </select>
              </div>

              {paymentMethod === 'Cheque' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cheque #</label>
                    <input
                      type="text"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="e.g. CHQ-1002"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. BOC / Commercial"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">සටහන් (Notes)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Partial settlement for bill #1002"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirm Credit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
