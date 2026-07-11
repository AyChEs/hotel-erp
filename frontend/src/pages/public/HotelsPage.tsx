import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { hotelApi } from '../../api/endpoints'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'

export default function HotelsPage() {
  const { t } = useTranslation()
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
      <h1 className="font-display mb-1 text-3xl text-teal-900">{t('public.hotels.title')}</h1>
      <div className="divider-arabesque mb-8 max-w-55 text-sm">◆</div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          className="field-input max-w-xs"
          placeholder={t('public.hotels.searchPlaceholder')}
          aria-label={t('public.hotels.searchAria')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="search"
          className="field-input max-w-xs"
          placeholder={t('public.hotels.cityPlaceholder')}
          aria-label={t('public.hotels.cityAria')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      {error && <ErrorNote error={error} />}
      {isPending ? (
        <ListSkeleton rows={3} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          title={t('public.hotels.emptyTitle')}
          hint={t('public.hotels.emptyHint')}
        />
      ) : (
        <div className="space-y-4">
          {data?.content.map((hotel) => (
            <Link
              key={hotel.id}
              to={`/hotels/${hotel.id}`}
              className="card-tile group flex flex-col gap-4 p-5 transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-(--radius-tile) bg-teal-900 sm:h-24 sm:w-44">
                {hotel.imageUrl && (
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  />
                )}
                <span className="absolute bottom-0 left-0 bg-teal-950/85 px-2 py-0.5 font-display text-sm text-gold-300">
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
                {t('public.hotels.viewRooms')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
