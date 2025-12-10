'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { LogOut, Upload, User, Bell, MessageCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import api from '@/utils/api';
import { usePathname } from 'next/navigation';
import ChatWidget from './Chat/ChatWidget';
import { useChat } from '@/context/ChatContext';

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
    const { unreadCount: chatUnreadCount, toggleChat } = useChat();
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

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-orange-600 text-white p-4 shadow-md relative z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                    <span className="hidden sm:inline">StravaClone</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-6">
                    {user ? (
                        <>
                            {/* Chat Icon - Always Visible */}
                            <button
                                onClick={toggleChat}
                                className="relative hover:text-orange-200 flex items-center p-2"
                            >
                                <MessageCircle size={24} />
                                {chatUnreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-orange-600">
                                        {chatUnreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications - Always Visible */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={handleNotificationClick}
                                    className="relative hover:text-orange-200 flex items-center p-2"
                                >
                                    <Bell size={24} />
                                    {unreadCount > 0 && (
                                        <span className={`absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-orange-600 ${animateBadge ? 'animate-bounce' : ''}`}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-[-60px] sm:right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[100]">
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
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex justify-between items-start">
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
                                                                <span className="text-gray-400 text-xs">
                                                                    {/* Time optional */}
                                                                </span>
                                                            </div>
                                                            <Link
                                                                href={`/activity/${notif.activity?._id}`}
                                                                className="hover:underline text-gray-600"
                                                                onClick={() => handleSingleRead(notif._id, notif.read)}
                                                            >
                                                                {notif.type === 'like' ? 'liked' : (notif.type === 'comment' ? 'commented on' : 'replied to')}
                                                                {' '}
                                                                <span className="font-medium text-orange-600">{notif.activity?.title || 'an activity'}</span>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-6">
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
                            </div>

                            {/* Mobile Hamburger Menu */}
                            <button
                                className="md:hidden p-2"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <div className="space-y-1.5 cursor-pointer">
                                    <div className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                                    <div className={`w-6 h-0.5 bg-white transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                                    <div className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                                </div>
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="hover:text-orange-200 font-semibold">Login</Link>
                    )}
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && user && (
                <div className="md:hidden absolute top-full left-0 w-full bg-orange-700 shadow-lg border-t border-orange-500 flex flex-col p-4 space-y-4 animate-in slide-in-from-top-2">
                    <Link
                        href={`/profile/${user._id}`}
                        className="flex items-center gap-3 hover:bg-orange-600 p-2 rounded transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <User size={20} />
                        <span className="font-semibold">{user.username}</span>
                    </Link>
                    <Link
                        href="/search"
                        className="flex items-center gap-3 hover:bg-orange-600 p-2 rounded transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <span className="w-5 text-center">🔍</span>
                        <span>Find Friends</span>
                    </Link>
                    <Link
                        href="/friends"
                        className="flex items-center gap-3 hover:bg-orange-600 p-2 rounded transition-colors justify-between"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-5 text-center">👥</span>
                            <span>Requests</span>
                        </div>
                        {requestCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {requestCount} New
                            </span>
                        )}
                    </Link>
                    <hr className="border-orange-500" />
                    <button
                        onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 hover:bg-red-600 p-2 rounded transition-colors text-left"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            )}

            {/* Floating Upload Button - Responsive Position */}
            {user && pathname !== '/upload' && (
                <Link
                    href="/upload"
                    className="fixed bottom-6 right-6 md:bottom-8 md:left-1/2 md:transform md:-translate-x-1/2 bg-orange-600 text-white w-14 h-14 md:w-fit md:h-auto md:px-5 md:py-2 rounded-full shadow-lg hover:bg-orange-700 transition-colors z-40 flex items-center justify-center gap-2"
                >
                    <Upload size={24} />
                    <span className="hidden md:inline font-bold text-sm tracking-wide">Upload Activity</span>
                </Link>
            )}

            <ChatWidget />
        </nav>
    );
}
