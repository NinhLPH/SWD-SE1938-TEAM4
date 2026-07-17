const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload;
};

export const api = {
  login: (body) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  getMyProducts: () => request('/products/mine'),
  createProduct: (body) => request('/products', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  updateProduct: (id, body) => request(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  deleteProduct: (id) => request(`/products/${id}`, {
    method: 'DELETE',
  }),
  getCategories: () => request('/search/categories'),
  searchProducts: (params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        searchParams.set(key, value)
      }
    })
    return request(`/search/products?${searchParams.toString()}`)
  },
  getProductDetail: (id) => request(`/search/products/${id}`),
  getCart: () => request('/cart'),
  addCartItem: (body) => request('/cart/items', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  updateCartItem: (itemId, body) => request(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  removeCartItem: (itemId) => request(`/cart/items/${itemId}`, {
    method: 'DELETE',
  }),
  checkout: (body) => request('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  getMyOrders: () => request('/orders/mine'),
  getShopOrders: () => request('/orders/shop'),
  updateOrderStatus: (orderId, body) => request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  getAdminDashboard: () => request('/admin/dashboard'),
  confirmMockPayment: (transactionId) => request(`/payments/mock/${transactionId}/confirm`, {
    method: 'POST',
  }),
  getAdminUsers: () => request('/admin/users'),
  getAdminProducts: () => request('/admin/products'),
  createAdminUser: (body) => request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  updateAdminUser: (id, body) => request(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, {
    method: 'DELETE',
  }),
};
