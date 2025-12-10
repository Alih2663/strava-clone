'use client';

import { useChat, Message } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

export default function ChatWindow() {
    const { activeConversation, setActiveConversation, socket, chatApi, markConversationAsRead } = useChat();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeConversation && activeConversation._id) {
            loadMessages();

            // Join conversation room
            socket?.emit('join_conversation', activeConversation._id);
            markConversationAsRead(activeConversation._id);

            // Listen for NEW messages
            const handleReceiveMessage = (newMessage: Message) => {
                // Verify it belongs to this conversation
                if (newMessage.conversationId === activeConversation._id) {
                    setMessages(prev => [...prev, newMessage]);
                    scrollToBottom();
                }
            };

            socket?.on('receive_message', handleReceiveMessage);

            return () => {
                socket?.emit('leave_conversation', activeConversation._id);
                socket?.off('receive_message', handleReceiveMessage);
            };
        } else if (activeConversation && !activeConversation._id) {
            // New pending chat, no messages yet
            setMessages([]);
        }
    }, [activeConversation, socket]);

    const loadMessages = async () => {
        if (!activeConversation || !activeConversation._id) return;
        try {
            const res = await chatApi.get(`/messages/${activeConversation._id}`);
            setMessages(res.data); // Assuming API returns chronological order (oldest -> newest) or reverse it
            scrollToBottom();
        } catch (err) {
            console.error("Failed to load messages", err);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !activeConversation || !socket || sending) return;

        setSending(true);
        // Optimistic UI updates could be added here, but let's rely on server ack/echo for consistency first

        const payload: any = {
            text: inputText,
        };

        if (activeConversation._id) {
            payload.conversationId = activeConversation._id;
        } else {
            // Pending conversation, send to recipient to create it
            // We assume participants[1] is the OTHER person. 
            // Better to find the one that is NOT me.
            const recipientId = activeConversation.participants.find(p => p !== user?._id);
            payload.recipientId = recipientId;
        }

        socket.emit('send_message', payload);

        setInputText('');
        setSending(false);
        // The 'receive_message' event will update the UI
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-3 border-b flex items-center gap-3 bg-gray-50 shadow-sm z-10">
                <button onClick={() => setActiveConversation(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full">
                    <ArrowLeft size={18} />
                </button>
                <div className="font-semibold text-black">
                    Chat
                    {/* Add participant name here */}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                {messages.map((msg, index) => {
                    const isOwn = msg.sender === user?._id;
                    return (
                        <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-2 rounded-lg text-sm shadow-sm ${isOwn ? 'bg-orange-500 text-black rounded-br-none' : 'bg-white text-black border rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm text-black focus:outline-none focus:border-orange-500"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
