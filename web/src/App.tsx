import { Navigate, Route, HashRouter, Routes } from "react-router-dom"
import { AppDataProvider } from "@/context/AppDataContext"
import { AuthProvider } from "@/context/AuthContext"
import { ToastProvider } from "@/context/ToastContext"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { Login } from "@/pages/Auth/Login"
import { Dashboard } from "@/pages/Dashboard/Dashboard"
import { ReservationsList } from "@/pages/Reservations/ReservationsList"
import { GuestsList } from "@/pages/Guests/GuestsList"
import { RoomsList } from "@/pages/Rooms/RoomsList"
import { Operations } from "@/pages/Operations/Operations"
import { RfidCards } from "@/pages/Access/RfidCards"
import { AccessLogs } from "@/pages/Access/AccessLogs"
import { Payments } from "@/pages/Payments/Payments"
import { Staff } from "@/pages/Staff/Staff"
import { Reports } from "@/pages/Reports/Reports"
import { Settings } from "@/pages/Settings/Settings"

export function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/reservations" element={<ReservationsList />} />
                  <Route path="/guests" element={<GuestsList />} />
                  <Route path="/rooms" element={<RoomsList />} />
                  <Route path="/operations" element={<Operations />} />
                  <Route path="/access/cards" element={<RfidCards />} />
                  <Route path="/access/logs" element={<AccessLogs />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </AppDataProvider>
    </AuthProvider>
  )
}

export default App
