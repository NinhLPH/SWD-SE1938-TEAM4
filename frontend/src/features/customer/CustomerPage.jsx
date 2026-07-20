import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  LayoutGrid,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`
const cartCount = (cart) => cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

export function CustomerPage({
  activeTab,
  filters,
  setFilters,
  categories,
  loadCategories,
  catalogProducts,
  catalogMeta,
  selectedProduct,
  cart,
  orders,
  checkoutForm,
  setCheckoutForm,
  paymentSession,
  loading,
  error,
  message,
  onSearch,
  onPage,
  onDetail,
  onAddToCart,
  onUpdateCartItem,
  onRemoveCartItem,
  onCheckout,
  onConfirmPayment,
  onGoToOrders,
  onCancelOrder,
  setError,
}) {
  if (activeTab === 'cart') {
    return (
      <CustomerShell
        eyebrow="Cart"
        title="Review your basket"
        description="Adjust quantity, choose payment method, and checkout when ready."
      >
        <CartScreen
          cart={cart}
          checkoutForm={checkoutForm}
          setCheckoutForm={setCheckoutForm}
          loading={loading}
          error={error}
          message={message}
          onUpdateCartItem={onUpdateCartItem}
          onRemoveCartItem={onRemoveCartItem}
          onCheckout={onCheckout}
          setError={setError}
        />
      </CustomerShell>
    )
  }

  if (activeTab === 'payment' && paymentSession) {
    return (
      <CustomerShell
        eyebrow="Payment"
        title="Mock online checkout"
        description="Confirming this demo gateway simulates a successful callback."
      >
        <PaymentScreen paymentSession={paymentSession} loading={loading} error={error} onConfirmPayment={onConfirmPayment} onGoToOrders={onGoToOrders} />
      </CustomerShell>
    )
  }

  if (activeTab === 'orders') {
    return (
      <CustomerShell
        eyebrow="Orders"
        title="Track every order"
        description="Follow payment and delivery status for each shop order."
      >
        <OrdersScreen orders={orders} loading={loading} error={error} message={message} onCancelOrder={onCancelOrder} />
      </CustomerShell>
    )
  }

  return (
    <CustomerShell
      eyebrow="Marketplace"
      title="Fresh fruit catalog"
      description="Search verified shop products, view details, and add items without leaving the catalog."
      metrics={[
        { label: 'Products', value: catalogMeta.total || catalogProducts.length },
        { label: 'Cart', value: cartCount(cart) },
        { label: 'Orders', value: orders.length },
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <CatalogFilters
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          loadCategories={loadCategories}
          loading={loading}
          onSearch={onSearch}
          setError={setError}
        />
        <div className="grid gap-4">
          <CatalogGrid
            products={catalogProducts}
            meta={catalogMeta}
            loading={loading}
            message={message}
            error={error}
            onDetail={onDetail}
            onAddToCart={onAddToCart}
            onPage={onPage}
          />
          {selectedProduct && <ProductDetail product={selectedProduct} />}
        </div>
      </div>
    </CustomerShell>
  )
}

function CustomerShell({ eyebrow, title, description, metrics = [], children }) {
  return (
    <main className="min-h-[calc(100vh-126px)] bg-neutral-50 px-4 py-5 text-foreground sm:px-6">
      <Card className="mb-4 overflow-hidden">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant="success" className="mb-3">
              <Sparkles className="size-3" />
              {eyebrow}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {metrics.map((metric) => (
                <Card key={metric.label} className="min-w-24 bg-neutral-50">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                    <div className="mt-1 text-xl font-semibold">{metric.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {children}
    </main>
  )
}

function CatalogFilters({ filters, setFilters, categories, loadCategories, loading, onSearch, setError }) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5 text-emerald-700" />
          Filters
        </CardTitle>
        <CardDescription>Refine catalog results.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSearch}>
          <FormField label="Keyword">
            <Input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder="Apple, mango, berry..." />
          </FormField>
          <FormField label="Category">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={filters.categoryId}
              onFocus={() => categories.length === 0 && loadCategories().catch((err) => setError(err.message))}
              onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <FormField label="Min price">
              <Input type="number" min="0" value={filters.minPriceVnd} onChange={(event) => setFilters({ ...filters, minPriceVnd: event.target.value })} />
            </FormField>
            <FormField label="Max price">
              <Input type="number" min="0" value={filters.maxPriceVnd} onChange={(event) => setFilters({ ...filters, maxPriceVnd: event.target.value })} />
            </FormField>
          </div>
          <FormField label="Minimum rating">
            <Input type="number" min="0" max="5" step="0.1" value={filters.minRating} onChange={(event) => setFilters({ ...filters, minRating: event.target.value })} />
          </FormField>
          <FormField label="Sort">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={filters.sort}
              onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
              <option value="rating_desc">Rating</option>
            </select>
          </FormField>
          <Button type="submit" className="mt-1 rounded-md" disabled={loading}>
            <Search className="size-4" />
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function CatalogGrid({ products, meta, loading, message, error, onDetail, onAddToCart, onPage }) {
  return (
    <Card>
      <CardHeader className="md:flex md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-emerald-700" />
            Products
          </CardTitle>
          <CardDescription>Add to cart now, checkout later.</CardDescription>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-md"
            disabled={meta.page <= 1}
            onClick={() => onPage(meta.page - 1)}
            title="Previous page"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Badge variant="outline" className="h-8 px-2.5">Page {meta.page} / {meta.totalPages || 1}</Badge>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-md"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPage(meta.page + 1)}
            title="Next page"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {message && <Notice>{message}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {products.length === 0 ? (
          <EmptyBlock title="No products" description="Use the filter panel and run Search to load fruit." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => (
              <Card key={product._id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-neutral-100">
                  {product.imageUrl ? <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">No image</div>}
                </div>
                <CardContent className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{product.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{product.shop?.name || 'Shop'} - Stock {product.stockQuantity}</p>
                    </div>
                    <Badge variant="warning">
                      <Star className="size-3" />
                      {product.averageRating || 0}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold">{money(product.priceVnd)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" className="rounded-md" onClick={() => onDetail(product._id)}>Detail</Button>
                    <Button type="button" className="rounded-md" onClick={() => onAddToCart(product._id)} disabled={loading}>
                      <ShoppingCart className="size-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductDetail({ product }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[320px_1fr]">
        {product.imageUrl && <img className="h-full min-h-72 w-full object-cover" src={product.imageUrl} alt={product.name} />}
        <CardContent className="grid gap-4 p-5">
          <div>
            <Badge variant="success">{product.category?.name || 'Fruit'}</Badge>
            <h2 className="mt-3 text-2xl font-semibold">{product.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description || 'No description'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile label="Price" value={money(product.priceVnd)} />
            <InfoTile label="Stock" value={product.stockQuantity} />
            <InfoTile label="Origin" value={product.origin || 'N/A'} />
          </div>
          <p className="text-sm text-muted-foreground">{product.shop?.name}</p>
        </CardContent>
      </div>
    </Card>
  )
}

function CartScreen({ cart, checkoutForm, setCheckoutForm, loading, error, message, onUpdateCartItem, onRemoveCartItem, onCheckout, setError }) {
  const items = cart?.items || []

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-emerald-700" />
            Cart Items
          </CardTitle>
          <CardDescription>{items.length} product rows, {items.reduce((sum, item) => sum + item.quantity, 0)} total items.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {message && <Notice>{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {items.length === 0 ? (
            <EmptyBlock title="Cart is empty" description="Add products from catalog before checkout." />
          ) : (
            items.map((item) => (
              <Card key={item.id} className="bg-neutral-50">
                <CardContent className="grid gap-3 p-3 md:grid-cols-[1fr_110px_140px_auto] md:items-center">
                  <div>
                    <div className="font-semibold">{item.product.name}</div>
                    <p className="text-sm text-muted-foreground">{money(item.product.priceVnd)} - Stock {item.product.stockQuantity}</p>
                  </div>
                  <Input min="1" type="number" defaultValue={item.quantity} onBlur={(event) => onUpdateCartItem(item.id, event.target.value).catch((err) => setError(err.message))} />
                  <div className="font-semibold">{money(item.lineTotalVnd)}</div>
                  <Button type="button" variant="destructive" className="rounded-md" onClick={() => onRemoveCartItem(item.id).catch((err) => setError(err.message))}>
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Total: {money(cart?.subtotalVnd)}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onCheckout}>
            <FormField label="Receiver">
              <Input value={checkoutForm.fullName} onChange={(event) => setCheckoutForm({ ...checkoutForm, fullName: event.target.value })} required />
            </FormField>
            <FormField label="Phone">
              <Input value={checkoutForm.phone} onChange={(event) => setCheckoutForm({ ...checkoutForm, phone: event.target.value })} required />
            </FormField>
            <FormField label="Address">
              <Input value={checkoutForm.address} onChange={(event) => setCheckoutForm({ ...checkoutForm, address: event.target.value })} required />
            </FormField>
            <FormField label="Payment">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                value={checkoutForm.paymentMethod}
                onChange={(event) => setCheckoutForm({ ...checkoutForm, paymentMethod: event.target.value })}
              >
                <option value="COD">COD - Pay on delivery</option>
                <option value="ONLINE">Online - Demo payment</option>
              </select>
            </FormField>
            <Button type="submit" className="rounded-md" disabled={loading || items.length === 0}>
              <CreditCard className="size-4" />
              Checkout
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentScreen({ paymentSession, loading, error, onConfirmPayment, onGoToOrders }) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700" />
          Demo gateway
        </CardTitle>
        <CardDescription>Online payment is simulated for demo workflow.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="Transaction" value={paymentSession.payment.transactionId} />
          <InfoTile label="Amount" value={money(paymentSession.payment.amountVnd)} />
          <InfoTile label="Provider" value="Mock Gateway" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="rounded-md" disabled={loading} onClick={onConfirmPayment}>Payment successful</Button>
          <Button type="button" variant="outline" className="rounded-md" onClick={onGoToOrders}>Pay later</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrdersScreen({ orders, loading, error, message, onCancelOrder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="size-5 text-emerald-700" />
          My Orders
        </CardTitle>
        <CardDescription>Orders are split by shop during checkout.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {message && <Notice>{message}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {orders.length === 0 ? (
          <EmptyBlock title="No orders" description="Checkout from cart to create your first order." />
        ) : (
          orders.map((order) => {
            const canCancel = order.status === 'PENDING'

            return (
              <Card key={order._id} className="bg-neutral-50">
                <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="text-sm text-muted-foreground">Order #{order._id}</div>
                    <div className="mt-1 font-medium">{order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Truck className="size-3" />
                        {order.status}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'secondary'}>{order.paymentMethod} - {order.paymentStatus}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-2 justify-items-start lg:justify-items-end">
                    <div className="text-lg font-semibold">{money(order.totalAmountVnd)}</div>
                    {canCancel && (
                      <Button type="button" variant="destructive" size="sm" className="rounded-md" disabled={loading} onClick={() => onCancelOrder(order._id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function FormField({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

function Notice({ children, tone = 'success' }) {
  return <Badge variant={tone === 'error' ? 'destructive' : 'success'} className="w-full justify-start rounded-lg px-3 py-2">{children}</Badge>
}

function InfoTile({ label, value }) {
  return (
    <Card className="bg-neutral-50">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 break-words font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function EmptyBlock({ title, description }) {
  return (
    <Card className="border-dashed bg-neutral-50">
      <CardContent className="grid place-items-center px-4 py-10 text-center">
        <div className="font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
