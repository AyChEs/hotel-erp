import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { hotelApi, meApi, roomApi } from '../../api/endpoints'
import type { BoardType, RoomDto } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { problemMessage } from '../../api/client'
import { money, nights, plusDaysIso, todayIso } from '../../lib/format'
import { BOARD_LABEL, ROOM_TYPE_LABEL } from '../../lib/labels'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'

function roomTotal(room: RoomDto, board: BoardType, guestCount: number, nightCount: number) {
  const supplement =
    board === 'HALF_BOARD'
      ? room.halfBoardSupplement
      : board === 'FULL_BOARD'
        ? room.fullBoardSupplement
        : 0
  return (room.pricePerNight + supplement * guestCount) * nightCount
}

export default function HotelDetailPage() {
  const { id } = useParams()
  const hotelId = Number(id)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const checkIn = params.get('checkIn') ?? plusDaysIso(7)
  const checkOut = params.get('checkOut') ?? plusDaysIso(10)
  const guests = Number(params.get('guests') ?? 2)
  const nightCount = Math.max(nights(checkIn, checkOut), 0)

  const [board, setBoard] = useState<BoardType>('BED_AND_BREAKFAST')
  const [bookedCode, setBookedCode] = useState<string | null>(null)

  const { data: hotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelApi.byId(hotelId),
  })

  const availability = useQuery({
    queryKey: ['availability', hotelId, checkIn, checkOut, guests],
    queryFn: () => roomApi.available(hotelId, checkIn, checkOut, guests),
    enabled: nightCount > 0,
  })

  const book = useMutation({
    mutationFn: (roomId: number) =>
      meApi.book({ roomId, checkInDate: checkIn, checkOutDate: checkOut, guests, boardType: board }),
    onSuccess: (booking) => {
      setBookedCode(booking.code)
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })

  const updateSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setParams({
      checkIn: String(form.get('checkIn')),
      checkOut: String(form.get('checkOut')),
      guests: String(form.get('guests')),
    })
    setBookedCode(null)
  }

  const canBook = user?.role === 'CLIENT'

  return (
    <div>
      {/* Hotel header — brand surface with the hotel's own photography */}
      <section className="relative isolate overflow-hidden bg-teal-950">
        {hotel?.imageUrl && (
          <img
            src={hotel.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="bg-arabesque absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <p className="text-sm text-gold-300">
            <Link to="/hotels" className="hover:text-gold-200">
              Hoteles
            </Link>{' '}
            / {hotel?.city ?? '…'}
          </p>
          <h1 className="font-display mt-1 text-3xl text-glaze-50 md:text-4xl">
            {hotel?.name ?? 'Cargando…'}
          </h1>
          {hotel && (
            <p className="mt-2 max-w-2xl text-sm text-glaze-100/85">
              {hotel.category.starRating}★ {hotel.category.name} · {hotel.address} ·{' '}
              {hotel.city}, {hotel.country}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {hotel?.description && (
          <p className="mb-8 max-w-3xl text-teal-800">{hotel.description}</p>
        )}

        {/* Availability controls */}
        <form
          onSubmit={updateSearch}
          className="card-tile mb-8 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_1fr_auto]"
        >
          <div>
            <label htmlFor="checkIn" className="field-label">
              Entrada
            </label>
            <input
              id="checkIn"
              name="checkIn"
              type="date"
              className="field-input"
              defaultValue={checkIn}
              min={todayIso()}
            />
          </div>
          <div>
            <label htmlFor="checkOut" className="field-label">
              Salida
            </label>
            <input
              id="checkOut"
              name="checkOut"
              type="date"
              className="field-input"
              defaultValue={checkOut}
              min={checkIn}
            />
          </div>
          <div>
            <label htmlFor="guests" className="field-label">
              Huéspedes
            </label>
            <input
              id="guests"
              name="guests"
              type="number"
              min={1}
              max={10}
              defaultValue={guests}
              className="field-input w-24"
            />
          </div>
          <div>
            <label htmlFor="board" className="field-label">
              Régimen
            </label>
            <select
              id="board"
              className="field-input"
              value={board}
              onChange={(e) => setBoard(e.target.value as BoardType)}
            >
              {Object.entries(BOARD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Actualizar
            </button>
          </div>
        </form>

        {bookedCode && (
          <div
            role="status"
            className="mb-6 rounded-(--radius-tile) border border-teal-600/30 bg-teal-50 px-4 py-3 text-sm text-teal-800"
          >
            Reserva <strong>{bookedCode}</strong> creada: pendiente de confirmación por el
            hotel. La verás en{' '}
            <Link to="/account" className="font-medium text-teal-600 underline">
              Mis reservas
            </Link>
            .
          </div>
        )}
        {book.error && <div className="mb-6"><ErrorNote error={book.error} /></div>}

        {/* Rooms */}
        <h2 className="font-display mb-4 text-2xl text-teal-900">
          Habitaciones disponibles
          <span className="ml-3 align-middle text-sm font-sans text-teal-800">
            {checkIn} → {checkOut} · {nightCount} noche{nightCount === 1 ? '' : 's'} ·{' '}
            {guests} huésped{guests === 1 ? '' : 'es'}
          </span>
        </h2>

        {availability.isPending ? (
          <ListSkeleton rows={3} />
        ) : availability.error ? (
          <ErrorNote error={availability.error} />
        ) : availability.data && availability.data.length === 0 ? (
          <EmptyState
            title="No hay habitaciones libres para esas fechas"
            hint="Cambia las fechas o reduce el número de huéspedes; el hotel podría tener disponibilidad cercana."
          />
        ) : (
          <div className="space-y-4">
            {availability.data?.map((room) => {
              const total = roomTotal(room, board, guests, nightCount)
              return (
                <article
                  key={room.id}
                  className="card-tile flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  {room.imageUrl && (
                    <img
                      src={room.imageUrl}
                      alt={`Habitación ${room.number}`}
                      loading="lazy"
                      className="h-32 w-full shrink-0 rounded-(--radius-tile) object-cover sm:h-24 sm:w-40"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-teal-900">
                      Habitación {room.number} — {ROOM_TYPE_LABEL[room.type]}
                    </h3>
                    <p className="mt-0.5 text-sm text-teal-800">
                      Hasta {room.capacity} personas
                      {room.floor != null && ` · planta ${room.floor}`}
                      {room.description && ` · ${room.description}`}
                    </p>
                    <p className="mt-1 text-sm text-teal-800">
                      {money(room.pricePerNight)}/noche
                      {board === 'HALF_BOARD' &&
                        ` + ${money(room.halfBoardSupplement)}/persona media pensión`}
                      {board === 'FULL_BOARD' &&
                        ` + ${money(room.fullBoardSupplement)}/persona pensión completa`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-teal-900">{money(total)}</p>
                      <p className="text-xs text-teal-800">total, IVA incluido</p>
                    </div>
                    {canBook ? (
                      <button
                        className="btn-gold"
                        disabled={book.isPending}
                        onClick={() => book.mutate(room.id)}
                      >
                        {book.isPending ? 'Reservando…' : 'Reservar'}
                      </button>
                    ) : user ? (
                      <span className="text-xs text-teal-800">
                        Solo los clientes pueden reservar online
                      </span>
                    ) : (
                      <button
                        className="btn-gold"
                        onClick={() =>
                          navigate('/login', {
                            state: { from: `/hotels/${hotelId}?${params.toString()}` },
                          })
                        }
                      >
                        Entra para reservar
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {book.error && problemMessage(book.error).includes('available') && (
          <p className="mt-4 text-sm text-teal-800">
            Otra persona pudo haber reservado esa habitación hace un momento; la lista se
            actualiza automáticamente.
          </p>
        )}
      </div>
    </div>
  )
}
