import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { problemMessage } from '../api/client'

export function RegisterPage() {
  const { t } = useTranslation()
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z.object({
    firstName: z.string().min(1, t('auth.validation.firstNameMin')).max(80),
    lastName: z.string().min(1, t('auth.validation.lastNameMin')).max(80),
    documentId: z.string().min(1, t('auth.validation.documentIdMin')).max(40),
    phone: z.string().max(40).optional(),
    email: z.email(t('auth.validation.emailInvalid')).max(160),
    password: z
      .string()
      .min(8, t('auth.validation.passwordMin'))
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, t('auth.validation.passwordPattern')),
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
      await registerUser(values)
      navigate('/account', { replace: true })
    } catch (error) {
      setServerError(problemMessage(error))
    }
  }

  const field = (
    id: keyof FormValues,
    label: string,
    type = 'text',
    autoComplete?: string,
    placeholder?: string,
  ) => (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className="field-input"
        placeholder={placeholder}
        {...register(id)}
      />
      {errors[id] && <p className="field-error">{errors[id]?.message}</p>}
    </div>
  )

  return (
    <div className="bg-arabesque-light flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card-tile-accent w-full max-w-lg p-8">
        <h1 className="mb-1 text-center text-2xl text-teal-900">{t('auth.register.title')}</h1>
        <div className="divider-arabesque mx-auto mb-6 max-w-45 text-sm">◆</div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('firstName', t('auth.register.firstName'), 'text', 'given-name')}
            {field('lastName', t('auth.register.lastName'), 'text', 'family-name')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('documentId', t('auth.register.documentId'), 'text', 'off')}
            {field('phone', t('auth.register.phone'), 'tel', 'tel')}
          </div>
          {field('email', t('auth.register.email'), 'email', 'email')}
          {field('password', t('auth.register.password'), 'password', 'new-password')}

          {serverError && (
            <p role="alert" className="rounded-(--radius-tile) bg-terra-100 px-3 py-2 text-sm text-terra-600">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-gold w-full">
            {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-teal-800">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-gold-600 hover:text-gold-500">
            {t('auth.register.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
