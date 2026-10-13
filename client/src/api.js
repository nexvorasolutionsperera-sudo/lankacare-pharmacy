const API_BASE = '/api';

export const api = {
  // Auth
  login: (username, password) => fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  }),
  getUsers: () => fetch(`${API_BASE}/auth/users`).then(res => res.json()),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`).then(res => res.json()),

  // Medicines
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/medicines?${query}`).then(res => res.json());
  },
  createMedicine: (data) => fetch(`${API_BASE}/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create medicine');
    return json;
  }),
  updateMedicine: (id, data) => fetch(`${API_BASE}/medicines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update medicine');
    return json;
  }),
  deleteMedicine: (id) => fetch(`${API_BASE}/medicines/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Categories
  getCategories: () => fetch(`${API_BASE}/categories`).then(res => res.json()),
  createCategory: (data) => fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Suppliers / Dealers
  getSuppliers: () => fetch(`${API_BASE}/suppliers`).then(res => res.json()),
  createSupplier: (data) => fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add supplier');
    return json;
  }),
  updateSupplier: (id, data) => fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteSupplier: (id) => fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
  paySupplier: (id, amount) => fetch(`${API_BASE}/suppliers/${id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  }).then(res => res.json()),

  // Dealer Purchases / Stock Inward
  getPurchases: () => fetch(`${API_BASE}/purchases`).then(res => res.json()),
  createPurchase: (data) => fetch(`${API_BASE}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to record purchase');
    return json;
  }),

  // Customers & Doctors
  getCustomers: () => fetch(`${API_BASE}/customers`).then(res => res.json()),
  createCustomer: (data) => fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  getDoctors: () => fetch(`${API_BASE}/doctors`).then(res => res.json()),
  createDoctor: (data) => fetch(`${API_BASE}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // POS Sales
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/sales?${query}`).then(res => res.json());
  },
  getSaleById: (id) => fetch(`${API_BASE}/sales/${id}`).then(res => res.json()),
  createSale: (data) => fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async res => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to process checkout');
    return json;
  }),

  // Reports
  getReportsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/reports/sales-summary?${query}`).then(res => res.json());
  }
};

export const formatCurrency = (amount) => {
  const val = Number(amount) || 0;
  return `Rs. ${val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
