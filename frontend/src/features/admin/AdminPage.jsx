import { Boxes, CircleDollarSign, RefreshCw, ShieldCheck, ShoppingBag, Store, Users } from 'lucide-react'
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
        action={<Button variant="outline" className="rounded-md" onClick={onRefreshProducts}><RefreshCw className="size-4" />Refresh Products</Button>}
      >
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Shop</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Owner</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">Status</th></tr>
          </thead>
          <tbody>
            {adminProducts.map((product) => (
              <tr className="border-t" key={product._id}>
                <td className="px-3 py-2 font-medium">{product.name}</td>
                <td className="px-3 py-2">{product.shop?.name}</td>
                <td className="px-3 py-2">{product.category?.name}</td>
                <td className="px-3 py-2">{product.createdBy?.email}</td>
                <td className="px-3 py-2">{money(product.priceVnd)}</td>
                <td className="px-3 py-2">{product.stockQuantity}</td>
                <td className="px-3 py-2">{product.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
