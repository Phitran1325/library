import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
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

const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations on mount
    useEffect(() => {
        if (user && token) {
            fetchConversations();
        }
    }, [user, token]);

    // Fetch messages when conversation is selected
    useEffect(() => {
        if (selectedConversation && token) {
            fetchMessages(selectedConversation.conversationId);
        }
    }, [selectedConversation, token]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
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
                return updated;
            });

            // Auto-select first conversation if exists and no conversation is currently selected
            if (!selectedConversation) {
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
        } finally {
            setLoading(false);
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
        if (!newMessage.trim() || sending) return;

        // Check if librarian has selected a conversation
        if (user?.role === 'Librarian' && !selectedConversation) {
            alert('Vui lòng chọn một cuộc trò chuyện để gửi tin nhắn!');
            return;
        }

        try {
            setSending(true);

            // Get receiverId from conversation for librarian
            let receiverId: string | undefined;
            if (user?.role === 'Librarian' && selectedConversation) {
                // Extract readerId from conversationId (format: readerId_all)
                receiverId = selectedConversation.conversationId.split('_')[0];
            }

            const response = await sendMessage(newMessage, token || undefined, receiverId);

            // Add new message to the list
            if (response.data.message) {
                setMessages([...messages, response.data.message]);
            }

            setNewMessage('');

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

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Vui lòng đăng nhập
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Bạn cần đăng nhập để chat
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-white">
            {/* Sidebar */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">Tin nhắn</h1>
                    <p className="text-base text-gray-500 mt-1">{conversations.length} cuộc trò chuyện</p>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {loading && conversations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <MessageCircle size={64} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600 text-base">Chưa có cuộc trò chuyện nào</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {user?.role?.toLowerCase() === 'reader'
                                    ? 'Đang tải...'
                                    : 'Chờ người dùng gửi tin nhắn'}
                            </p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
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
                                        return updated;
                                    });
                                }}
                                className={`w-full px-6 py-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${selectedConversation?.conversationId === conv.conversationId
                                    ? 'bg-gray-50'
                                    : ''
                                    }`}
                            >
                                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-lg flex-shrink-0 mt-0.5">
                                    {conv.participant.role === 'Librarian' ? 'T' : conv.participant.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-baseline justify-between mb-1.5">
                                        <h3 className="font-medium text-gray-900 text-base truncate">
                                            {conv.participant.role === 'Librarian' ? 'Thủ thư' : conv.participant.name}
                                        </h3>
                                        {conv.lastMessage && (
                                            <span className="text-sm text-gray-400 ml-2 flex-shrink-0">
                                                {formatTime(conv.lastMessage.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-base text-gray-500 truncate">
                                            {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 px-8 py-5">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-lg">
                                    {selectedConversation.participant.role === 'Librarian' ? 'T' : selectedConversation.participant.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-medium text-gray-900 text-lg">
                                        {selectedConversation.participant.role === 'Librarian' ? 'Thủ thư' : selectedConversation.participant.name}
                                    </h2>
                                    <p className="text-base text-gray-500">
                                        {selectedConversation.participant.role === 'Reader' ? 'Người dùng' : 'Thủ thư'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
                            <div className="max-w-4xl mx-auto space-y-5">
                                {loading && messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 text-lg mb-6">Chưa có tin nhắn nào</p>
                                        <p className="text-sm text-gray-500 mb-4">Gợi ý câu hỏi để bắt đầu:</p>
                                        <div className="space-y-3 max-w-md mx-auto">
                                            {[
                                                'Làm thế nào để mượn sách?',
                                                'Thời gian mở cửa của thư viện là khi nào?',
                                                'Làm cách nào để gia hạn sách đã mượn?',
                                                'Tôi muốn tìm sách về chủ đề...',
                                                'Cách đăng ký thẻ thành viên?'
                                            ].map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setNewMessage(suggestion)}
                                                    className="w-full text-left px-5 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors text-sm text-gray-700"
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
                                                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                                    {!isOwnMessage && (
                                                        <span className="text-sm text-gray-500 mb-1.5 px-1">
                                                            {msg.senderId.fullName}
                                                        </span>
                                                    )}
                                                    <div
                                                        className={`rounded-2xl px-5 py-3.5 ${isOwnMessage
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-white border border-gray-200 text-gray-900'
                                                            }`}
                                                    >
                                                        <p className="text-base leading-relaxed break-words">
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm text-gray-400 mt-1.5 px-1">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input */}
                        <div className="bg-white border-t border-gray-200 px-8 py-5">
                            <div className="max-w-4xl mx-auto flex items-end space-x-3">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={
                                        user?.role === 'Librarian' && !selectedConversation
                                            ? 'Chọn cuộc trò chuyện để gửi tin nhắn...'
                                            : 'Nhập tin nhắn...'
                                    }
                                    rows={1}
                                    className="flex-1 px-5 py-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-base"
                                    disabled={sending || (user?.role === 'Librarian' && !selectedConversation)}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sending || (user?.role === 'Librarian' && !selectedConversation)}
                                    className="bg-gray-900 text-white p-4 rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    ) : (
                                        <Send size={22} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">
                                Chọn một cuộc trò chuyện
                            </h3>
                            <p className="text-base text-gray-500">
                                Chọn cuộc trò chuyện để bắt đầu nhắn tin
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
