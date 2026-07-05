import type {
  BoardType, BookingStatus, ClientType, EmployeePosition, EmployeeStatus,
  InvoiceStatus, PaymentMethod, RoomStatus, RoomType, TaskPriority, TaskStatus, TaskType,
} from '../api/types'

export const BOARD_LABEL: Record<BoardType, string> = {
  ROOM_ONLY: 'Solo alojamiento',
  BED_AND_BREAKFAST: 'Alojamiento y desayuno',
  HALF_BOARD: 'Media pensión',
  FULL_BOARD: 'Pensión completa',
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Cancelada',
}

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  SINGLE: 'Individual',
  DOUBLE: 'Doble',
  TRIPLE: 'Triple',
  SUITE: 'Suite',
}

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  CLEANING: 'Limpieza',
  MAINTENANCE: 'Mantenimiento',
  OUT_OF_SERVICE: 'Fuera de servicio',
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  ISSUED: 'Emitida',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CARD: 'Tarjeta',
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  DONE: 'Hecha',
  CANCELLED: 'Cancelada',
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CLEANING: 'Limpieza',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Otra',
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  REGULAR: 'Regular',
  VIP: 'VIP',
}

export const POSITION_LABEL: Record<EmployeePosition, string> = {
  MANAGER: 'Dirección',
  RECEPTIONIST: 'Recepción',
  HOUSEKEEPER: 'Limpieza',
  MAINTENANCE: 'Mantenimiento',
}

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  ACTIVE: 'Activo',
  ON_LEAVE: 'De baja',
  TERMINATED: 'Finalizado',
}
