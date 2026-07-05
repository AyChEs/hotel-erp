import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { meApi } from '../../api/endpoints'
import { ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { problemMessage } from '../../api/client'
import { CLIENT_TYPE_LABEL } from '../../lib/labels'

const schema = z.object({
  firstName: z.string().min(1, 'Obligatorio').max(80),
  lastName: z.string().min(1, 'Obligatorio').max(80),
  birthDate: z.string().optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(200).optional(),
})

type FormValues = z.infer<typeof schema>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data: profile, isPending, error } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => meApi.profile(),
  })

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      meApi.updateProfile({ ...values, birthDate: values.birthDate || null }),
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate ?? '',
          phone: profile.phone ?? '',
          address: profile.address ?? '',
        }
      : undefined,
  })

  if (isPending) return <ListSkeleton rows={2} />
  if (error) return <ErrorNote error={error} />

  return (
    <div className="max-w-xl">
      <form
        onSubmit={handleSubmit((values) => {
          setSaved(false)
          save.mutate(values)
        })}
        noValidate
        className="card-tile space-y-4 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="field-label">
              Nombre
            </label>
            <input id="firstName" className="field-input" {...register('firstName')} />
            {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="field-label">
              Apellidos
            </label>
            <input id="lastName" className="field-input" {...register('lastName')} />
            {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="birthDate" className="field-label">
              Fecha de nacimiento
            </label>
            <input id="birthDate" type="date" className="field-input" {...register('birthDate')} />
          </div>
          <div>
            <label htmlFor="phone" className="field-label">
              Teléfono
            </label>
            <input id="phone" type="tel" className="field-input" {...register('phone')} />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="field-label">
            Dirección
          </label>
          <input id="address" className="field-input" {...register('address')} />
        </div>

        <div className="rounded-(--radius-tile) bg-glaze-100 px-4 py-3 text-sm text-teal-800">
          <p>
            <span className="font-medium">Documento:</span> {profile?.documentId} ·{' '}
            <span className="font-medium">Tipo:</span>{' '}
            {profile && CLIENT_TYPE_LABEL[profile.clientType]}
          </p>
          <p className="mt-1 text-xs">
            El documento de identidad solo puede modificarlo la recepción del hotel.
          </p>
        </div>

        {save.error && (
          <p role="alert" className="field-error">
            {problemMessage(save.error)}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm font-medium text-teal-600">
            Perfil guardado.
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={isSubmitting || save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
