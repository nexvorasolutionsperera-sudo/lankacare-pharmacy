import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Printer, 
  FileText, 
  CreditCard, 
  Banknote,
  Search,
  Download,
  FileSpreadsheet,
  Truck,
  Receipt,
  DollarSign,
  TrendingDown,
  PieChart,
  ShoppingBag
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import ReceiptModal from '../components/ReceiptModal';
import { pdfGenerator } from '../utils/pdfGenerator';
import { excelExporter } from '../utils/excelExporter';

export default function Reports({ t }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'purchases' | 'expenses' | 'pl'
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState('');
  const [reprintSale, setReprintSale] = useState(null);

  // Data states
  const [compReport, setCompReport] = useState(null);
  const [summary, setSummary] = useState(null);
  const [salesList, setSalesList] = useState([]);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const [sumData, salesData, fullReport] = await Promise.all([
        api.getReportsSummary({ startDate, endDate }).catch(() => null),
        api.getSales({ startDate, endDate, limit: 200 }).catch(() => []),
        api.getComprehensiveReports({ startDate, endDate }).catch(() => null)
      ]);

      const rawSales = Array.isArray(salesData) ? salesData : (salesData?.sales || []);
      const normalizedSales = rawSales.map(s => ({
        ...s,
        id: s.id || s._id,
        invoice_no: s.invoice_no || s.bill_number || `INV-${s._id?.toString().slice(-6) || 'N/A'}`
      }));

      // Normalize summary
      let normalizedSummary = sumData;
      if (sumData) {
        const totalSales = Number(sumData.summary?.totalSales ?? sumData.netSales ?? 0);
        const totalBills = Number(sumData.summary?.totalBills ?? sumData.totalBills ?? normalizedSales.length);
        const totalCost = Number(sumData.totalCost ?? (totalSales * 0.7));
        const grossProfit = Number(sumData.grossProfit ?? (totalSales - totalCost));
        const profitMargin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;
        const totalDiscounts = Number(sumData.totalDiscounts ?? normalizedSales.reduce((acc, s) => acc + (s.discount || 0), 0));

        let pmList = [];
        if (Array.isArray(sumData.paymentMethods)) {
          pmList = sumData.paymentMethods;
        } else if (sumData.paymentMethods && typeof sumData.paymentMethods === 'object') {
          pmList = Object.entries(sumData.paymentMethods).map(([pm, amt]) => ({
            payment_method: pm,
            count: normalizedSales.filter(s => (s.payment_method || 'Cash').toLowerCase() === pm.toLowerCase()).length || 1,
            amount: Number(amt) || 0
          }));
        }

        const topMeds = (sumData.topMedicines || []).map(m => ({
          medicine_name: m.medicine_name || m.name || 'Medicine',
          total_qty_sold: m.total_qty_sold || m.quantity || 0,
          total_revenue: m.total_revenue || m.revenue || 0,
          profit: m.profit || (m.total_revenue ? m.total_revenue * 0.25 : 0)
        }));

        normalizedSummary = {
          netSales: totalSales,
          totalBills: totalBills,
          totalCost: totalCost,
          grossProfit: grossProfit,
          profitMargin: profitMargin,
          totalDiscounts: totalDiscounts,
          topMedicines: topMeds,
          paymentMethods: pmList
        };
      }

      setSummary(normalizedSummary);
      setSalesList(normalizedSales);
      setCompReport(fullReport);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setPresetRange = (preset) => {
    const today = new Date();
    const format = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(format(today));
      setEndDate(format(today));
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      setStartDate(format(y));
      setEndDate(format(y));
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(today.getDate() - 7);
      setStartDate(format(w));
      setEndDate(format(today));
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(format(m));
      setEndDate(format(today));
    } else if (preset === 'year') {
      const y = new Date(today.getFullYear(), 0, 1);
      setStartDate(format(y));
      setEndDate(format(today));
    }
  };

  const filteredSales = salesList.filter(s => {
    if (!searchInvoice.trim()) return true;
    const q = searchInvoice.toLowerCase();
    const inv = (s.invoice_no || '').toLowerCase();
    const cust = (s.customer_name || '').toLowerCase();
    return inv.includes(q) || cust.includes(q);
  });

  // Export handlers
  const handleExportSalesExcel = () => {
    const data = filteredSales.map((s, idx) => ({
      '#': idx + 1,
      'Invoice #': s.invoice_no,
      'Date': s.created_at?.split('T')[0] || '-',
      'Customer': s.customer_name,
      'Doctor': s.doctor_name || 'OTC',
      'Payment Method': s.payment_method,
      'Subtotal (LKR)': s.subtotal,
      'Discount (LKR)': s.discount,
      'Total Amount (LKR)': s.total_amount,
      'Cashier': s.cashier_name
    }));
    excelExporter.exportToExcel(data, `Sales_Report_${startDate}_to_${endDate}`, 'Sales');
  };

  const handleExportPurchasesExcel = () => {
    const purchases = compReport?.purchases?.purchasesList || [];
    const data = purchases.map((p, idx) => ({
      '#': idx + 1,
      'GRN #': p.grn_number || `GRN-${p.id}`,
      'Date': p.purchase_date || p.createdAt?.split('T')[0],
      'Supplier': p.supplier_name,
      'Invoice #': p.invoice_number || p.invoice_no,
      'Payment Status': p.status || p.payment_status,
      'Total Amount (LKR)': p.total_amount,
      'Amount Paid (LKR)': p.amount_paid || p.paid_amount,
      'Balance Due (LKR)': p.balance_due
    }));
    excelExporter.exportToExcel(data, `Purchases_Report_${startDate}_to_${endDate}`, 'Purchases');
  };

  const handleExportExpensesExcel = () => {
    const expenses = compReport?.expenses?.expensesList || [];
    const data = expenses.map((e, idx) => ({
      '#': idx + 1,
      'Voucher #': e.expense_number,
      'Date': e.expense_date,
      'Category': e.category,
      'Description': e.title,
      'Amount (LKR)': e.amount,
      'Method': e.payment_method,
      'Paid To': e.paid_to || '-'
    }));
    excelExporter.exportToExcel(data, `Expenses_Report_${startDate}_to_${endDate}`, 'Expenses');
  };

  const handleExportProfitLossExcel = () => {
    const pl = compReport?.profitLoss || {};
    const sales = compReport?.sales || {};
    const medicare = compReport?.medicare || {};
    const reloads = compReport?.reloads || {};
    const expenses = compReport?.expenses || {};

    const data = [
      { 'Component': 'GROSS SALES (Medicines, Grocery, Books)', 'Amount (LKR)': sales.totalRevenue || 0 },
      { 'Component': 'MEDICARE & LAB TEST INCOME', 'Amount (LKR)': medicare.totalRevenue || 0 },
      { 'Component': 'PHOTOCOPY & RELOAD PROFIT', 'Amount (LKR)': reloads.totalProfit || 0 },
      { 'Component': 'TOTAL GROSS REVENUE', 'Amount (LKR)': pl.grossRevenue || 0 },
      { 'Component': 'COST OF GOODS SOLD (COGS 70%)', 'Amount (LKR)': -(pl.cogs || 0) },
      { 'Component': 'GROSS PROFIT', 'Amount (LKR)': pl.grossProfit || 0 },
      { 'Component': 'OPERATING OVERHEAD EXPENSES', 'Amount (LKR)': -(expenses.totalExpenses || 0) },
      { 'Component': 'NET PROFIT / (LOSS)', 'Amount (LKR)': pl.netProfit || 0 },
      { 'Component': 'NET PROFIT MARGIN %', 'Amount (LKR)': `${pl.profitMargin || 0}%` }
    ];
    excelExporter.exportToExcel(data, `Profit_Loss_Statement_${startDate}_to_${endDate}`, 'ProfitAndLoss');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            මූල්‍ය සහ මෙහෙයුම් වාර්තා (Financial & Performance Reports)
          </h2>
          <p className="text-xs text-slate-500">
            Audit daily, monthly, and yearly sales, dealer purchasing, expenses, and profit & loss
          </p>
        </div>

        {/* Date presets & datepickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button 
              onClick={() => setPresetRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${startDate === todayStr && endDate === todayStr ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
            >
              Today (Daily)
            </button>
            <button 
              onClick={() => setPresetRange('yesterday')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              Yesterday
            </button>
            <button 
              onClick={() => setPresetRange('week')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => setPresetRange('month')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              This Month (Monthly)
            </button>
            <button 
              onClick={() => setPresetRange('year')}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
            >
              This Year (Yearly)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'sales'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          1. විකුණුම් වාර්තාව (Sales Report)
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'purchases'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          2. ගැණුම් සහ ඩීලර් වාර්තාව (Purchasing & GRN)
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'expenses'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          3. වියදම් වාර්තාව (Operating Expenses)
        </button>

        <button
          onClick={() => setActiveTab('pl')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'pl'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          4. ලාභ හා අලාභ ගිණුම (Profit & Loss P&L)
        </button>
      </div>

      {/* ==================== TAB 1: SALES REPORT ==================== */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Action buttons for Sales */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleExportSalesExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={() => pdfGenerator.generateSalesReportPDF(summary, salesList, startDate, endDate)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to PDF
            </button>
          </div>

          {/* Sales KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales Revenue</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(summary?.netSales || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">{summary?.totalBills || 0} Bills completed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated COGS</span>
              <p className="text-2xl font-black text-slate-700 mt-2">{formatCurrency(summary?.totalCost || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Wholesale inventory cost</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Gross Trading Profit</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(summary?.grossProfit || 0)}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">Margin: {summary?.profitMargin || 0}%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discounts Allowed</span>
              <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(summary?.totalDiscounts || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Customer bill savings</p>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          {summary?.paymentMethods && summary.paymentMethods.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Payment Methods Distribution (ගෙවීම් ක්‍රම අනුව බෙදීයාම)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summary.paymentMethods.map(pm => (
                  <div key={pm.payment_method} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block">{pm.payment_method}</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">{formatCurrency(pm.amount)}</span>
                    <span className="text-[10px] text-slate-400">{pm.count} Invoices</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Selling Products */}
          {summary?.topMedicines && summary.topMedicines.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  වැඩියෙන්ම අලෙවි වූ ඖෂධ සහ භාණ්ඩ (Top Selling Items)
                </h3>
                <span className="text-xs text-slate-400 font-semibold">Ranked by revenue</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-4"># Rank</th>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4 text-center">Units Sold</th>
                    <th className="py-2.5 px-4 text-right">Total Revenue</th>
                    <th className="py-2.5 px-4 text-right">Profit Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.topMedicines.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{m.medicine_name}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-600">{m.total_qty_sold}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{formatCurrency(m.total_revenue)}</td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-600">{formatCurrency(m.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sales List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                බිල්පත් ලැයිස්තුව (Invoices Log) ({filteredSales.length})
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Reprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{s.invoice_no}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(s.created_at || s.createdAt).toLocaleString('en-GB')}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{s.customer_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">{formatCurrency(s.total_amount)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setReprintSale(s)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Reprint Bill"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PURCHASING & GRN ==================== */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleExportPurchasesExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={() => {
                const pList = compReport?.purchases?.purchasesList || [];
                pdfGenerator.generatePurchasesReportPDF(
                  pList,
                  compReport?.purchases?.totalCost || 0,
                  compReport?.purchases?.totalPaid || 0,
                  compReport?.purchases?.totalDue || 0,
                  startDate,
                  endDate
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Goods Ordered</span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(compReport?.purchases?.totalCost || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Inward pharmaceutical deliveries</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Settled to Date</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">
                {formatCurrency(compReport?.purchases?.totalPaid || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Paid supplier invoices</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Outstanding Balance Due</span>
              <p className="text-2xl font-black text-rose-600 mt-2">
                {formatCurrency(compReport?.purchases?.totalDue || 0)}
              </p>
              <p className="text-xs text-rose-600 font-semibold mt-1">Pending payments to distributors</p>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4">GRN #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Supplier / Dealer</th>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(compReport?.purchases?.purchasesList || []).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      මෙම කාල සීමාව තුළ මිලදී ගැනීම් කිසිවක් හමු නොවීය (No purchases in this range)
                    </td>
                  </tr>
                ) : (
                  (compReport?.purchases?.purchasesList || []).map((p) => (
                    <tr key={p.id || p._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.grn_number || `GRN-${p.id}`}</td>
                      <td className="py-2.5 px-4 text-slate-500">{p.purchase_date || p.createdAt?.split('T')[0]}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{p.supplier_name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{p.invoice_number || p.invoice_no || '-'}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status || p.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900">{formatCurrency(p.total_amount)}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(p.amount_paid || p.paid_amount || 0)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-600 font-bold">{formatCurrency(p.balance_due)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: OPERATING EXPENSES ==================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleExportExpensesExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={() => {
                const expList = compReport?.expenses?.expensesList || [];
                pdfGenerator.generateExpensesReportPDF(
                  expList,
                  compReport?.expenses?.totalExpenses || 0,
                  startDate,
                  endDate
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Period Overheads</span>
              <p className="text-2xl font-black text-rose-600 mt-2">
                {formatCurrency(compReport?.expenses?.totalExpenses || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Shop operational costs</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Expenses by Category</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(compReport?.expenses?.categories || {}).map(([cat, amt]) => (
                  <span key={cat} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                    {cat}: <strong className="text-rose-600">{formatCurrency(amt)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Expenses Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4"># Voucher</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Paid To</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(compReport?.expenses?.expensesList || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      වියදම් සටහන් කිසිවක් හමු නොවීය (No expenses recorded in this period)
                    </td>
                  </tr>
                ) : (
                  (compReport?.expenses?.expensesList || []).map((e) => (
                    <tr key={e.id || e._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{e.expense_number}</td>
                      <td className="py-2.5 px-4 text-slate-500">{e.expense_date}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{e.title}</td>
                      <td className="py-2.5 px-4 text-slate-600">{e.paid_to || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{e.payment_method}</td>
                      <td className="py-2.5 px-4 text-right font-black text-rose-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: PROFIT & LOSS ==================== */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleExportProfitLossExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={() => {
                pdfGenerator.generateProfitLossReportPDF(compReport, startDate, endDate);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to PDF
            </button>
          </div>

          {/* P&L Statement Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto space-y-6">
            
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                AAUSH PHARMACY - ලාභ සහ අලාභ විස්තරය (PROFIT & LOSS STATEMENT)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                For the period: <strong className="text-slate-800">{startDate}</strong> to <strong className="text-slate-800">{endDate}</strong>
              </p>
            </div>

            {/* Income Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 p-2 rounded-xl">
                1. REVENUE & TRADING INCOMES (ආදායම්)
              </h4>
              <div className="space-y-1.5 pl-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Gross Sales Revenue (Medicines, Grocery, Books):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(compReport?.sales?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Medicare & Lab Diagnostics Service Income:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(compReport?.medicare?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Photocopy, Printing & Mobile Reload Net Profit:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(compReport?.reloads?.totalProfit || 0)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-indigo-950 bg-slate-50 px-3 rounded-xl mt-2">
                  <span>TOTAL GROSS REVENUE:</span>
                  <span className="text-indigo-600">{formatCurrency(compReport?.profitLoss?.grossRevenue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded-xl">
                2. COST OF GOODS SOLD (COGS - තොග පිරිවැය)
              </h4>
              <div className="space-y-1.5 pl-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Estimated Wholesale Drug & Inventory Cost (70%):</span>
                  <span className="font-bold text-rose-600">({formatCurrency(compReport?.profitLoss?.cogs || 0)})</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-slate-900 bg-emerald-50 px-3 rounded-xl mt-2">
                  <span className="text-emerald-900">GROSS TRADING PROFIT (දළ ලාභය):</span>
                  <span className="text-emerald-600">{formatCurrency(compReport?.profitLoss?.grossProfit || 0)}</span>
                </div>
              </div>
            </div>

            {/* Operational Overheads */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 p-2 rounded-xl">
                3. OPERATING OVERHEAD EXPENSES (මෙහෙයුම් වියදම්)
              </h4>
              <div className="space-y-1.5 pl-3 text-xs">
                {Object.entries(compReport?.expenses?.categories || {}).length === 0 ? (
                  <p className="text-slate-400 italic">No expense vouchers in range</p>
                ) : (
                  Object.entries(compReport?.expenses?.categories || {}).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-600">{cat}:</span>
                      <span className="font-semibold text-slate-800">({formatCurrency(amt)})</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between py-2 text-sm font-black text-rose-950 bg-rose-50 px-3 rounded-xl mt-2">
                  <span>TOTAL OPERATIONAL EXPENSES:</span>
                  <span className="text-rose-600">({formatCurrency(compReport?.expenses?.totalExpenses || 0)})</span>
                </div>
              </div>
            </div>

            {/* NET PROFIT / LOSS BANNER */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold block">
                  Net Financial Performance
                </span>
                <span className="text-2xl font-black">
                  ශුද්ධ ලාභය (NET OPERATING PROFIT)
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Net Profit Margin: <strong className="text-emerald-400">{compReport?.profitLoss?.profitMargin || 0}%</strong>
                </p>
              </div>

              <div className="text-right">
                <span className={`text-3xl font-black font-mono ${
                  (compReport?.profitLoss?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(compReport?.profitLoss?.netProfit || 0)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bill Reprint Modal */}
      {reprintSale && (
        <ReceiptModal
          sale={reprintSale}
          onClose={() => setReprintSale(null)}
        />
      )}

    </div>
  );
}
