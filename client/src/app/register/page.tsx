'use client';

import { useState } from 'react';
import api from '@/utils/api';
import Link from 'next/link';

import SimpleNavbar from '@/components/SimpleNavbar';
import GoogleLoginButton from '@/components/GoogleLoginButton';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/register', { username, email, password });
            setSuccessMessage(`Confirmation mail sent to ${email}`);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
            setSuccessMessage('');
        }
    };

    if (successMessage) {
        return (
            <>
                <SimpleNavbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded shadow-md w-96 text-center">
                        <h1 className="text-2xl font-bold mb-6 text-green-600">Registration Successful</h1>
                        <p className="mb-6 text-gray-700">{successMessage}</p>
                        <Link href="/login" className="inline-block bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition-colors">
                            Go to Login
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SimpleNavbar />
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded shadow-md w-96">
                    <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700">Username</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
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
                            Register
                        </button>
                    </form>
                    <p className="mt-4 text-center">
                        Already have an account? <Link href="/login" className="text-blue-500">Login</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
