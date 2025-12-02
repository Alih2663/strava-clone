'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import Link from 'next/link';

import SimpleNavbar from '@/components/SimpleNavbar';
import GoogleLoginButton from '@/components/GoogleLoginButton';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.token, data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <>
            <SimpleNavbar />
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded shadow-md w-96">
                    <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700">Email</label>
                            <input
                                type="email"
                                className="w-full border p-2 rounded"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700">Password</label>
                            <input
                                type="password"
                                className="w-full border p-2 rounded"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
                        >
                            Login
                        </button>
                    </form>
                    <GoogleLoginButton />
                    <p className="mt-4 text-center">
                        Don't have an account? <Link href="/register" className="text-blue-500">Register</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
