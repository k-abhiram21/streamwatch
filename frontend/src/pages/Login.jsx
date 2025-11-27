import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'

  const { login, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // For admin login, we might want to enforce that the user actually has admin role
    // But the backend handles the role check upon login and returns it
    // We can check it after login if needed, but for now let's just login

    const result = await login(username, password);

    if (result.success) {
      // If admin tab is selected, only admins should proceed
      const loggedInRole = (user?.role) || JSON.parse(localStorage.getItem('user'))?.role;
      if (activeTab === 'admin' && loggedInRole !== 'admin') {
        // Enforce restriction: non-admins cannot use the Admin tab
        await logout();
        setError('Only admins can sign in via the Admin tab. Please use the User tab.');
        setLoading(false);
        return;
      }

      // Navigate: Admins can use both tabs; if they used Admin tab, send them to admin area
      if (loggedInRole === 'admin' && activeTab === 'admin') {
        navigate('/admin-stats');
      } else {
        navigate('/datahub');
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 w-72 h-72 rounded-full bg-fuchsia-700/40 blur-3xl" />
        <div className="absolute -right-16 top-20 w-72 h-72 rounded-full bg-purple-700/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 w-80 h-80 rounded-full bg-pink-600/30 blur-3xl" />
      </div>

      <div className="max-w-4xl w-full relative flex flex-col md:flex-row items-stretch gap-10">
        <div className="hidden md:flex flex-col justify-center flex-1 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">
            Login
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.24em] mb-3">
            STREAM WATCH
          </h1>
          <div className="inline-flex items-center border border-slate-500/70 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]">
            <span>Monitor your data</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.9)] p-7 md:p-8">
            <div className="mb-6 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">
                {activeTab === 'user' ? 'Login' : 'Admin Login'}
              </p>
              <h2 className="text-2xl font-semibold tracking-wide mb-1">
                Access your Stream Watch console
              </h2>
              <p className="text-xs text-slate-400">
                Enter your credentials to continue. Admins use the same form with elevated access.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 bg-slate-900/80 rounded-full p-1 border border-slate-700/80">
              <button
                className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-[0.18em] uppercase transition-all ${activeTab === 'user'
                    ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white shadow-lg shadow-fuchsia-700/50'
                    : 'text-slate-400 hover:text-slate-100'
                  }`}
                onClick={() => setActiveTab('user')}
              >
                User Login
              </button>
              <button
                className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-[0.18em] uppercase transition-all ${activeTab === 'admin'
                    ? 'bg-gradient-to-r from-indigo-500 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-700/50'
                    : 'text-slate-400 hover:text-slate-100'
                  }`}
                onClick={() => setActiveTab('admin')}
              >
                Admin Login
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white shadow-lg transition-all transform hover:translate-y-[1px] active:scale-[0.99] ${activeTab === 'user'
                    ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 shadow-fuchsia-700/40'
                    : 'bg-gradient-to-r from-indigo-500 via-violet-600 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 shadow-indigo-700/40'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <Link
                to="/forgot-password"
                className="hover:text-slate-100 transition-colors underline underline-offset-4"
              >
                Forgot Password?
              </Link>
              <p>
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-fuchsia-300 hover:text-fuchsia-100 font-medium transition-colors underline underline-offset-4"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
