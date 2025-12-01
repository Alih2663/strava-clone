'use client';

import { useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import { UserPlus, Check } from 'lucide-react';

interface User {
    _id: string;
    username: string;
    avatar: string;
    status: 'none' | 'friend' | 'sent' | 'received';
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const { data } = await api.get(`/users/search?q=${query}`);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (userId: string) => {
        try {
            await api.post(`/users/friend-request/${userId}`);
            // Update local state
            setResults(results.map(user =>
                user._id === userId ? { ...user, status: 'sent' } : user
            ));
        } catch (error) {
            console.error('Failed to send request:', error);
            alert('Failed to send request');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4 max-w-2xl">
                <h1 className="text-2xl font-bold mb-6 mt-6">Find Friends</h1>

                <form onSubmit={handleSearch} className="mb-8 flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by username..."
                        className="flex-1 border p-2 rounded"
                    />
                    <button
                        type="submit"
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div className="space-y-4">
                    {results.map((user) => (
                        <div key={user._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <span className="font-semibold">{user.username}</span>
                            </div>

                            {user.status === 'friend' && (
                                <button disabled className="flex items-center gap-1 text-green-600 px-3 py-1 font-semibold">
                                    <Check size={18} /> Friend
                                </button>
                            )}

                            {user.status === 'sent' && (
                                <button disabled className="flex items-center gap-1 text-gray-500 px-3 py-1">
                                    <Check size={18} /> Request Sent
                                </button>
                            )}

                            {user.status === 'received' && (
                                <span className="text-blue-500 text-sm">Request Received</span>
                            )}

                            {user.status === 'none' && (
                                <button
                                    onClick={() => sendRequest(user._id)}
                                    className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                >
                                    <UserPlus size={18} /> Add Friend
                                </button>
                            )}
                        </div>
                    ))}
                    {results.length === 0 && query && !loading && (
                        <p className="text-gray-500 text-center">No users found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
