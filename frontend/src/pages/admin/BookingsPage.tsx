import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bookingApi, clientApi, hotelApi, roomApi } from '../../api/endpoints'
import type { BoardType, BookingDto, BookingStatus } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { BookingBadge } from '../../components/ui/StatusBadge'
import { ErrorNote } from '../../components/ui/Feedback'
import { date, money, plusDaysIso, todayIso } from '../../lib/format'
import { useLabels } from '../../lib/labels'

type Action = 'confirm' | 'checkIn' | 'checkOut' | 'cancel'

function CreateBookingForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
  const [hotelId, setHotelId] = useState<number | ''>('')
  const [checkIn, setCheckIn] = useState(plusDaysIso(1))
  const [checkOut, setCheckOut] = useState(plusDaysIso(3))
  const [guests, setGuests] = useState(2)
  const [roomId, setRoomId] = useState<number | ''>('')
  const [clientSearch, setClientSearch] = useState('')
  const [clientId, setClientId] = useState<number | ''>('')
  const [board, setBoard] = useState<BoardType>('BED_AND_BREAKFAST')
  const queryClient = useQueryClient()

  const hotels = useQuery({ queryKey: ['hotels', 'all'], queryFn: () => hotelApi.search({ size: 50 }) })
  const rooms = useQuery({
    queryKey: ['available', hotelId, checkIn, checkOut, guests],
    queryFn: () => roomApi.available(Number(hotelId), checkIn, checkOut, guests),
    enabled: hotelId !== '' && checkIn < checkOut,
  })
  const clients = useQuery({
    queryKey: ['clients', 'picker', clientSearch],
    queryFn: () => clientApi.search({ search: clientSearch || undefined, size: 8 }),
  })

  const create = useMutation({
    mutationFn: () =>
      bookingApi.create({
        roomId, clientId, checkInDate: checkIn, checkOutDate: checkOut,
        guests, boardType: board,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      onDone()
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (roomId && clientId) create.mutate()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="nb-hotel">Hotel</label>
          <select
            id="nb-hotel" className="field-input" required value={hotelId}
            onChange={(e) => { setHotelId(Number(e.target.value)); setRoomId('') }}
          >
            <option value="" disabled>{t('admin.bookings.pickHotel')}</option>
            {hotels.data?.content.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="nb-guests">{t('public.landing.guests')}</label>
          <input
            id="nb-guests" type="number" min={1} max={10} className="field-input"
            value={guests} onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="nb-in">{t('public.landing.checkIn')}</label>
          <input
            id="nb-in" type="date" className="field-input" min={todayIso()}
            value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setRoomId('') }}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="nb-out">{t('public.landing.checkOut')}</label>
          <input
            id="nb-out" type="date" className="field-input" min={checkIn}
            value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setRoomId('') }}
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="nb-room">
          {t('admin.bookings.availableRoom')}{rooms.data && ` (${rooms.data.length})`}
        </label>
        <select
          id="nb-room" className="field-input" required value={roomId}
          onChange={(e) => setRoomId(Number(e.target.value))}
          disabled={!rooms.data || rooms.data.length === 0}
        >
          <option value="" disabled>
            {hotelId === '' ? t('admin.bookings.pickHotelFirst') : t('admin.bookings.pickRoom')}
          </option>
          {rooms.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.number} · {tLabel('roomType', r.type)} · {money(r.pricePerNight)}{t('public.hotelDetail.perNight')}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="nb-client-search">{t('account.myInvoices.client')}</label>
          <input
            id="nb-client-search" type="search" className="field-input mb-2"
            placeholder={t('admin.bookings.clientSearchPlaceholder')}
            value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
          />
          <select
            className="field-input" required value={clientId} size={4}
            onChange={(e) => setClientId(Number(e.target.value))}
            aria-label={t('admin.bookings.clientResults')}
          >
            {clients.data?.content.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName}, {c.firstName} · {c.documentId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="nb-board">{t('public.hotelDetail.board')}</label>
          <select
            id="nb-board" className="field-input" value={board}
            onChange={(e) => setBoard(e.target.value as BoardType)}
          >
            {(['ROOM_ONLY','BED_AND_BREAKFAST','HALF_BOARD','FULL_BOARD'] as BoardType[]).map((v) => (
              <option key={v} value={v}>{tLabel('boardType', v)}</option>
            ))}
          </select>
        </div>
      </div>

      {create.error && <p role="alert" className="field-error">{problemMessage(create.error)}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>{t('common.close')}</button>
        <button type="submit" className="btn-primary" disabled={create.isPending || !roomId || !clientId}>
          {create.isPending ? t('admin.bookings.creating') : t('admin.bookings.create')}
        </button>
      </div>
    </form>
  )
}

export default function BookingsPage() {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['bookings', page, status],
    queryFn: () => bookingApi.search({ page, status: status || undefined }),
  })

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: Action }) => bookingApi[action](id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const ACTION_LABELS: Record<Action, string> = {
    confirm: t('admin.bookings.confirm'),
    checkIn: t('admin.bookings.checkIn'),
    checkOut: t('admin.bookings.checkOut'),
    cancel: t('admin.bookings.cancel'),
  }
  const ACTIONS: Record<BookingStatus, Action[]> = {
    PENDING: ['confirm', 'cancel'],
    CONFIRMED: ['checkIn', 'cancel'],
    CHECKED_IN: ['checkOut'],
    CHECKED_OUT: [],
    CANCELLED: [],
  }

  const columns: Column<BookingDto>[] = [
    {
      header: t('admin.bookings.bookingCol'),
      cell: (b) => (
        <div>
          <p className="font-medium text-teal-950">{b.code}</p>
          <p className="text-xs text-teal-800">{b.clientFullName}</p>
        </div>
      ),
    },
    {
      header: t('admin.bookings.hotelRoomCol'),
      cell: (b) => (
        <div>
          <p className="text-teal-950">{b.hotelName}</p>
          <p className="text-xs text-teal-800">{t('admin.bookings.roomShort', { n: b.roomNumber })}</p>
        </div>
      ),
    },
    {
      header: t('admin.bookings.dates'),
      cell: (b) => (
        <span className="text-teal-800">
          {date(b.checkInDate)} → {date(b.checkOutDate)}
        </span>
      ),
    },
    { header: t('admin.bookings.status'), cell: (b) => <BookingBadge status={b.status} /> },
    { header: t('admin.bookings.total'), align: 'right', cell: (b) => <span className="font-medium">{money(b.totalPrice)}</span> },
    {
      header: t('common.actions'),
      align: 'right',
      cell: (b) => (
        <div className="flex justify-end gap-1.5">
          {ACTIONS[b.status].map((action) => (
            <button
              key={action}
              disabled={act.isPending}
              onClick={() => act.mutate({ id: b.id, action })}
              className={action === 'cancel' ? 'btn-danger px-2.5 py-1 text-xs' : 'btn-primary px-2.5 py-1 text-xs'}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('admin.bookings.title')}
        subtitle={t('admin.bookings.subtitle')}
        actions={
          <button className="btn-gold" onClick={() => setCreating(true)}>
            {t('admin.bookings.new')}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`badge cursor-pointer ${status === '' ? 'bg-teal-800 text-glaze-50' : 'bg-glaze-100 text-teal-800 hover:bg-glaze-200'}`}
          onClick={() => { setStatus(''); setPage(0) }}
        >
          {t('admin.bookings.allStatuses')}
        </button>
        {(['PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED'] as BookingStatus[]).map((s) => (
          <button
            key={s}
            className={`badge cursor-pointer ${status === s ? 'bg-teal-800 text-glaze-50' : 'bg-glaze-100 text-teal-800 hover:bg-glaze-200'}`}
            onClick={() => { setStatus(s); setPage(0) }}
          >
            {tLabel('bookingStatus', s)}
          </button>
        ))}
      </div>

      {act.error && <div className="mb-4"><ErrorNote error={act.error} /></div>}

      <DataTable
        columns={columns}
        data={data}
        isPending={isPending}
        error={error}
        page={page}
        onPageChange={setPage}
        emptyTitle={t('admin.bookings.emptyTitle')}
        emptyHint={t('admin.bookings.emptyHint')}
        rowKey={(b) => b.id}
      />

      <Modal open={creating} title={t('admin.bookings.newFrontDesk')} onClose={() => setCreating(false)} wide>
        <CreateBookingForm onDone={() => setCreating(false)} />
      </Modal>
    </>
  )
}
