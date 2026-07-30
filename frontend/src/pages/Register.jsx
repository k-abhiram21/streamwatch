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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-4xl w-full relative flex flex-col md:flex-row items-stretch gap-10">
                <div className="hidden md:flex flex-col justify-center flex-1 text-gray-900 dark:text-white">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-gray-400 mb-4">
                        Signup
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.24em] mb-3">
                        REGISTER
                    </h1>
                    <div className="inline-flex items-center border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]">
                        <span>For Free !!</span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-7 md:p-8">
                        <div className="mb-6 text-gray-900 dark:text-white">
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-gray-400 mb-3">
                                {step === 1 ? 'Signup' : 'Verify Email'}
                            </p>
                            <h2 className="text-2xl font-semibold tracking-wide mb-1">
                                {step === 1 ? 'Create your Stream Watch account' : 'Enter the OTP we sent you'}
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {step === 1
                                    ? 'Use a valid email to receive verification and alerts.'
                                    : 'We sent a one-time code to your inbox.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-xs">
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleRegister} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Choose a username"
                                        required
                                        minLength={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Create a password"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all transform hover:translate-y-[1px] disabled:opacity-60"
                                >
                                    {loading ? 'Sending OTP...' : 'Register & Send OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-lg text-xs">
                                    We&apos;ve sent a verification code to <strong>{formData.email}</strong>.
                                    Please check your inbox (or console in dev).
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
                                        One-Time Password
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-center tracking-[0.4em] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="000000"
                                        required
                                        maxLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-[0.16em] uppercase text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all transform hover:translate-y-[1px] disabled:opacity-60"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Complete Registration'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4"
                                >
                                    Back to Registration
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
                            <p>
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors underline underline-offset-4">
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
