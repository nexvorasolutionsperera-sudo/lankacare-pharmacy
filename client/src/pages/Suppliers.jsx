import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  DollarSign, 
  PackageCheck, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../api';
import PayDealerModal from '../components/PayDealerModal';

export default function Suppliers({ 
  suppliers, 
  medicines, 
  onRefresh, 
  onOpenAddDealer, 
  onOpenGRN 
}) {
  const [purchases, setPurchases] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('dealers'); // 'dealers' | 'history'
  const [payingDealer, setPayingDealer] = useState(null);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const data = await api.getPurchases();
      setPurchases(data);
    } catch (err) {
      console.error(err);
    }
  };

  const totalPurchasedAll = suppliers.reduce((s, d) => s + (Number(d.total_purchased) || 0), 0);
  const totalPaidAll = suppliers.reduce((s, d) => s + (Number(d.total_paid) || 0), 0);
  const totalDueAll = totalPurchasedAll - totalPaidAll;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            ඩීලර්ස් සහ සැපයුම්කරුවන් (Dealers & Suppliers)
          </h2>
          <p className="text-xs text-slate-500">
            Pharmaceutical distributors, stock inward GRNs, and outstanding supplier dues
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGRN}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            Stock Inward / GRN (බෙහෙත් භාරගැනීම)
          </button>

          <button
            onClick={onOpenAddDealer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Dealer (නව ඩීලර් කෙනෙක්)
          </button>
        </div>
      </div>

      {/* KPI Cards for Dealers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Goods Ordered</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(totalPurchasedAll)}</p>
          <p className="text-xs text-slate-400 mt-1">From {suppliers.length} active dealers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Settled to Date</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(totalPaidAll)}</p>
          <p className="text-xs text-slate-400 mt-1">Paid supplier invoices</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Outstanding Due (හිඟ මුදල්)</span>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(totalDueAll)}</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">Pending payments to distributors</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('dealers')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === 'dealers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Dealers Directory ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Delivery & GRN History ({purchases.length})
        </button>
      </div>

      {/* Tab 1: Dealers Directory */}
      {activeSubTab === 'dealers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((dealer) => {
            const due = (Number(dealer.total_purchased) || 0) - (Number(dealer.total_paid) || 0);

            return (
              <div 
                key={dealer.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{dealer.name}</h3>
                      {dealer.contact_person && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Agent: {dealer.contact_person}</p>
                      )}
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    {dealer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{dealer.phone}</span>
                      </div>
                    )}
                    {dealer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{dealer.email}</span>
                      </div>
                    )}
                    {dealer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-500 leading-tight">{dealer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial stats & Pay button */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-slate-500">Balance Due:</span>
                    <span className={`text-base font-extrabold ${due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(due)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span>Purchased: {formatCurrency(dealer.total_purchased)}</span>
                    <span>Paid: {formatCurrency(dealer.total_paid)}</span>
                  </div>

                  <button
                    onClick={() => setPayingDealer(dealer)}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Settle / Pay Balance (ගෙවීම් සටහන් කරන්න)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Delivery & GRN History */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {purchases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No delivery history recorded yet. Use the "Stock Inward / GRN" button to record medicine deliveries.
              </div>
            ) : (
              purchases.map((p) => {
                const isExpanded = expandedPurchaseId === p.id;

                return (
                  <div key={p.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div 
                      className="flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setExpandedPurchaseId(isExpanded ? null : p.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{p.invoice_no}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.payment_status === 'Paid' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : p.payment_status === 'Partial' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.payment_status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {p.supplier_name} • {formatDate(p.purchase_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-extrabold text-slate-900 text-sm">{formatCurrency(p.total_amount)}</p>
                          <p className="text-[10px] text-slate-400">Paid: {formatCurrency(p.paid_amount)}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Items */}
                    {isExpanded && p.items && (
                      <div className="mt-3 pt-3 border-t border-slate-100 pl-11">
                        <table className="w-full text-xs">
                          <thead className="text-slate-400 text-[10px] uppercase font-semibold">
                            <tr>
                              <th className="text-left pb-1">Medicine</th>
                              <th className="text-left pb-1">Batch</th>
                              <th className="text-center pb-1">Qty</th>
                              <th className="text-right pb-1">Unit Cost</th>
                              <th className="text-right pb-1">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-700">
                            {p.items.map((it, idx) => (
                              <tr key={idx} className="py-1">
                                <td className="py-1 font-semibold">{it.medicine_name}</td>
                                <td className="py-1 text-slate-500">{it.batch_no || '-'}</td>
                                <td className="py-1 text-center font-bold text-blue-700">{it.quantity}</td>
                                <td className="py-1 text-right">{formatCurrency(it.cost_price)}</td>
                                <td className="py-1 text-right font-semibold">
                                  {formatCurrency(Number(it.quantity) * Number(it.cost_price))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pay Dealer Modal */}
      {payingDealer && (
        <PayDealerModal
          isOpen={true}
          dealer={payingDealer}
          onClose={() => setPayingDealer(null)}
          onSaved={() => {
            onRefresh();
            loadPurchases();
          }}
        />
      )}

    </div>
  );
}
