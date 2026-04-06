import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LoadingPage } from './components/ui'
import AppLayout from './components/layout/AppLayout'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import Dashboard       from './pages/Dashboard'
import TasksPage       from './pages/TasksPage'
import CalendarPage    from './pages/CalendarPage'
import TeamPage        from './pages/TeamPage'
import OrientationPage from './pages/OrientationPage'
import CommsPage       from './pages/CommsPage'
import InfraPage       from './pages/InfraPage'
import LogsPage        from './pages/LogsPage'
import AdminUsersPage  from './pages/AdminUsersPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ScreeningPage   from './pages/ScreeningPage'
import InterviewPage   from './pages/InterviewPage'
import SelectionDashboard from './pages/SelectionDashboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (user) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected — all inside AppLayout */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index              element={<Dashboard />} />
        <Route path="tasks"       element={<TasksPage />} />
        <Route path="calendar"    element={<CalendarPage />} />
        <Route path="team"        element={<TeamPage />} />
        <Route path="logs"        element={<LogsPage />} />
        <Route path="admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="orientation" element={<OrientationPage />} />
        <Route path="comms"       element={<CommsPage />} />
        <Route path="infra"       element={<InfraPage />} />
        <Route path="applications" element={<ApplicationsPage />} />

        {/* Mitr Recruitment — Admin Only */}
        <Route path="screening"   element={<AdminRoute><ScreeningPage /></AdminRoute>} />
        <Route path="interviews"  element={<AdminRoute><InterviewPage /></AdminRoute>} />
        <Route path="selection"   element={<AdminRoute><SelectionDashboard /></AdminRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
