import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthContext'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import type { Role } from '../../api/types'
import { useLabels } from '../../lib/labels'

export function AdminShell() {
  const { user, logout, hasRole } = useAuth()
  const { t } = useTranslation()
  const { tLabel } = useLabels()

  const items: { to: string; label: string; icon: string; roles?: Role[] }[] = [
    { to: '/admin', label: t('admin.nav.dashboard'), icon: '▦', roles: ['ADMIN', 'MANAGER'] },
    { to: '/admin/bookings', label: t('admin.nav.bookings'), icon: '◫' },
    { to: '/admin/calendar', label: t('admin.nav.calendar'), icon: '▤' },
    { to: '/admin/invoices', label: t('admin.nav.invoices'), icon: '▥' },
    { to: '/admin/clients', label: t('admin.nav.clients'), icon: '◧' },
    { to: '/admin/tasks', label: t('admin.nav.tasks'), icon: '◨' },
    { to: '/admin/hotels', label: t('admin.nav.hotels'), icon: '⬡', roles: ['ADMIN'] },
    { to: '/admin/rooms', label: t('admin.nav.rooms'), icon: '⬢', roles: ['ADMIN', 'MANAGER'] },
    { to: '/admin/categories', label: t('admin.nav.categories'), icon: '✦', roles: ['ADMIN'] },
    { to: '/admin/employees', label: t('admin.nav.employees'), icon: '◩', roles: ['ADMIN', 'MANAGER'] },
  ]

  return (
    <div className="flex min-h-screen bg-glaze-50">
      <aside className="bg-arabesque flex w-60 shrink-0 flex-col">
        <Link to="/" className="block px-5 py-5 font-display text-lg text-glaze-50">
          <span className="text-gold-400">◆</span> Zellige ERP
        </Link>
        <div className="mx-5 mb-4 h-px bg-gold-500/30" />
        <nav className="flex-1 space-y-0.5 px-3">
          {items.filter((item) => !item.roles || hasRole(...item.roles)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-(--radius-tile) px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-teal-800/80 text-gold-300'
                    : 'text-glaze-100/80 hover:bg-teal-900/60 hover:text-glaze-50'
                }`
              }
            >
              <span aria-hidden className="text-gold-400/90">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gold-500/20 p-4 text-xs text-glaze-100/70">
          <p className="truncate font-medium text-glaze-50">{user?.email}</p>
          <p className="mb-2 text-gold-400">{user && tLabel('employeePosition', user.role)}</p>
          <LanguageSwitcher className="mb-2" />
          <button
            onClick={logout}
            className="w-full rounded-(--radius-tile) border border-gold-500/40 px-2 py-1.5 text-gold-300 transition hover:bg-teal-900"
          >
            {t('common.logout')}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
