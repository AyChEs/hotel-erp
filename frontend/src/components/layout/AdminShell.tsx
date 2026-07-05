import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import type { Role } from '../../api/types'

interface Item {
  to: string
  label: string
  icon: string
  roles?: Role[]
}

const ITEMS: Item[] = [
  { to: '/admin', label: 'Dashboard', icon: '▦', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/bookings', label: 'Reservas', icon: '◫' },
  { to: '/admin/calendar', label: 'Calendario', icon: '▤' },
  { to: '/admin/invoices', label: 'Facturas', icon: '▥' },
  { to: '/admin/clients', label: 'Clientes', icon: '◧' },
  { to: '/admin/tasks', label: 'Tareas', icon: '◨' },
  { to: '/admin/hotels', label: 'Hoteles', icon: '⬡', roles: ['ADMIN'] },
  { to: '/admin/rooms', label: 'Habitaciones', icon: '⬢', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/categories', label: 'Categorías', icon: '✦', roles: ['ADMIN'] },
  { to: '/admin/employees', label: 'Empleados', icon: '◩', roles: ['ADMIN', 'MANAGER'] },
]

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administración',
  MANAGER: 'Dirección',
  RECEPTIONIST: 'Recepción',
  CLIENT: 'Cliente',
}

export function AdminShell() {
  const { user, logout, hasRole } = useAuth()

  return (
    <div className="flex min-h-screen bg-glaze-50">
      <aside className="bg-arabesque flex w-60 shrink-0 flex-col">
        <Link to="/" className="block px-5 py-5 font-display text-lg text-glaze-50">
          <span className="text-gold-400">◆</span> Zellige ERP
        </Link>
        <div className="mx-5 mb-4 h-px bg-gold-500/30" />
        <nav className="flex-1 space-y-0.5 px-3">
          {ITEMS.filter((item) => !item.roles || hasRole(...item.roles)).map((item) => (
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
          <p className="mb-2 text-gold-400">{user && ROLE_LABEL[user.role]}</p>
          <button
            onClick={logout}
            className="w-full rounded-(--radius-tile) border border-gold-500/40 px-2 py-1.5 text-gold-300 transition hover:bg-teal-900"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
