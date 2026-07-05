import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { problemMessage } from '../api/client'

const schema = z.object({
  firstName: z.string().min(1, 'Obligatorio').max(80),
  lastName: z.string().min(1, 'Obligatorio').max(80),
  documentId: z.string().min(1, 'Obligatorio').max(40),
  phone: z.string().max(40).optional(),
  email: z.email('Email no válido').max(160),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'Debe incluir mayúscula, minúscula y número'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

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
        {...register(id)}
      />
      {errors[id] && <p className="field-error">{errors[id]?.message}</p>}
    </div>
  )

  return (
    <div className="bg-arabesque-light flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="card-tile-accent w-full max-w-lg p-8">
        <h1 className="mb-1 text-center text-2xl text-teal-900">Crea tu cuenta</h1>
        <div className="divider-arabesque mx-auto mb-6 max-w-45 text-sm">◆</div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('firstName', 'Nombre', 'text', 'given-name')}
            {field('lastName', 'Apellidos', 'text', 'family-name')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('documentId', 'DNI / Pasaporte')}
            {field('phone', 'Teléfono (opcional)', 'tel', 'tel')}
          </div>
          {field('email', 'Email', 'email', 'email')}
          {field('password', 'Contraseña', 'password', 'new-password')}

          {serverError && (
            <p role="alert" className="rounded-(--radius-tile) bg-terra-100 px-3 py-2 text-sm text-terra-600">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-gold w-full">
            {isSubmitting ? 'Creando cuenta…' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-teal-800">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-gold-600 hover:text-gold-500">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
