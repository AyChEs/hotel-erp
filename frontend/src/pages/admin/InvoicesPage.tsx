import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingApi, invoiceApi } from '../../api/endpoints'
import type { InvoiceDto, InvoiceStatus, PaymentMethod } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { InvoiceBadge } from '../../components/ui/StatusBadge'
import { ErrorNote } from '../../components/ui/Feedback'
import { dateTime, money } from '../../lib/format'
import { INVOICE_STATUS_LABEL, PAYMENT_LABEL } from '../../lib/labels'

function GenerateInvoiceForm({ onDone }: { onDone: () => void }) {
  const [bookingId, setBookingId] = useState<number | ''>('')
  const [method, setMethod] = useState<PaymentMethod>('CARD')
  const queryClient = useQueryClient()

  // Bookings that can be invoiced: confirmed / checked-in / checked-out without invoice
  const candidates = useQuery({
    queryKey: ['bookings', 'invoiceable'],
    queryFn: async () => {
      const [confirmed, checkedIn, checkedOut] = await Promise.all([
        bookingApi.search({ status: 'CONFIRMED', size: 50 }),
        bookingApi.search({ status: 'CHECKED_IN', size: 50 }),
        bookingApi.search({ status: 'CHECKED_OUT', size: 50 }),
      ])
      return [...confirmed.content, ...checkedIn.content, ...checkedOut.content].filter(
        (b) => !b.invoiceId,
      )
    },
  })

  const generate = useMutation({
    mutationFn: () => invoiceApi.generate(Number(bookingId), method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      onDone()
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (bookingId) generate.mutate()
      }}
    >
      <div>
        <label className="field-label" htmlFor="gi-booking">
          Reserva facturable {candidates.data && `(${candidates.data.length})`}
        </label>
        <select
          id="gi-booking" className="field-input" required value={bookingId}
          onChange={(e) => setBookingId(Number(e.target.value))}
        >
          <option value="" disabled>Elige reserva…</option>
          {candidates.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} · {b.clientFullName} · {money(b.totalPrice)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-teal-800">
          Solo reservas confirmadas o con check-in/out que aún no tienen factura.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="gi-method">Método de pago</label>
        <select
          id="gi-method" className="field-input" value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        >
          {Object.entries(PAYMENT_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {generate.error && <p role="alert" className="field-error">{problemMessage(generate.error)}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>Cerrar</button>
        <button type="submit" className="btn-primary" disabled={generate.isPending || !bookingId}>
          {generate.isPending ? 'Generando…' : 'Generar factura'}
        </button>
      </div>
    </form>
  )
}

function InvoiceDetailModal({ invoice, onClose }: { invoice: InvoiceDto; onClose: () => void }) {
  return (
    <Modal open title={invoice.invoiceNumber} onClose={onClose}>
      <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div><dt className="text-teal-800">Cliente</dt><dd className="font-medium">{invoice.clientFullName}</dd></div>
        <div><dt className="text-teal-800">Hotel</dt><dd className="font-medium">{invoice.hotelName}</dd></div>
        <div><dt className="text-teal-800">Reserva</dt><dd className="font-medium">{invoice.bookingCode}</dd></div>
        <div><dt className="text-teal-800">Emitida</dt><dd className="font-medium">{dateTime(invoice.issuedAt)}</dd></div>
        <div><dt className="text-teal-800">Pago</dt><dd className="font-medium">{PAYMENT_LABEL[invoice.paymentMethod]}</dd></div>
        <div><dt className="text-teal-800">Estado</dt><dd><InvoiceBadge status={invoice.status} /></dd></div>
      </dl>
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-t border-glaze-200">
            <td className="py-2 text-teal-800">Base imponible</td>
            <td className="py-2 text-right font-medium">{money(invoice.subtotal)}</td>
          </tr>
          <tr className="border-t border-glaze-200">
            <td className="py-2 text-teal-800">IVA ({Math.round(invoice.vatRate * 100)}%)</td>
            <td className="py-2 text-right font-medium">{money(invoice.vatAmount)}</td>
          </tr>
          <tr className="border-t-2 border-teal-800">
            <td className="py-2 font-semibold">Total</td>
            <td className="py-2 text-right text-lg font-semibold">{money(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-primary" onClick={() => window.print()}>Imprimir / PDF</button>
        <button className="btn-ghost" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  )
}

export default function InvoicesPage() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<InvoiceDto | null>(null)
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () => invoiceApi.search({ page, status: status || undefined }),
  })

  const pay = useMutation({
    mutationFn: (id: number) => invoiceApi.markPaid(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const columns: Column<InvoiceDto>[] = [
    { header: 'Número', cell: (i) => <span className="font-medium text-teal-950">{i.invoiceNumber}</span> },
    { header: 'Cliente', cell: (i) => i.clientFullName },
    { header: 'Reserva', cell: (i) => <span className="text-teal-800">{i.bookingCode}</span> },
    { header: 'Emitida', cell: (i) => <span className="text-teal-800">{dateTime(i.issuedAt)}</span> },
    { header: 'Estado', cell: (i) => <InvoiceBadge status={i.status} /> },
    { header: 'Total', align: 'right', cell: (i) => <span className="font-medium">{money(i.total)}</span> },
    {
      header: 'Acciones',
      align: 'right',
      cell: (i) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setSelected(i)}>
            Ver
          </button>
          {i.status === 'ISSUED' && (
            <button
              className="btn-primary px-2.5 py-1 text-xs"
              disabled={pay.isPending}
              onClick={() => pay.mutate(i.id)}
            >
              Marcar pagada
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Facturas"
        subtitle="Numeración secuencial con IVA del 10% desglosado"
        actions={
          <button className="btn-gold" onClick={() => setGenerating(true)}>
            + Generar factura
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
        {(Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map((s) => (
          <button
            key={s}
            className={`badge cursor-pointer ${status === s ? 'bg-teal-800 text-glaze-50' : 'bg-glaze-100 text-teal-800 hover:bg-glaze-200'}`}
            onClick={() => { setStatus(s); setPage(0) }}
          >
            {INVOICE_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {pay.error && <div className="mb-4"><ErrorNote error={pay.error} /></div>}

      <DataTable
        columns={columns}
        data={data}
        isPending={isPending}
        error={error}
        page={page}
        onPageChange={setPage}
        emptyTitle="Sin facturas con este filtro"
        emptyHint="Genera la primera desde una reserva confirmada con «Generar factura»."
        rowKey={(i) => i.id}
      />

      <Modal open={generating} title="Generar factura" onClose={() => setGenerating(false)}>
        <GenerateInvoiceForm onDone={() => setGenerating(false)} />
      </Modal>
      {selected && <InvoiceDetailModal invoice={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
