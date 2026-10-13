import React, { useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  Plus, 
  Phone, 
  Mail, 
  AlertOctagon, 
  MapPin, 
  Building 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../api';

export default function CustomersDoctors({ 
  customers, 
  doctors, 
  onRefresh, 
  onOpenAddCustomer, 
  onOpenAddDoctor 
}) {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'doctors'

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            පාරිභෝගිකයින් සහ වෛද්‍යවරුන් (Patients & Prescribers)
          </h2>
          <p className="text-xs text-slate-500">
            Maintain customer records, drug allergy warnings, and registered doctor references
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'customers' ? (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Patient / Customer (නව පාරිභෝගිකයා)
            </button>
          ) : (
            <button
              onClick={onOpenAddDoctor}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Doctor (නව වෛද්‍යවරයා)
            </button>
          )}
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
          Patients & Customers ({customers.length})
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

      {/* Patients Tab */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-[11px] text-slate-400">Registered Patient #{c.id}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

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
                <span className="text-slate-500">{c.total_orders || 0} visits</span>
                <span className="font-bold text-slate-900">Spent: {formatCurrency(c.total_spent)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{d.name}</h3>
                  <p className="text-xs font-semibold text-blue-600">{d.specialization || 'Medical Officer'}</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                {d.slmc_no && (
                  <p className="font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-md inline-block">
                    {d.slmc_no}
                  </p>
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
          ))}
        </div>
      )}

    </div>
  );
}
