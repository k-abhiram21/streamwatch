import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await requestPasswordReset(email);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess('If the email exists, a reset code has been sent.');
      setStep(2);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    }
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
            Password Reset
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.18em] mb-3">
            NO WORRIES.!!
          </h1>
          <div className="inline-flex items-center border border-slate-500/70 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]">
            <span>Take me back.!</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.9)] p-7 md:p-8">
            <div className="mb-6 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">
                Forgot Password ?
              </p>
              <h2 className="text-2xl font-semibold tracking-wide mb-1">
                Reset access to your Stream Watch account
              </h2>
              <p className="text-xs text-slate-400">
                Enter your registered email and follow the steps to create a new password.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
                {success}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequest} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 shadow-lg shadow-fuchsia-700/40 transition-all transform hover:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-center tracking-[0.4em] text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                    placeholder="Create a strong password"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 shadow-lg shadow-fuchsia-700/40 transition-all transform hover:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <Link
                to="/login"
                className="hover:text-slate-100 transition-colors underline underline-offset-4"
              >
                Back to Login
              </Link>
              <Link
                to="/register"
                className="hover:text-slate-100 transition-colors underline underline-offset-4"
              >
                Need an account? Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


