import { LockKeyhole, Store, User, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const demoAccounts = [
  { label: 'Customer', icon: User, email: 'customer@example.com' },
  { label: 'Shop Owner', icon: Store, email: 'owner@example.com' },
  { label: 'Admin', icon: ShieldCheck, email: 'admin@example.com' },
]

// Màn hình đăng nhập và chọn nhanh tài khoản demo theo vai trò.
export function LoginPage({ loginForm, setLoginForm, onLogin, loading, error }) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.28),transparent_28%),linear-gradient(135deg,#052e16,#111827)] p-10 lg:flex">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm text-emerald-100">
            <Store className="size-4" />
            Fruit Marketplace Admin
          </div>
          <div className="max-w-xl">
            <h1 className="text-5xl font-semibold tracking-tight">Manage fruit commerce with role-based workspaces.</h1>
            <p className="mt-5 text-lg leading-8 text-emerald-50/80">
              Customer, Shop Owner, and Admin each enter the exact workflow their role is allowed to use.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-emerald-50/80">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Catalog</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Shop Orders</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Admin Control</div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-neutral-50 p-6 text-neutral-950">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <LockKeyhole className="size-5" />
              </div>
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-neutral-500">Choose a demo account or enter credentials manually.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="grid gap-4" onSubmit={onLogin}>
              <label className="grid gap-1.5 text-sm font-medium">
                Email
                <input
                  className="h-10 rounded-md border border-neutral-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Password
                <input
                  className="h-10 rounded-md border border-neutral-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  required
                />
              </label>
              <Button type="submit" className="rounded-md bg-emerald-700 hover:bg-emerald-800" disabled={loading}>
                Login
              </Button>
            </form>

            <div className="mt-6 grid gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Demo accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon
                  return (
                    <Button
                      key={account.email}
                      type="button"
                      variant="outline"
                      className="h-auto rounded-md px-2 py-3 text-neutral-700"
                      onClick={() => setLoginForm({ email: account.email, password: 'Password123!' })}
                    >
                      <span className="grid justify-items-center gap-1 text-xs">
                        <Icon className="size-4" />
                        {account.label}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
