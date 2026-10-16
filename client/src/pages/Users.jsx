import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Trash2, 
  KeyRound, 
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import { api, formatDate } from '../api';

export default function UsersPage({ currentUser, t }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'cashier',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'cashier',
      phone: '',
      email: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      password: '', // Leave blank unless updating
      role: user.role?.toLowerCase() || 'cashier',
      phone: user.phone || '',
      email: user.email || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setError('නම සහ Username අනිවාර්යයි (Name and Username are required)');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setError('මුරපදයක් (Password) ඇතුළත් කරන්න');
      return;
    }

    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password.trim()) delete payload.password;
        await api.updateUser(editingUser.id || editingUser._id, payload);
        setSuccess('පරිශීලක තොරතුරු යාවත්කාලීන විය (User updated successfully)');
      } else {
        await api.createUser(formData);
        setSuccess('නව පරිශීලකයෙක් සාර්ථකව ලියාපදිංචි විය (User created successfully)');
      }
      setIsModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (user) => {
    if (user.username === 'admin') {
      alert('ප්‍රධාන Admin ගිණුම මකා දැමිය නොහැක (Cannot delete master admin account)');
      return;
    }
    if (window.confirm(`"${user.name}" (${user.username}) පරිශීලකයා මකා දැමීමට සහතිකද?`)) {
      try {
        await api.deleteUser(user.id || user._id);
        loadUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            පරිශීලක කළමනාකරණය (User Accounts & Staff)
          </h2>
          <p className="text-xs text-slate-500">
            Register unlimited Admin, Pharmacist, and Cashier accounts with role-based access
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add New User (නව පරිශීලකයෙක්)
        </button>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          Total Users: {users.length}
        </span>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const role = (u.role || '').toLowerCase();
          const isAdmin = role === 'admin';
          return (
            <div 
              key={u.id || u._id} 
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{u.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isAdmin ? 'Admin' : 'Cashier'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {u.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                  {u.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Role Permissions: {isAdmin ? 'Full System & Reports' : 'POS & Orders Only'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Edit / Change Role
                </button>
                {u.username !== 'admin' && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingUser ? 'පරිශීලක සංස්කරණය (Edit Staff)' : 'නව පරිශීලකයෙක් ඇතුළත් කිරීම (New Staff)'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter user details and assign permissions role
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">සම්පූර්ණ නම (Full Name) *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kasun Fernando"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">පරිශීලක නාමය (Username) *</label>
                <input
                  type="text"
                  required
                  disabled={editingUser && editingUser.username === 'admin'}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="e.g. kasun12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  මුරපදය (Password) {editingUser ? '(වෙනස් කිරීමට පමණක් ටයිප් කරන්න)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">භූමිකාව (Role / Permissions) *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-indigo-500"
                >
                  <option value="cashier">Cashier (POS Billing, Medicare & Reloads Only)</option>
                  <option value="admin">Admin (Full Control, Reports, Inventory & Settings)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">දුරකථන අංකය (Phone)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="077-xxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">විද්‍යුත් තැපෑල (Email)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
