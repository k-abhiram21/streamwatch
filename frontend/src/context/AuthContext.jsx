import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Check if user is logged in from localStorage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            // Set default axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.defaults.headers.common['x-username'] = JSON.parse(storedUser).username;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE}/api/auth/login`, {
                username,
                password
            });

            const { user, token } = response.data;

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.defaults.headers.common['x-username'] = user.username;

            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post(`${API_BASE}/api/auth/register`, userData);
            return { success: true, email: response.data.email };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            await axios.post(`${API_BASE}/api/auth/verify-otp`, {
                email,
                otp,
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Verification failed'
            };
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to request password reset',
            };
        }
    };

    const resetPassword = async (email, otp, newPassword) => {
        try {
            await axios.post(`${API_BASE}/api/auth/reset-password`, {
                email,
                otp,
                new_password: newPassword,
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Failed to reset password',
            };
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_BASE}/api/auth/logout`);
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['x-username'];
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        verifyOTP,
        requestPasswordReset,
        resetPassword,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
