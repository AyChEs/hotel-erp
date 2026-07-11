import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bookingApi, hotelApi, roomApi } from '../../api/endpoints'
import type { BookingStatus } from '../../api/types'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { plusDaysIso, todayIso } from '../../lib/format'
import { useLabels } from '../../lib/labels'

const CELL_TONE: Record<BookingStatus, string> = {
  PENDING: 'bg-gold-300',
  CONFIRMED: 'bg-teal-500',
  CHECKED_IN: 'bg-teal-800',
  CHECKED_OUT: 'bg-glaze-200',
  CANCELLED: '',
}

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const { tLabel } = useLabels()
  const locale = i18n.resolvedLanguage?.slice(0, 2) || 'es'
  const [hotelId, setHotelId] = useState<number>(1)
  const [start, setStart] = useState(todayIso())
  const [daysToShow, setDaysToShow] = useState<7 | 14>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 7 : 14,
  )

  const days = Array.from({ length: daysToShow }, (_, i) =>
    plusDaysIso(i, new Date(start + 'T00:00:00')),
  )
  const end = plusDaysIso(daysToShow, new Date(start + 'T00:00:00'))

  const hotels = useQuery({ queryKey: ['hotels', 'all'], queryFn: () => hotelApi.search({ size: 50 }) })
  const rooms = useQuery({
    queryKey: ['rooms', 'cal', hotelId],
    queryFn: () => roomApi.search({ hotelId, size: 100 }),
  })
  const bookings = useQuery({
    queryKey: ['bookings', 'cal', hotelId, start],
    queryFn: () => bookingApi.search({ hotelId, from: start, to: end, size: 200 }),
  })

  if (rooms.error || bookings.error) return <ErrorNote error={rooms.error ?? bookings.error} />

  const bookingAt = (roomId: number, day: string) =>
    bookings.data?.content.find(
      (b) =>
        b.roomId === roomId &&
        b.status !== 'CANCELLED' &&
        b.checkInDate <= day &&
        b.checkOutDate > day,
    )

  const formatDayHeader = (d: string) => {
    const date = new Date(`${d}T00:00:00`)
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: '2-digit' })
  }

  return (
    <>
      <PageHeader
        title={t('admin.calendar.title')}
        subtitle={t('admin.calendar.subtitle', { days: daysToShow })}
        actions={
          <>
            <select
              className="field-input w-auto"
              value={hotelId}
              aria-label="Hotel"
              onChange={(e) => setHotelId(Number(e.target.value))}
            >
              {hotels.data?.content.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <input
              type="date"
              className="field-input w-auto"
              value={start}
              aria-label={t('admin.calendar.startDate')}
              onChange={(e) => setStart(e.target.value)}
            />
            <div className="flex items-center gap-1 rounded-full border border-glaze-200 bg-glaze-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDaysToShow(7)}
                aria-pressed={daysToShow === 7}
                className={`rounded-full px-2.5 py-1 ${daysToShow === 7 ? 'bg-teal-800 text-glaze-50' : 'text-teal-800'}`}
              >7d</button>
              <button
                type="button"
                onClick={() => setDaysToShow(14)}
                aria-pressed={daysToShow === 14}
                className={`rounded-full px-2.5 py-1 ${daysToShow === 14 ? 'bg-teal-800 text-glaze-50' : 'text-teal-800'}`}
              >14d</button>
            </div>
          </>
        }
      />

      {/* Leyenda: color + texto, nunca solo color */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-teal-800">
        {(['PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT'] as BookingStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <i className={`h-3 w-3 rounded-[3px] ${CELL_TONE[s]}`} /> {tLabel('bookingStatus', s)}
          </span>
        ))}
      </div>

      {rooms.isPending || bookings.isPending ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="card-tile overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold text-teal-800">
                  {t('admin.rooms.title').slice(0, 5)}
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`min-w-10 px-1 py-2 text-center font-medium ${
                      d === todayIso() ? 'text-gold-600' : 'text-teal-800'
                    }`}
                  >
                    {formatDayHeader(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.data?.content.map((room) => (
                <tr key={room.id} className="border-t border-glaze-100">
                  <th className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-teal-950">
                    {room.number}
                  </th>
                  {days.map((d) => {
                    const b = bookingAt(room.id, d)
                    return (
                      <td key={d} className="p-0.5">
                        <div
                          className={`h-6 rounded-[3px] ${b ? CELL_TONE[b.status] : 'bg-glaze-100/50'}`}
                          title={b ? `${b.code} · ${b.clientFullName}` : `${room.number} · ${t('admin.calendar.free')} · ${d}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
