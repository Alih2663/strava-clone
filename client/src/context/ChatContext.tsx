'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import axios, { AxiosInstance } from 'axios';
import { useAuth } from './AuthContext';

// Types
export interface Message {
    _id: string;
    conversationId: string;
    sender: string;
    text: string;
    createdAt: string;
}

export interface Conversation {
    _id: string;
    participants: string[]; // User IDs (or populated objects if needed)
    lastMessage?: Message;
    updatedAt: string;
    unreadCount?: number;
}

interface ChatContextType {
    socket: Socket | null;
    chatApi: AxiosInstance;
    isChatOpen: boolean;
    toggleChat: () => void;
    activeConversation: Conversation | null;
    setActiveConversation: (conversation: Conversation | null) => void;
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    markConversationAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Create a dedicated API instance for the chat server
    const chatApi = axios.create({
        baseURL: 'http://localhost:3000/api',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add auth token to chat API requests
    chatApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:3000', {
                auth: {
                    userId: user._id
                }
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to Chat Server');
            });

            newSocket.on('message_notification', () => {
                setUnreadCount(prev => prev + 1);
            });

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]);

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
        if (!isChatOpen) {
            // Reset unread count when opening chat (optional logic, maybe strictly on specific conversation open)
            // setUnreadCount(0); 
        }
    };

    const markConversationAsRead = async (conversationId: string) => {
        try {
            if (!user) return;
            await chatApi.post(`/conversations/${conversationId}/read`, { userId: user._id });
            // Ideally update local state too if we had it here
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    return (
        <ChatContext.Provider value={{
            socket,
            chatApi,
            isChatOpen,
            toggleChat,
            activeConversation,
            setActiveConversation,
            unreadCount,
            setUnreadCount,
            markConversationAsRead
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
