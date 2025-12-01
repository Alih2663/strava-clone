'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Activity {
    _id: string;
    title: string;
    description: string;
    sportType: string;
    location: {
        coordinates: [number, number, number][]; // [lng, lat, ele]
    };
    stats: {
        distance: number;
        duration: number;
        elevationGain: number;
    };
    user: {
        username: string;
    };
}

export default function ActivityPage() {
    const { id } = useParams();
    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const { data } = await api.get(`/activities/${id}`);
                setActivity(data);
            } catch (error) {
                console.error('Error fetching activity:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchActivity();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!activity) return <div>Activity not found</div>;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const mapCoordinates = activity.location.coordinates.map(coord => [coord[1], coord[0]] as [number, number]);

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4 max-w-4xl">
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h1 className="text-3xl font-bold mb-2">{activity.title}</h1>
                    <p className="text-gray-600 mb-4">{activity.description}</p>

                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-gray-500 text-sm">Distance</p>
                            <p className="text-xl font-bold">{(activity.stats.distance / 1000).toFixed(2)} km</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-gray-500 text-sm">Duration</p>
                            <p className="text-xl font-bold">{Math.floor(activity.stats.duration / 60)} min</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-gray-500 text-sm">Elevation</p>
                            <p className="text-xl font-bold">{activity.stats.elevationGain} m</p>
                        </div>
                    </div>

                    <div className="rounded-lg overflow-hidden border">
                        <Map coordinates={mapCoordinates} />
                    </div>
                </div>
            </div>
        </div>
    );
}
