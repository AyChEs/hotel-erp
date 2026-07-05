import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { hotelApi } from '../../api/endpoints'
import { plusDaysIso, todayIso } from '../../lib/format'
import { ListSkeleton } from '../../components/ui/Feedback'

export default function LandingPage() {
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState(plusDaysIso(7))
  const [checkOut, setCheckOut] = useState(plusDaysIso(10))
  const [guests, setGuests] = useState(2)

  const { data: hotels, isPending } = useQuery({
    queryKey: ['hotels', 'landing'],
    queryFn: () => hotelApi.search({ active: true, size: 3 }),
  })

  const searchFirstHotel = (e: React.FormEvent) => {
    e.preventDefault()
    const first = hotels?.content[0]
    navigate(
      first
        ? `/hotels/${first.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
        : '/hotels',
    )
  }

  return (
    <>
      {/* Hero — brand surface: arabesque + display serif */}
      <section className="bg-arabesque">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <p className="mb-3 text-sm text-gold-300">Zellige Hotels · desde 1998</p>
          <h1 className="font-display max-w-3xl text-4xl leading-tight text-glaze-50 md:text-5xl">
            La hospitalidad es un oficio.
            <br />
            Nosotros lo ejercemos con precisión.
          </h1>
          <p className="mt-4 max-w-xl text-glaze-100/85">
            Tres hoteles con carácter en Granada, Marrakech y Barcelona. Reserva
            directa, sin intermediarios, con confirmación al instante.
          </p>

          {/* Availability search — the primary task */}
          <form
            onSubmit={searchFirstHotel}
            className="card-tile-accent mt-10 grid max-w-3xl gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div>
              <label htmlFor="checkIn" className="field-label">
                Entrada
              </label>
              <input
                id="checkIn"
                type="date"
                className="field-input"
                value={checkIn}
                min={todayIso()}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="checkOut" className="field-label">
                Salida
              </label>
              <input
                id="checkOut"
                type="date"
                className="field-input"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="guests" className="field-label">
                Huéspedes
              </label>
              <input
                id="guests"
                type="number"
                min={1}
                max={10}
                className="field-input w-24"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-gold w-full">
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Hotels */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl text-teal-900">Nuestros hoteles</h2>
          <Link to="/hotels" className="text-sm font-medium text-teal-600 hover:text-teal-500">
            Ver todos →
          </Link>
        </div>

        {isPending ? (
          <ListSkeleton rows={3} />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {hotels?.content.map((hotel, i) => (
              <Link
                key={hotel.id}
                to={`/hotels/${hotel.id}`}
                className="card-tile group overflow-hidden transition-shadow duration-200 hover:shadow-md"
              >
                <div
                  className={`h-40 ${i % 2 === 0 ? 'bg-arabesque' : 'bg-teal-800'} relative`}
                  aria-hidden
                >
                  <span className="font-display absolute bottom-3 left-4 text-xl text-gold-300">
                    {hotel.category.starRating}★ · {hotel.city}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg text-teal-900 group-hover:text-teal-700">
                    {hotel.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-teal-800">
                    {hotel.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Why direct — quiet trust section, no icon-card grid */}
      <section className="border-t border-glaze-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
            <h2 className="font-display text-2xl text-teal-900">
              Reservar directo tiene ventajas
            </h2>
            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="font-medium text-teal-900">Confirmación inmediata</dt>
                <dd className="mt-1 text-sm text-teal-800">
                  Tu reserva entra directamente en el sistema del hotel, con email al momento.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-teal-900">Cancelación flexible</dt>
                <dd className="mt-1 text-sm text-teal-800">
                  Cancela cualquier reserva pendiente o confirmada desde tu cuenta, sin llamadas.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-teal-900">Factura sin sorpresas</dt>
                <dd className="mt-1 text-sm text-teal-800">
                  Precio cerrado por noche y régimen, con IVA desglosado en tu factura.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  )
}
