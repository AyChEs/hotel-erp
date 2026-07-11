import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PageResponse } from '../../api/types'
import { EmptyState, ErrorNote } from './Feedback'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
}

interface Props<T> {
  columns: Column<T>[]
  data: PageResponse<T> | undefined
  isPending: boolean
  error?: unknown
  page: number
  onPageChange: (page: number) => void
  emptyTitle: string
  emptyHint?: string
  rowKey: (row: T) => string | number
}

/** Server-paginated table: the workhorse of every ERP list screen. */
export function DataTable<T>({
  columns, data, isPending, error, page, onPageChange, emptyTitle, emptyHint, rowKey,
}: Props<T>) {
  const { t } = useTranslation()

  if (error) return <ErrorNote error={error} />

  if (isPending) {
    return (
      <div className="card-tile space-y-0 p-4" aria-hidden>
        <div className="skeleton mb-3 h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton mb-2 h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.content.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />
  }

  return (
    <div className="relative">
      {/* Mobile scroll hint */}
      <div className="mb-2 flex items-center justify-end gap-1 text-[10px] tracking-wide text-teal-800/70 uppercase sm:hidden">
        <span aria-hidden>←</span>
        <span>{t('dataTable.scroll')}</span>
        <span aria-hidden>→</span>
      </div>
      <div className="card-tile overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-glaze-200 text-left text-xs tracking-wide text-teal-800 uppercase">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={`px-4 py-3 font-semibold whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.content.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-glaze-100 last:border-0 hover:bg-glaze-100/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`px-4 py-3 whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {data.totalPages > 1 && (
          <nav
            aria-label={t('dataTable.ariaLabel')}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-glaze-200 px-4 py-3 text-sm"
          >
            <span className="text-teal-800">
              {t('dataTable.page', { page: data.page + 1, total: data.totalPages, count: data.totalElements })}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-ghost px-3 py-1"
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
              >
                ← {t('common.previous')}
              </button>
              <button
                className="btn-ghost px-3 py-1"
                disabled={page + 1 >= data.totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                {t('common.next')} →
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
