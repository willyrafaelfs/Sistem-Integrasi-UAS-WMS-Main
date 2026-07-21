const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return localStorage.getItem('wms_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    window.location.href = '/login';
    return;
  }

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
}

const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getUser: () => request('/user'),
  googleLoginUrl: () => `${API_BASE}/auth/google/redirect`,

  // Warehouses
  getWarehouses: () => request('/warehouses'),
  getWarehouse: (id) => request(`/warehouses/${id}`),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => request(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarehouse: (id) => request(`/warehouses/${id}`, { method: 'DELETE' }),

  // Locations
  getLocations: (warehouseId) => request(`/locations${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`),
  createLocation: (data) => request('/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id, data) => request(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLocation: (id) => request(`/locations/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  importProducts: (formData) => {
    const token = getToken();
    return fetch(`${API_BASE}/products/import`, {
      method: 'POST',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: formData,
    }).then(r => r.json());
  },
  getExportUrl: () => `${API_BASE}/products/export`,

  // Inventory Stocks
  getStocks: () => request('/stocks'),

  // Transactions / Operations
  validateLocation: (barcode) => request('/mobile/putaway/validate-location', { method: 'POST', body: JSON.stringify({ barcode }) }),
  submitPutaway: (data) => request('/mobile/putaway/submit', { method: 'POST', body: JSON.stringify(data) }),

  // Outbound / Picking
  generatePickList: (productId, quantity) => request('/outbound/generate-picklist', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) }),
  executePicking: (data) => request('/outbound/execute-picking', { method: 'POST', body: JSON.stringify(data) }),

  // Transaction History
  getHistory: () => request('/transactions/history'),

  // Digital Twin & Night Compaction
  getWarehouseMap: () => request('/warehouse-map'),
  triggerNightCompaction: () => request('/night-compaction/trigger', { method: 'POST' }),

  // ========================
  // E2E SUPPLY CHAIN
  // ========================

  // Suppliers
  getSuppliers: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/suppliers${qs ? `?${qs}` : ''}`); },
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Purchase Orders
  getPurchaseOrders: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/purchase-orders${qs ? `?${qs}` : ''}`); },
  createPurchaseOrder: (data) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  getPurchaseOrder: (id) => request(`/purchase-orders/${id}`),
  updatePOStatus: (id, status) => request(`/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Customers
  getCustomers: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/customers${qs ? `?${qs}` : ''}`); },
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Sales Orders
  getSalesOrders: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/sales-orders${qs ? `?${qs}` : ''}`); },
  createSalesOrder: (data) => request('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  getSalesOrder: (id) => request(`/sales-orders/${id}`),
  updateSOStatus: (id, status) => request(`/sales-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Shipments / Delivery Orders
  getShipments: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/shipments${qs ? `?${qs}` : ''}`); },
  createShipment: (data) => request('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipmentStatus: (id, status) => request(`/shipments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // ========================
  // OPERATIONAL (AUDIT & APPROVALS)
  // ========================
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  
  getActivityLogs: (page = 1) => request(`/activity-logs?page=${page}`),
  
  getPendingApprovals: () => request('/approvals/pending'),
  processApproval: (id, data) => request(`/approvals/${id}/process`, { method: 'POST', body: JSON.stringify(data) }),
  
  submitManualTransaction: (data) => request('/transactions/manual', { method: 'POST', body: JSON.stringify(data) }),
};

export default api;
