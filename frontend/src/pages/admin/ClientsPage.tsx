import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clientApi } from '../../api/endpoints'
import type { ClientDto, ClientType } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote } from '../../components/ui/Feedback'
import { useAuth } from '../../auth/AuthContext'
import { useCrud } from '../../hooks/useCrud'
import { useLabels } from '../../lib/labels'

export default function ClientsPage() {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
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
      header: t('admin.clients.name'),
      cell: (c) => (
        <div>
          <p className="font-medium text-teal-950">{c.lastName}, {c.firstName}</p>
          <p className="text-xs text-teal-800">{c.email ?? t('admin.clients.noAccount')}</p>
        </div>
      ),
    },
    { header: t('auth.register.documentId'), cell: (c) => c.documentId },
    { header: t('auth.register.phone'), cell: (c) => c.phone ?? '—' },
    {
      header: t('admin.clients.type'),
      cell: (c) => (
        <span className={`badge ${c.clientType === 'VIP' ? 'bg-gold-100 text-gold-600' : 'bg-glaze-100 text-teal-800'}`}>
          {tLabel('clientType', c.clientType)}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(c)}>{t('common.edit')}</button>
          {hasRole('ADMIN', 'MANAGER') && (
            <button
              className="btn-danger px-2.5 py-1 text-xs"
              onClick={() => {
                if (window.confirm(t('admin.clients.deleteConfirm', { name: `${c.firstName} ${c.lastName}` }))) remove.mutate(c.id)
              }}
            >
              {t('common.delete')}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('admin.clients.title')}
        subtitle={t('admin.clients.subtitle')}
        actions={<button className="btn-gold" onClick={() => setEditing('new')}>{t('admin.clients.new')}</button>}
      />

      <div className="mb-4">
        <input
          type="search" className="field-input max-w-sm" placeholder={t('admin.bookings.clientSearchPlaceholder')}
          aria-label={t('admin.clients.searchAria')}
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
        />
      </div>

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle={t('admin.clients.emptyTitle')}
        emptyHint={t('admin.clients.emptyHint')}
        rowKey={(c) => c.id}
      />

      <Modal
        open={editing !== null}
        title={current ? t('admin.clients.edit', { name: `${current.firstName} ${current.lastName}` }) : t('admin.clients.create')}
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
              <label className="field-label" htmlFor="cl-first">{t('auth.register.firstName')}</label>
              <input id="cl-first" name="firstName" className="field-input" required maxLength={80} defaultValue={current?.firstName} />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-last">{t('auth.register.lastName')}</label>
              <input id="cl-last" name="lastName" className="field-input" required maxLength={80} defaultValue={current?.lastName} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="cl-doc">{t('auth.register.documentId')}</label>
              <input id="cl-doc" name="documentId" className="field-input" required maxLength={40} defaultValue={current?.documentId} />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-birth">{t('account.profile.birthDate')}</label>
              <input id="cl-birth" name="birthDate" type="date" className="field-input" defaultValue={current?.birthDate ?? ''} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="cl-phone">{t('auth.register.phone')}</label>
              <input id="cl-phone" name="phone" type="tel" className="field-input" maxLength={40} defaultValue={current?.phone ?? ''} />
            </div>
            <div>
              <label className="field-label" htmlFor="cl-type">{t('admin.clients.type')}</label>
              <select id="cl-type" name="clientType" className="field-input" defaultValue={current?.clientType ?? 'REGULAR'}>
                {(['REGULAR','VIP'] as ClientType[]).map((v) => (
                  <option key={v} value={v}>{tLabel('clientType', v)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="cl-addr">{t('account.profile.address')}</label>
            <input id="cl-addr" name="address" className="field-input" maxLength={200} defaultValue={current?.address ?? ''} />
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
