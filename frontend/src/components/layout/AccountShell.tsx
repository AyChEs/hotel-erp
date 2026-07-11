import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-(--radius-tile) px-4 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-teal-800 text-glaze-50' : 'text-teal-800 hover:bg-teal-50'
  }`

/** Client area: rendered inside PublicShell; adds heading + tabbed sub-nav. */
export function AccountShell() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="font-display mb-1 text-2xl text-teal-900">{t('public.nav.myAccount')}</h1>
      <div className="divider-arabesque mb-6 max-w-55 text-sm">◆</div>
      <nav aria-label={t('public.nav.myAccount')} className="mb-6 flex flex-wrap gap-2">
        <NavLink to="/account" end className={tab}>
          {t('account.nav.myBookings')}
        </NavLink>
        <NavLink to="/account/invoices" className={tab}>
          {t('account.nav.myInvoices')}
        </NavLink>
        <NavLink to="/account/profile" className={tab}>
          {t('account.nav.profile')}
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
