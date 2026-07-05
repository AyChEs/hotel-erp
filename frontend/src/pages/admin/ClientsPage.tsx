import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { clientApi } from '../../api/endpoints'
import type { ClientDto, ClientType } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote } from '../../components/ui/Feedback'
import { useAuth } from '../../auth/AuthContext'
import { useCrud } from '../../hooks/useCrud'
import { CLIENT_TYPE_LABEL } from '../../lib/labels'

export default function ClientsPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ClientDto | null | 'new'>(null)
  const { hasRole } = useAuth()

  const { data, isPending, error } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => clientApi.search({ page, search: search || undefined }),
  })
  const { save, remove } = useCrud('clients', clientApi, () => setEditing(null))

  const current = editing === 'new' ? null : editing

  const columns: Column<ClientDto>[] = [
    {
      header: 'Cliente',
      cell: (c) => (
        <div>
          <p className="font-medium text-teal-950">{c.lastName}, {c.firstName}</p>
          <p className="text-xs text-teal-800">{c.email ?? 'sin cuenta online'}</p>
        </div>
      ),
    },
    { header: 'Documento', cell: (c) => c.documentId },
    { header: 'Teléfono', cell: (c) => c.phone ?? '—' },
    {
      header: 'Tipo',
      cell: (c) => (
        <span className={`badge ${c.clientType === 'VIP' ? 'bg-gold-100 text-gold-600' : 'bg-glaze-100 text-teal-800'}`}>
          {CLIENT_TYPE_LABEL[c.clientType]}
        </span>
      ),
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(c)}>Editar</button>
          {hasRole('ADMIN', 'MANAGER') && (
            <button
              className="btn-danger px-2.5 py-1 text-xs"
              onClick={() => {
                if (window.confirm(`¿Eliminar a ${c.firstName} ${c.lastName}?`)) remove.mutate(c.id)
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Huéspedes registrados y clientes de mostrador"
        actions={<button className="btn-gold" onClick={() => setEditing('new')}>+ Nuevo cliente</button>}
      />

      <div className="mb-4">
        <input
          type="search" className="field-input max-w-sm" placeholder="Buscar por nombre o documento…"
          aria-label="Buscar clientes"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
        />
      </div>

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle="Sin clientes con esta búsqueda"
        emptyHint="Los clientes que se registran online aparecen aquí automáticamente."
        rowKey={(c) => c.id}
      />

      <Modal
        open={editing !== null}
        title={current ? `Editar ${current.firstName} ${current.lastName}` : 'Nuevo cliente (mostrador)'}
        onClose={() => setEditing(null)}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            save.mutate({
              id: current?.id ?? null,
              body: {
                firstName: f.get('firstName'), lastName: f.get('lastName'),
                documentId: f.get('documentId'),
                birthDate: f.get('birthDate') || null,
                phone: f.get('phone') || null, address: f.get('address') || null,
                clientType: f.get('clientType') as ClientType,
              },
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="cl-first">Nombre</label>
              <input id="cl-first" name="firstName" className="field-input" required maxLength={80} defaultValue={current?.firstName} />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-last">Apellidos</label>
              <input id="cl-last" name="lastName" className="field-input" required maxLength={80} defaultValue={current?.lastName} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="cl-doc">Documento</label>
              <input id="cl-doc" name="documentId" className="field-input" required maxLength={40} defaultValue={current?.documentId} />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-birth">Nacimiento</label>
              <input id="cl-birth" name="birthDate" type="date" className="field-input" defaultValue={current?.birthDate ?? ''} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="cl-phone">Teléfono</label>
              <input id="cl-phone" name="phone" type="tel" className="field-input" maxLength={40} defaultValue={current?.phone ?? ''} />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-type">Tipo</label>
              <select id="cl-type" name="clientType" className="field-input" defaultValue={current?.clientType ?? 'REGULAR'}>
                {Object.entries(CLIENT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="cl-addr">Dirección</label>
            <input id="cl-addr" name="address" className="field-input" maxLength={200} defaultValue={current?.address ?? ''} />
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
