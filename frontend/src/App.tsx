import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicShell } from './components/layout/PublicShell'
import { AdminShell } from './components/layout/AdminShell'
import { AccountShell } from './components/layout/AccountShell'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const LandingPage = lazy(() => import('./pages/public/LandingPage'))
const HotelsPage = lazy(() => import('./pages/public/HotelsPage'))
const HotelDetailPage = lazy(() => import('./pages/public/HotelDetailPage'))

const MyBookingsPage = lazy(() => import('./pages/account/MyBookingsPage'))
const MyInvoicesPage = lazy(() => import('./pages/account/MyInvoicesPage'))
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'))

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const BookingsPage = lazy(() => import('./pages/admin/BookingsPage'))
const CalendarPage = lazy(() => import('./pages/admin/CalendarPage'))
const InvoicesPage = lazy(() => import('./pages/admin/InvoicesPage'))
const ClientsPage = lazy(() => import('./pages/admin/ClientsPage'))
const TasksPage = lazy(() => import('./pages/admin/TasksPage'))
const HotelsAdminPage = lazy(() => import('./pages/admin/HotelsAdminPage'))
const RoomsAdminPage = lazy(() => import('./pages/admin/RoomsAdminPage'))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))
const EmployeesPage = lazy(() => import('./pages/admin/EmployeesPage'))

function PageFallback() {
  return (
    <div className="space-y-4 p-8">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* public */}
        <Route element={<PublicShell />}>
          <Route index element={<LandingPage />} />
          <Route path="hotels" element={<HotelsPage />} />
          <Route path="hotels/:id" element={<HotelDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* client area (public chrome + tabs) */}
        <Route element={<ProtectedRoute roles={['CLIENT']} />}>
          <Route element={<PublicShell />}>
            <Route path="account" element={<AccountShell />}>
              <Route index element={<MyBookingsPage />} />
              <Route path="invoices" element={<MyInvoicesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* staff ERP */}
        <Route element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'RECEPTIONIST']} />}>
          <Route path="admin" element={<AdminShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="hotels" element={<HotelsAdminPage />} />
            <Route path="rooms" element={<RoomsAdminPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="employees" element={<EmployeesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
