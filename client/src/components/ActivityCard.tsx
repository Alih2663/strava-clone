import Link from 'next/link';
import { Activity as ActivityIcon } from 'lucide-react';

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

interface ActivityCardProps {
    activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
                <Link href={`/profile/${activity.user._id}`}>
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity">
                        {activity.user.avatar ? (
                            <img src={activity.user.avatar} alt={activity.user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-600 font-semibold">{activity.user.username[0].toUpperCase()}</span>
                        )}
                    </div>
                </Link>
                <div>
                    <Link href={`/profile/${activity.user._id}`} className="font-semibold hover:text-orange-600 hover:underline">
                        {activity.user.username}
                    </Link>
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
            </div>
        </div>
    );
}
