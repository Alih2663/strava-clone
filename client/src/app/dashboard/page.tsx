'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { MapPin, Clock, Activity as ActivityIcon } from 'lucide-react';

interface Activity {
    _id: string;
    title: string;
    description: string;
    sportType: string;
    stats: {
        distance: number;
        duration: number;
        elevationGain: number;
    };
    user: {
        username: string;
        avatar: string;
    };
    createdAt: string;
}

export default function Dashboard() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const { data } = await api.get('/activities/feed');
                setActivities(data);
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4 max-w-3xl">
                <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>
                {loading ? (
                    <p>Loading activities...</p>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity._id} className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        {activity.user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{activity.user.username}</p>
                                        <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <Link href={`/activity/${activity._id}`} className="hover:text-orange-600">
                                    <h2 className="text-xl font-bold mb-2">{activity.title}</h2>
                                </Link>
                                <p className="text-gray-600 mb-4">{activity.description}</p>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Distance</span>
                                        <span className="font-semibold">{(activity.stats.distance / 1000).toFixed(2)} km</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Duration</span>
                                        <span className="font-semibold">{formatDuration(activity.stats.duration)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Elevation</span>
                                        <span className="font-semibold">{activity.stats.elevationGain} m</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t flex gap-4 text-gray-500">
                                    <div className="flex items-center gap-1"><ActivityIcon size={16} /> {activity.sportType}</div>
                                    {/* Add Like/Comment buttons here later */}
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <p className="text-center text-gray-500">No activities yet. Upload one!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
