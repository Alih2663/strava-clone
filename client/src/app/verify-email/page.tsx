'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import Link from 'next/link';

import SimpleNavbar from '@/components/SimpleNavbar';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verify = async () => {
            try {
                await api.get(`/auth/verify?token=${token}`);
                setStatus('success');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed.');
            }
        };

        verify();
    }, [token]);

    if (status === 'loading') {
        return (
            <>
                <SimpleNavbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded shadow-md w-96 text-center">
                        <h1 className="text-2xl font-bold mb-6 text-gray-700">Verifying...</h1>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                </div>
            </>
        );
    }

    if (status === 'success') {
        return (
            <>
                <SimpleNavbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded shadow-md w-96 text-center">
                        <h1 className="text-2xl font-bold mb-6 text-green-600">Mail Verified</h1>
                        <p className="mb-6 text-gray-700">Now you can use Strava Clone</p>
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
                <div className="bg-white p-8 rounded shadow-md w-96 text-center">
                    <h1 className="text-2xl font-bold mb-6 text-red-600">Verification Failed</h1>
                    <p className="mb-6 text-gray-700">{message}</p>
                    <Link href="/login" className="text-blue-500 hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
