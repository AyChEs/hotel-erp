// Mirrors of the backend DTOs (see backend/src/main/java/com/ayches/hotelerp/**/dto)

export type Role = 'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'CLIENT'

export interface UserSummary {
  id: number
  email: string
  role: Role
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  user: UserSummary
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CategoryDto {
  id: number
  name: string
  starRating: number
  description: string | null
}

export interface HotelDto {
  id: number
  name: string
  address: string
  city: string
  country: string
  phone: string | null
  email: string | null
  description: string | null
  imageUrl: string | null
  active: boolean
  category: CategoryDto
}

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'SUITE'
export type RoomStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE'

export interface RoomDto {
  id: number
  number: string
  floor: number | null
  type: RoomType
  status: RoomStatus
  capacity: number
  description: string | null
  imageUrl: string | null
  pricePerNight: number
  halfBoardSupplement: number
  fullBoardSupplement: number
  hotelId: number
  hotelName: string
}

export type BoardType = 'ROOM_ONLY' | 'BED_AND_BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD'
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'

export interface BookingDto {
  id: number
  code: string
  checkInDate: string
  checkOutDate: string
  guests: number
  boardType: BoardType
  status: BookingStatus
  totalPrice: number
  notes: string | null
  createdAt: string
  roomId: number
  roomNumber: string
  hotelId: number
  hotelName: string
  clientId: number
  clientFullName: string
  invoiceId: number | null
}

export type PaymentMethod = 'CARD' | 'CASH' | 'BANK_TRANSFER'
export type InvoiceStatus = 'ISSUED' | 'PAID' | 'CANCELLED'

export interface InvoiceDto {
  id: number
  invoiceNumber: string
  issuedAt: string
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  paymentMethod: PaymentMethod
  status: InvoiceStatus
  bookingId: number
  bookingCode: string
  clientId: number
  clientFullName: string
  hotelName: string
}

export type ClientType = 'REGULAR' | 'VIP'

export interface ClientDto {
  id: number
  firstName: string
  lastName: string
  documentId: string
  birthDate: string | null
  phone: string | null
  address: string | null
  clientType: ClientType
  registeredAt: string
  email: string | null
}

export type EmployeePosition = 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPER' | 'MAINTENANCE'
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'

export interface EmployeeDto {
  id: number
  firstName: string
  lastName: string
  documentId: string
  birthDate: string | null
  phone: string | null
  address: string | null
  position: EmployeePosition
  status: EmployeeStatus
  hiredAt: string
  grossSalary: number | null
  hotelId: number | null
  hotelName: string | null
  email: string | null
}

export type TaskType = 'CLEANING' | 'MAINTENANCE' | 'OTHER'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TaskDto {
  id: number
  title: string
  description: string | null
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  completedAt: string | null
  hotelId: number
  hotelName: string
  roomId: number | null
  roomNumber: string | null
  assignees: { id: number; fullName: string }[]
}

export interface DashboardSummary {
  totalHotels: number
  totalRooms: number
  occupiedRoomsToday: number
  occupancyRateToday: number
  bookingsThisMonth: number
  revenueThisMonth: number
  pendingTasks: number
  bookingsByStatus: Record<string, number>
}

export interface RevenuePoint {
  month: string
  revenue: number
}

export interface OccupancyPoint {
  date: string
  occupiedRooms: number
  totalRooms: number
  rate: number
}

/** RFC 7807 problem body produced by the backend for every error. */
export interface ProblemDetail {
  title: string
  status: number
  detail: string
  errors?: Record<string, string>
}
