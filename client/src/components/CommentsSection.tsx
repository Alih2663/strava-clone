import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Link from 'next/link';

interface Comment {
    _id: string;
    user: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    text: string;
    createdAt: string;
    parentComment?: string | null;
}

interface CommentsSectionProps {
    activityId: string;
}

export default function CommentsSection({ activityId }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [showAddComment, setShowAddComment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useAuth();
    const { socket } = useSocket(); // Added useSocket hook

    useEffect(() => {
        fetchComments(); // Removed '1' argument
    }, [activityId]);

    // New useEffect for socket events
    useEffect(() => {
        if (socket && activityId) {
            socket.on(`activity_${activityId}_comments`, (newComment: Comment) => {
                // Add the new comment (whether root or reply) to the beginning of the comments array.
                // The existing rendering logic (rootComments, getReplies) will correctly place it.
                setComments(prev => [newComment, ...prev]);
            });

            return () => {
                socket.off(`activity_${activityId}_comments`);
            };
        }
    }, [socket, activityId]);

    const fetchComments = async (pageNum: number = 1) => { // Added default value for pageNum
        try {
            const { data } = await api.get(`/activities/${activityId}/comments?page=${pageNum}&limit=10`);
            if (pageNum === 1) {
                setComments(data.comments);
            } else {
                setComments(prev => [...prev, ...data.comments]);
            }
            setTotalPages(data.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (page < totalPages) {
            fetchComments(page + 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault();
        const text = parentId ? replyText[parentId] : newComment;

        if (!text || !text.trim()) return;

        try {
            const { data } = await api.post(`/activities/${activityId}/comments`, {
                text,
                parentComment: parentId
            });

            setComments(prev => [data, ...prev]);

            if (parentId) {
                setReplyText({ ...replyText, [parentId]: '' });
                setReplyingTo(null);
            } else {
                setNewComment('');
                setShowAddComment(false);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Organize comments into threads
    const rootComments = comments.filter(c => !c.parentComment);
    const getReplies = (parentId: string) => comments.filter(c => c.parentComment === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (loading && page === 1) return <div className="mt-6 text-gray-500">Loading comments...</div>;

    return (
        <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Comments</h2>
                {user && comments.length > 0 && !showAddComment && (
                    <button
                        onClick={() => setShowAddComment(true)}
                        className="text-orange-500 hover:text-orange-600 font-medium"
                    >
                        Add Comment
                    </button>
                )}
            </div>

            {user && showAddComment && (
                <form onSubmit={(e) => handleSubmit(e)} className="mb-6">
                    <textarea
                        className="w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Add a comment..."
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        {comments.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowAddComment(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
                            disabled={!newComment.trim()}
                        >
                            Post Comment
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {rootComments.length === 0 && !showAddComment ? (
                    <div className="text-center py-4">
                        <p className="text-gray-500 mb-2">No comments yet.</p>
                        {user && (
                            <button
                                onClick={() => setShowAddComment(true)}
                                className="text-orange-500 font-medium"
                            >
                                Be the first to share your thoughts!
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {rootComments.map((comment) => (
                            <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                                {/* Comment Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/profile/${comment.user._id}`} className="font-semibold text-gray-800 hover:text-orange-600 hover:underline">
                                            {comment.user.username}
                                        </Link>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Comment Body */}
                                <p className="text-gray-700 mb-3">{comment.text}</p>

                                {/* Reply Button */}
                                {user && (
                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                        className="text-sm text-gray-500 hover:text-orange-500 font-medium mb-2"
                                    >
                                        Reply
                                    </button>
                                )}

                                {/* Reply Form */}
                                {replyingTo === comment._id && (
                                    <form onSubmit={(e) => handleSubmit(e, comment._id)} className="mt-2 mb-4 ml-4">
                                        <textarea
                                            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                            placeholder={`Reply to ${comment.user.username}...`}
                                            rows={2}
                                            value={replyText[comment._id] || ''}
                                            onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                        />
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setReplyingTo(null)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-orange-500 text-white px-3 py-1 text-xs rounded hover:bg-orange-600"
                                                disabled={!replyText[comment._id]?.trim()}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Replies List */}
                                {getReplies(comment._id).length > 0 && (
                                    <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                                        {getReplies(comment._id).map((reply) => (
                                            <div key={reply._id}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link href={`/profile/${reply.user._id}`} className="font-semibold text-sm text-gray-800 hover:text-orange-600 hover:underline">
                                                        {reply.user.username}
                                                    </Link>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(reply.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{reply.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {page < totalPages && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={loadMore}
                                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium transition-colors"
                                >
                                    <span>Load more comments</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
