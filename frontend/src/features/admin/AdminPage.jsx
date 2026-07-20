import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Boxes, CircleDollarSign, RefreshCw, ShieldCheck, ShoppingBag, Store, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statIcons = {
  users: Users,
  shops: Store,
  categories: Boxes,
  products: ShoppingBag,
  carts: ShoppingBag,
  orders: ShoppingBag,
  payments: CircleDollarSign,
  totalPaidVnd: CircleDollarSign,
}

const statLabels = {
  users: 'Users',
  shops: 'Shops',
  categories: 'Categories',
  products: 'Products',
  carts: 'Carts',
  orders: 'Orders',
  payments: 'Payments',
  totalPaidVnd: 'Paid Revenue',
}

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`

export function AdminPage({
  adminDashboard,
  adminUsers,
  adminProducts,
  adminUserForm,
  editingAdminUserId,
  loading,
  error,
  message,
  setAdminUserForm,
  onSubmitUser,
  onEditUser,
  onDeleteUser,
  onCancelUser,
  onRefreshDashboard,
  onRefreshProducts,
}) {
  const [shopProductPage, setShopProductPage] = useState(0)
  const productGroups = useMemo(() => groupProductsByShop(adminProducts), [adminProducts])
  const safeShopPage = Math.min(shopProductPage, Math.max(productGroups.length - 1, 0))
  const visibleProductGroup = productGroups[safeShopPage]

  return (
    <main className="grid gap-5 p-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <ShieldCheck className="size-4" />
              Admin Workspace
            </div>
            <h1 className="mt-1 text-2xl font-semibold">Operations Dashboard</h1>
          </div>
          <Button variant="outline" className="rounded-md" onClick={onRefreshDashboard}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
      </section>

      {adminDashboard && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(adminDashboard.stats).map(([key, value]) => {
            const Icon = statIcons[key] || Boxes
            return (
              <div key={key} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">{statLabels[key] || key}</span>
                  <Icon className="size-4 text-emerald-700" />
                </div>
                <div className="mt-3 text-2xl font-semibold">{key === 'totalPaidVnd' ? money(value) : value}</div>
              </div>
            )
          })}
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{editingAdminUserId ? 'Edit Account' : 'Create Account'}</h2>
          <form className="mt-4 grid gap-3" onSubmit={onSubmitUser}>
            <AdminInput label="Full name" value={adminUserForm.fullName} onChange={(value) => setAdminUserForm({ ...adminUserForm, fullName: value })} required />
            <AdminInput label="Email" value={adminUserForm.email} onChange={(value) => setAdminUserForm({ ...adminUserForm, email: value })} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput label="Phone" value={adminUserForm.phone} onChange={(value) => setAdminUserForm({ ...adminUserForm, phone: value })} />
              <label className="grid gap-1.5 text-sm font-medium">
                Role
                <select className="h-10 rounded-md border border-neutral-300 px-3" value={adminUserForm.role} onChange={(event) => setAdminUserForm({ ...adminUserForm, role: event.target.value })}>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="SHOP_OWNER">SHOP_OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
            </div>
            <AdminInput label="Address" value={adminUserForm.address} onChange={(value) => setAdminUserForm({ ...adminUserForm, address: value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Status
                <select className="h-10 rounded-md border border-neutral-300 px-3" value={adminUserForm.status} onChange={(event) => setAdminUserForm({ ...adminUserForm, status: event.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="LOCKED">LOCKED</option>
                </select>
              </label>
              <AdminInput
                label="Password"
                type="password"
                value={adminUserForm.password}
                onChange={(value) => setAdminUserForm({ ...adminUserForm, password: value })}
                required={!editingAdminUserId}
                placeholder={editingAdminUserId ? 'Keep current' : ''}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-md bg-emerald-700 hover:bg-emerald-800" disabled={loading}>
                {editingAdminUserId ? 'Save Account' : 'Create Account'}
              </Button>
              {editingAdminUserId && (
                <Button type="button" variant="outline" className="rounded-md" onClick={onCancelUser}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        <DataPanel title="Account Management">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr className="border-t" key={user._id}>
                  <td className="px-3 py-2 font-medium">{user.fullName}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => onEditUser(user)}>Edit</Button>
                      <Button type="button" variant="destructive" size="sm" className="rounded-md" onClick={() => onDeleteUser(user._id)}>Lock</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>
      </section>

      <DataPanel
        title="All Products"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-md" disabled={safeShopPage <= 0} onClick={() => setShopProductPage((page) => Math.max(page - 1, 0))} title="Previous shop">
              <ArrowLeft className="size-4" />
              Prev shop
            </Button>
            <Badge variant="outline" className="h-8 px-2.5">
              Shop {productGroups.length ? safeShopPage + 1 : 0} / {productGroups.length}
            </Badge>
            <Button variant="outline" size="sm" className="rounded-md" disabled={safeShopPage >= productGroups.length - 1} onClick={() => setShopProductPage((page) => Math.min(page + 1, productGroups.length - 1))} title="Next shop">
              Next shop
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" className="rounded-md" onClick={onRefreshProducts}><RefreshCw className="size-4" />Refresh</Button>
          </div>
        )}
      >
        {visibleProductGroup ? (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-neutral-50 px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{visibleProductGroup.shopName}</h3>
                  <Badge variant="secondary">{visibleProductGroup.products.length} products</Badge>
                  <Badge variant="outline">Stock {visibleProductGroup.totalStock}</Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{visibleProductGroup.ownerEmail}</p>
              </div>
              <div className="text-right text-sm font-semibold">{money(visibleProductGroup.totalValue)}</div>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-white text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleProductGroup.products.map((product) => (
                  <tr className="border-t align-top" key={product._id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{product.name}</div>
                      <div className="mt-1 text-xs text-neutral-500">{product.category?.name || 'No category'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{money(product.priceVnd)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.status === 'ACTIVE' ? 'success' : 'secondary'}>{product.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-neutral-500">No products loaded.</div>
        )}
      </DataPanel>

      {adminDashboard && (
        <section className="grid gap-5 xl:grid-cols-2">
          <SimpleRecentTable title="Recent Users" rows={adminDashboard.recentUsers} columns={['fullName', 'email', 'role', 'status']} />
          <SimpleRecentTable title="Recent Orders" rows={adminDashboard.recentOrders} columns={['user.email', 'shop.name', 'totalAmountVnd', 'status']} moneyColumn="totalAmountVnd" />
        </section>
      )}
    </main>
  )
}

function groupProductsByShop(products) {
  const groups = new Map()

  products.forEach((product) => {
    const shopId = product.shop?._id || product.shop?.id || product.shop?.name || 'unknown-shop'
    const existing = groups.get(shopId) || {
      shopId,
      shopName: product.shop?.name || 'No shop',
      ownerEmail: product.createdBy?.email || product.createdByEmail || product.shop?.owner?.email || 'No owner',
      products: [],
      totalStock: 0,
      totalValue: 0,
    }

    existing.products.push(product)
    existing.totalStock += Number(product.stockQuantity || 0)
    existing.totalValue += Number(product.priceVnd || 0) * Number(product.stockQuantity || 0)
    groups.set(shopId, existing)
  })

  return Array.from(groups.values()).sort((a, b) => a.shopName.localeCompare(b.shopName))
}

function AdminInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        className="h-10 rounded-md border border-neutral-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </label>
  )
}

function DataPanel({ title, action, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div className="overflow-auto">{children}</div>
    </section>
  )
}

function SimpleRecentTable({ title, rows, columns, moneyColumn }) {
  const getValue = (row, column) => column.split('.').reduce((value, key) => value?.[key], row)
  return (
    <DataPanel title={title}>
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>{columns.map((column) => <th className="px-3 py-2" key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t" key={row._id}>
              {columns.map((column) => (
                <td className="px-3 py-2" key={column}>
                  {column === moneyColumn ? money(getValue(row, column)) : getValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </DataPanel>
  )
}
