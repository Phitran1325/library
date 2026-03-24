import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Mail,
  Send,
  User,
  BookOpen,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import axios from 'axios';
import { useNotification } from '@/components/common/Notification';
import { useConfirm } from '@/components/common/ConfirmDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

interface Reminder {
  _id: string;
  borrow: {
    _id: string;
    borrowDate: string;
    dueDate: string;
    status: string;
    book?: {
      _id: string;
      title: string;
      coverImage?: string;
      isbn?: string;
    };
  };
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  type: 'BEFORE_DUE' | 'OVERDUE' | 'MANUAL';
  status: 'PENDING' | 'SENT' | 'FAILED';
  scheduledDate: string;
  sentAt?: string;
  daysUntilDue?: number;
  daysOverdue?: number;
  emailSent: boolean;
  notificationSent: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface Statistics {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  byType: {
    BEFORE_DUE?: number;
    OVERDUE?: number;
    MANUAL?: number;
  };
}

const REMINDER_TYPE_CONFIG = {
  BEFORE_DUE: {
    label: 'Sắp đến hạn',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock size={16} />,
  },
  OVERDUE: {
    label: 'Quá hạn',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertCircle size={16} />,
  },
  MANUAL: {
    label: 'Thủ công',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Bell size={16} />,
  },
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ gửi',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Clock size={16} />,
  },
  SENT: {
    label: 'Đã gửi',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 size={16} />,
  },
  FAILED: {
    label: 'Thất bại',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle size={16} />,
  },
};

const LibrarianReminders: React.FC = () => {
  const { showNotification } = useNotification();
  const { confirm, ConfirmDialog } = useConfirm();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const token = localStorage.getItem('token');

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reminders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setStatistics(res.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      showNotification(error.response?.data?.message || 'Không thể tải thống kê', 'error');
    }
  };

  // Fetch reminders
  const fetchReminders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await axios.get(`${API_BASE_URL}/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.success) {
        setReminders(res.data.data.reminders || []);
        const pagination = res.data.data.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalItems(pagination.total || 0);
        }
      }
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      showNotification(error.response?.data?.message || 'Không thể tải danh sách nhắc nhở', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Send batch reminders
  const handleSendBatchReminders = async () => {
    setSending(true);
    try {
      // Lấy tất cả reminders PENDING để extract borrowIds
      const res = await axios.get(`${API_BASE_URL}/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'PENDING', limit: 50 }, // Giới hạn 50 theo backend
      });

      if (!res.data.success) {
        showNotification('Không thể tải danh sách nhắc nhở', 'error');
        return;
      }

      const pendingReminders = res.data.data.reminders || [];

      if (pendingReminders.length === 0) {
        showNotification('Không có nhắc nhở nào đang chờ gửi', 'warning');
        return;
      }

      // Extract borrowIds
      const borrowIds = pendingReminders
        .filter((r: Reminder) => r.borrow && r.borrow._id)
        .map((r: Reminder) => r.borrow._id);

      if (borrowIds.length === 0) {
        showNotification('Không tìm thấy borrow ID hợp lệ', 'error');
        return;
      }

      const confirmed = await confirm(
        'Gửi nhắc nhở hàng loạt',
        `Bạn có chắc muốn gửi ${borrowIds.length} nhắc nhở? Hệ thống sẽ gửi email đến người dùng có sách sắp đến hạn hoặc quá hạn.`
      );
      if (!confirmed) return;

      // Gửi batch reminders
      const batchRes = await axios.post(
        `${API_BASE_URL}/borrows/send-reminders/batch`,
        { borrowIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (batchRes.data.success) {
        const results = batchRes.data.data;
        const successCount = results?.success?.length || 0;
        const failedCount = results?.failed?.length || 0;

        showNotification(
          `Đã gửi ${successCount} nhắc nhở thành công${failedCount > 0 ? `, ${failedCount} thất bại` : ''}`,
          successCount > 0 ? 'success' : 'warning'
        );
        fetchReminders();
        fetchStatistics();
      }
    } catch (error: any) {
      console.error('Error sending batch reminders:', error);
      showNotification(
        error.response?.data?.message || 'Không thể gửi nhắc nhở',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate days overdue
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    fetchStatistics();
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhắc nhở</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gửi nhắc nhở đến người dùng về sách sắp đến hạn hoặc quá hạn
          </p>
        </div>
        <button
          onClick={handleSendBatchReminders}
          disabled={sending || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send size={18} />
              Gửi nhắc nhở hàng loạt
            </>
          )}
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
              </div>
              <Bell size={32} className="text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ gửi</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.pending}</p>
              </div>
              <Clock size={32} className="text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã gửi</p>
                <p className="text-2xl font-bold text-green-600">{statistics.sent}</p>
              </div>
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Thất bại</p>
                <p className="text-2xl font-bold text-red-600">{statistics.failed}</p>
              </div>
              <XCircle size={32} className="text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sắp hạn</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.byType.BEFORE_DUE || 0}</p>
              </div>
              <Clock size={32} className="text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quá hạn</p>
                <p className="text-2xl font-bold text-red-600">{statistics.byType.OVERDUE || 0}</p>
              </div>
              <AlertCircle size={32} className="text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Lọc:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ gửi</option>
            <option value="SENT">Đã gửi</option>
            <option value="FAILED">Thất bại</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả loại</option>
            <option value="BEFORE_DUE">Sắp đến hạn</option>
            <option value="OVERDUE">Quá hạn</option>
            <option value="MANUAL">Thủ công</option>
          </select>

          <button
            onClick={() => {
              setStatusFilter('all');
              setTypeFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Reminders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đến hạn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại nhắc nhở
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày lên lịch
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-blue-600" />
                      <span className="text-gray-600">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Bell size={48} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Không có nhắc nhở nào</p>
                  </td>
                </tr>
              ) : (
                reminders.map((reminder) => {
                  // Safe checks
                  if (!reminder.borrow || !reminder.user) {
                    return null;
                  }

                  const daysOverdue = reminder.borrow.dueDate ? getDaysOverdue(reminder.borrow.dueDate) : 0;
                  const typeConfig = REMINDER_TYPE_CONFIG[reminder.type];
                  const statusConfig = STATUS_CONFIG[reminder.status];

                  const userName = reminder.user.fullName || 'N/A';
                  const userEmail = reminder.user.email || 'N/A';
                  const bookTitle = reminder.borrow.book?.title || 'N/A';
                  const bookCoverImage = reminder.borrow.book?.coverImage;
                  const dueDate = reminder.borrow.dueDate;

                  return (
                    <tr key={reminder._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail size={14} />
                              {userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {bookCoverImage ? (
                            <img
                              src={bookCoverImage}
                              alt={bookTitle}
                              className="h-12 w-8 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-8 bg-gray-200 rounded flex items-center justify-center">
                              <BookOpen size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bookTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                        {daysOverdue > 0 && dueDate && (
                          <div className="text-xs text-red-600 font-medium">
                            Quá hạn {daysOverdue} ngày
                          </div>
                        )}
                        {daysOverdue < 0 && dueDate && (
                          <div className="text-xs text-gray-500">
                            Còn {Math.abs(daysOverdue)} ngày
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig.className}`}
                        >
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {reminder.status === 'FAILED' && reminder.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">
                            {reminder.errorMessage}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reminder.scheduledDate ? formatDate(reminder.scheduledDate) : '—'}
                        {reminder.sentAt && (
                          <div className="text-xs text-green-600">
                            Đã gửi: {formatDate(reminder.sentAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Hiển thị {reminders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} nhắc
              nhở
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹‹
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ››
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default LibrarianReminders;
