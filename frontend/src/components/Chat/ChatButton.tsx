import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessage, getConversations, getConversationMessages, markConversationAsRead } from '../../services/message.api';

interface Message {
    _id: string;
    content: string;
    senderId: {
        _id: string;
        fullName: string;
    };
    receiverId: string | null;
    conversationId: string;
    senderRole: string;
    createdAt: string;
    isRead: boolean;
}

interface Conversation {
    conversationId: string;
    lastMessage?: {
        _id: string;
        senderId: {
            _id: string;
            fullName: string;
        };
        content: string;
        createdAt: string;
        isRead: boolean;
    };
    unreadCount: number;
    participant: {
        role: string;
        name: string;
    };
}

const ChatButton = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user, token } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations when chat opens
    useEffect(() => {
        if (isOpen && user && token) {
            fetchConversations(true); // Auto-select when opening chat
        }
    }, [isOpen, user, token]);

    // Fetch messages when conversation is selected
    useEffect(() => {
        if (selectedConversation && token) {
            fetchMessages(selectedConversation.conversationId);
        }
    }, [selectedConversation, token]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages every 5 seconds when chat is open
    useEffect(() => {
        if (!isOpen || !user || !token) return;

        const interval = setInterval(() => {
            fetchConversations(false); // Don't auto-select during polling
            if (selectedConversation) {
                fetchMessages(selectedConversation.conversationId);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, user, token, selectedConversation]);

    // Poll for unread messages even when chat is closed
    useEffect(() => {
        if (!user || !token || isOpen) return; // Don't poll if chat is open (handled by other useEffect)

        const interval = setInterval(() => {
            fetchConversations(false); // Don't auto-select when chat is closed
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [user, token, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async (shouldAutoSelect = false) => {
        try {
            const response = await getConversations(token || undefined);
            const convs = response.data.conversations || [];

            // Use setState callback to preserve unreadCount=0 for active conversation
            setConversations(() => {
                const updated = convs.map((conv: Conversation) => {
                    // If this is the currently selected conversation, keep unreadCount=0
                    if (selectedConversation && conv.conversationId === selectedConversation.conversationId) {
                        return { ...conv, unreadCount: 0 };
                    }
                    return conv;
                });

                // Calculate total unread count from updated list
                const totalUnread = updated.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
                setUnreadCount(totalUnread);

                return updated;
            });

            // Auto-select first conversation ONLY when requested and no conversation selected
            if (shouldAutoSelect && !selectedConversation) {
                if (convs.length > 0) {
                    setSelectedConversation(convs[0]);
                } else if (user?.role?.toLowerCase() === 'reader') {
                    // Create default conversation with librarian for new users
                    const defaultConv: Conversation = {
                        conversationId: `${user.id}_all`,
                        unreadCount: 0,
                        participant: {
                            role: 'Librarian',
                            name: 'Thủ thư'
                        }
                    };
                    setSelectedConversation(defaultConv);
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }; const fetchMessages = async (conversationId: string) => {
        try {
            setLoading(true);
            const response = await getConversationMessages(conversationId, token || undefined);
            setMessages(response.data.messages || []);

            // Mark conversation as read
            await markConversationAsRead(conversationId, token || undefined);

            // Refresh conversations to update unread count
            await fetchConversations();
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || sending) return;

        try {
            setSending(true);

            // Get receiverId from conversation for librarian
            let receiverId: string | undefined;
            if (user?.role === 'Librarian' && selectedConversation) {
                // Extract readerId from conversationId (format: readerId_all)
                receiverId = selectedConversation.conversationId.split('_')[0];
            }

            const response = await sendMessage(message, token || undefined, receiverId);

            // Add new message to the list
            if (response.data.message) {
                setMessages([...messages, response.data.message]);
            }

            setMessage('');

            // Refresh conversations to update last message
            await fetchConversations();
        } catch (error: unknown) {
            console.error('Error sending message:', error);
            const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại!';
            alert(errorMsg);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleOpenFullScreen = () => {
        setIsOpen(false);
        setSelectedConversation(null); // Reset selection when navigating away
        navigate('/chat');
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setSelectedConversation(null); // Reset selection when opening
                    }}
                    className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-800 transition-all duration-300 z-50 flex items-center justify-center group"
                    aria-label="Mở chat với thủ thư"
                >
                    <MessageCircle size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    {/* Tooltip */}
                    <span className="absolute right-full mr-3 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Chat với thủ thư
                    </span>
                </button>
            )}

            {/* Chat Box */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[480px] h-[700px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                                {selectedConversation?.participant?.role === 'Librarian' ? 'T' : (selectedConversation?.participant?.name?.charAt(0).toUpperCase() || 'T')}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 text-base">
                                    Tin nhắn
                                </h3>
                                <p className="text-sm text-gray-500">{conversations.length} cuộc trò chuyện</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setSelectedConversation(null); // Reset selection when closing
                            }}
                            className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
                            aria-label="Đóng chat"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>

                    {selectedConversation ? (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
                                {loading && messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageCircle size={48} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-600 text-sm mb-4">Chưa có tin nhắn</p>
                                        <p className="text-xs text-gray-500 mb-3">Gợi ý câu hỏi:</p>
                                        <div className="space-y-2 px-4">
                                            {[
                                                'Làm thế nào để mượn sách?',
                                                'Thời gian mở cửa thư viện?',
                                                'Cách gia hạn sách đã mượn?',
                                                'Tôi cần hỗ trợ tìm sách'
                                            ].map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setMessage(suggestion)}
                                                    className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors text-xs text-gray-700"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        // If user is Librarian, all Librarian messages are on the right
                                        // If user is Reader, only their own messages are on the right
                                        const isOwnMessage = user?.role === 'Librarian'
                                            ? msg.senderRole === 'Librarian'
                                            : msg.senderId._id === user?.id;
                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                    {!isOwnMessage && (
                                                        <span className="text-xs text-gray-500 mb-1 px-1">
                                                            {msg.senderId.fullName}
                                                        </span>
                                                    )}
                                                    <div
                                                        className={`rounded-2xl px-4 py-2.5 ${isOwnMessage
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-white border border-gray-200 text-gray-800'
                                                            }`}
                                                    >
                                                        <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 mt-1 px-1">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
                                {user ? (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors flex-shrink-0"
                                            title="Quay lại danh sách"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Nhập tin nhắn..."
                                            rows={1}
                                            disabled={sending}
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!message.trim() || sending || (user?.role === 'Librarian' && !selectedConversation)}
                                            className="bg-gray-900 text-white p-3 rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                                            aria-label="Gửi tin nhắn"
                                        >
                                            {sending ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            ) : (
                                                <Send size={18} />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-2">
                                            Vui lòng đăng nhập để chat
                                        </p>
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors text-sm"
                                        >
                                            Đăng nhập
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Conversations List */
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {loading && conversations.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <MessageCircle size={48} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-600 text-sm">Chưa có cuộc trò chuyện</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {user?.role?.toLowerCase() === 'reader' ? 'Đang tải...' : 'Chờ người dùng gửi tin nhắn'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.conversationId}
                                            onClick={async () => {
                                                setSelectedConversation(conv);

                                                // Mark as read immediately
                                                try {
                                                    await markConversationAsRead(conv.conversationId, token || undefined);
                                                } catch (error) {
                                                    console.error('Error marking conversation as read:', error);
                                                }

                                                // Update unreadCount using callback to avoid stale state
                                                setConversations(prev => {
                                                    const updated = prev.map(c =>
                                                        c.conversationId === conv.conversationId
                                                            ? { ...c, unreadCount: 0 }
                                                            : c
                                                    );

                                                    // Recalculate total unread count from updated list
                                                    const totalUnread = updated.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0);
                                                    setUnreadCount(totalUnread);

                                                    return updated;
                                                });
                                            }}
                                            className="w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                        >

                                            <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium flex-shrink-0 text-sm">
                                                {conv.participant.role === 'Librarian' ? 'T' : conv.participant.name.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-baseline justify-between mb-1">
                                                    <h3 className="font-medium text-gray-900 text-sm truncate">
                                                        {conv.participant.role === 'Librarian' ? 'Thủ thư' : conv.participant.name}
                                                    </h3>
                                                    {conv.lastMessage && (
                                                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                                            {formatTime(conv.lastMessage.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleOpenFullScreen}
                                        className="w-full py-4 text-center text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-200 transition-colors font-medium"
                                    >
                                        Mở toàn màn hình
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatButton;
