import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { meApi } from '../../api/endpoints'
import { BookingBadge } from '../../components/ui/StatusBadge'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { date, money } from '../../lib/format'
import { useLabels } from '../../lib/labels'

export default function MyBookingsPage() {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
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
        title={t('account.myBookings.empty')}
        hint={`${t('account.myBookings.empty')} — ${t('account.myBookings.emptyLink')}`}
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
            className="card-tile flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-medium text-teal-900">{booking.hotelName}</h2>
                <BookingBadge status={booking.status} />
              </div>
              <p className="mt-1 text-sm text-teal-800">
                {date(booking.checkInDate)} → {date(booking.checkOutDate)} ·{' '}
                {t('account.myBookings.room', { n: booking.roomNumber })} ·{' '}
                {t('public.hotelDetail.guests', { count: booking.guests })} ·{' '}
                {tLabel('boardType', booking.boardType)}
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
                      {t('account.myBookings.invoiceAvailable')}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
              <p className="text-lg font-semibold text-teal-900">{money(booking.totalPrice)}</p>
              {cancellable && (
                <button
                  className="btn-danger"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (window.confirm(t('account.myBookings.cancelConfirmWithCode', { code: booking.code }))) {
                      cancel.mutate(booking.id)
                    }
                  }}
                >
                  {cancel.isPending ? t('account.myBookings.cancelling') : t('account.myBookings.cancel')}
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
