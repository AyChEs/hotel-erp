import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthContext'
import { homeFor } from '../../auth/ProtectedRoute'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'

const navLink = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm transition ${
    isActive ? 'text-gold-400' : 'text-glaze-100 hover:text-gold-300'
  }`

export function PublicShell() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-glaze-50">
      <header className="bg-teal-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="font-display text-xl text-glaze-50">
            <span className="text-gold-400">◆</span> Zellige Hotels
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLink}>
              {t('public.nav.hotels') === 'Hotels' ? 'Home' : 'Inicio'}
            </NavLink>
            <NavLink to="/hotels" className={navLink}>
              {t('public.nav.hotels')}
            </NavLink>
            {user ? (
              <>
                <NavLink to={homeFor(user.role)} className={navLink}>
                  {user.role === 'CLIENT' ? t('public.nav.myAccount') : 'Panel ERP'}
                </NavLink>
                <button
                  onClick={logout}
                  className="ml-2 rounded-(--radius-tile) border border-gold-500/50 px-3 py-1.5 text-sm text-gold-300 transition hover:bg-teal-900"
                >
                  {t('public.nav.logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLink}>
                  {t('public.nav.login')}
                </NavLink>
                <Link
                  to="/register"
                  className="ml-2 rounded-(--radius-tile) bg-gold-500 px-3 py-1.5 text-sm font-medium text-teal-950 transition hover:bg-gold-400"
                >
                  {t('auth.register.submit')}
                </Link>
              </>
            )}
            <LanguageSwitcher className="ml-1" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-teal-950 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-glaze-100/60">
          <div className="divider-arabesque mx-auto mb-3 max-w-xs">◆</div>
          Zellige Hotels · {t('public.footer.tagline')} ·{' '}
          <a
            href="https://github.com/AyChEs"
            className="text-gold-400 hover:text-gold-300"
            target="_blank"
            rel="noreferrer"
          >
            AyChEs
          </a>
        </div>
      </footer>
    </div>
  )
}
