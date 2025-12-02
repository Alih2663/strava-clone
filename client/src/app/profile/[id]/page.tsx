'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import ActivityCard from '@/components/ActivityCard';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Edit2, Save, X } from 'lucide-react';

interface User {
    _id: string;
    username: string;
    avatar?: string;
    bio?: string;
}

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

export default function ProfilePage() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [userRes, activitiesRes] = await Promise.all([
                    api.get(`/users/${id}`),
                    api.get(`/activities/user/${id}`)
                ]);
                setProfileUser(userRes.data);
                setActivities(activitiesRes.data);
                setEditBio(userRes.data.bio || '');
                // setEditAvatar(userRes.data.avatar || ''); // No longer needed for file upload
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProfileData();
    }, [id]);

    const handleSaveProfile = async () => {
        try {
            const formData = new FormData();
            formData.append('bio', editBio);
            if (editAvatarFile) {
                formData.append('avatar', editAvatarFile);
            }

            const { data } = await api.put('/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfileUser(prev => prev ? { ...prev, bio: data.bio, avatar: data.avatar } : null);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!profileUser) return <div>User not found</div>;

    const isOwnProfile = currentUser && currentUser._id === profileUser._id;

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4 max-w-5xl">
                <div className="flex flex-col md:flex-row gap-6 mt-6">
                    {/* Left Sidebar - User Profile */}
                    <div className="md:w-1/3">
                        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center sticky top-24">
                            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 overflow-hidden flex items-center justify-center relative group">
                                {profileUser.avatar ? (
                                    <img src={profileUser.avatar} alt={profileUser.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl text-gray-500 font-bold">{profileUser.username[0].toUpperCase()}</span>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold mb-2">{profileUser.username}</h1>

                            {isEditing ? (
                                <div className="w-full space-y-3 mb-4">
                                    <div className="text-left">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Profile Picture</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setEditAvatarFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full border p-2 rounded text-sm"
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Bio"
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className="w-full border p-2 rounded text-sm"
                                        rows={3}
                                    />
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={handleSaveProfile} className="bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                            <Save size={14} /> Save
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                            <X size={14} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {profileUser.bio && <p className="text-gray-600 mb-4 italic">"{profileUser.bio}"</p>}
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="mb-4 text-orange-600 hover:text-orange-800 flex items-center gap-1 text-sm"
                                        >
                                            <Edit2 size={14} /> Edit Profile
                                        </button>
                                    )}
                                </>
                            )}

                            <div className="mt-4 w-full">
                                <div className="flex justify-around border-t pt-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xl">{activities.length}</span>
                                        <span className="text-xs text-gray-500 uppercase">Activities</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Activities */}
                    <div className="md:w-2/3">
                        <h2 className="text-xl font-bold mb-4">Activities</h2>
                        <div className="space-y-4">
                            {activities.length === 0 ? (
                                <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                                    No activities yet.
                                </div>
                            ) : (
                                activities.map(activity => (
                                    <ActivityCard key={activity._id} activity={activity} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
