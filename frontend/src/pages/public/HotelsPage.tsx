import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { hotelApi } from '../../api/endpoints'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'

export default function HotelsPage() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')

  const { data, isPending, error } = useQuery({
    queryKey: ['hotels', 'list', search, city],
    queryFn: () =>
      hotelApi.search({
        active: true,
        search: search || undefined,
        city: city || undefined,
        size: 24,
      }),
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display mb-1 text-3xl text-teal-900">Hoteles</h1>
      <div className="divider-arabesque mb-8 max-w-55 text-sm">◆</div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          className="field-input max-w-xs"
          placeholder="Buscar por nombre…"
          aria-label="Buscar hotel por nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="search"
          className="field-input max-w-xs"
          placeholder="Ciudad (p. ej. Granada)"
          aria-label="Filtrar por ciudad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      {error && <ErrorNote error={error} />}
      {isPending ? (
        <ListSkeleton rows={3} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          hint="Prueba con otro nombre u otra ciudad; el buscador no distingue mayúsculas."
        />
      ) : (
        <div className="space-y-4">
          {data?.content.map((hotel) => (
            <Link
              key={hotel.id}
              to={`/hotels/${hotel.id}`}
              className="card-tile group flex flex-col gap-4 p-5 transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div
                className="bg-arabesque flex h-24 w-full shrink-0 items-end rounded-(--radius-tile) p-3 sm:w-44"
                aria-hidden
              >
                <span className="font-display text-gold-300">
                  {hotel.category.starRating}★
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl text-teal-900 group-hover:text-teal-700">
                  {hotel.name}
                </h2>
                <p className="text-sm text-teal-800">
                  {hotel.address} · {hotel.city}, {hotel.country}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-teal-800/90">
                  {hotel.description}
                </p>
              </div>
              <span className="btn-ghost shrink-0 self-start sm:self-center">
                Ver habitaciones
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
