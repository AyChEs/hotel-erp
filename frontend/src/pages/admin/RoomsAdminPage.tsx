import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { hotelApi, roomApi } from '../../api/endpoints'
import type { RoomDto, RoomStatus, RoomType } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { RoomBadge } from '../../components/ui/StatusBadge'
import { ErrorNote } from '../../components/ui/Feedback'
import { useCrud } from '../../hooks/useCrud'
import { money } from '../../lib/format'
import { ROOM_STATUS_LABEL, ROOM_TYPE_LABEL } from '../../lib/labels'

export default function RoomsAdminPage() {
  const [page, setPage] = useState(0)
  const [hotelFilter, setHotelFilter] = useState<number | ''>('')
  const [editing, setEditing] = useState<RoomDto | null | 'new'>(null)

  const hotels = useQuery({ queryKey: ['hotels', 'all'], queryFn: () => hotelApi.search({ size: 50 }) })
  const { data, isPending, error } = useQuery({
    queryKey: ['rooms', 'admin', page, hotelFilter],
    queryFn: () => roomApi.search({ page, hotelId: hotelFilter || undefined }),
  })
  const { save, remove } = useCrud('rooms', roomApi, () => setEditing(null))

  const current = editing === 'new' ? null : editing

  const columns: Column<RoomDto>[] = [
    {
      header: 'Habitación',
      cell: (r) => (
        <div>
          <p className="font-medium text-teal-950">{r.number}</p>
          <p className="text-xs text-teal-800">{r.hotelName}{r.floor != null && ` · planta ${r.floor}`}</p>
        </div>
      ),
    },
    { header: 'Tipo', cell: (r) => ROOM_TYPE_LABEL[r.type] },
    { header: 'Capacidad', cell: (r) => `${r.capacity} pers.` },
    { header: 'Estado', cell: (r) => <RoomBadge status={r.status} /> },
    { header: 'Precio/noche', align: 'right', cell: (r) => <span className="font-medium">{money(r.pricePerNight)}</span> },
    {
      header: 'Acciones',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(r)}>Editar</button>
          <button
            className="btn-danger px-2.5 py-1 text-xs"
            onClick={() => {
              if (window.confirm(`¿Eliminar la habitación ${r.number}?`)) remove.mutate(r.id)
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
        title="Habitaciones"
        subtitle="Inventario, precios por régimen y estado operativo"
        actions={<button className="btn-gold" onClick={() => setEditing('new')}>+ Nueva habitación</button>}
      />

      <div className="mb-4">
        <select
          className="field-input w-auto"
          value={hotelFilter}
          aria-label="Filtrar por hotel"
          onChange={(e) => { setHotelFilter(e.target.value === '' ? '' : Number(e.target.value)); setPage(0) }}
        >
          <option value="">Todos los hoteles</option>
          {hotels.data?.content.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle="Sin habitaciones con este filtro" rowKey={(r) => r.id}
      />

      <Modal
        open={editing !== null}
        title={current ? `Editar habitación ${current.number}` : 'Nueva habitación'}
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
                number: f.get('number'),
                floor: f.get('floor') ? Number(f.get('floor')) : null,
                type: f.get('type') as RoomType,
                status: f.get('status') as RoomStatus,
                capacity: Number(f.get('capacity')),
                description: f.get('description') || null,
                imageUrl: f.get('imageUrl') || null,
                pricePerNight: Number(f.get('pricePerNight')),
                halfBoardSupplement: Number(f.get('halfBoardSupplement')),
                fullBoardSupplement: Number(f.get('fullBoardSupplement')),
                hotelId: Number(f.get('hotelId')),
              },
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="r-hotel">Hotel</label>
              <select id="r-hotel" name="hotelId" className="field-input" required defaultValue={current?.hotelId}>
                {hotels.data?.content.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="r-number">Número</label>
              <input id="r-number" name="number" className="field-input" required maxLength={20} defaultValue={current?.number} />
            </div>
            <div>
              <label className="field-label" htmlFor="r-floor">Planta</label>
              <input id="r-floor" name="floor" type="number" className="field-input" defaultValue={current?.floor ?? ''} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="r-type">Tipo</label>
              <select id="r-type" name="type" className="field-input" defaultValue={current?.type ?? 'DOUBLE'}>
                {Object.entries(ROOM_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="r-status">Estado</label>
              <select id="r-status" name="status" className="field-input" defaultValue={current?.status ?? 'AVAILABLE'}>
                {Object.entries(ROOM_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="r-cap">Capacidad</label>
              <input id="r-cap" name="capacity" type="number" min={1} max={10} className="field-input" required defaultValue={current?.capacity ?? 2} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="r-price">Precio/noche (€)</label>
              <input id="r-price" name="pricePerNight" type="number" step="0.01" min={0} className="field-input" required defaultValue={current?.pricePerNight} />
            </div>
            <div>
              <label className="field-label" htmlFor="r-half">Supl. media pensión</label>
              <input id="r-half" name="halfBoardSupplement" type="number" step="0.01" min={0} className="field-input" required defaultValue={current?.halfBoardSupplement ?? 0} />
            </div>
            <div>
              <label className="field-label" htmlFor="r-full">Supl. pensión completa</label>
              <input id="r-full" name="fullBoardSupplement" type="number" step="0.01" min={0} className="field-input" required defaultValue={current?.fullBoardSupplement ?? 0} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="r-img">URL de imagen</label>
            <input id="r-img" name="imageUrl" type="url" className="field-input" maxLength={500} defaultValue={current?.imageUrl ?? ''} />
          </div>
          <div>
            <label className="field-label" htmlFor="r-desc">Descripción</label>
            <textarea id="r-desc" name="description" className="field-input" rows={2} maxLength={500} defaultValue={current?.description ?? ''} />
          </div>
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
