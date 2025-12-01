'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        if (user) {
            api.get('/users/friend-requests')
                .then(({ data }: { data: any[] }) => setRequestCount(data.length))
                .catch((err: any) => console.error(err));
        }
    }, [user]);

    return (
        <nav className="bg-orange-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" /> StravaClone
                </Link>
                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link href="/search" className="hover:text-orange-200">Find Friends</Link>
                            <Link href="/friends" className="hover:text-orange-200 relative"> {/* Modified Requests link */}
                                Requests
                                {requestCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {requestCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/upload" className="flex items-center gap-1 hover:text-orange-200">
                                <Upload size={20} /> Upload
                            </Link>
                            <div className="flex items-center gap-2">
                                <User size={20} />
                                <span>{user.username}</span>
                            </div>
                            <button onClick={logout} className="flex items-center gap-1 hover:text-orange-200">
                                <LogOut size={20} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="hover:text-orange-200">Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
