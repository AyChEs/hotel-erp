import { problemMessage } from '../../api/client'

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <div
      role="alert"
      className="rounded-(--radius-tile) border border-terra-600/30 bg-terra-100 px-4 py-3 text-sm text-terra-600"
    >
      {problemMessage(error)}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-tile flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span aria-hidden className="text-2xl text-gold-500">
        ◆
      </span>
      <p className="font-medium text-teal-900">{title}</p>
      {hint && <p className="max-w-md text-sm text-teal-800">{hint}</p>}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-20 w-full" />
      ))}
    </div>
  )
}
