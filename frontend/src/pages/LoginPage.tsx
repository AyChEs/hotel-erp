import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/ProtectedRoute'
import { problemMessage } from '../api/client'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z.object({
    email: z.email(t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  })
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const user = await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? homeFor(user.role), { replace: true })
    } catch (error) {
      setServerError(problemMessage(error))
    }
  }

  return (
    <div className="bg-arabesque-light flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card-tile-accent w-full max-w-md p-8">
        <h1 className="mb-1 text-center text-2xl text-teal-900">{t('auth.login.title')}</h1>
        <div className="divider-arabesque mx-auto mb-6 max-w-45 text-sm">◆</div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="field-label">
              {t('auth.login.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="field-input"
              placeholder="tu@email.com"
              {...register('email')}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              {t('auth.login.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field-input"
              {...register('password')}
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p role="alert" className="rounded-(--radius-tile) bg-terra-100 px-3 py-2 text-sm text-terra-600">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-teal-800">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-medium text-gold-600 hover:text-gold-500">
            {t('auth.login.register')}
          </Link>
        </p>

        <div className="mt-6 rounded-(--radius-tile) bg-teal-50 p-3 text-xs text-teal-800">
          <p className="mb-1 font-semibold">{t('auth.login.demoAccounts')}</p>
          <p>admin@hotel-erp.dev · Admin123!</p>
          <p>manager@hotel-erp.dev · Manager123!</p>
          <p>reception@hotel-erp.dev · Reception123!</p>
          <p>client@hotel-erp.dev · Client123!</p>
        </div>
      </div>
    </div>
  )
}
