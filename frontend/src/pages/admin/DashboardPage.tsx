import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { dashboardApi } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import { ErrorNote } from '../../components/ui/Feedback'
import { PageHeader } from '../../components/ui/PageHeader'
import { money, plusDaysIso, todayIso } from '../../lib/format'
import { BOOKING_STATUS_LABEL } from '../../lib/labels'
import type { BookingStatus } from '../../api/types'

const SERIES = '#1f747d' // teal-600 — single-hue charts, validated ≥3:1 on white
const INK = '#06282b'
const MUTED = '#10494f'
const GRID = '#d5e2e2'

function StatTile({ label, value, context }: { label: string; value: string; context?: string }) {
  return (
    <div className="card-tile p-5">
      <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-teal-950">{value}</p>
      {context && <p className="mt-0.5 text-xs text-teal-800">{context}</p>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-tile p-5">
      <h2 className="mb-4 text-sm font-semibold text-teal-950">{title}</h2>
      {children}
    </section>
  )
}

const tooltipStyle = {
  borderRadius: 6,
  border: `1px solid ${GRID}`,
  fontSize: 12,
  color: INK,
}

export default function DashboardPage() {
  const { hasRole } = useAuth()

  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
    enabled: hasRole('ADMIN', 'MANAGER'),
  })
  const revenue = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => dashboardApi.revenue(12),
    enabled: hasRole('ADMIN', 'MANAGER'),
  })
  const occupancy = useQuery({
    queryKey: ['dashboard', 'occupancy'],
    queryFn: () => dashboardApi.occupancy(plusDaysIso(-14), plusDaysIso(14)),
    enabled: hasRole('ADMIN', 'MANAGER'),
  })

  // Receptionists land on bookings: the dashboard is ADMIN/MANAGER only.
  if (!hasRole('ADMIN', 'MANAGER')) return <Navigate to="/admin/bookings" replace />

  if (summary.error) return <ErrorNote error={summary.error} />

  const s = summary.data
  const statusEntries = s
    ? (Object.entries(s.bookingsByStatus) as [BookingStatus, number][])
    : []
  const maxStatus = Math.max(1, ...statusEntries.map(([, n]) => n))

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Situación a ${todayIso()}`} />

      {/* KPI row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (
          <>
            <StatTile
              label="Ocupación hoy"
              value={`${s.occupancyRateToday}%`}
              context={`${s.occupiedRoomsToday} de ${s.totalRooms} habitaciones`}
            />
            <StatTile
              label="Ingresos del mes"
              value={money(s.revenueThisMonth)}
              context="facturas emitidas y pagadas"
            />
            <StatTile
              label="Reservas del mes"
              value={String(s.bookingsThisMonth)}
              context="creadas desde el día 1"
            />
            <StatTile
              label="Tareas pendientes"
              value={String(s.pendingTasks)}
              context="limpieza y mantenimiento"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Ingresos facturados por mes (últimos 12)">
          {revenue.data ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue.data.points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickFormatter={(m: string) => m.slice(5)}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k€` : `${v}€`)}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [money(Number(value)), 'Ingresos']}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(31,116,125,0.08)' }}
                />
                <Bar dataKey="revenue" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="skeleton h-60 w-full" />
          )}
        </ChartCard>

        <ChartCard title="Ocupación diaria — 2 semanas atrás y 2 adelante">
          {occupancy.data ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={occupancy.data.points} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickFormatter={(d: string) => d.slice(8) + '/' + d.slice(5, 7)}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickFormatter={(v: number) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Ocupación']}
                  labelFormatter={(d) => String(d)}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke={SERIES}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="skeleton h-60 w-full" />
          )}
        </ChartCard>
      </div>

      {/* Status breakdown: identity carried by the row label, single hue */}
      <ChartCard title="Reservas por estado (histórico)">
        <div className="mt-2 space-y-2">
          {statusEntries.map(([status, count]) => (
            <div key={status} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="text-teal-800">{BOOKING_STATUS_LABEL[status]}</span>
              <div className="h-4 rounded-[4px] bg-glaze-100">
                <div
                  className="h-4 rounded-[4px]"
                  style={{ width: `${(count / maxStatus) * 100}%`, backgroundColor: SERIES }}
                />
              </div>
              <span className="text-right font-medium text-teal-950">{count}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </>
  )
}
