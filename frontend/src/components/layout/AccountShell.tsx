import { NavLink, Outlet } from 'react-router-dom'

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-(--radius-tile) px-4 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-teal-800 text-glaze-50' : 'text-teal-800 hover:bg-teal-50'
  }`

/** Client area: rendered inside PublicShell; adds heading + tabbed sub-nav. */
export function AccountShell() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="font-display mb-1 text-2xl text-teal-900">Mi cuenta</h1>
      <div className="divider-arabesque mb-6 max-w-55 text-sm">◆</div>
      <nav aria-label="Mi cuenta" className="mb-6 flex flex-wrap gap-2">
        <NavLink to="/account" end className={tab}>
          Mis reservas
        </NavLink>
        <NavLink to="/account/invoices" className={tab}>
          Mis facturas
        </NavLink>
        <NavLink to="/account/profile" className={tab}>
          Mi perfil
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
