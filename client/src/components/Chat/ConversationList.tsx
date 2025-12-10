'use client';

import { useChat, Conversation } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { MessageSquarePlus, Search } from 'lucide-react';
import api from '@/utils/api'; // Use main API for fetching friends

interface Friend {
    _id: string;
    username: string;
    avatar?: string;
}

export default function ConversationList() {
    const { chatApi } = useChat();
    const { setActiveConversation, setUnreadCount } = useChat();
    const { user: authUser } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ type: 'conversation' | 'friend', data: any }[]>([]);

    useEffect(() => {
        if (authUser) {
            loadData();
        }
    }, [authUser]);

    useEffect(() => {
        handleSearch();
    }, [searchTerm, conversations, friends]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [convRes, friendsRes] = await Promise.all([
                chatApi.get(`/conversations/${authUser?._id}`),
                api.get('/users/friends')
            ]);
            setConversations(convRes.data);
            setFriends(friendsRes.data);

            // Calculate and set global unread count
            const totalUnread = convRes.data.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);
            setUnreadCount(totalUnread);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const getOtherParticipantId = (conversation: Conversation) => {
        return conversation.participants.find(p => p !== authUser?._id) || 'Unknown';
    };

    // Helper to get friend details from ID (for existing conversations)
    const getParticipantDetails = (participantId: string) => {
        return friends.find(f => f._id === participantId) || { username: 'User ' + participantId.substr(0, 5), _id: participantId };
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const results: { type: 'conversation' | 'friend', data: any }[] = [];

        // 1. Search existing conversations (by friend's name)
        conversations.forEach(conv => {
            const otherId = getOtherParticipantId(conv);
            const details = getParticipantDetails(otherId);
            if (details.username.toLowerCase().includes(lowerTerm)) {
                results.push({ type: 'conversation', data: { ...conv, friendDetails: details } });
            }
        });

        // 2. Search friends (who don't have an open conversation showing in results yet? 
        // Or show them anyway to "Start Chat" which effectively opens the existing one)
        // Let's just list friends that match.
        friends.forEach(friend => {
            if (friend.username.toLowerCase().includes(lowerTerm)) {
                // Check if already in results (as a conversation) to avoid duplicates?
                // Actually, if a conversation exists, clicking the friend should just open it.
                // Let's deduce if conversation exists for this friend.
                const existingConv = conversations.find(c => c.participants.includes(friend._id));

                if (!existingConv) {
                    results.push({ type: 'friend', data: friend });
                } else {
                    // If we didn't add the conversation already (maybe logic mismatch), ensure it's handled.
                    // But simpler: If conversation exists, we already added it in step 1.
                    // So we ONLY add friends here if they don't have a conversation.
                    // Wait, what if the user deleted the conversation? (Not implemented).
                }
            }
        });

        setSearchResults(results);
    };

    const startChatWithFriend = async (friendId: string) => {
        // Check if conversation already exists locally to be safe
        const existing = conversations.find(c => c.participants.includes(friendId));
        if (existing) {
            setActiveConversation(existing);
            return;
        }

        // We can't synchronously "create" it here without an API call if we want the full object immediately.
        // But for better UX, we can just open an empty chat window shell?
        // Or better: Use socket/api to Create OR Get conversation.
        // Let's assume the user sends a message.
        // BUT ChatWindow needs `activeConversation`.

        // Let's optimistically set a "temporary" conversation object
        const tempConv: Conversation = {
            _id: 'temp_' + Date.now(), // ID that won't match DB yet
            participants: [authUser?._id!, friendId],
            updatedAt: new Date().toISOString()
        };

        // Wait! We should fetch/create it via API to be robust. 
        // We generally shouldn't rely on 'pending' state in ChatWindow for IDs.
        // Let's try to 'get' it via Chat API first?
        // Or better: The ChatWindow logic handles "if message sent -> create".
        // But we need to pass a valid conversation ID to ChatWindow usually, OR valid participants.
        // Since `activeConversation` is the state, let's use a flag or special helper?

        // Simple robust solution:
        // Use Chat API to "Init Conversation"
        // POST /conversations { participantId: ... } -> returns conv
        // But we didn't implement that in chat_server/index.js (only get by userId).

        // Solution: Just set it as active. 
        // But wait, our ChatWindow relies on `_id` to join room. 'temp_' room won't work for receiving messages.
        // So we MUST create it on server or have server endpoint.

        // Since we can't change server easily right now (objective is "Enhancing Chat UI"), 
        // let's try the socket 'send_message' approach? 
        // No, we need to open the window BEFORE sending.

        // Correct approach with current server code:
        // Client emits 'join_conversation' with ID.
        // Client emits 'send_message' with recipientId? (Supported in server/socket.js line 67).
        // Yes! `if (recipientId) ... find or create`.

        // So we can set `activeConversation` to a special object that has `recipientId` distinct from `_id`.
        // I need to update ChatContext type or just hack it.
        // Let's hack it: `_id` is empty string?

        const friend = friends.find(f => f._id === friendId);

        const tempConvWithRecipient = {
            _id: '', // Empty ID signals "New/Pending"
            participants: [authUser?._id!, friendId],
            updatedAt: new Date().toISOString(),
            // We attach a custom property for the UI to know who we are talking to
            // But Typescript will yell.
            // We can just rely on `participants`.
        } as Conversation;

        // We need to modify ChatWindow to handle `_id === ''`
        // It should SKIP joining room (or join user room?).
        // And when sending, send `recipientId`.

        setActiveConversation(tempConvWithRecipient);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-3 border-b bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Messages</h3>
                    {/* <button onClick={onNewChat} ... /> Removed New Chat button as per plan */}
                </div>
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-sm text-black border rounded-full focus:outline-none focus:border-orange-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-400">Loading...</div>
                ) : searchTerm ? (
                    // SEARCH RESULTS VIEW
                    searchResults.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No friends found matching "{searchTerm}"
                        </div>
                    ) : (
                        searchResults.map((result, idx) => {
                            if (result.type === 'conversation') {
                                return (
                                    <div
                                        key={'conv-' + result.data._id}
                                        onClick={() => setActiveConversation(result.data)}
                                        className="p-3 border-b hover:bg-orange-50 cursor-pointer transition-colors bg-white"
                                    >
                                        <div className="font-semibold text-sm text-gray-800">
                                            {result.data.friendDetails.username}
                                        </div>
                                        <div className="text-xs text-green-600 mt-1">
                                            Existing Conversation
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div
                                        key={'friend-' + result.data._id}
                                        onClick={() => startChatWithFriend(result.data._id)}
                                        className="p-3 border-b hover:bg-orange-50 cursor-pointer transition-colors bg-white"
                                    >
                                        <div className="font-semibold text-sm text-gray-800">
                                            {result.data.username}
                                        </div>
                                        <div className="text-xs text-blue-600 mt-1">
                                            Start New Chat
                                        </div>
                                    </div>
                                );
                            }
                        })
                    )
                ) : (
                    // NORMAL LIST VIEW
                    conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                            No conversations yet.<br />Search for a friend to start chatting!
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherId = getOtherParticipantId(conv);
                            const details = getParticipantDetails(otherId);
                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => setActiveConversation(conv)}
                                    className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="font-semibold text-sm text-gray-800">
                                        {details.username}
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div className="text-xs text-gray-500 truncate mt-1">
                                            {conv.lastMessage?.text || 'No messages'}
                                        </div>
                                        {conv.unreadCount && conv.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 ml-2">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
}
