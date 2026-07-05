import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hotelApi } from '../../api/endpoints'
import { plusDaysIso, todayIso } from '../../lib/format'
import { ListSkeleton } from '../../components/ui/Feedback'

const HERO_IMG =
  'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1800&q=70'

export default function LandingPage() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
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

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <>
      {/* Hero — photographic, with teal veil + arabesque pattern on top */}
      <section className="relative isolate overflow-hidden bg-teal-950">
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="eager"
        />
        <div className="bg-arabesque absolute inset-0 opacity-55" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-24 lg:py-32">
          <motion.p {...rise(0)} className="mb-3 text-sm text-gold-300">
            Zellige Hotels · Granada · Marrakech · Barcelona
          </motion.p>
          <motion.h1
            {...rise(0.08)}
            className="font-display max-w-3xl text-4xl leading-tight text-white md:text-6xl"
          >
            La hospitalidad es un oficio. Nosotros lo ejercemos con precisión.
          </motion.h1>
          <motion.p {...rise(0.16)} className="mt-5 max-w-xl text-lg text-glaze-100/90">
            Tres hoteles con carácter. Reserva directa, confirmación al instante y
            factura sin sorpresas.
          </motion.p>

          <motion.form
            {...rise(0.24)}
            onSubmit={searchFirstHotel}
            className="card-tile-accent mt-10 grid max-w-3xl gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div>
              <label htmlFor="checkIn" className="field-label">Entrada</label>
              <input
                id="checkIn" type="date" className="field-input" value={checkIn}
                min={todayIso()} onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="checkOut" className="field-label">Salida</label>
              <input
                id="checkOut" type="date" className="field-input" value={checkOut}
                min={checkIn} onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="guests" className="field-label">Huéspedes</label>
              <input
                id="guests" type="number" min={1} max={10} className="field-input w-24"
                value={guests} onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-gold w-full">Buscar</button>
            </div>
          </motion.form>
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
              <motion.div
                key={hotel.id}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={`/hotels/${hotel.id}`}
                  className="card-tile group block overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
                >
                  <div className="relative h-48 overflow-hidden bg-teal-900">
                    {hotel.imageUrl && (
                      <img
                        src={hotel.imageUrl}
                        alt={`Fachada de ${hotel.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                      />
                    )}
                    <span className="absolute bottom-0 left-0 bg-teal-950/85 px-3 py-1.5 font-display text-sm text-gold-300">
                      {hotel.category.starRating}★ · {hotel.city}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-teal-900 group-hover:text-teal-700">
                      {hotel.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-teal-800">{hotel.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Why direct */}
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
