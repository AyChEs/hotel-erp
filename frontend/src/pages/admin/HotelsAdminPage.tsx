import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { categoryApi, hotelApi } from '../../api/endpoints'
import type { HotelDto } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote } from '../../components/ui/Feedback'
import { useCrud } from '../../hooks/useCrud'

export default function HotelsAdminPage() {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<HotelDto | null | 'new'>(null)

  const { data, isPending, error } = useQuery({
    queryKey: ['hotels', 'admin', page],
    queryFn: () => hotelApi.search({ page }),
  })
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list })
  const { save, remove } = useCrud('hotels', hotelApi, () => setEditing(null))

  const current = editing === 'new' ? null : editing

  const columns: Column<HotelDto>[] = [
    {
      header: 'Hotel',
      cell: (h) => (
        <div>
          <p className="font-medium text-teal-950">{h.name}</p>
          <p className="text-xs text-teal-800">{h.address}</p>
        </div>
      ),
    },
    { header: 'Ciudad', cell: (h) => `${h.city}, ${h.country}` },
    { header: 'Categoría', cell: (h) => <span className="text-gold-600">{'★'.repeat(h.category.starRating)}</span> },
    {
      header: 'Estado',
      cell: (h) => (
        <span className={`badge ${h.active ? 'bg-teal-100 text-teal-800' : 'bg-glaze-200 text-teal-900'}`}>
          {h.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (h) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(h)}>Editar</button>
          <button
            className="btn-danger px-2.5 py-1 text-xs"
            onClick={() => {
              if (window.confirm(`¿Eliminar «${h.name}»? Sus habitaciones y reservas se perderán.`))
                remove.mutate(h.id)
            }}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Hoteles"
        subtitle="Alta, edición y baja de los hoteles de la cadena"
        actions={<button className="btn-gold" onClick={() => setEditing('new')}>+ Nuevo hotel</button>}
      />

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle="Sin hoteles" rowKey={(h) => h.id}
      />

      <Modal
        open={editing !== null}
        title={current ? `Editar ${current.name}` : 'Nuevo hotel'}
        onClose={() => setEditing(null)}
        wide
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            save.mutate({
              id: current?.id ?? null,
              body: {
                name: f.get('name'), address: f.get('address'), city: f.get('city'),
                country: f.get('country'), phone: f.get('phone') || null,
                email: f.get('email') || null, description: f.get('description') || null,
                imageUrl: f.get('imageUrl') || null,
                active: f.get('active') === 'on',
                categoryId: Number(f.get('categoryId')),
              },
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="h-name">Nombre</label>
              <input id="h-name" name="name" className="field-input" required maxLength={120} defaultValue={current?.name} />
            </div>
            <div>
              <label className="field-label" htmlFor="h-cat">Categoría</label>
              <select id="h-cat" name="categoryId" className="field-input" required defaultValue={current?.category.id}>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.starRating}★)</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="h-addr">Dirección</label>
            <input id="h-addr" name="address" className="field-input" required maxLength={200} defaultValue={current?.address} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="h-city">Ciudad</label>
              <input id="h-city" name="city" className="field-input" required maxLength={100} defaultValue={current?.city} />
            </div>
            <div>
              <label className="field-label" htmlFor="h-country">País</label>
              <input id="h-country" name="country" className="field-input" required maxLength={100} defaultValue={current?.country} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="h-phone">Teléfono</label>
              <input id="h-phone" name="phone" className="field-input" maxLength={40} defaultValue={current?.phone ?? ''} />
            </div>
            <div>
              <label className="field-label" htmlFor="h-email">Email</label>
              <input id="h-email" name="email" type="email" className="field-input" maxLength={160} defaultValue={current?.email ?? ''} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="h-img">URL de imagen</label>
            <input id="h-img" name="imageUrl" type="url" className="field-input" maxLength={500} defaultValue={current?.imageUrl ?? ''} />
          </div>
          <div>
            <label className="field-label" htmlFor="h-desc">Descripción</label>
            <textarea id="h-desc" name="description" className="field-input" rows={2} maxLength={1000} defaultValue={current?.description ?? ''} />
          </div>
          <label className="flex items-center gap-2 text-sm text-teal-900">
            <input type="checkbox" name="active" defaultChecked={current?.active ?? true} />
            Hotel activo (visible al público)
          </label>
          {save.error && <p role="alert" className="field-error">{problemMessage(save.error)}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cerrar</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
