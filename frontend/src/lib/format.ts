const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const dateFmt = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export const money = (value: number) => eur.format(value)
export const date = (iso: string) => dateFmt.format(new Date(iso))
export const dateTime = (iso: string) => dateTimeFmt.format(new Date(iso))

export const nights = (checkIn: string, checkOut: string) =>
  Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000)

export const todayIso = () => new Date().toISOString().slice(0, 10)

export const plusDaysIso = (days: number, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
