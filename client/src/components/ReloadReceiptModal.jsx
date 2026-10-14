import React from 'react';
import { Printer, X, CheckCircle, Smartphone, Copy, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../api';

export default function ReloadReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const txId = order.transaction_id || `REL-${Date.now().toString().slice(-6)}`;
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDateTime = orderDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const isPhotocopy = order.type === 'photocopy' || order.type === 'printing' || order.type === 'laminating';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Modal Action Header (Not printed) */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-xs">
              {isPhotocopy ? <Copy className="w-5 h-5 text-white" /> : <Smartphone className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">
                {isPhotocopy ? 'මුද්‍රණ රිසිට්පත (Print Receipt)' : 'රීලෝඩ් රිසිට්පත (Reload Slip)'}
              </h3>
              <p className="text-[11px] text-sky-100 font-medium">Aaush Communication Services</p>
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
        <div id="printable-reload-slip" className="p-6 bg-white text-slate-900 font-mono text-xs">
          
          {/* Pharmacy Branding */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="p-1 bg-sky-100 rounded-lg text-sky-600">
                {isPhotocopy ? <Copy className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </span>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                Aaush pharmacy
              </h2>
            </div>
            <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
              GROCERY & HEALTH MEDI CARE
            </p>
            <p className="text-[9px] text-slate-500 font-sans mt-0.5">
              Mobile Reloads, Utility Bills & Photocopy Center
            </p>
            <p className="text-[9px] text-slate-500 font-sans">
              Tel: 011-2925840 / 077-1234567
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">TX REF / SLIP:</span>
              <span className="font-mono font-black text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                {txId}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Date & Time:</span>
              <span className="font-sans font-medium text-slate-700">{formattedDateTime}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Status:</span>
              <span className="font-bold text-emerald-600 uppercase">{order.status || 'Success'}</span>
            </div>
          </div>

          {/* Service Details */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 font-sans text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-900">{order.service_name}</span>
            </div>

            {order.operator && (
              <div className="flex justify-between">
                <span className="text-slate-500">Network / Operator:</span>
                <span className="font-semibold text-slate-800">{order.operator}</span>
              </div>
            )}

            {order.recipient && (
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile / Account:</span>
                <span className="font-mono font-bold text-slate-900">{order.recipient}</span>
              </div>
            )}

            {isPhotocopy && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Number of Copies:</span>
                  <span className="font-mono font-bold">{order.quantity || 1}</span>
                </div>
                {order.unit_price > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Rate per Copy:</span>
                    <span className="font-mono">{formatCurrency(order.unit_price)}</span>
                  </div>
                )}
              </>
            )}

            {order.details && (
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Details / Notes:</span>
                <span className="text-right italic">{order.details}</span>
              </div>
            )}
          </div>

          {/* Amount Summary */}
          <div className="py-3 border-b-2 border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Total Paid:</span>
              <span className="font-mono text-base text-sky-600">
                {formatCurrency(order.amount)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Payment Mode:</span>
              <span className="font-medium">{order.payment_method || 'Cash'}</span>
            </div>
          </div>

          {/* Slip Footer */}
          <div className="pt-3 text-center space-y-1">
            <p className="text-[9px] text-slate-500 font-sans">
              Thank you for transacting with Aaush Communication!
            </p>
            <p className="text-[9px] text-slate-500 font-sans">
              ස්තූතියි, නැවත පැමිණෙන්න!
            </p>
            <div className="pt-1.5">
              <span className="text-[10px] tracking-widest text-slate-400 font-mono">
                * * {txId} * *
              </span>
            </div>
          </div>

        </div>

        {/* Modal Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
          >
            වසන්න (Close)
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Slip
          </button>
        </div>

      </div>
    </div>
  );
}
