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
  },

  // Medicare & Lab Diagnostics
  getMedicareOrders: () => safeFetch(`${API_BASE}/medicare`).catch(() => []),
  createMedicareOrder: (data) => safeFetch(`${API_BASE}/medicare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateMedicareOrder: (id, data) => safeFetch(`${API_BASE}/medicare/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteMedicareOrder: (id) => safeFetch(`${API_BASE}/medicare/${id}`, {
    method: 'DELETE'
  }),

  // Medicare & Blood Test Catalog (Price Index)
  getMedicareCatalog: () => safeFetch(`${API_BASE}/medicare/catalog`).catch(() => []),
  createMedicareCatalogItem: (data) => safeFetch(`${API_BASE}/medicare/catalog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateMedicareCatalogItem: (id, data) => safeFetch(`${API_BASE}/medicare/catalog/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteMedicareCatalogItem: (id) => safeFetch(`${API_BASE}/medicare/catalog/${id}`, {
    method: 'DELETE'
  }),

  // Photocopy, Printing & Mobile Reloads
  getReloadOrders: () => safeFetch(`${API_BASE}/reloads`).catch(() => []),
  createReloadOrder: (data) => safeFetch(`${API_BASE}/reloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteReloadOrder: (id) => safeFetch(`${API_BASE}/reloads/${id}`, {
    method: 'DELETE'
  }),

  // User Management
  createUser: (data) => safeFetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateUser: (id, data) => safeFetch(`${API_BASE}/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteUser: (id) => safeFetch(`${API_BASE}/auth/users/${id}`, {
    method: 'DELETE'
  }),

  // Customer Credit Payments
  getCustomerPayments: (customerId) => safeFetch(`${API_BASE}/customers/${customerId}/payments`).catch(() => []),
  getAllCustomerPayments: () => safeFetch(`${API_BASE}/customer-payments`).catch(() => []),
  createCustomerPayment: (customerId, data) => safeFetch(`${API_BASE}/customers/${customerId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // Sales Returns
  getReturns: () => safeFetch(`${API_BASE}/returns`).catch(() => []),
  createReturn: (data) => safeFetch(`${API_BASE}/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteReturn: (id) => safeFetch(`${API_BASE}/returns/${id}`, {
    method: 'DELETE'
  }),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/expenses?${query}`).catch(() => []);
  },
  createExpense: (data) => safeFetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateExpense: (id, data) => safeFetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteExpense: (id) => safeFetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE'
  }),

  // Stock Adjustments
  getStockAdjustments: () => safeFetch(`${API_BASE}/stock/adjustments`).catch(() => []),
  createStockAdjustment: (data) => safeFetch(`${API_BASE}/stock/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  // Comprehensive Reports
  getComprehensiveReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return safeFetch(`${API_BASE}/reports/comprehensive?${query}`).catch(() => null);
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
