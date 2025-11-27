import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [step, setStep] = useState(1); // 1: Register, 2: OTP
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await register(formData);

        if (result.success) {
            setStep(2);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verifyOTP(formData.email, otp);

        if (result.success) {
            navigate('/login');
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
                        Signup
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.24em] mb-3">
                        REGISTER
                    </h1>
                    <div className="inline-flex items-center border border-slate-500/70 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]">
                        <span>For Free !!</span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-[0_32px_80px_rgba(15,23,42,0.9)] p-7 md:p-8">
                        <div className="mb-6 text-white">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">
                                {step === 1 ? 'Signup' : 'Verify Email'}
                            </p>
                            <h2 className="text-2xl font-semibold tracking-wide mb-1">
                                {step === 1 ? 'Create your Stream Watch account' : 'Enter the OTP we sent you'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {step === 1
                                    ? 'Use a valid email to receive verification and alerts.'
                                    : 'We sent a one-time code to your inbox.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-xs">
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleRegister} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                                        placeholder="Choose a username"
                                        required
                                        minLength={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                                        placeholder="Create a password"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 shadow-lg shadow-fuchsia-700/40 transition-all transform hover:translate-y-[1px] disabled:opacity-60"
                                >
                                    {loading ? 'Sending OTP...' : 'Register & Send OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-200 px-4 py-3 rounded-lg text-xs">
                                    We&apos;ve sent a verification code to <strong>{formData.email}</strong>.
                                    Please check your inbox (or console in dev).
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                                        One-Time Password
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-center tracking-[0.4em] text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                                        placeholder="000000"
                                        required
                                        maxLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-700/30 transition-all transform hover:translate-y-[1px] disabled:opacity-60"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Complete Registration'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-100 transition-colors underline underline-offset-4"
                                >
                                    Back to Registration
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center text-xs text-slate-400">
                            <p>
                                Already have an account?{' '}
                                <Link to="/login" className="text-fuchsia-300 hover:text-fuchsia-100 font-medium transition-colors underline underline-offset-4">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
