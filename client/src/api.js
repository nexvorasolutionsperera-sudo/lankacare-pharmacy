const API_BASE = '/api';

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      // If server returned HTML / Plain text error
      if (!res.ok) {
        throw new Error(text.length < 200 ? text : `Server Error (${res.status})`);
      }
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      throw new Error((data && data.error) ? data.error : `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) => safeFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }),
  getUsers: () => safeFetch(`${API_BASE}/auth/users`).catch(() => []),

  // Dashboard
  getDashboardStats: () => safeFetch(`${API_BASE}/dashboard/stats`).catch(() => null),

  // Medicines
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/medicines?${query}`).catch(() => []);
  },
  createMedicine: (data) => safeFetch(`${API_BASE}/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateMedicine: (id, data) => safeFetch(`${API_BASE}/medicines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteMedicine: (id) => safeFetch(`${API_BASE}/medicines/${id}`, {
    method: 'DELETE'
  }),

  // Categories
  getCategories: () => safeFetch(`${API_BASE}/categories`).catch(() => []),
  createCategory: (data) => safeFetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // Suppliers / Dealers
  getSuppliers: () => safeFetch(`${API_BASE}/suppliers`).catch(() => []),
  createSupplier: (data) => safeFetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateSupplier: (id, data) => safeFetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteSupplier: (id) => safeFetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE'
  }),
  paySupplier: (id, amount) => safeFetch(`${API_BASE}/suppliers/${id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  }),

  // Dealer Purchases / Stock Inward
  getPurchases: () => safeFetch(`${API_BASE}/dealer-purchases`).catch(() => []),
  createPurchase: (data) => safeFetch(`${API_BASE}/dealer-purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // Customers & Doctors
  getCustomers: () => safeFetch(`${API_BASE}/customers`).catch(() => []),
  createCustomer: (data) => safeFetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  getDoctors: () => safeFetch(`${API_BASE}/doctors`).catch(() => []),
  createDoctor: (data) => safeFetch(`${API_BASE}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // POS Sales
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/sales?${query}`).catch(() => []);
  },
  getSaleById: (id) => safeFetch(`${API_BASE}/sales/${id}`),
  createSale: (data) => safeFetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // Reports
  getReportsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/reports/sales?${query}`).catch(() => null);
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
