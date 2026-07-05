import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingApi, hotelApi, roomApi } from '../../api/endpoints'
import type { BookingStatus } from '../../api/types'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { plusDaysIso, todayIso } from '../../lib/format'

const DAYS_SHOWN = 14

const CELL_TONE: Record<BookingStatus, string> = {
  PENDING: 'bg-gold-300',
  CONFIRMED: 'bg-teal-500',
  CHECKED_IN: 'bg-teal-800',
  CHECKED_OUT: 'bg-glaze-200',
  CANCELLED: '',
}

export default function CalendarPage() {
  const [hotelId, setHotelId] = useState<number>(1)
  const [start, setStart] = useState(todayIso())

  const days = Array.from({ length: DAYS_SHOWN }, (_, i) =>
    plusDaysIso(i, new Date(start + 'T00:00:00')),
  )
  const end = plusDaysIso(DAYS_SHOWN, new Date(start + 'T00:00:00'))

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

  return (
    <>
      <PageHeader
        title="Calendario de ocupación"
        subtitle={`${DAYS_SHOWN} días · habitaciones × fechas`}
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
              aria-label="Fecha inicial"
              onChange={(e) => setStart(e.target.value)}
            />
          </>
        }
      />

      {/* Leyenda: color + texto, nunca solo color */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-teal-800">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px] bg-gold-300" /> Pendiente</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px] bg-teal-500" /> Confirmada</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px] bg-teal-800" /> Check-in</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-[3px] bg-glaze-200" /> Check-out</span>
      </div>

      {rooms.isPending || bookings.isPending ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="card-tile overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-3 py-2 text-left font-semibold text-teal-800">
                  Habitación
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`min-w-11 px-1 py-2 text-center font-medium ${
                      d === todayIso() ? 'text-gold-600' : 'text-teal-800'
                    }`}
                  >
                    {d.slice(8)}/{d.slice(5, 7)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.data?.content.map((room) => (
                <tr key={room.id} className="border-t border-glaze-100">
                  <th className="sticky left-0 bg-white px-3 py-1.5 text-left font-medium text-teal-950">
                    {room.number}
                  </th>
                  {days.map((d) => {
                    const b = bookingAt(room.id, d)
                    return (
                      <td key={d} className="p-0.5">
                        <div
                          className={`h-6 rounded-[3px] ${b ? CELL_TONE[b.status] : 'bg-glaze-100/50'}`}
                          title={b ? `${b.code} · ${b.clientFullName}` : `${room.number} libre ${d}`}
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
