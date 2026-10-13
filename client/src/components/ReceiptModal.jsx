import React from 'react';
import { Printer, X, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../api';
import Logo from './Logo';
import { pdfGenerator } from '../utils/pdfGenerator';

export default function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const saleDate = sale.created_at ? new Date(sale.created_at) : new Date();
  const formattedDateTime = saleDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header (Not printed) */}
        <div className="flex items-center justify-between p-4 bg-emerald-600 text-white print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <h3 className="font-semibold text-lg">බිල්පත / Bill Receipt</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt" className="p-6 text-slate-800 bg-white font-mono text-xs">
          
          {/* Pharmacy Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-center mb-1">
              <Logo size="sm" showText={false} />
            </div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">LANKA CARE PHARMACY</h2>
            <p className="text-[11px] text-slate-500 font-sans">රජයේ ලියාපදිංචි ඔසුසල / Reg No: PH-84920</p>
            <p className="text-[11px] text-slate-600 font-sans mt-0.5">142, Kandy Road, Kadawatha, Sri Lanka</p>
            <p className="text-[11px] text-slate-600 font-sans">Hotline: 011-2925840 / 077-4567890</p>
          </div>

          {/* Invoice Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-bold text-slate-900">{sale.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formattedDateTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient / Cust:</span>
              <span className="font-medium text-slate-900">{sale.customer_name || 'Walk-in Customer'}</span>
            </div>
            {sale.doctor_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Prescribed By:</span>
                <span className="font-medium text-slate-800">{sale.doctor_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Payment:</span>
              <span className="font-semibold text-emerald-700">{sale.payment_method}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200 uppercase">
              <span className="w-1/2">Item (Batch)</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>
            <div className="divide-y divide-slate-100 mt-1">
              {(sale.items || []).map((it, idx) => (
                <div key={idx} className="py-1.5 flex justify-between items-start text-[11px]">
                  <div className="w-1/2 pr-1">
                    <p className="font-bold text-slate-800 leading-tight">{it.medicine_name}</p>
                    <p className="text-[9px] text-slate-500">{it.dosage} {it.batch_no ? `| B:${it.batch_no}` : ''}</p>
                  </div>
                  <div className="w-1/6 text-center font-semibold">{it.quantity}</div>
                  <div className="w-1/6 text-right text-slate-600">{Number(it.unit_price).toFixed(2)}</div>
                  <div className="w-1/6 text-right font-bold text-slate-900">{Number(it.subtotal).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payments */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount ({sale.discount_percent}%):</span>
                <span>-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            {sale.tax_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>VAT / Tax:</span>
                <span>+{formatCurrency(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200 text-slate-900">
              <span>NET TOTAL:</span>
              <span className="text-emerald-700">{formatCurrency(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>Cash Tendered:</span>
              <span>{formatCurrency(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Change Due:</span>
              <span>{formatCurrency(sale.change_amount)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-3 space-y-1 font-sans">
            <p className="font-semibold text-emerald-800 text-[11px]">සුවපත් වේවා! ඉක්මන් සුවය පතමු!</p>
            <p className="text-[10px] text-slate-500">Thank you for visiting! Get well soon!</p>
            <p className="text-[9px] text-slate-400">Goods once sold cannot be returned without original receipt. Keep in cool, dry place.</p>
          </div>
        </div>

        {/* Modal Actions (Hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" />
            Print (මුද්‍රණය)
          </button>
          <button
            onClick={() => pdfGenerator.generateBillPDF(sale)}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
