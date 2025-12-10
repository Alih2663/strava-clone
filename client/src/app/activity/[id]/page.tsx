'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });
import CommentsSection from '@/components/CommentsSection';

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
    likes: string[];
}

export default function ActivityPage() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const { socket } = useSocket();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchActivity = async () => {
            if (authLoading || !user) return;

            try {
                const { data } = await api.get(`/activities/${id}`);
                setActivity(data);
                setLikeCount(data.likes.length);
                setIsLiked(data.likes.includes(user._id));
            } catch (error) {
                console.error('Error fetching activity:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchActivity();
    }, [id, user, authLoading, router]);

    useEffect(() => {
        if (socket && id) {
            socket.on(`activity_${id}_likes`, (data: { count: number, likes: string[] }) => {
                setLikeCount(data.count);
                if (user) {
                    setIsLiked(data.likes.includes(user._id));
                }
            });

            return () => {
                socket.off(`activity_${id}_likes`);
            };
        }
    }, [socket, id, user]);

    const handleToggleLike = async () => {
        if (!activity) return;
        try {
            const { data } = await api.post(`/likes/${activity._id}`);
            setIsLiked(data.liked);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!activity) return <div>Activity not found</div>;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const mapCoordinates = activity.location.coordinates.map(coord => [coord[1], coord[0]] as [number, number]);

    return (
        <div className="min-h-screen bg-gray-100 pb-32">
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

                    <div className="rounded-lg overflow-hidden border mb-4">
                        <Map coordinates={mapCoordinates} />
                    </div>

                    {/* Likes Section */}
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={handleToggleLike}
                            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        >
                            <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                        <span className="text-lg font-semibold">{likeCount} likes</span>
                    </div>

                    <CommentsSection activityId={activity._id} />
                </div>
            </div>
        </div>
    );
}
