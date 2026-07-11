import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryApi, hotelApi } from '../../api/endpoints'
import type { HotelDto } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote } from '../../components/ui/Feedback'
import { useCrud } from '../../hooks/useCrud'

export default function HotelsAdminPage() {
  const { t } = useTranslation()
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
      header: t('admin.hotels.name'),
      cell: (h) => (
        <div>
          <p className="font-medium text-teal-950">{h.name}</p>
          <p className="text-xs text-teal-800">{h.address}</p>
        </div>
      ),
    },
    { header: t('admin.hotels.city'), cell: (h) => `${h.city}, ${h.country}` },
    { header: t('admin.hotels.category'), cell: (h) => <span className="text-gold-600">{'★'.repeat(h.category.starRating)}</span> },
    {
      header: t('admin.hotels.active'),
      cell: (h) => (
        <span className={`badge ${h.active ? 'bg-teal-100 text-teal-800' : 'bg-glaze-200 text-teal-900'}`}>
          {h.active ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      align: 'right',
      cell: (h) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(h)}>{t('common.edit')}</button>
          <button
            className="btn-danger px-2.5 py-1 text-xs"
            onClick={() => {
              if (window.confirm(t('admin.hotels.deleteConfirm', { name: h.name })))
                remove.mutate(h.id)
            }}
          >
            {t('common.delete')}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('admin.hotels.title')}
        subtitle={t('admin.hotels.subtitle')}
        actions={<button className="btn-gold" onClick={() => setEditing('new')}>{t('admin.hotels.new')}</button>}
      />

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      <DataTable
        columns={columns} data={data} isPending={isPending} error={error}
        page={page} onPageChange={setPage}
        emptyTitle={t('admin.hotels.emptyTitle')} rowKey={(h) => h.id}
      />

      <Modal
        open={editing !== null}
        title={current ? t('admin.hotels.edit', { name: current.name }) : t('admin.hotels.create')}
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
              <label className="field-label" htmlFor="h-name">{t('admin.hotels.name')}</label>
              <input id="h-name" name="name" className="field-input" required maxLength={120} defaultValue={current?.name} />
            </div>
            <div>
              <label className="field-label" htmlFor="h-cat">{t('admin.hotels.category')}</label>
              <select id="h-cat" name="categoryId" className="field-input" required defaultValue={current?.category.id}>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.starRating}★)</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="h-addr">{t('admin.hotels.address')}</label>
            <input id="h-addr" name="address" className="field-input" required maxLength={200} defaultValue={current?.address} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="h-city">{t('admin.hotels.city')}</label>
              <input id="h-city" name="city" className="field-input" required maxLength={100} defaultValue={current?.city} />
            </div>
            <div>
              <label className="field-label" htmlFor="h-country">{t('admin.hotels.country')}</label>
              <input id="h-country" name="country" className="field-input" required maxLength={100} defaultValue={current?.country} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="h-phone">{t('auth.register.phone')}</label>
              <input id="h-phone" name="phone" className="field-input" maxLength={40} defaultValue={current?.phone ?? ''} />
            </div>
            <div>
              <label className="field-label" htmlFor="h-email">{t('auth.login.email')}</label>
              <input id="h-email" name="email" type="email" className="field-input" maxLength={160} defaultValue={current?.email ?? ''} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="h-img">{t('admin.hotels.imageUrl')}</label>
            <input id="h-img" name="imageUrl" type="url" className="field-input" maxLength={500} defaultValue={current?.imageUrl ?? ''} />
          </div>
          <div>
            <label className="field-label" htmlFor="h-desc">{t('admin.hotels.description')}</label>
            <textarea id="h-desc" name="description" className="field-input" rows={2} maxLength={1000} defaultValue={current?.description ?? ''} />
          </div>
          <label className="flex items-center gap-2 text-sm text-teal-900">
            <input type="checkbox" name="active" defaultChecked={current?.active ?? true} />
            {t('admin.hotels.activeLabel')}
          </label>
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
