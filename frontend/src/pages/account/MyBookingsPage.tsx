import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { meApi } from '../../api/endpoints'
import { BookingBadge } from '../../components/ui/StatusBadge'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { date, money } from '../../lib/format'
import { BOARD_LABEL } from '../../lib/labels'

export default function MyBookingsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: ['me', 'bookings'],
    queryFn: () => meApi.bookings({ size: 20 }),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => meApi.cancelBooking(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'bookings'] }),
  })

  if (isPending) return <ListSkeleton />
  if (error) return <ErrorNote error={error} />
  if (!data || data.content.length === 0) {
    return (
      <EmptyState
        title="Todavía no tienes reservas"
        hint="Busca disponibilidad en cualquiera de nuestros hoteles y tu reserva aparecerá aquí."
      />
    )
  }

  return (
    <div className="space-y-4">
      {cancel.error && <ErrorNote error={cancel.error} />}
      {data.content.map((booking) => {
        const cancellable = booking.status === 'PENDING' || booking.status === 'CONFIRMED'
        return (
          <article
            key={booking.id}
            className="card-tile flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-medium text-teal-900">{booking.hotelName}</h2>
                <BookingBadge status={booking.status} />
              </div>
              <p className="mt-1 text-sm text-teal-800">
                {date(booking.checkInDate)} → {date(booking.checkOutDate)} · hab.{' '}
                {booking.roomNumber} · {booking.guests} huésped
                {booking.guests === 1 ? '' : 'es'} · {BOARD_LABEL[booking.boardType]}
              </p>
              <p className="mt-0.5 text-xs text-teal-800/80">
                {booking.code}
                {booking.invoiceId && (
                  <>
                    {' · '}
                    <Link
                      to="/account/invoices"
                      className="text-teal-600 underline hover:text-teal-500"
                    >
                      factura disponible
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <p className="text-lg font-semibold text-teal-900">{money(booking.totalPrice)}</p>
              {cancellable && (
                <button
                  className="btn-danger"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (window.confirm(`¿Cancelar la reserva ${booking.code}?`)) {
                      cancel.mutate(booking.id)
                    }
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
