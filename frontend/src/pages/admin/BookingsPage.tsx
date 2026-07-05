import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingApi, clientApi, hotelApi, roomApi } from '../../api/endpoints'
import type { BoardType, BookingDto, BookingStatus } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { BookingBadge } from '../../components/ui/StatusBadge'
import { ErrorNote } from '../../components/ui/Feedback'
import { date, money, plusDaysIso, todayIso } from '../../lib/format'
import { BOARD_LABEL, BOOKING_STATUS_LABEL } from '../../lib/labels'

type Action = 'confirm' | 'checkIn' | 'checkOut' | 'cancel'

const ACTIONS: Record<BookingStatus, { action: Action; label: string }[]> = {
  PENDING: [
    { action: 'confirm', label: 'Confirmar' },
    { action: 'cancel', label: 'Cancelar' },
  ],
  CONFIRMED: [
    { action: 'checkIn', label: 'Check-in' },
    { action: 'cancel', label: 'Cancelar' },
  ],
  CHECKED_IN: [{ action: 'checkOut', label: 'Check-out' }],
  CHECKED_OUT: [],
  CANCELLED: [],
}

function CreateBookingForm({ onDone }: { onDone: () => void }) {
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
            <option value="" disabled>Elige hotel…</option>
            {hotels.data?.content.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="nb-guests">Huéspedes</label>
          <input
            id="nb-guests" type="number" min={1} max={10} className="field-input"
            value={guests} onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="nb-in">Entrada</label>
          <input
            id="nb-in" type="date" className="field-input" min={todayIso()}
            value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setRoomId('') }}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="nb-out">Salida</label>
          <input
            id="nb-out" type="date" className="field-input" min={checkIn}
            value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setRoomId('') }}
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="nb-room">
          Habitación disponible {rooms.data && `(${rooms.data.length})`}
        </label>
        <select
          id="nb-room" className="field-input" required value={roomId}
          onChange={(e) => setRoomId(Number(e.target.value))}
          disabled={!rooms.data || rooms.data.length === 0}
        >
          <option value="" disabled>
            {hotelId === '' ? 'Elige primero el hotel' : 'Elige habitación…'}
          </option>
          {rooms.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.number} · {r.type} · {money(r.pricePerNight)}/noche
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="nb-client-search">Cliente</label>
          <input
            id="nb-client-search" type="search" className="field-input mb-2"
            placeholder="Buscar por nombre o documento…"
            value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
          />
          <select
            className="field-input" required value={clientId} size={4}
            onChange={(e) => setClientId(Number(e.target.value))}
            aria-label="Resultados de clientes"
          >
            {clients.data?.content.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName}, {c.firstName} · {c.documentId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="nb-board">Régimen</label>
          <select
            id="nb-board" className="field-input" value={board}
            onChange={(e) => setBoard(e.target.value as BoardType)}
          >
            {Object.entries(BOARD_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {create.error && <p role="alert" className="field-error">{problemMessage(create.error)}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>Cerrar</button>
        <button type="submit" className="btn-primary" disabled={create.isPending || !roomId || !clientId}>
          {create.isPending ? 'Creando…' : 'Crear reserva'}
        </button>
      </div>
    </form>
  )
}

export default function BookingsPage() {
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

  const columns: Column<BookingDto>[] = [
    {
      header: 'Reserva',
      cell: (b) => (
        <div>
          <p className="font-medium text-teal-950">{b.code}</p>
          <p className="text-xs text-teal-800">{b.clientFullName}</p>
        </div>
      ),
    },
    {
      header: 'Hotel / Habitación',
      cell: (b) => (
        <div>
          <p className="text-teal-950">{b.hotelName}</p>
          <p className="text-xs text-teal-800">hab. {b.roomNumber}</p>
        </div>
      ),
    },
    {
      header: 'Fechas',
      cell: (b) => (
        <span className="text-teal-800">
          {date(b.checkInDate)} → {date(b.checkOutDate)}
        </span>
      ),
    },
    { header: 'Estado', cell: (b) => <BookingBadge status={b.status} /> },
    { header: 'Total', align: 'right', cell: (b) => <span className="font-medium">{money(b.totalPrice)}</span> },
    {
      header: 'Acciones',
      align: 'right',
      cell: (b) => (
        <div className="flex justify-end gap-1.5">
          {ACTIONS[b.status].map(({ action, label }) => (
            <button
              key={action}
              disabled={act.isPending}
              onClick={() => act.mutate({ id: b.id, action })}
              className={action === 'cancel' ? 'btn-danger px-2.5 py-1 text-xs' : 'btn-primary px-2.5 py-1 text-xs'}
            >
              {label}
            </button>
          ))}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Reservas"
        subtitle="Ciclo de vida completo: confirmar, check-in, check-out, cancelar"
        actions={
          <button className="btn-gold" onClick={() => setCreating(true)}>
            + Nueva reserva
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`badge cursor-pointer ${status === '' ? 'bg-teal-800 text-glaze-50' : 'bg-glaze-100 text-teal-800 hover:bg-glaze-200'}`}
          onClick={() => { setStatus(''); setPage(0) }}
        >
          Todas
        </button>
        {(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => (
          <button
            key={s}
            className={`badge cursor-pointer ${status === s ? 'bg-teal-800 text-glaze-50' : 'bg-glaze-100 text-teal-800 hover:bg-glaze-200'}`}
            onClick={() => { setStatus(s); setPage(0) }}
          >
            {BOOKING_STATUS_LABEL[s]}
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
        emptyTitle="No hay reservas con este filtro"
        emptyHint="Crea una reserva desde el mostrador con el botón «Nueva reserva»."
        rowKey={(b) => b.id}
      />

      <Modal open={creating} title="Nueva reserva (mostrador)" onClose={() => setCreating(false)} wide>
        <CreateBookingForm onDone={() => setCreating(false)} />
      </Modal>
    </>
  )
}
