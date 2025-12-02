'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { LogOut, Upload, User, Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import api from '@/utils/api';
import { usePathname } from 'next/navigation';

interface Notification {
    _id: string;
    sender: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    type: 'comment' | 'reply' | 'like';
    activity: {
        _id: string;
        title: string;
    };
    read: boolean;
    createdAt: string;
}

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [requestCount, setRequestCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [animateBadge, setAnimateBadge] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { socket } = useSocket();

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('notification', (newNotification: Notification) => {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                setAnimateBadge(true);
                setTimeout(() => setAnimateBadge(false), 1000);
            });

            socket.on('friend_request', () => {
                setRequestCount(prev => prev + 1);
            });

            return () => {
                socket.off('notification');
                socket.off('friend_request');
            };
        }
    }, [socket]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            const [requestsRes, notifRes] = await Promise.all([
                api.get('/users/friend-requests'),
                api.get('/notifications')
            ]);
            setRequestCount(requestsRes.data.length);

            const newUnreadCount = notifRes.data.unreadCount;
            if (newUnreadCount > unreadCount) {
                setAnimateBadge(true);
                setTimeout(() => setAnimateBadge(false), 1000); // Reset animation
            }
            setUnreadCount(newUnreadCount);
            setNotifications(notifRes.data.notifications);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read');
            setUnreadCount(0);
            setNotifications([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSingleRead = async (id: string, isRead: boolean) => {
        setShowNotifications(false);
        if (!isRead) {
            try {
                await api.put(`/notifications/${id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.filter(n => n._id !== id));
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <nav className="bg-orange-600 text-white p-4 shadow-md relative z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" /> StravaClone
                </Link>
                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            {/* Notifications Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={handleNotificationClick}
                                    className="relative hover:text-orange-200 flex items-center"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${animateBadge ? 'animate-bounce' : ''}`}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                                        <div className="p-3 border-b bg-gray-50 font-semibold flex justify-between items-center">
                                            <span>Notifications</span>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllRead}
                                                    className="text-xs text-orange-600 hover:text-orange-800 font-normal"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif._id}
                                                        className={`block p-3 hover:bg-gray-50 border-b last:border-b-0 text-sm ${!notif.read ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                                                    >
                                                        <Link
                                                            href={`/profile/${notif.sender._id}`}
                                                            className="font-semibold hover:underline hover:text-orange-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowNotifications(false);
                                                            }}
                                                        >
                                                            {notif.sender.username}
                                                        </Link>
                                                        {' '}
                                                        <Link
                                                            href={`/activity/${notif.activity?._id}`}
                                                            className="hover:underline"
                                                            onClick={() => handleSingleRead(notif._id, notif.read)}
                                                        >
                                                            {notif.type === 'like' ? 'liked' : (notif.type === 'comment' ? 'commented on' : 'replied to your comment on')}
                                                            {' '}
                                                            <span className="font-medium text-orange-600">{notif.activity?.title || 'an activity'}</span>
                                                        </Link>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link href="/search" className="hover:text-orange-200">Find Friends</Link>
                            <Link href="/friends" className="hover:text-orange-200 relative">
                                Requests
                                {requestCount > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {requestCount}
                                    </span>
                                )}
                            </Link>

                            <Link href={`/profile/${user._id}`} className="flex items-center gap-2 hover:text-orange-200">
                                <User size={20} />
                                <span>{user.username}</span>
                            </Link>
                            <button onClick={logout} className="flex items-center gap-1 hover:text-orange-200">
                                <LogOut size={20} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="hover:text-orange-200">Login</Link>
                    )}
                </div>
            </div>

            {/* Floating Upload Button */}
            {user && pathname !== '/upload' && (
                <Link
                    href="/upload"
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-colors z-50 flex items-center gap-2"
                >
                    <Upload size={24} />
                    <span className="font-bold">Upload Activity</span>
                </Link>
            )}
        </nav>
    );
}
