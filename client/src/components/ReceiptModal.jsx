import React from 'react';
import { Printer, X, CheckCircle, Download, Sparkles, HeartHandshake } from 'lucide-react';
import { formatCurrency, formatDate } from '../api';
import { pdfGenerator } from '../utils/pdfGenerator';

export default function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // Safe Number Sanitizers (Guarantees NEVER NaN)
  const safeNum = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const invoiceNo = sale.invoice_no || sale.bill_number || `INV-${Date.now().toString().slice(-6)}`;
  const subtotal = safeNum(sale.subtotal);
  const discountAmount = safeNum(sale.discount_amount || sale.discount);
  const totalAmount = safeNum(sale.total_amount);
  const paidAmount = safeNum(sale.paid_amount || sale.paidAmount || (sale.payment_method === 'Card' ? totalAmount : totalAmount));
  const changeAmount = safeNum(sale.change_amount || sale.changeAmount || (paidAmount > totalAmount ? paidAmount - totalAmount : 0));
  const taxAmount = safeNum(sale.tax_amount);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/80 my-8">
        
        {/* Modal Action Header (Not printed) */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">ගෙවීම් රිසිට්පත / Bill Receipt</h3>
              <p className="text-[11px] text-indigo-100 font-medium">Payment Completed Successfully</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div id="printable-receipt" className="p-6 text-slate-800 bg-white font-mono text-xs select-text">
          
          {/* Pharmacy Header & Logo */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <div className="flex justify-center mb-2">
              <img 
                src="/pharmacy-logo.png" 
                alt="Aaush pharmacy" 
                className="h-14 w-auto object-contain mx-auto"
              />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 font-sans leading-tight">
              Aaush pharmacy
            </h2>
            <p className="text-[11px] font-sans font-black text-sky-800 tracking-wider">
              GROCERY & HEALTH MEDI CARE
            </p>
            <p className="text-[10px] text-slate-500 font-sans italic">
              "Your Trusted Source for Wellness"
            </p>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              142, Main Street, Sri Lanka • Tel: 011-2925840
            </p>
          </div>

          {/* Invoice Meta Details */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                {invoiceNo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-medium text-slate-800">{formattedDateTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer (පාරිභෝගිකයා):</span>
              <span className="font-bold text-slate-900">{sale.customer_name || 'Walk-in Customer'}</span>
            </div>
            {sale.doctor_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Prescribing Dr:</span>
                <span className="font-medium text-slate-800">{sale.doctor_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span className="font-medium text-slate-800">{sale.cashier_name || 'Staff'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-indigo-700 uppercase">{sale.payment_method || 'Cash'}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3 border-b-2 border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] pb-1.5 border-b border-slate-200 text-slate-600 uppercase tracking-wider">
              <span className="w-5/12">Item Description</span>
              <span className="w-2/12 text-center">Qty</span>
              <span className="w-2/12 text-right">Price</span>
              <span className="w-3/12 text-right">Total</span>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {(sale.items || []).map((it, idx) => {
                const itemQty = safeNum(it.quantity || 1);
                const itemPrice = safeNum(it.unit_price);
                const itemDisc = safeNum(it.discount_amount || it.discount);
                const itemTotal = safeNum(it.total_price || it.subtotal || (itemPrice * itemQty - itemDisc));

                return (
                  <div key={idx} className="py-2 flex justify-between items-start text-[11px]">
                    <div className="w-5/12 pr-1">
                      <p className="font-bold text-slate-900 leading-tight">{it.medicine_name}</p>
                      <p className="text-[9px] text-slate-400 font-sans">
                        {it.dosage ? `${it.dosage}` : ''} {it.batch_number || it.batch_no ? `| B:${it.batch_number || it.batch_no}` : ''}
                      </p>
                      {itemDisc > 0 && (
                        <span className="inline-block text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded mt-0.5">
                          -Rs.{itemDisc.toFixed(2)} Off
                        </span>
                      )}
                    </div>
                    <div className="w-2/12 text-center font-bold text-slate-700">{itemQty}</div>
                    <div className="w-2/12 text-right text-slate-600">{itemPrice.toFixed(2)}</div>
                    <div className="w-3/12 text-right font-black text-slate-900">{itemTotal.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary & Totals */}
          <div className="py-3 border-b-2 border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (දළ එකතුව):</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-bold bg-rose-50/70 px-2 py-1 rounded-lg">
                <span>Total Discount (වට්ටම):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / VAT:</span>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {/* NET TOTAL */}
            <div className="flex justify-between items-center font-black text-base pt-2 border-t border-slate-200 text-slate-900">
              <span className="tracking-tight uppercase">Net Total (ශුද්ධ මුදල):</span>
              <span className="text-slate-900 text-lg font-black">{formatCurrency(totalAmount)}</span>
            </div>

            {/* PAYMENT DETAILS (CARD VS CASH) */}
            {sale.payment_method === 'Card' ? (
              <div className="pt-2">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-800">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span>PAID BY CARD (කාඩ්පතින් ගෙවන ලදී)</span>
                  </div>
                  {sale.card_last4 && (
                    <p className="text-[10px] font-mono text-slate-600 font-bold mt-0.5">
                      Card: **** **** **** {sale.card_last4}
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                    Amount: {formatCurrency(totalAmount)} • Approved ✓
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-dotted border-slate-300 space-y-1">
                {/* Cash Tendered */}
                <div className="flex justify-between items-center text-slate-800 text-xs">
                  <span className="font-bold">Cash Tendered (දුන් මුදල):</span>
                  <span className="font-black text-sm font-mono">{formatCurrency(paidAmount)}</span>
                </div>

                {/* Change Due (Bold and very prominent) */}
                <div className="flex justify-between items-center font-black text-slate-900 pt-1 text-xs">
                  <span className="font-black text-slate-900">Change Due (ඉතිරි මුදල):</span>
                  <span className="text-slate-950 text-base font-black font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-300 print:bg-transparent print:border-b-2 print:border-black">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* You Saved Badge (if discount given) */}
          {discountAmount > 0 && (
            <div className="my-2.5 p-2 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200/80 rounded-xl text-center">
              <p className="text-[11px] font-extrabold text-indigo-900 flex items-center justify-center gap-1 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                ඔබ ඉතිරි කරගත් මුදල / You Saved: {formatCurrency(discountAmount)}!
              </p>
            </div>
          )}

          {/* Barcode Mock Visual */}
          <div className="py-2 text-center">
            <div className="inline-block tracking-[4px] font-mono text-[9px] text-slate-400 font-bold">
              ||| ||||| || |||| ||||| |||| ||| |||||
            </div>
            <p className="text-[8px] text-slate-400 font-mono mt-0.5">{invoiceNo}</p>
          </div>

          {/* Footer Warm Note & Branding */}
          <div className="text-center pt-2 space-y-1 font-sans">
            <div className="flex items-center justify-center gap-1.5 text-slate-800 font-extrabold text-xs">
              <HeartHandshake className="w-4 h-4 text-indigo-600" />
              <span>සුවපත් වේවා! ඉක්මන් සුවය පතමු!</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Thank you for visiting! Get well soon!</p>
            <p className="text-[8px] text-slate-400">
              Goods once sold cannot be returned without original receipt. Store medicines below 25°C.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
              <span className="text-[9px] text-slate-400">Powered by</span>
              <span className="text-[9px] font-bold text-slate-600">Nexvora Solutions</span>
            </div>
          </div>
        </div>

        {/* Modal Buttons (Hidden when printed) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" />
            Print Bill (මුද්‍රණය)
          </button>
          <button
            onClick={() => pdfGenerator.generateBillPDF(sale)}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl shadow-lg shadow-sky-600/25 transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-2xl transition-colors cursor-pointer text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
