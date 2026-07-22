import { useEffect, useState } from 'react'
import { api } from './utils/api'
import { LoginPage } from './features/auth/LoginPage'
import { AdminPage } from './features/admin/AdminPage'
import { CustomerPage } from './features/customer/CustomerPage'
import './App.css'

const emptyForm = {
  categoryId: '',
  name: '',
  description: '',
  origin: '',
  priceVnd: '',
  stockQuantity: '',
  imageUrl: '',
  status: 'ACTIVE',
}

const emptyAdminUserForm = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  password: '',
}

const emptyStockInForm = {
  productId: '',
  quantity: '',
  note: '',
}

const buildAdminUserPayload = (form, isEditing) => {
  const payload = {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    role: form.role,
    status: form.status,
    password: form.password,
  }

  if (!payload.phone) delete payload.phone
  if (!payload.address) delete payload.address
  if (isEditing && !payload.password) delete payload.password

  return payload
}

const orderStatusTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING'],
  PACKING: ['SHIPPING'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : 'N/A')

const getInitialUser = () => {
  const stored = localStorage.getItem('authUser')
  return stored ? JSON.parse(stored) : null
}

const getInitialTab = (user) => {
  if (!user) return 'catalog'
  if (user.role === 'SHOP_OWNER') return 'manage'
  if (user.role === 'ADMIN') return 'admin'
  return 'catalog'
}

