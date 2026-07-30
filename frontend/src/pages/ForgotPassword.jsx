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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-4xl w-full relative flex flex-col md:flex-row items-stretch gap-10">
        <div className="hidden md:flex flex-col justify-center flex-1 text-gray-900 dark:text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-gray-400 mb-4">
            Password Reset
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.18em] mb-3">
            NO WORRIES.!!
          </h1>
          <div className="inline-flex items-center border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]">
            <span>Take me back.!</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-7 md:p-8">
            <div className="mb-6 text-gray-900 dark:text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-gray-400 mb-3">
                Forgot Password ?
              </p>
              <h2 className="text-2xl font-semibold tracking-wide mb-1">
                Reset access to your Stream Watch account
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Enter your registered email and follow the steps to create a new password.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-xs text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequest} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all transform hover:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-center tracking-[0.4em] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Create a strong password"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all transform hover:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <Link
                to="/login"
                className="hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4"
              >
                Back to Login
              </Link>
              <Link
                to="/register"
                className="hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4"
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


