import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { categoryApi } from '../../api/endpoints'
import type { CategoryDto } from '../../api/types'
import { problemMessage } from '../../api/client'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { useCrud } from '../../hooks/useCrud'

export default function CategoriesPage() {
  const [editing, setEditing] = useState<CategoryDto | null | 'new'>(null)
  const { data, isPending, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  })
  const { save, remove } = useCrud('categories', categoryApi, () => setEditing(null))

  if (isPending) return <ListSkeleton rows={3} />
  if (error) return <ErrorNote error={error} />

  const current = editing === 'new' ? null : editing

  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Clasificación de los hoteles por estrellas"
        actions={<button className="btn-gold" onClick={() => setEditing('new')}>+ Nueva categoría</button>}
      />

      {remove.error && <div className="mb-4"><ErrorNote error={remove.error} /></div>}

      {data && data.length === 0 ? (
        <EmptyState title="Sin categorías" />
      ) : (
        <div className="card-tile overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glaze-200 text-left text-xs tracking-wide text-teal-800 uppercase">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Estrellas</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.map((cat) => (
                <tr key={cat.id} className="border-b border-glaze-100 last:border-0 hover:bg-glaze-100/60">
                  <td className="px-4 py-3 font-medium text-teal-950">{cat.name}</td>
                  <td className="px-4 py-3 text-gold-600">{'★'.repeat(cat.starRating)}</td>
                  <td className="px-4 py-3 text-teal-800">{cat.description}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setEditing(cat)}>
                        Editar
                      </button>
                      <button
                        className="btn-danger px-2.5 py-1 text-xs"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la categoría «${cat.name}»?`)) remove.mutate(cat.id)
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={current ? `Editar ${current.name}` : 'Nueva categoría'}
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
                name: f.get('name'),
                starRating: Number(f.get('starRating')),
                description: f.get('description') || null,
              },
            })
          }}
        >
          <div>
            <label className="field-label" htmlFor="c-name">Nombre</label>
            <input id="c-name" name="name" className="field-input" required maxLength={80} defaultValue={current?.name} />
          </div>
          <div>
            <label className="field-label" htmlFor="c-stars">Estrellas (1–5)</label>
            <input id="c-stars" name="starRating" type="number" min={1} max={5} className="field-input" required defaultValue={current?.starRating ?? 3} />
          </div>
          <div>
            <label className="field-label" htmlFor="c-desc">Descripción</label>
            <textarea id="c-desc" name="description" className="field-input" rows={2} maxLength={500} defaultValue={current?.description ?? ''} />
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
