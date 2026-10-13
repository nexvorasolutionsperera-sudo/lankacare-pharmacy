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
  Download
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import ReceiptModal from '../components/ReceiptModal';
import { pdfGenerator } from '../utils/pdfGenerator';

export default function Reports({ t }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [summary, setSummary] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reprintSale, setReprintSale] = useState(null);
  const [searchInvoice, setSearchInvoice] = useState('');

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const [sumData, salesData] = await Promise.all([
        api.getReportsSummary({ startDate, endDate }),
        api.getSales({ startDate, endDate, limit: 100 })
      ]);
      setSummary(sumData);
      setSalesList(salesData);
    } catch (err) {
      console.error(err);
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
    }
  };

  const filteredSales = salesList.filter(s => {
    if (!searchInvoice.trim()) return true;
    const q = searchInvoice.toLowerCase();
    return s.invoice_no.toLowerCase().includes(q) || (s.customer_name && s.customer_name.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            විකුණුම් සහ ලාභ වාර්තා (Sales & Profit Reports)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time financial performance, profit margin analysis, and bill reprint
          </p>
        </div>

        {/* Date presets & datepickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button 
              onClick={() => setPresetRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${startDate === todayStr && endDate === todayStr ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
            >
              Today
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
              This Month
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium"
            />
          </div>

          {/* Export PDF Button */}
          <button
            onClick={() => pdfGenerator.generateSalesReportPDF(summary, salesList, startDate, endDate)}
            disabled={!summary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{t?.exportSalesReportPdf || 'Export Sales Report PDF'}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Sales (විකුණුම් එකතුව)</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(summary.netSales)}</p>
            <p className="text-xs text-slate-400 mt-1">{summary.totalBills} bills generated</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost of Goods (වියදම)</span>
            <p className="text-2xl font-black text-slate-700 mt-2">{formatCurrency(summary.totalCost)}</p>
            <p className="text-xs text-slate-400 mt-1">Wholesale drug purchase cost</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Gross Profit (දළ ලාභය)</span>
            <p className="text-2xl font-black text-emerald-700 mt-2">{formatCurrency(summary.grossProfit)}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Margin: {summary.profitMargin}%</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discounts Given</span>
            <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(summary.totalDiscounts)}</p>
            <p className="text-xs text-slate-400 mt-1">Total customer discounts deducted</p>
          </div>

        </div>
      )}

      {/* Grid: Top Medicines & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 10 Best-Selling Drugs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            වැඩිපුරම අලෙවි වූ ඖෂධ (Top-Selling Medicines in Period)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="pb-2">Medicine Name</th>
                  <th className="pb-2 text-center">Qty Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">Profit Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary?.topMedicines?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No sales recorded in this date range.</td>
                  </tr>
                ) : (
                  summary?.topMedicines?.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-800">
                        <span className="text-slate-400 mr-2 font-mono">{idx + 1}.</span>
                        {med.medicine_name}
                      </td>
                      <td className="py-2.5 text-center font-bold text-blue-600">{med.total_qty_sold}</td>
                      <td className="py-2.5 text-right font-medium text-slate-700">{formatCurrency(med.total_revenue)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">{formatCurrency(med.profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            ගෙවීම් ක්‍රම (Payment Methods)
          </h3>

          <div className="space-y-3">
            {summary?.paymentMethods?.map((pm, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-800">{pm.payment_method}</p>
                  <p className="text-[11px] text-slate-400">{pm.count} transactions</p>
                </div>
                <p className="font-black text-sm text-slate-900">{formatCurrency(pm.amount)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Past Invoices & Reprint Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">නිකුත් කල බිල්පත් ලැයිස්තුව (Invoices & Reprint)</h3>
            <p className="text-xs text-slate-500">View details and reprint receipts</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="Search Invoice # or Customer..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer / Patient</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">No invoices found for this range.</td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900 font-mono">{sale.invoice_no}</td>
                    <td className="p-3 text-slate-600">{formatDate(sale.created_at)}</td>
                    <td className="p-3 font-medium text-slate-800">{sale.customer_name || 'Walk-in Customer'}</td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(sale.total_amount)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setReprintSale(sale)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Reprint Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal for Reprinting */}
      {reprintSale && (
        <ReceiptModal
          sale={reprintSale}
          onClose={() => setReprintSale(null)}
        />
      )}

    </div>
  );
}
