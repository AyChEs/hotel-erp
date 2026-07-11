import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useLabels } from '../../lib/labels'

const STATUS_TONE: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-teal-100 text-teal-800',
  ON_LEAVE: 'bg-gold-100 text-gold-600',
  TERMINATED: 'bg-glaze-200 text-teal-900',
}

export default function EmployeesPage() {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
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
      header: t('admin.employees.name'),
      cell: (e) => (
        <div>
          <p className="font-medium text-teal-950">{e.lastName}, {e.firstName}</p>
          <p className="text-xs text-teal-800">{e.email ?? e.documentId}</p>
        </div>
      ),
    },
    { header: t('admin.employees.position'), cell: (e) => tLabel('employeePosition', e.position) },
    { header: t('admin.rooms.hotel'), cell: (e) => e.hotelName ?? '—' },
    {
      header: t('admin.employees.status'),
      cell: (e) => <span className={`badge ${STATUS_TONE[e.status]}`}>{tLabel('employeeStatus', e.status)}</span>,
    },
    ...(isAdmin
      ? [{
          header: t('admin.employees.grossSalary'),
          align: 'right' as const,
          cell: (e: EmployeeDto) => (e.grossSalary != null ? money(e.grossSalary) : '—'),
        }]
      : []),
    {
      header: t('common.actions'),
      align: 'right',
      cell: (e) =>
        isAdmin ? (
          <div className="flex justify-end gap-1.5">
            <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(e)}>{t('common.edit')}</button>
            <button
              className="btn-danger px-2.5 py-1 text-xs"
              onClick={() => {
                if (window.confirm(t('admin.employees.deleteConfirm', { name: `${e.firstName} ${e.lastName}` }))) remove.mutate(e.id)
              }}
            >
              {t('common.delete')}
            </button>
          </div>
        ) : (
          <span className="text-xs text-teal-800">{t('admin.employees.readOnly')}</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('admin.employees.title')}
        subtitle={isAdmin ? t('admin.employees.subtitleAdmin') : t('admin.employees.subtitleReadonly')}
        actions={isAdmin && <button className="btn-gold" onClick={() => setEditing('new')}>{t('admin.employees.new')}</button>}
      />

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle={t('admin.employees.emptyTitle')} rowKey={(e) => e.id}
      />

      <Modal
        open={editing !== null}
        title={current ? t('admin.employees.edit', { name: `${current.firstName} ${current.lastName}` }) : t('admin.employees.create')}
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
              <label className="field-label" htmlFor="e-first">{t('auth.register.firstName')}</label>
              <input id="e-first" name="firstName" className="field-input" required maxLength={80} defaultValue={current?.firstName} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-last">{t('auth.register.lastName')}</label>
              <input id="e-last" name="lastName" className="field-input" required maxLength={80} defaultValue={current?.lastName} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="e-doc">{t('auth.register.documentId')}</label>
              <input id="e-doc" name="documentId" className="field-input" required maxLength={40} defaultValue={current?.documentId} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-birth">{t('account.profile.birthDate')}</label>
              <input id="e-birth" name="birthDate" type="date" className="field-input" defaultValue={current?.birthDate ?? ''} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-phone">{t('auth.register.phone')}</label>
              <input id="e-phone" name="phone" type="tel" className="field-input" maxLength={40} defaultValue={current?.phone ?? ''} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="e-pos">{t('admin.employees.position')}</label>
              <select id="e-pos" name="position" className="field-input" defaultValue={current?.position ?? 'RECEPTIONIST'}>
                {(['MANAGER','RECEPTIONIST','HOUSEKEEPER','MAINTENANCE'] as EmployeePosition[]).map((v) => (
                  <option key={v} value={v}>{tLabel('employeePosition', v)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="e-status">{t('admin.employees.status')}</label>
              <select id="e-status" name="status" className="field-input" defaultValue={current?.status ?? 'ACTIVE'}>
                {(['ACTIVE','ON_LEAVE','TERMINATED'] as EmployeeStatus[]).map((v) => (
                  <option key={v} value={v}>{tLabel('employeeStatus', v)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="e-hotel">Hotel</label>
              <select id="e-hotel" name="hotelId" className="field-input" defaultValue={current?.hotelId ?? ''}>
                <option value="">— {t('admin.employees.unassigned')} —</option>
                {hotels.data?.content.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="e-hired">{t('admin.employees.hireDate')}</label>
              <input id="e-hired" name="hiredAt" type="date" className="field-input" required defaultValue={current?.hiredAt ?? todayIso()} />
            </div>
            <div>
              <label className="field-label" htmlFor="e-salary">{t('admin.employees.grossSalaryField')}</label>
              <input id="e-salary" name="grossSalary" type="number" step="0.01" min={0} className="field-input" defaultValue={current?.grossSalary ?? ''} />
            </div>
          </div>
          {save.error && <p role="alert" className="field-error">{problemMessage(save.error)}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>{t('common.close')}</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
