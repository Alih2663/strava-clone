'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

interface User {
    _id: string;
    username: string;
    avatar: string;
}

export default function FriendsPage() {
    const [requests, setRequests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/users/friend-requests');
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await api.put(`/users/friend-request/${id}/accept`);
            setRequests(requests.filter(req => req._id !== id));
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.put(`/users/friend-request/${id}/reject`);
            setRequests(requests.filter(req => req._id !== id));
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4 max-w-2xl">
                <h1 className="text-2xl font-bold mb-6 mt-6">Friend Requests</h1>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <p className="text-gray-500">No pending friend requests.</p>
                        ) : (
                            requests.map((user) => (
                                <div key={user._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/profile/${user._id}`}>
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
                                                {user.username[0].toUpperCase()}
                                            </div>
                                        </Link>
                                        <Link href={`/profile/${user._id}`} className="font-semibold hover:text-orange-600 hover:underline">
                                            {user.username}
                                        </Link>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(user._id)}
                                            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                        >
                                            <Check size={18} /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(user._id)}
                                            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                        >
                                            <X size={18} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
