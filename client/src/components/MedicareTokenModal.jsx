import React from 'react';
import { Printer, X, CheckCircle, Download, Activity, Heart, Clock, User, Phone, Stethoscope } from 'lucide-react';
import { formatCurrency, formatDate } from '../api';
import { pdfGenerator } from '../utils/pdfGenerator';

export default function MedicareTokenModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const tests = Array.isArray(order.tests) ? order.tests : [];
  const orderNo = order.order_number || `MED-${Date.now().toString().slice(-6)}`;
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDateTime = orderDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Modal Action Header (Not printed) */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">රසායනාගාර ටෝකනය / Lab Token</h3>
              <p className="text-[11px] text-sky-100 font-medium">Aaush Medicare Diagnostics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Token Area */}
        <div id="printable-token" className="p-6 bg-white text-slate-900 font-mono text-xs">
          
          {/* Pharmacy & Medicare Branding */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="p-1 bg-sky-100 rounded-lg text-sky-600">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                Aaush pharmacy
              </h2>
            </div>
            <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
              GROCERY & HEALTH MEDI CARE
            </p>
            <p className="text-[9px] text-slate-500 font-sans mt-0.5">
              Clinical Diagnostics, Blood Tests & ECG Unit
            </p>
            <p className="text-[9px] text-slate-500 font-sans">
              Tel: 011-2925840 / 077-1234567
            </p>
          </div>

          {/* Token Number & Date */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">LAB TOKEN / NO:</span>
              <span className="font-mono font-black text-sm text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                {orderNo}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Date & Time:</span>
              <span className="font-sans font-medium text-slate-700">{formattedDateTime}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Current Status:</span>
              <span className="font-bold text-indigo-600 uppercase">{order.status || 'Sample Collected'}</span>
            </div>
          </div>

          {/* Patient & Doctor Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 font-sans text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{order.patient_name || 'Walk-in Patient'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Age / Gender:</span>
              <span className="text-slate-700 font-medium">
                {order.patient_age ? `${order.patient_age} Yrs` : '-'} / {order.patient_gender || 'Unspecified'}
              </span>
            </div>
            {order.phone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-700">{order.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Prescribing Dr:</span>
              <span className="text-slate-700 font-medium">{order.doctor_name || 'Self / OTC'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fasting:</span>
              <span className="font-bold text-amber-700">{order.fasting_status || 'Not Required'}</span>
            </div>
          </div>

          {/* Tests List */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
              <span>Test / Procedure</span>
              <span>Amount (Rs.)</span>
            </div>
            <div className="space-y-1.5">
              {tests.map((t, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="pr-2">
                    <div className="font-semibold text-slate-800">{t.name}</div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      {t.sample_type || 'Blood'} • {t.category || 'Diagnostic'}
                    </div>
                  </div>
                  <div className="font-mono font-medium text-slate-900 whitespace-nowrap">
                    {formatCurrency(t.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(order.subtotal || order.total_amount)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-mono">- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Fee:</span>
              <span className="font-mono text-sky-600">{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Amount Paid ({order.payment_method || 'Cash'}):</span>
              <span className="font-mono">{formatCurrency(order.paid_amount || order.total_amount)}</span>
            </div>
            {Number(order.balance_due) > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(order.balance_due)}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="pt-3 text-center space-y-1">
            <p className="text-[9px] text-slate-500 font-sans leading-tight">
              * Please produce this token when collecting your test report.
            </p>
            <p className="text-[9px] text-slate-500 font-sans leading-tight">
              * Reports are verified by registered medical laboratory technologists.
            </p>
            <div className="pt-2">
              <span className="text-[10px] tracking-widest text-slate-400 font-mono">
                * * {orderNo} * *
              </span>
            </div>
            <p className="text-[9px] font-bold text-sky-700 font-sans pt-1">
              Get Well Soon • සුවපත් වේවා!
            </p>
          </div>

        </div>

        {/* Modal Footer Controls (Not printed) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => pdfGenerator.generateMedicareOrderPDF(order)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-500" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Token
          </button>
        </div>

      </div>
    </div>
  );
}
