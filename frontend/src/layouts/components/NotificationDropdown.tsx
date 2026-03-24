import { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@/services/book.service';
import type { NotificationItem } from '@/types';
import useNotification from '@/hooks/userNotification';

interface NotificationDropdownProps {
    variant?: 'light' | 'dark';
}

const NotificationDropdown = ({ variant = 'dark' }: NotificationDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [showAll, setShowAll] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();

    // Fetch notifications (both read and unread)
    const fetchNotifications = async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            // Fetch all notifications (both read and unread)
            const data = await notificationService.getNotifications('all', pageNum, 20);

            if (append) {
                setNotifications(prev => [...prev, ...data.notifications]);
            } else {
                setNotifications(data.notifications);
            }

            // Check if there are more notifications
            setHasMore(data.pagination.page < data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Fetch on mount and when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setPage(1);
            setShowAll(false);
            fetchNotifications(1, false);
        } else {
            // Reset when closing dropdown
            setShowAll(false);
            setPage(1);
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle notification click
    const handleNotificationClick = async (notification: NotificationItem) => {
        try {
            // Only mark as read if it's currently unread
            if (notification.status === 'unread') {
                await notificationService.markAsRead(notification._id);

                // Update notification status in state (don't remove it)
                setNotifications(prev =>
                    prev.map(n =>
                        n._id === notification._id
                            ? { ...n, status: 'read' as const }
                            : n
                    )
                );
            }

            // Extract bookId from notification (check both direct bookId and data.bookId)
            // This ensures it works for all roles (Admin, Librarian, Reader)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const notificationData = (notification as any).data;
            const bookId = notification.bookId ||
                notificationData?.bookId ||
                notificationData?.book?._id ||
                notificationData?.book?.id;

            // Navigate based on notification type
            // For notifications with bookId (favorites, reports, etc.), navigate to book page
            if (bookId) {
                navigate(`/books/${bookId}`);
            } else if (notification.type === 'borrow-reminder') {
                navigate('/my-borrows');
            } else if (notification.type === 'reservation-ready') {
                navigate('/my-reservations');
            } else if (notification.type === 'membership-expiring') {
                navigate('/profile');
            }

            // Close dropdown
            setIsOpen(false);

            if (notification.status === 'unread') {
                showSuccess('Đã đánh dấu đã đọc');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            showError('Không thể đánh dấu đã đọc');
        }
    };

    // Handle clear all notifications (mark all as read, but keep them visible)
    const handleClearAll = async () => {
        try {
            // Mark all as read with new API
            await notificationService.markAllAsRead();

            // Update all notifications status to 'read' in state (don't remove them)
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'read' as const }))
            );

            showSuccess('Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            showError('Không thể đánh dấu thông báo');
        }
    };

    // Count only unread notifications for badge
    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    // Get icon based on notification type
    const getNotificationIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'favorite-available':
                return <BookOpen size={20} className="text-white" />;
            case 'borrow-reminder':
                return <Clock size={20} className="text-white" />;
            case 'reservation-ready':
                return <CheckCircle size={20} className="text-white" />;
            case 'membership-expiring':
                return <AlertCircle size={20} className="text-white" />;
            default:
                return <Bell size={20} className="text-white" />;
        }
    };

    // Get color based on notification type
    const getNotificationColor = (type: NotificationItem['type']) => {
        switch (type) {
            case 'favorite-available':
                return 'from-green-400 to-emerald-500';
            case 'borrow-reminder':
                return 'from-orange-400 to-red-500';
            case 'reservation-ready':
                return 'from-blue-400 to-cyan-500';
            case 'membership-expiring':
                return 'from-yellow-400 to-amber-500';
            default:
                return 'from-gray-400 to-gray-500';
        }
    };

    // Get status badge
    const getStatusBadge = (type: NotificationItem['type']) => {
        switch (type) {
            case 'favorite-available':
                return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Có sẵn</span>;
            case 'borrow-reminder':
                return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Sắp hết hạn</span>;
            case 'reservation-ready':
                return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Sẵn sàng</span>;
            case 'membership-expiring':
                return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Thông báo</span>;
            default:
                return null;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative bg-transparent border-none cursor-pointer flex flex-col items-center gap-1 hover:scale-105 transition-transform ${variant === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-white'
                    }`}
            >
                <div className="relative">
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                <span className="text-sm">Thông Báo</span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-2xl w-[380px] max-h-[500px] overflow-hidden z-50 border border-gray-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Thông báo</h3>
                                {unreadCount > 0 ? (
                                    <p className="text-sm text-gray-600">
                                        {unreadCount} thông báo mới
                                    </p>
                                ) : notifications.length > 0 ? (
                                    <p className="text-sm text-gray-600">
                                        Tất cả thông báo đã được đọc
                                    </p>
                                ) : null}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Đang tải...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={48} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Không có thông báo mới</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Thông báo về sách, mượn trả, đặt chỗ và thành viên sẽ xuất hiện ở đây
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => {
                                    const formatted = notificationService.formatNotification(notification);

                                    const isRead = notification.status === 'read';

                                    return (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 cursor-pointer transition-all group ${isRead ? 'opacity-75' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon - Dynamic based on type */}
                                                <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getNotificationColor(notification.type)} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className={`text-sm font-semibold ${isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                                                            {formatted.title}
                                                        </p>
                                                        {isRead && (
                                                            <span className="text-xs text-gray-400">(Đã đọc)</span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm line-clamp-2 mb-2 ${isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                                                        {formatted.message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500">
                                                            {formatted.timeAgo}
                                                        </span>
                                                        {getStatusBadge(notification.type)}
                                                    </div>
                                                </div>

                                                {/* Close button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNotificationClick(notification);
                                                    }}
                                                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-2">
                            {/* View All / Load More Button */}
                            {!showAll ? (
                                <button
                                    onClick={async () => {
                                        try {
                                            // Mark all unread notifications as read
                                            const unreadNotifications = notifications.filter(n => n.status === 'unread');
                                            if (unreadNotifications.length > 0) {
                                                await notificationService.markAllAsRead();
                                                // Update all notifications status to 'read' in state
                                                setNotifications(prev =>
                                                    prev.map(n => ({ ...n, status: 'read' as const }))
                                                );
                                            }
                                            // Load more notifications
                                            setShowAll(true);
                                            if (hasMore) {
                                                const nextPage = page + 1;
                                                setPage(nextPage);
                                                await fetchNotifications(nextPage, true);
                                            }
                                        } catch (error) {
                                            console.error('Error loading all notifications:', error);
                                            showError('Không thể tải thông báo');
                                        }
                                    }}
                                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors py-2"
                                >
                                    Xem tất cả thông báo →
                                </button>
                            ) : hasMore ? (
                                <button
                                    onClick={async () => {
                                        try {
                                            setLoadingMore(true);
                                            const nextPage = page + 1;
                                            setPage(nextPage);
                                            await fetchNotifications(nextPage, true);
                                        } catch (error) {
                                            console.error('Error loading more notifications:', error);
                                            showError('Không thể tải thêm thông báo');
                                        } finally {
                                            setLoadingMore(false);
                                        }
                                    }}
                                    disabled={loadingMore}
                                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-2"
                                >
                                    {loadingMore ? 'Đang tải...' : 'Tải thêm thông báo'}
                                </button>
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-2">
                                    Đã hiển thị tất cả thông báo
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;