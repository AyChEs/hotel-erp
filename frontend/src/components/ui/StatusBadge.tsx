import type { BookingStatus, InvoiceStatus, RoomStatus, TaskPriority, TaskStatus } from '../../api/types'
import {
  BOOKING_STATUS_LABEL, INVOICE_STATUS_LABEL, ROOM_STATUS_LABEL,
  TASK_PRIORITY_LABEL, TASK_STATUS_LABEL,
} from '../../lib/labels'

const BOOKING_TONE: Record<BookingStatus, string> = {
  PENDING: 'bg-gold-100 text-gold-600',
  CONFIRMED: 'bg-teal-100 text-teal-800',
  CHECKED_IN: 'bg-teal-800 text-glaze-50',
  CHECKED_OUT: 'bg-glaze-200 text-teal-900',
  CANCELLED: 'bg-terra-100 text-terra-600',
}

const INVOICE_TONE: Record<InvoiceStatus, string> = {
  ISSUED: 'bg-gold-100 text-gold-600',
  PAID: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-terra-100 text-terra-600',
}

const ROOM_TONE: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-teal-100 text-teal-800',
  OCCUPIED: 'bg-teal-800 text-glaze-50',
  CLEANING: 'bg-gold-100 text-gold-600',
  MAINTENANCE: 'bg-terra-100 text-terra-600',
  OUT_OF_SERVICE: 'bg-glaze-200 text-teal-900',
}

const TASK_TONE: Record<TaskStatus, string> = {
  PENDING: 'bg-gold-100 text-gold-600',
  IN_PROGRESS: 'bg-teal-100 text-teal-800',
  DONE: 'bg-glaze-200 text-teal-900',
  CANCELLED: 'bg-terra-100 text-terra-600',
}

const PRIORITY_TONE: Record<TaskPriority, string> = {
  LOW: 'bg-glaze-200 text-teal-900',
  MEDIUM: 'bg-teal-100 text-teal-800',
  HIGH: 'bg-gold-100 text-gold-600',
  URGENT: 'bg-terra-100 text-terra-600',
}

export const BookingBadge = ({ status }: { status: BookingStatus }) => (
  <span className={`badge ${BOOKING_TONE[status]}`}>{BOOKING_STATUS_LABEL[status]}</span>
)

export const InvoiceBadge = ({ status }: { status: InvoiceStatus }) => (
  <span className={`badge ${INVOICE_TONE[status]}`}>{INVOICE_STATUS_LABEL[status]}</span>
)

export const RoomBadge = ({ status }: { status: RoomStatus }) => (
  <span className={`badge ${ROOM_TONE[status]}`}>{ROOM_STATUS_LABEL[status]}</span>
)

export const TaskBadge = ({ status }: { status: TaskStatus }) => (
  <span className={`badge ${TASK_TONE[status]}`}>{TASK_STATUS_LABEL[status]}</span>
)

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span className={`badge ${PRIORITY_TONE[priority]}`}>{TASK_PRIORITY_LABEL[priority]}</span>
)
