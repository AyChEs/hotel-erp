import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bookingApi, invoiceApi } from '../../api/endpoints'
import type { InvoiceDto, InvoiceStatus, PaymentMethod } from '../../api/types'
import { problemMessage } from '../../api/client'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { InvoiceBadge } from '../../components/ui/StatusBadge'
import { ErrorNote } from '../../components/ui/Feedback'
import { dateTime, money } from '../../lib/format'
import { useLabels } from '../../lib/labels'

function GenerateInvoiceForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
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
          {t('admin.invoices.invoiceableBooking')}{candidates.data && ` (${candidates.data.length})`}
        </label>
        <select
          id="gi-booking" className="field-input" required value={bookingId}
          onChange={(e) => setBookingId(Number(e.target.value))}
        >
          <option value="" disabled>{t('admin.invoices.pickBooking')}</option>
          {candidates.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} · {b.clientFullName} · {money(b.totalPrice)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-teal-800">
          {t('admin.invoices.candidatesHint')}
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="gi-method">{t('admin.invoices.method')}</label>
        <select
          id="gi-method" className="field-input" value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        >
          {(['CARD','CASH','BANK_TRANSFER'] as PaymentMethod[]).map((v) => (
            <option key={v} value={v}>{tLabel('paymentMethod', v)}</option>
          ))}
        </select>
      </div>

      {generate.error && <p role="alert" className="field-error">{problemMessage(generate.error)}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>{t('common.close')}</button>
        <button type="submit" className="btn-primary" disabled={generate.isPending || !bookingId}>
          {generate.isPending ? t('admin.invoices.generating') : t('admin.invoices.generate')}
        </button>
      </div>
    </form>
  )
}

function InvoiceDetailModal({ invoice, onClose }: { invoice: InvoiceDto; onClose: () => void }) {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
  return (
    <Modal open title={invoice.invoiceNumber} onClose={onClose}>
      <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div><dt className="text-teal-800">{t('account.myInvoices.client')}</dt><dd className="font-medium">{invoice.clientFullName}</dd></div>
        <div><dt className="text-teal-800">{t('account.myInvoices.hotel')}</dt><dd className="font-medium">{invoice.hotelName}</dd></div>
        <div><dt className="text-teal-800">{t('account.myInvoices.booking')}</dt><dd className="font-medium">{invoice.bookingCode}</dd></div>
        <div><dt className="text-teal-800">{t('admin.invoices.issuedAt')}</dt><dd className="font-medium">{dateTime(invoice.issuedAt)}</dd></div>
        <div><dt className="text-teal-800">{t('admin.invoices.method')}</dt><dd className="font-medium">{tLabel('paymentMethod', invoice.paymentMethod)}</dd></div>
        <div><dt className="text-teal-800">{t('admin.invoices.status')}</dt><dd><InvoiceBadge status={invoice.status} /></dd></div>
      </dl>
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-t border-glaze-200">
            <td className="py-2 text-teal-800">{t('account.myInvoices.subtotal')}</td>
            <td className="py-2 text-right font-medium">{money(invoice.subtotal)}</td>
          </tr>
          <tr className="border-t border-glaze-200">
            <td className="py-2 text-teal-800">{t('account.myInvoices.vat', { rate: Math.round(invoice.vatRate * 100) })}</td>
            <td className="py-2 text-right font-medium">{money(invoice.vatAmount)}</td>
          </tr>
          <tr className="border-t-2 border-teal-800">
            <td className="py-2 font-semibold">{t('admin.invoices.total')}</td>
            <td className="py-2 text-right text-lg font-semibold">{money(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-primary" onClick={() => window.print()}>{t('account.myInvoices.print')}</button>
        <button className="btn-ghost" onClick={onClose}>{t('common.close')}</button>
      </div>
    </Modal>
  )
}

export default function InvoicesPage() {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
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
    { header: t('admin.invoices.number'), cell: (i) => <span className="font-medium text-teal-950">{i.invoiceNumber}</span> },
    { header: t('account.myInvoices.client'), cell: (i) => i.clientFullName },
    { header: t('admin.bookings.title'), cell: (i) => <span className="text-teal-800">{i.bookingCode}</span> },
    { header: t('admin.invoices.issuedAt'), cell: (i) => <span className="text-teal-800">{dateTime(i.issuedAt)}</span> },
    { header: t('admin.invoices.status'), cell: (i) => <InvoiceBadge status={i.status} /> },
    { header: t('admin.invoices.total'), align: 'right', cell: (i) => <span className="font-medium">{money(i.total)}</span> },
    {
      header: t('common.actions'),
      align: 'right',
      cell: (i) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setSelected(i)}>
            {t('admin.invoices.view')}
          </button>
          {i.status === 'ISSUED' && (
            <button
              className="btn-primary px-2.5 py-1 text-xs"
              disabled={pay.isPending}
              onClick={() => pay.mutate(i.id)}
            >
              {t('admin.invoices.markPaid')}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('admin.invoices.title')}
        subtitle={t('admin.invoices.subtitle')}
        actions={
          <button className="btn-gold" onClick={() => setGenerating(true)}>
            {t('admin.invoices.new')}
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
        {(['ISSUED','PAID','CANCELLED'] as InvoiceStatus[]).map((s) => (
          <button
            key={s}
            className={`badge cursor-pointer ${status === s ? 'bg-teal-800 text-glaze-50' : 'bg-glaze-100 text-teal-800 hover:bg-glaze-200'}`}
            onClick={() => { setStatus(s); setPage(0) }}
          >
            {tLabel('invoiceStatus', s)}
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
        emptyTitle={t('admin.invoices.emptyTitle')}
        emptyHint={t('admin.invoices.emptyHint')}
        rowKey={(i) => i.id}
      />

      <Modal open={generating} title={t('admin.invoices.new')} onClose={() => setGenerating(false)}>
        <GenerateInvoiceForm onDone={() => setGenerating(false)} />
      </Modal>
      {selected && <InvoiceDetailModal invoice={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
