import React, { useState } from 'react';
import { 
  HeartPulse, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '../api';
import Logo from '../components/Logo';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('කරුණාකර පරිශීලක නාමය සහ මුරපදය ඇතුළත් කරන්න (Please enter username and password)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.login(username, password);
      // Persist in localStorage
      localStorage.setItem('pharmacy_auth', JSON.stringify(data));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img 
              src="/pharmacy-logo.png" 
              alt="LankaCare Pharmacy" 
              className="h-20 w-auto object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">LankaCare</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            ඔසුසල් කළමනාකරණ පද්ධතියට පිවිසෙන්න
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Authorized Access
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              පරිශීලක නාමය (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                required
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800 transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              මුරපදය (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800 transition-all bg-slate-50/50 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'පද්ධතියට පිවිසෙමින්... (Signing in)' : 'ඇතුල් වන්න (Sign In)'}
          </button>
        </form>

        {/* Quick Demo Credentials for Easy Testing */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Quick Fill Demo Accounts (පරීක්ෂා කිරීමට ක්ලික් කරන්න)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Admin</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">Pharmacist</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">admin / admin123</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('cashier', 'cashier123')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Cashier</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">Counter</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">cashier / cashier123</p>
            </button>
          </div>
        </div>

        {/* Footer — Created by Nexvora Solutions */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 mb-2">LankaCare Pharmacy POS & ERP System v1.0</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Software Created by</span>
            <img 
              src="/nexvora-logo.png" 
              alt="Nexvora Solutions" 
              className="h-6 w-auto object-contain opacity-80"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
