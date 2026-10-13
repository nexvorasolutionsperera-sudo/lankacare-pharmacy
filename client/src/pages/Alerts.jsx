import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Truck, 
  ExternalLink,
  ChevronRight,
  PackageX
} from 'lucide-react';
import { formatCurrency, formatDate } from '../api';

export default function Alerts({ medicines, onOpenGRN, onEditMedicine }) {
  const today = new Date().toISOString().split('T')[0];

  const expiredMedicines = medicines.filter(m => m.expiry_date < today);
  const expiringSoonMedicines = medicines.filter(m => m.expiry_date >= today && m.days_to_expiry <= 60);
  const lowStockMedicines = medicines.filter(m => m.stock_quantity <= m.min_stock_alert);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            අනතුරු ඇඟවීම් මධ්‍යස්ථානය (Alerts & Warnings Hub)
          </h2>
          <p className="text-xs text-slate-500">
            Automated monitoring of expired batches, expiring drugs, and out-of-stock items
          </p>
        </div>

        <button
          onClick={onOpenGRN}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          Re-order Stock via GRN
        </button>
      </div>

      {/* 1. EXPIRED DRUGS (CRITICAL) */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-sm">කල් ඉකුත් වූ ඖෂධ (Expired Medicines - Immediate Disposal)</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-200 text-rose-900">
            {expiredMedicines.length} Expired Batches
          </span>
        </div>

        <div className="divide-y divide-rose-50">
          {expiredMedicines.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No expired medicines in stock. Great inventory hygiene!
            </div>
          ) : (
            expiredMedicines.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-rose-50/30 text-xs">
                <div>
                  <h4 className="font-bold text-rose-950 text-sm">{m.name}</h4>
                  <p className="text-slate-500">
                    {m.generic_name} • Batch: <span className="font-mono">{m.batch_no}</span> • Shelf: {m.rack_location || 'Not set'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-extrabold text-rose-700">Expired on {formatDate(m.expiry_date)}</span>
                    <p className="text-[11px] text-slate-500">Holding: {m.stock_quantity} units</p>
                  </div>
                  <button
                    onClick={() => onEditMedicine(m)}
                    className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-xs"
                  >
                    Adjust Batch
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. EXPIRING SOON (< 60 DAYS) */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm">කල් ඉකුත්වීමට ආසන්න ඖෂධ (Expiring Soon - Next 60 Days)</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-900">
            {expiringSoonMedicines.length} Batches
          </span>
        </div>

        <div className="divide-y divide-amber-50">
          {expiringSoonMedicines.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No medicines expiring within the next 60 days.
            </div>
          ) : (
            expiringSoonMedicines.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-amber-50/30 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                  <p className="text-slate-500">
                    {m.generic_name} • Batch: <span className="font-mono">{m.batch_no}</span> • Supplier: {m.supplier_name || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-extrabold text-amber-700">
                      Expires in {m.days_to_expiry} days ({formatDate(m.expiry_date)})
                    </span>
                    <p className="text-[11px] text-slate-500">{m.stock_quantity} units remaining</p>
                  </div>
                  <button
                    onClick={() => onEditMedicine(m)}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold text-xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. LOW STOCK ITEMS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">අවම තොග මට්ටමේ පවතින ඖෂධ (Low Stock Reorder List)</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
            {lowStockMedicines.length} Items
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {lowStockMedicines.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              All medicines are adequately stocked.
            </div>
          ) : (
            lowStockMedicines.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                  <p className="text-slate-500">
                    {m.generic_name} • {m.dosage} • Supplier: {m.supplier_name || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-extrabold text-rose-600">
                      Current Stock: {m.stock_quantity} units
                    </span>
                    <p className="text-[11px] text-slate-400">Reorder Alert: {m.min_stock_alert}</p>
                  </div>
                  <button
                    onClick={onOpenGRN}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                  >
                    Order Stock
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
