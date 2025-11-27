import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import DataHub from './pages/DataHub'
import AIAnalyst from './pages/AIAnalyst'
import Vitals from './pages/Vitals'
import Prometheus from './pages/Prometheus'
import AdminStats from './pages/AdminStats'

// Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/datahub" replace />} />
                <Route path="datahub" element={<DataHub />} />
                <Route path="ai-analyst" element={<AIAnalyst />} />
                <Route path="grafana" element={<Vitals />} />

                {/* Admin Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="prometheus" element={<Prometheus />} />
                  <Route path="admin-stats" element={<AdminStats />} />
                </Route>
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
