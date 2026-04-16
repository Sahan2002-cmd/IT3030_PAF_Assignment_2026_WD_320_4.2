import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './components/pages/LoginPage'
import ResourcesPage from './components/pages/ResourcesPage'
import DashboardPage from './components/pages/DashboardPage'
import ProtectedRoute from './controllers/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="resources" element={<ResourcesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}