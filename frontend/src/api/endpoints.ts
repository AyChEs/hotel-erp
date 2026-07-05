import { api } from './client'
import type {
  BoardType,
  BookingDto,
  CategoryDto,
  ClientDto,
  DashboardSummary,
  EmployeeDto,
  HotelDto,
  InvoiceDto,
  OccupancyPoint,
  PageResponse,
  PaymentMethod,
  RevenuePoint,
  RoomDto,
  TaskDto,
  TaskStatus,
  TokenResponse,
} from './types'

type Query = Record<string, string | number | boolean | undefined>

const get = async <T>(url: string, params?: Query) =>
  (await api.get<T>(url, { params })).data
const post = async <T>(url: string, body?: unknown) => (await api.post<T>(url, body)).data
const put = async <T>(url: string, body?: unknown) => (await api.put<T>(url, body)).data
const del = async (url: string) => (await api.delete(url)).data as void

// ---------- auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    post<TokenResponse>('/api/auth/login', { email, password }),
  register: (body: {
    email: string
    password: string
    firstName: string
    lastName: string
    documentId: string
    phone?: string
  }) => post<TokenResponse>('/api/auth/register', body),
  refresh: (refreshToken: string) => post<TokenResponse>('/api/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => post<void>('/api/auth/logout', { refreshToken }),
}

// ---------- public browsing ----------
export const hotelApi = {
  search: (params?: Query) => get<PageResponse<HotelDto>>('/api/hotels', params),
  byId: (id: number) => get<HotelDto>(`/api/hotels/${id}`),
  create: (body: unknown) => post<HotelDto>('/api/hotels', body),
  update: (id: number, body: unknown) => put<HotelDto>(`/api/hotels/${id}`, body),
  remove: (id: number) => del(`/api/hotels/${id}`),
}

export const categoryApi = {
  list: () => get<CategoryDto[]>('/api/categories'),
  create: (body: unknown) => post<CategoryDto>('/api/categories', body),
  update: (id: number, body: unknown) => put<CategoryDto>(`/api/categories/${id}`, body),
  remove: (id: number) => del(`/api/categories/${id}`),
}

export const roomApi = {
  search: (params?: Query) => get<PageResponse<RoomDto>>('/api/rooms', params),
  byId: (id: number) => get<RoomDto>(`/api/rooms/${id}`),
  available: (hotelId: number, checkIn: string, checkOut: string, guests: number) =>
    get<RoomDto[]>('/api/rooms/available', { hotelId, checkIn, checkOut, guests }),
  create: (body: unknown) => post<RoomDto>('/api/rooms', body),
  update: (id: number, body: unknown) => put<RoomDto>(`/api/rooms/${id}`, body),
  remove: (id: number) => del(`/api/rooms/${id}`),
}

// ---------- client self-service ----------
export const meApi = {
  bookings: (params?: Query) => get<PageResponse<BookingDto>>('/api/me/bookings', params),
  book: (body: {
    roomId: number
    checkInDate: string
    checkOutDate: string
    guests: number
    boardType: BoardType
    notes?: string
  }) => post<BookingDto>('/api/me/bookings', body),
  cancelBooking: (id: number) => post<BookingDto>(`/api/me/bookings/${id}/cancel`),
  invoices: (params?: Query) => get<PageResponse<InvoiceDto>>('/api/me/invoices', params),
  invoice: (id: number) => get<InvoiceDto>(`/api/me/invoices/${id}`),
  profile: () => get<ClientDto>('/api/me/profile'),
  updateProfile: (body: unknown) => put<ClientDto>('/api/me/profile', body),
}

// ---------- staff ----------
export const bookingApi = {
  search: (params?: Query) => get<PageResponse<BookingDto>>('/api/bookings', params),
  byId: (id: number) => get<BookingDto>(`/api/bookings/${id}`),
  create: (body: unknown) => post<BookingDto>('/api/bookings', body),
  confirm: (id: number) => post<BookingDto>(`/api/bookings/${id}/confirm`),
  checkIn: (id: number) => post<BookingDto>(`/api/bookings/${id}/check-in`),
  checkOut: (id: number) => post<BookingDto>(`/api/bookings/${id}/check-out`),
  cancel: (id: number) => post<BookingDto>(`/api/bookings/${id}/cancel`),
}

export const invoiceApi = {
  search: (params?: Query) => get<PageResponse<InvoiceDto>>('/api/invoices', params),
  byId: (id: number) => get<InvoiceDto>(`/api/invoices/${id}`),
  generate: (bookingId: number, paymentMethod: PaymentMethod) =>
    post<InvoiceDto>('/api/invoices', { bookingId, paymentMethod }),
  markPaid: (id: number) => post<InvoiceDto>(`/api/invoices/${id}/pay`),
  cancel: (id: number) => post<InvoiceDto>(`/api/invoices/${id}/cancel`),
}

export const clientApi = {
  search: (params?: Query) => get<PageResponse<ClientDto>>('/api/clients', params),
  byId: (id: number) => get<ClientDto>(`/api/clients/${id}`),
  create: (body: unknown) => post<ClientDto>('/api/clients', body),
  update: (id: number, body: unknown) => put<ClientDto>(`/api/clients/${id}`, body),
  remove: (id: number) => del(`/api/clients/${id}`),
}

export const employeeApi = {
  search: (params?: Query) => get<PageResponse<EmployeeDto>>('/api/employees', params),
  byId: (id: number) => get<EmployeeDto>(`/api/employees/${id}`),
  create: (body: unknown) => post<EmployeeDto>('/api/employees', body),
  update: (id: number, body: unknown) => put<EmployeeDto>(`/api/employees/${id}`, body),
  remove: (id: number) => del(`/api/employees/${id}`),
}

export const taskApi = {
  search: (params?: Query) => get<PageResponse<TaskDto>>('/api/tasks', params),
  byId: (id: number) => get<TaskDto>(`/api/tasks/${id}`),
  create: (body: unknown) => post<TaskDto>('/api/tasks', body),
  update: (id: number, body: unknown) => put<TaskDto>(`/api/tasks/${id}`, body),
  changeStatus: (id: number, status: TaskStatus) =>
    post<TaskDto>(`/api/tasks/${id}/status/${status}`),
  remove: (id: number) => del(`/api/tasks/${id}`),
}

export const dashboardApi = {
  summary: () => get<DashboardSummary>('/api/dashboard/summary'),
  revenue: (months = 12) => get<{ points: RevenuePoint[] }>('/api/dashboard/revenue', { months }),
  occupancy: (from: string, to: string) =>
    get<{ points: OccupancyPoint[] }>('/api/dashboard/occupancy', { from, to }),
}
