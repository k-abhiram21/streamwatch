import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const getActiveTab = () => {
    if (location.pathname === '/' || location.pathname === '/datahub') return 'data-hub'
    if (location.pathname === '/ai-analyst') return 'ai-analyst'
    if (location.pathname === '/grafana') return 'grafana'
    if (location.pathname === '/prometheus') return 'prometheus'
    if (location.pathname === '/admin-stats') return 'admin-stats'
    return 'data-hub'
  }

  const activeTab = getActiveTab()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    {
      id: 'data-hub',
      path: '/datahub',
      label: 'Data Hub',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      )
    },
    {
      id: 'ai-analyst',
      path: '/ai-analyst',
      label: 'AI Analyst',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'grafana',
      path: '/grafana',
      label: 'System Vitals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  // Add Admin items
  if (user?.role === 'admin') {
    navItems.push(
      {
        id: 'prometheus',
        path: '/prometheus',
        label: 'Prometheus',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      },
      {
        id: 'admin-stats',
        path: '/admin-stats',
        label: 'Admin Stats',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      }
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-fuchsia-700/20 blur-3xl animate-pulse" />
        <div className="absolute -right-16 top-20 w-96 h-96 rounded-full bg-purple-700/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute left-1/2 bottom-0 w-96 h-96 rounded-full bg-pink-600/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Stream Watch</h1>
                <p className="text-xs text-slate-400 -mt-0.5">Monitoring Platform</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 text-white border border-fuchsia-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{user?.username}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user?.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="group relative px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 border border-red-500/30 rounded-xl transition-all backdrop-blur-xl flex items-center space-x-2 text-red-400 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
