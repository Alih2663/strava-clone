'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ActivityCard from '@/components/ActivityCard';

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
        _id: string;
        username: string;
        avatar?: string;
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
                            <ActivityCard key={activity._id} activity={activity} />
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
