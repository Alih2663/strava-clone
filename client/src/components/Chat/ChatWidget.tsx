'use client';

import { useChat } from '@/context/ChatContext';
import { X } from 'lucide-react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
    const { isChatOpen, toggleChat, activeConversation, socket, setActiveConversation } = useChat();

    if (!isChatOpen) return null;

    return (
        <div className={`fixed z-[60] font-sans flex flex-col overflow-hidden bg-white shadow-2xl border border-gray-200
            ${isChatOpen ? 'bottom-0 right-0 w-full h-full md:bottom-24 md:right-8 md:w-80 md:h-96 md:rounded-lg' : 'hidden'}
        `}>
            {/* Header */}
            <div className="bg-orange-600 text-white p-3 flex justify-between items-center shadow-md">
                <span className="font-bold">Strava Chat</span>
                <button onClick={toggleChat} className="hover:bg-orange-700 p-1 rounded">
                    <X size={18} />
                </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative">
                {activeConversation ? (
                    <ChatWindow />
                ) : (
                    <ConversationList />
                )}
            </div>
        </div>
    );
}