function App() {
  const [currentUser, setCurrentUser] = useState(getInitialUser)
  const [activeTab, setActiveTab] = useState(getInitialTab(currentUser))
  const [loginForm, setLoginForm] = useState({ email: 'customer@example.com', password: 'Password123!' })
  const [productForm, setProductForm] = useState(emptyForm)
  const [products, setProducts] = useState([])
  const [catalogProducts, setCatalogProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [cart, setCart] = useState(null)
  const [orders, setOrders] = useState([])
  const [adminDashboard, setAdminDashboard] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminProducts, setAdminProducts] = useState([])
  const [adminUserForm, setAdminUserForm] = useState(emptyAdminUserForm)
  const [editingAdminUserId, setEditingAdminUserId] = useState(null)
  const [stockInForm, setStockInForm] = useState(emptyStockInForm)
  const [stockTransactions, setStockTransactions] = useState([])
  const [stockTransactionMeta, setStockTransactionMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [paymentSession, setPaymentSession] = useState(null)
  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    minPriceVnd: '',
    maxPriceVnd: '',
    inStock: 'true',
    minRating: '',
    sort: 'newest',
    page: 1,
  })
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'COD',
  })
  const [catalogMeta, setCatalogMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const role = currentUser?.role || ''
  const isCustomer = role === 'CUSTOMER'
  const isShopOwner = role === 'SHOP_OWNER'
  const isAdmin = role === 'ADMIN'

  const loadProducts = async () => {
    const response = await api.getMyProducts()
    setProducts(response.data)
  }

  const loadStockTransactions = async (page = 1) => {
    const response = await api.getStockTransactions({ page, limit: 10 })
    setStockTransactions(response.data)
    setStockTransactionMeta(response.meta || { page, totalPages: 1, total: response.data.length })
  }

  const loadCatalog = async (nextFilters = filters) => {
    const response = await api.searchProducts(nextFilters)
    setCatalogProducts(response.data)
    setCatalogMeta(response.meta || { page: 1, totalPages: 1, total: response.data.length })
  }

  const loadCategories = async () => {
    const response = await api.getCategories()
    setCategories(response.data)
  }

  const loadCart = async () => {
    const response = await api.getCart()
    setCart(response.data)
  }

  const loadOrders = async () => {
    const response = isShopOwner ? await api.getShopOrders() : await api.getMyOrders()
    setOrders(response.data)
  }

  const loadAdminDashboard = async () => {
    const response = await api.getAdminDashboard()
    setAdminDashboard(response.data)
  }

  const loadAdminUsers = async () => {
    const response = await api.getAdminUsers()
    setAdminUsers(response.data)
  }

  const loadAdminProducts = async () => {
    const response = await api.getAdminProducts()
    setAdminProducts(response.data)
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.login(loginForm)
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('authUser', JSON.stringify(response.data.user))
      setCurrentUser(response.data.user)
      setActiveTab(getInitialTab(response.data.user))
      if (response.data.user.role === 'ADMIN') {
        const [dashboard, users, productsResponse] = await Promise.all([
          api.getAdminDashboard(),
          api.getAdminUsers(),
          api.getAdminProducts(),
        ])
        setAdminDashboard(dashboard.data)
        setAdminUsers(users.data)
        setAdminProducts(productsResponse.data)
      } else if (response.data.user.role === 'CUSTOMER') {
        await Promise.all([loadCatalog(), loadCategories()])
      } else if (response.data.user.role === 'SHOP_OWNER') {
        await loadProducts()
      }
      setMessage('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setCurrentUser(null)
    setActiveTab('catalog')
    setMessage('')
    setError('')
  }

  const handleSubmitProduct = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const payload = {
      ...productForm,
      priceVnd: Number(productForm.priceVnd),
      stockQuantity: Number(productForm.stockQuantity),
    }

    if (!payload.imageUrl) delete payload.imageUrl

    try {
      if (editingId) {
        await api.updateProduct(editingId, payload)
        setMessage('Product updated')
      } else {
        await api.createProduct(payload)
        setMessage('Product created')
      }
      setProductForm(emptyForm)
      setEditingId(null)
      await loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product._id)
    setProductForm({
      categoryId: product.category?._id || product.category || '',
      name: product.name || '',
      description: product.description || '',
      origin: product.origin || '',
      priceVnd: String(product.priceVnd || ''),
      stockQuantity: String(product.stockQuantity || ''),
      imageUrl: product.imageUrl || '',
      status: product.status || 'ACTIVE',
    })
  }

  const handleDelete = async (productId) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await api.deleteProduct(productId)
      setMessage('Product deleted')
      await loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const nextFilters = { ...filters, page: 1 }
      setFilters(nextFilters)
      await loadCatalog(nextFilters)
      if (categories.length === 0) await loadCategories()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page }
    setFilters(nextFilters)
    await loadCatalog(nextFilters)
  }

  const handleDetail = async (productId) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getProductDetail(productId)
      setSelectedProduct(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.addCartItem({ productId, quantity: 1 })
      setCart(response.data)
      setMessage('Added to cart')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCartItem = async (itemId, quantity) => {
    const response = await api.updateCartItem(itemId, { quantity: Number(quantity) })
    setCart(response.data)
  }

  const handleRemoveCartItem = async (itemId) => {
    const response = await api.removeCartItem(itemId)
    setCart(response.data)
  }

  const handleCheckout = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.checkout({
        paymentMethod: checkoutForm.paymentMethod,
        shippingAddress: {
          fullName: checkoutForm.fullName,
          phone: checkoutForm.phone,
          address: checkoutForm.address,
        },
      })
      await loadCart()
      await loadOrders()
      if (checkoutForm.paymentMethod === 'ONLINE') {
        setPaymentSession(response.data)
        setActiveTab('payment')
        setMessage('')
      } else {
        setPaymentSession(null)
        setActiveTab('orders')
        setMessage(`Created ${response.data.orders.length} COD order(s). Customer will pay when receiving goods.`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderStatus = async (orderId, status) => {
    const response = await api.updateOrderStatus(orderId, { status })
    setOrders((items) => items.map((item) => (item._id === orderId ? response.data : item)))
  }

  const handleOrderDetail = async (orderId) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.getMyOrderDetail(orderId)
      setSelectedOrder(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOwnerConfirmPayment = async (orderId) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.confirmOrderVietQrPayment(orderId)
      setOrders((items) => items.map((item) => (item._id === orderId ? response.data.order : item)))
      setMessage('Payment confirmed by shop owner.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrepareStockIn = (product) => {
    setStockInForm({ productId: product._id, quantity: '', note: '' })
    setMessage('')
    setError('')
  }

  const handleStockIn = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const product = products.find((item) => item._id === stockInForm.productId)
    const quantity = Number(stockInForm.quantity)

    if (!product) {
      setError('Please select a product to import stock.')
      setLoading(false)
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Import quantity must be a positive integer.')
      setLoading(false)
      return
    }

    try {
      const response = await api.addStock(product._id, {
        quantity,
        note: stockInForm.note.trim(),
      })
      const nextStockQuantity = response.data.stockTransaction.quantityAfter
      setMessage(`Imported ${quantity} item(s) into ${product.name}. Current stock: ${nextStockQuantity}.`)
      setStockInForm(emptyStockInForm)
      await Promise.all([loadProducts(), loadStockTransactions()])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStockHistoryPage = async (page) => {
    await loadStockTransactions(page)
  }

  const handleCancelOrder = async (orderId) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.cancelMyOrder(orderId)
      setOrders((items) => items.map((item) => (item._id === orderId ? response.data : item)))
      setSelectedOrder((order) => (order?._id === orderId ? response.data : order))
      setMessage('Order cancelled. Reserved stock has been returned.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentSession) return
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await api.submitVietQrTransfer(paymentSession.payment.transactionId)
      setMessage('Transfer submitted. Waiting for shop owner confirmation.')
      setPaymentSession(null)
      await loadOrders()
      setActiveTab('orders')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAdminUser = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const payload = buildAdminUserPayload(adminUserForm, Boolean(editingAdminUserId))

    if (!payload.fullName || payload.fullName.length < 2) {
      setError('Full name must be at least 2 characters.')
      setLoading(false)
      return
    }

    if (!payload.email) {
      setError('Email is required.')
      setLoading(false)
      return
    }

    if (!editingAdminUserId && payload.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (payload.password && payload.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    try {
      if (editingAdminUserId) {
        await api.updateAdminUser(editingAdminUserId, payload)
        setMessage('User updated')
      } else {
        await api.createAdminUser(payload)
        setMessage('User created')
      }
      setAdminUserForm(emptyAdminUserForm)
      setEditingAdminUserId(null)
      await Promise.all([loadAdminUsers(), loadAdminDashboard()])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAdminUser = (user) => {
    setEditingAdminUserId(user._id)
    setAdminUserForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'CUSTOMER',
      status: user.status || 'ACTIVE',
      password: '',
    })
  }

  const handleDeleteAdminUser = async (userId) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await api.deleteAdminUser(userId)
      setMessage('User locked')
      await Promise.all([loadAdminUsers(), loadAdminDashboard()])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      if (!currentUser) return

      try {
        if (currentUser.role === 'CUSTOMER' && activeTab === 'catalog') {
          const [catalogResponse, categoryResponse] = await Promise.all([
            api.searchProducts(filters),
            api.getCategories(),
          ])
          if (!cancelled) {
            setCatalogProducts(catalogResponse.data)
            setCatalogMeta(catalogResponse.meta || { page: 1, totalPages: 1, total: catalogResponse.data.length })
            setCategories(categoryResponse.data)
          }
        }

        if (currentUser.role === 'CUSTOMER' && activeTab === 'cart') {
          const response = await api.getCart()
          if (!cancelled) setCart(response.data)
        }

        if ((currentUser.role === 'CUSTOMER' || currentUser.role === 'SHOP_OWNER') && activeTab === 'orders') {
          const response = currentUser.role === 'SHOP_OWNER' ? await api.getShopOrders() : await api.getMyOrders()
          if (!cancelled) setOrders(response.data)
        }

        if (currentUser.role === 'SHOP_OWNER' && activeTab === 'manage') {
          const [productsResponse, stockTransactionsResponse] = await Promise.all([
            api.getMyProducts(),
            api.getStockTransactions({ page: 1, limit: 10 }),
          ])
          if (!cancelled) {
            setProducts(productsResponse.data)
            setStockTransactions(stockTransactionsResponse.data)
            setStockTransactionMeta(stockTransactionsResponse.meta || { page: 1, totalPages: 1, total: stockTransactionsResponse.data.length })
          }
        }

        if (currentUser.role === 'ADMIN') {
          const [dashboardResponse, usersResponse, productsResponse] = await Promise.all([
            api.getAdminDashboard(),
            api.getAdminUsers(),
            api.getAdminProducts(),
          ])
          if (!cancelled) {
            setAdminDashboard(dashboardResponse.data)
            setAdminUsers(usersResponse.data)
            setAdminProducts(productsResponse.data)
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
    // Initial role/tab hydration intentionally fetches server data after localStorage restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab])

  if (!currentUser) {
    return (
      <LoginPage
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        onLogin={handleLogin}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">Fruit Marketplace</div>
          <div className="muted">{currentUser.email} · {currentUser.role}</div>
        </div>
        <button className="secondary" type="button" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="tabs">
        {isCustomer && <button className={activeTab === 'catalog' ? 'active' : ''} onClick={() => { setActiveTab('catalog'); loadCatalog().catch((err) => setError(err.message)); loadCategories().catch((err) => setError(err.message)) }}>Catalog</button>}
        {isCustomer && (
          <button className={activeTab === 'cart' ? 'active' : ''} onClick={() => { setActiveTab('cart'); loadCart().catch((err) => setError(err.message)) }}>
            Cart ({cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0})
          </button>
        )}
        {isCustomer && paymentSession && <button className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>Payment</button>}
        {!isAdmin && <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => { setActiveTab('orders'); loadOrders().catch((err) => setError(err.message)) }}>Orders</button>}
        {isShopOwner && <button className={activeTab === 'manage' ? 'active' : ''} onClick={() => { setActiveTab('manage'); loadProducts().catch((err) => setError(err.message)); loadStockTransactions().catch((err) => setError(err.message)) }}>Shop Products</button>}
        {isAdmin && (
          <button
            className="active"
            onClick={() => {
              loadAdminDashboard().catch((err) => setError(err.message))
              loadAdminUsers().catch((err) => setError(err.message))
              loadAdminProducts().catch((err) => setError(err.message))
            }}
          >
            Admin
          </button>
        )}
      </nav>

      {isAdmin && (
        <AdminPage
          adminDashboard={adminDashboard}
          adminUsers={adminUsers}
          adminProducts={adminProducts}
          adminUserForm={adminUserForm}
          editingAdminUserId={editingAdminUserId}
          loading={loading}
          error={error}
          message={message}
          setAdminUserForm={setAdminUserForm}
          onSubmitUser={handleSubmitAdminUser}
          onEditUser={handleEditAdminUser}
          onDeleteUser={handleDeleteAdminUser}
          onCancelUser={() => {
            setEditingAdminUserId(null)
            setAdminUserForm(emptyAdminUserForm)
          }}
          onRefreshDashboard={() => {
            loadAdminDashboard().catch((err) => setError(err.message))
            loadAdminUsers().catch((err) => setError(err.message))
            loadAdminProducts().catch((err) => setError(err.message))
          }}
          onRefreshProducts={() => loadAdminProducts().catch((err) => setError(err.message))}
        />
      )}

      {isCustomer && (
        <CustomerPage
          activeTab={activeTab}
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          loadCategories={loadCategories}
          catalogProducts={catalogProducts}
          catalogMeta={catalogMeta}
          selectedProduct={selectedProduct}
          cart={cart}
          orders={orders}
          selectedOrder={selectedOrder}
          checkoutForm={checkoutForm}
          setCheckoutForm={setCheckoutForm}
          paymentSession={paymentSession}
          loading={loading}
          error={error}
          message={message}
          onSearch={handleSearch}
          onPage={handlePage}
          onDetail={handleDetail}
          onAddToCart={handleAddToCart}
          onUpdateCartItem={handleUpdateCartItem}
          onRemoveCartItem={handleRemoveCartItem}
          onCheckout={handleCheckout}
          onConfirmPayment={handleConfirmPayment}
          onGoToOrders={() => setActiveTab('orders')}
          onCancelOrder={handleCancelOrder}
          onOrderDetail={handleOrderDetail}
          onCloseOrderDetail={() => setSelectedOrder(null)}
          setError={setError}
        />
      )}

      {isShopOwner && activeTab === 'manage' && (
        <main className="content">
          <div className="panel-stack">
            <section className="panel">
              <h2>{editingId ? 'Edit Product' : 'Create Product'}</h2>
              {message && <div className="message">{message}</div>}
              {error && <div className="message error">{error}</div>}
              <form className="form-grid" onSubmit={handleSubmitProduct}>
                <label className="field">
                  <span>Category ID</span>
                  <input value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Name</span>
                  <input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea rows="3" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
                </label>
                <label className="field">
                  <span>Origin</span>
                  <input value={productForm.origin} onChange={(event) => setProductForm({ ...productForm, origin: event.target.value })} />
                </label>
                <label className="field">
                  <span>Price VND</span>
                  <input min="0" type="number" value={productForm.priceVnd} onChange={(event) => setProductForm({ ...productForm, priceVnd: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Stock</span>
                  <input min="0" type="number" value={productForm.stockQuantity} onChange={(event) => setProductForm({ ...productForm, stockQuantity: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Image URL</span>
                  <input value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select value={productForm.status} onChange={(event) => setProductForm({ ...productForm, status: event.target.value })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="HIDDEN">HIDDEN</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </label>
                <div className="actions">
                  <button disabled={loading}>{editingId ? 'Save' : 'Create'}</button>
                  {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(null); setProductForm(emptyForm) }}>Cancel</button>}
                </div>
              </form>
            </section>

            <section className="panel">
              <h2>Stock In</h2>
              {message && <div className="message">{message}</div>}
              {error && <div className="message error">{error}</div>}
              <form className="form-grid" onSubmit={handleStockIn}>
                <label className="field">
                  <span>Product</span>
                  <select value={stockInForm.productId} onChange={(event) => setStockInForm({ ...stockInForm, productId: event.target.value })} required>
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - Stock {product.stockQuantity}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Import quantity</span>
                  <input min="1" type="number" value={stockInForm.quantity} onChange={(event) => setStockInForm({ ...stockInForm, quantity: event.target.value })} required />
                </label>
                <label className="field">
                  <span>Note</span>
                  <textarea rows="3" maxLength="300" value={stockInForm.note} onChange={(event) => setStockInForm({ ...stockInForm, note: event.target.value })} />
                </label>
                {stockInForm.productId && (
                  <div className="stat-card">
                    <span>Stock after import</span>
                    <strong>
                      {Number(products.find((product) => product._id === stockInForm.productId)?.stockQuantity || 0) + Number(stockInForm.quantity || 0)}
                    </strong>
                  </div>
                )}
                <div className="actions">
                  <button disabled={loading}>Import Stock</button>
                  <button className="secondary" type="button" onClick={() => setStockInForm(emptyStockInForm)}>Clear</button>
                </div>
              </form>
            </section>
          </div>

          <div className="panel-stack">
            <section className="panel">
              <h2>My Products</h2>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{Number(product.priceVnd).toLocaleString('vi-VN')} VND</td>
                      <td>{product.stockQuantity}</td>
                      <td>{product.status}</td>
                      <td className="actions">
                        <button className="secondary" type="button" onClick={() => handlePrepareStockIn(product)}>Stock in</button>
                        <button className="secondary" type="button" onClick={() => handleEdit(product)}>Edit</button>
                        <button className="danger" type="button" onClick={() => handleDelete(product._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="5">No products loaded.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Stock History</h2>
                <div className="actions">
                  <button className="secondary" type="button" disabled={stockTransactionMeta.page <= 1} onClick={() => handleStockHistoryPage(stockTransactionMeta.page - 1).catch((err) => setError(err.message))}>Prev</button>
                  <button className="secondary" type="button" disabled={stockTransactionMeta.page >= stockTransactionMeta.totalPages} onClick={() => handleStockHistoryPage(stockTransactionMeta.page + 1).catch((err) => setError(err.message))}>Next</button>
                </div>
              </div>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {stockTransactions.map((item) => (
                    <tr key={item._id}>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{item.product?.name || 'Product'}</td>
                      <td>+{item.quantity}</td>
                      <td>{item.quantityBefore}</td>
                      <td>{item.quantityAfter}</td>
                      <td>{item.note || '-'}</td>
                    </tr>
                  ))}
                  {stockTransactions.length === 0 && <tr><td colSpan="6">No stock history yet.</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        </main>
      )}

      {isShopOwner && activeTab === 'orders' && (
        <main className="content single">
          <section className="panel">
            <h2>Orders</h2>
            {message && <div className="message">{message}</div>}
            {error && <div className="message error">{error}</div>}
            <table className="product-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{Number(order.totalAmountVnd).toLocaleString('vi-VN')} VND</td>
                    <td>
                      <div>{order.paymentMethod} · {order.paymentStatus}</div>
                      {order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PENDING' && (
                        <button
                          className="secondary"
                          type="button"
                          disabled={loading}
                          onClick={() => handleOwnerConfirmPayment(order._id)}
                        >
                          Confirm payment
                        </button>
                      )}
                    </td>
                    <td>
                      {isShopOwner ? (
                        <select
                          value={order.status}
                          disabled={(orderStatusTransitions[order.status] || []).length === 0}
                          onChange={(event) => handleOrderStatus(order._id, event.target.value).catch((err) => setError(err.message))}
                        >
                          <option value={order.status}>{order.status}</option>
                          {(orderStatusTransitions[order.status] || []).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : order.status}
                    </td>
                    <td>{order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan="5">No orders loaded.</td></tr>}
              </tbody>
            </table>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
