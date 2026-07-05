import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { employeeApi, hotelApi } from '../../api/endpoints'
import type { EmployeeDto, EmployeePosition, EmployeeStatus } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote } from '../../components/ui/Feedback'
import { useAuth } from '../../auth/AuthContext'
import { useCrud } from '../../hooks/useCrud'
import { money, todayIso } from '../../lib/format'
import { EMPLOYEE_STATUS_LABEL, POSITION_LABEL } from '../../lib/labels'

const STATUS_TONE: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-teal-100 text-teal-800',
  ON_LEAVE: 'bg-gold-100 text-gold-600',
  TERMINATED: 'bg-glaze-200 text-teal-900',
}

export default function EmployeesPage() {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<EmployeeDto | null | 'new'>(null)
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const hotels = useQuery({ queryKey: ['hotels', 'all'], queryFn: () => hotelApi.search({ size: 50 }) })
  const { data, isPending, error } = useQuery({
    queryKey: ['employees', page],
    queryFn: () => employeeApi.search({ page }),
  })
  const { save, remove } = useCrud('employees', employeeApi, () => setEditing(null))

  const current = editing === 'new' ? null : editing

  const columns: Column<EmployeeDto>[] = [
    {
      header: 'Empleado',
      cell: (e) => (
        <div>
          <p className="font-medium text-teal-950">{e.lastName}, {e.firstName}</p>
          <p className="text-xs text-teal-800">{e.email ?? e.documentId}</p>
        </div>
      ),
    },
    { header: 'Puesto', cell: (e) => POSITION_LABEL[e.position] },
    { header: 'Hotel', cell: (e) => e.hotelName ?? '—' },
    {
      header: 'Estado',
      cell: (e) => <span className={`badge ${STATUS_TONE[e.status]}`}>{EMPLOYEE_STATUS_LABEL[e.status]}</span>,
    },
    ...(isAdmin
      ? [{
          header: 'Salario bruto',
          align: 'right' as const,
          cell: (e: EmployeeDto) => (e.grossSalary != null ? money(e.grossSalary) : '—'),
        }]
      : []),
    {
      header: 'Acciones',
      align: 'right',
      cell: (e) =>
        isAdmin ? (
          <div className="flex justify-end gap-1.5">
            <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(e)}>Editar</button>
            <button
              className="btn-danger px-2.5 py-1 text-xs"
              onClick={() => {
                if (window.confirm(`¿Eliminar a ${e.firstName} ${e.lastName}?`)) remove.mutate(e.id)
              }}
            >
              Eliminar
            </button>
          </div>
        ) : (
          <span className="text-xs text-teal-800">solo lectura</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Empleados"
        subtitle={isAdmin ? 'Plantilla completa con salarios' : 'Vista de solo lectura para dirección'}
        actions={isAdmin && <button className="btn-gold" onClick={() => setEditing('new')}>+ Nuevo empleado</button>}
      />

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle="Sin empleados" rowKey={(e) => e.id}
      />

      <Modal
        open={editing !== null}
        title={current ? `Editar ${current.firstName} ${current.lastName}` : 'Nuevo empleado'}
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
                firstName: f.get('firstName'), lastName: f.get('lastName'),
                documentId: f.get('documentId'),
                birthDate: f.get('birthDate') || null,
                phone: f.get('phone') || null, address: f.get('address') || null,
                position: f.get('position') as EmployeePosition,
                status: f.get('status') as EmployeeStatus,
                hiredAt: f.get('hiredAt'),
                grossSalary: f.get('grossSalary') ? Number(f.get('grossSalary')) : null,
                hotelId: f.get('hotelId') ? Number(f.get('hotelId')) : null,
              },
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="e-first">Nombre</label>
              <input id="e-first" name="firstName" className="field-input" required maxLength={80} defaultValue={current?.firstName} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-last">Apellidos</label>
              <input id="e-last" name="lastName" className="field-input" required maxLength={80} defaultValue={current?.lastName} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="e-doc">Documento</label>
              <input id="e-doc" name="documentId" className="field-input" required maxLength={40} defaultValue={current?.documentId} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-birth">Nacimiento</label>
              <input id="e-birth" name="birthDate" type="date" className="field-input" defaultValue={current?.birthDate ?? ''} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-phone">Teléfono</label>
              <input id="e-phone" name="phone" type="tel" className="field-input" maxLength={40} defaultValue={current?.phone ?? ''} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="e-pos">Puesto</label>
              <select id="e-pos" name="position" className="field-input" defaultValue={current?.position ?? 'RECEPTIONIST'}>
                {Object.entries(POSITION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="e-status">Estado</label>
              <select id="e-status" name="status" className="field-input" defaultValue={current?.status ?? 'ACTIVE'}>
                {Object.entries(EMPLOYEE_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="e-hotel">Hotel</label>
              <select id="e-hotel" name="hotelId" className="field-input" defaultValue={current?.hotelId ?? ''}>
                <option value="">— Sin asignar —</option>
                {hotels.data?.content.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="e-hired">Fecha de alta</label>
              <input id="e-hired" name="hiredAt" type="date" className="field-input" required defaultValue={current?.hiredAt ?? todayIso()} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-salary">Salario bruto anual (€)</label>
              <input id="e-salary" name="grossSalary" type="number" step="0.01" min={0} className="field-input" defaultValue={current?.grossSalary ?? ''} />
            </div>
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
