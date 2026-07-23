const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Hàm gọi API dùng chung: tự gắn token, parse JSON và chuẩn hóa lỗi trả về.
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
    const fieldErrors = payload?.error?.details?.fieldErrors;
    const firstFieldError = fieldErrors
      ? Object.entries(fieldErrors).find(([, messages]) => messages?.length)
      : null;
    const detail = firstFieldError ? `${firstFieldError[0]}: ${firstFieldError[1][0]}` : '';
    throw new Error(detail || payload?.message || 'Request failed');
  }

  return payload;
};

export const api = {
  // Đăng nhập và nhận token xác thực.
  login: (body) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Lấy sản phẩm của shop owner hiện tại.
  getMyProducts: () => request('/products/mine'),
  // Tạo sản phẩm mới cho shop owner.
  createProduct: (body) => request('/products', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Cập nhật thông tin sản phẩm theo id.
  updateProduct: (id, body) => request(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  // Nhập thêm tồn kho cho một sản phẩm.
  addStock: (id, body) => request(`/products/${id}/stock-in`, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Lấy lịch sử nhập kho, có hỗ trợ query phân trang.
  getStockTransactions: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        searchParams.set(key, value)
      }
    })
    const query = searchParams.toString()
    return request(`/products/stock-transactions${query ? `?${query}` : ''}`)
  },
  // Xóa sản phẩm theo id.
  deleteProduct: (id) => request(`/products/${id}`, {
    method: 'DELETE',
  }),
  // Lấy danh mục sản phẩm cho bộ lọc catalog.
  getCategories: () => request('/search/categories'),
  // Tìm kiếm sản phẩm theo bộ lọc catalog.
  searchProducts: (params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        searchParams.set(key, value)
      }
    })
    return request(`/search/products?${searchParams.toString()}`)
  },
  // Lấy chi tiết một sản phẩm trong catalog.
  getProductDetail: (id) => request(`/search/products/${id}`),
  // Lấy giỏ hàng của khách hàng hiện tại.
  getCart: () => request('/cart'),
  // Thêm sản phẩm vào giỏ hàng.
  addCartItem: (body) => request('/cart/items', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Cập nhật số lượng một item trong giỏ.
  updateCartItem: (itemId, body) => request(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  // Xóa một item khỏi giỏ hàng.
  removeCartItem: (itemId) => request(`/cart/items/${itemId}`, {
    method: 'DELETE',
  }),
  // Checkout giỏ hàng thành đơn hàng.
  checkout: (body) => request('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Lấy danh sách đơn hàng của khách hàng.
  getMyOrders: () => request('/orders/mine'),
  // Lấy chi tiết một đơn hàng của khách hàng.
  getMyOrderDetail: (orderId) => request(`/orders/mine/${orderId}`),
  // Lấy đơn hàng thuộc shop owner hiện tại.
  getShopOrders: () => request('/orders/shop'),
  // Cập nhật trạng thái xử lý/giao hàng của đơn.
  updateOrderStatus: (orderId, body) => request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  // Khách hàng hủy đơn của mình.
  cancelMyOrder: (orderId) => request(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
  }),
  // Lấy dữ liệu dashboard tổng quan cho admin.
  getAdminDashboard: () => request('/admin/dashboard'),
  // Xác nhận thanh toán mock theo transaction id.
  confirmMockPayment: (transactionId) => request(`/payments/mock/${transactionId}/confirm`, {
    method: 'POST',
  }),
  // Khách hàng gửi xác nhận đã chuyển khoản VietQR.
  submitVietQrTransfer: (transactionId) => request(`/payments/vietqr/${transactionId}/submit`, {
    method: 'POST',
  }),
  // Shop owner xác nhận tiền VietQR đã vào cho đơn hàng.
  confirmOrderVietQrPayment: (orderId) => request(`/payments/vietqr/orders/${orderId}/confirm`, {
    method: 'POST',
  }),
  // Lấy danh sách tài khoản để admin quản lý.
  getAdminUsers: () => request('/admin/users'),
  // Lấy toàn bộ sản phẩm để admin giám sát.
  getAdminProducts: () => request('/admin/products'),
  // Admin tạo tài khoản mới.
  createAdminUser: (body) => request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Admin cập nhật thông tin tài khoản.
  updateAdminUser: (id, body) => request(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  // Admin khóa/xóa tài khoản theo API hiện có.
  deleteAdminUser: (id) => request(`/admin/users/${id}`, {
    method: 'DELETE',
  }),
};
