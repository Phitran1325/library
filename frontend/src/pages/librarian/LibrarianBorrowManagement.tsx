import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpenCheck,
  CheckCircle,
  Filter,
  Loader2,
  Mail,
  PackageX,
  RefreshCcw,
  RotateCcw,
  Search,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Borrow, Pagination } from '../../types';
import type { BorrowListFilters } from '../../services/librarianBorrow.api';
import {
  getBorrowRecords,
  markBorrowAsDamaged,
  markBorrowAsLost,
  returnBorrowRecord,
  sendBorrowReminder,
  approveBorrowRequest,
  rejectBorrowRequest,
} from '../../services/librarianBorrow.api';

type ActionType = 'return' | 'reminder' | 'lost' | 'damaged' | 'approve' | 'reject' | null;

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'ReturnRequested', label: 'Chờ trả sách' },
  { value: 'Borrowed', label: 'Đang mượn' },
  { value: 'Overdue', label: 'Quá hạn' },
  { value: 'Returned', label: 'Đã trả' },
  { value: 'Lost', label: 'Mất' },
  { value: 'Damaged', label: 'Hư hỏng' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'Rejected', label: 'Từ chối' },
];

const STATUS_STYLES: Record<
  Borrow['status'],
  { badge: string; dot: string; label: string }
> = {
  Pending: {
    badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    dot: 'bg-yellow-500',
    label: 'Chờ xác nhận',
  },
  ReturnRequested: {
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    dot: 'bg-purple-500',
    label: 'Chờ trả sách',
  },
  Borrowed: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    label: 'Đang mượn',
  },
  Overdue: {
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
    label: 'Quá hạn',
  },
  Returned: {
    badge: 'bg-green-50 text-green-700 border border-green-200',
    dot: 'bg-green-500',
    label: 'Đã trả',
  },
  Lost: {
    badge: 'bg-gray-100 text-gray-700 border border-gray-300',
    dot: 'bg-gray-500',
    label: 'Mất',
  },
  Damaged: {
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500',
    label: 'Hư hỏng',
  },
  Cancelled: {
    badge: 'bg-gray-100 text-gray-600 border border-gray-300',
    dot: 'bg-gray-400',
    label: 'Đã hủy',
  },
  Rejected: {
    badge: 'bg-red-50 text-red-600 border border-red-200',
    dot: 'bg-red-400',
    label: 'Từ chối',
  },
};

const ACTION_CONFIG: Record<
  Exclude<ActionType, null>,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    description: string;
  }
> = {
  return: {
    label: 'Xác nhận trả sách',
    icon: RotateCcw,
    color: 'text-green-600',
    description: 'Xác nhận độc giả đã trả sách về thư viện',
  },
  reminder: {
    label: 'Gửi nhắc nhở',
    icon: Bell,
    color: 'text-blue-600',
    description: 'Gửi email nhắc nhở độc giả về thời hạn trả sách',
  },
  lost: {
    label: 'Đánh dấu mất',
    icon: PackageX,
    color: 'text-gray-600',
    description: 'Đánh dấu sách bị mất và tính phí bồi thường',
  },
  damaged: {
    label: 'Đánh dấu hư hỏng',
    icon: AlertTriangle,
    color: 'text-orange-600',
    description: 'Ghi nhận sách bị hư hỏng và tính phí sửa chữa',
  },
  approve: {
    label: 'Chấp nhận yêu cầu',
    icon: CheckCircle2,
    color: 'text-green-600',
    description: 'Phê duyệt yêu cầu mượn sách của độc giả',
  },
  reject: {
    label: 'Từ chối yêu cầu',
    icon: XCircle,
    color: 'text-red-600',
    description: 'Từ chối yêu cầu mượn sách',
  },
};

const LibrarianBorrowManagement: React.FC = () => {
  const [filters, setFilters] = useState<BorrowListFilters>({
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [bookCondition, setBookCondition] = useState<'Good' | 'Damaged' | 'SeverelyDamaged'>('Good');
  const [damageLevel, setDamageLevel] = useState<'Damaged' | 'SeverelyDamaged'>('Damaged');
  const [actionState, setActionState] = useState<{
    type: ActionType;
    borrow: Borrow | null;
  }>({
    type: null,
    borrow: null,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = toastIdCounter;
    setToastIdCounter((prev) => prev + 1);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, [toastIdCounter]);

  const fetchBorrows = useCallback(async () => {
    setLoading(true);
    try {
      // Include search term in filters
      const filtersWithSearch = {
        ...filters,
        search: searchTerm || undefined
      };
      
      console.log('🔍 [LibrarianBorrowManagement] Fetching borrows with filters:', filtersWithSearch);
      const data = await getBorrowRecords(filtersWithSearch);
      console.log('✅ [LibrarianBorrowManagement] Received data from API');
      console.log('✅ [LibrarianBorrowManagement] Total borrows from API:', data.borrows.length);
      console.log('✅ [LibrarianBorrowManagement] Pagination from API:', data.pagination);

      // Check for borrows with null user/book
      const validBorrows = data.borrows.filter(b => b.user && b.book);
      const invalidBorrows = data.borrows.filter(b => !b.user || !b.book);
      console.log('✅ [LibrarianBorrowManagement] Valid borrows (with user & book):', validBorrows.length);
      console.log('⚠️ [LibrarianBorrowManagement] Invalid borrows (null user/book):', invalidBorrows.length);

      if (invalidBorrows.length > 0) {
        console.warn('⚠️ [LibrarianBorrowManagement] Invalid borrows will be filtered out:', invalidBorrows);
      }

      // Check for Rental borrows
      const rentalBorrows = data.borrows.filter(b => b.borrowType === 'Rental');
      console.log('🔍 [LibrarianBorrowManagement] Rental borrows found:', rentalBorrows.length);
      if (rentalBorrows.length > 0) {
        console.log('🔍 [LibrarianBorrowManagement] First rental borrow:', rentalBorrows[0]);
      }

      // Check for Pending borrows
      const pendingBorrows = data.borrows.filter(b => b.status === 'Pending');
      console.log('🔍 [LibrarianBorrowManagement] Pending borrows found:', pendingBorrows.length);
      if (pendingBorrows.length > 0) {
        console.log('🔍 [LibrarianBorrowManagement] First pending borrow:', pendingBorrows[0]);
      }

      // Warn if API returned fewer records than expected
      const expectedLimit = filters.limit || 10;
      if (data.borrows.length < expectedLimit && data.pagination.page < data.pagination.pages) {
        console.warn(`⚠️ [LibrarianBorrowManagement] Backend returned ${data.borrows.length} records instead of ${expectedLimit}. This may cause pagination issues.`);
      }

      setBorrows(data.borrows);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Error loading borrows:', error);
      showToast('error', error.message || 'Không thể tải danh sách mượn trả');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, showToast]);

  useEffect(() => {
    fetchBorrows();
  }, [fetchBorrows]);

  const handleFilterChange = (key: keyof BorrowListFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const openActionModal = (borrow: Borrow, type: Exclude<ActionType, null>) => {
    setActionState({ borrow, type });
    setActionNotes('');
    setBookCondition('Good');
    setDamageLevel('Damaged');
  };

  const closeActionModal = () => {
    setActionState({ type: null, borrow: null });
    setActionNotes('');
    setActionLoading(false);
  };

  const displayedBorrows = useMemo(() => {
    // Since we're doing server-side filtering now, just return valid borrows
    return borrows.filter((item) => item.book && item.user);
  }, [borrows]);

  const stats = useMemo(() => {
    const validBorrows = borrows.filter((b) => b.book && b.user);
    return {
      pending: validBorrows.filter((b) => b.status === 'Pending').length,
      returnRequested: validBorrows.filter((b) => b.status === 'ReturnRequested').length,
      borrowed: validBorrows.filter((b) => b.status === 'Borrowed').length,
      overdue: validBorrows.filter((b) => b.status === 'Overdue').length,
      returned: validBorrows.filter((b) => b.status === 'Returned').length,
    };
  }, [borrows]);

  const formatDate = (value?: string) => {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('vi-VN');
  };

  const remainingDays = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleActionSubmit = async () => {
    if (!actionState.borrow || !actionState.type) return;
    setActionLoading(true);
    try {
      let successMessage = '';
      switch (actionState.type) {
        case 'approve':
          await approveBorrowRequest(actionState.borrow._id);
          successMessage = 'Đã chấp nhận yêu cầu mượn sách thành công!';
          break;
        case 'reject':
          await rejectBorrowRequest(actionState.borrow._id, actionNotes || undefined);
          successMessage = 'Đã từ chối yêu cầu mượn sách!';
          break;
        case 'return':
          await returnBorrowRecord(actionState.borrow._id, {
            bookCondition,
            notes: actionNotes || undefined,
          });
          successMessage = 'Xác nhận trả sách thành công!';
          break;
        case 'reminder':
          await sendBorrowReminder(actionState.borrow._id, actionNotes || undefined);
          successMessage = 'Đã gửi email nhắc nhở tới độc giả!';
          break;
        case 'lost':
          await markBorrowAsLost(actionState.borrow._id, actionNotes || undefined);
          successMessage = 'Đã đánh dấu sách bị mất và tính phí bồi thường!';
          break;
        case 'damaged':
          await markBorrowAsDamaged(actionState.borrow._id, damageLevel, actionNotes || undefined);
          successMessage = 'Đã ghi nhận sách bị hư hỏng và tính phí!';
          break;
        default:
          break;
      }
      closeActionModal();
      showToast('success', successMessage);
      await fetchBorrows();
    } catch (error: any) {
      console.error('Action error:', error);
      showToast('error', error.message || 'Không thể thực hiện thao tác');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionModal = () => {
    if (!actionState.type || !actionState.borrow) return null;
    const config = ACTION_CONFIG[actionState.type];
    const Icon = config.icon;

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-in fade-in duration-200"
        onClick={closeActionModal}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${actionState.type === 'approve' ? 'bg-green-100' : actionState.type === 'reject' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  <Icon className={`${config.color} w-6 h-6`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                </div>
              </div>
              <button
                onClick={closeActionModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Book & User Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Sách</p>
                  <p className="text-sm font-medium text-gray-900">{actionState.borrow.book.title}</p>
                  <p className="text-xs text-gray-500">ISBN: {actionState.borrow.book.isbn}</p>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Độc giả</p>
                  <p className="text-sm font-medium text-gray-900">{actionState.borrow.user.fullName}</p>
                  <p className="text-xs text-gray-500">{actionState.borrow.user.email}</p>
                </div>
              </div>
            </div>

            {/* Return specific fields */}
            {actionState.type === 'return' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tình trạng sách khi trả <span className="text-red-500">*</span>
                </label>
                <select
                  value={bookCondition}
                  onChange={(e) =>
                    setBookCondition(e.target.value as 'Good' | 'Damaged' | 'SeverelyDamaged')
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="Good">✓ Tốt - Không có hư hỏng</option>
                  <option value="Damaged">⚠ Hư nhẹ - Có thể sửa chữa</option>
                  <option value="SeverelyDamaged">✕ Hư nặng - Không thể sử dụng</option>
                </select>
              </div>
            )}

            {/* Approve confirmation */}
            {actionState.type === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Xác nhận phê duyệt yêu cầu này?
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  Hệ thống sẽ tự động thực hiện:
                </p>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Chuyển trạng thái sang "Đang mượn"</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Tính toán ngày hẹn trả theo gói thành viên</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Giảm số lượng sách available</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Gửi email xác nhận cho độc giả</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Reject warning */}
            {actionState.type === 'reject' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 mb-1">
                  ⚠ Từ chối yêu cầu mượn sách
                </p>
                <p className="text-sm text-gray-600">
                  Yêu cầu sẽ bị hủy và độc giả sẽ nhận được thông báo qua email.
                </p>
              </div>
            )}

            {/* Damage level selector */}
            {actionState.type === 'damaged' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mức độ hư hỏng <span className="text-red-500">*</span>
                </label>
                <select
                  value={damageLevel}
                  onChange={(e) => setDamageLevel(e.target.value as 'Damaged' | 'SeverelyDamaged')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="Damaged">⚠ Hư nhẹ - Phí thấp</option>
                  <option value="SeverelyDamaged">✕ Hư nghiêm trọng - Phí cao</option>
                </select>
              </div>
            )}

            {/* Notes field */}
            {(actionState.type === 'reject' ||
              actionState.type === 'reminder' ||
              actionState.type === 'return' ||
              actionState.type === 'lost' ||
              actionState.type === 'damaged') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ghi chú {actionState.type === 'reject' && <span className="text-red-500">*</span>}
                  {(actionState.type === 'reminder' || actionState.type === 'return') && (
                    <span className="text-gray-400 text-xs ml-1">(tùy chọn)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder={
                    actionState.type === 'reject'
                      ? 'Nhập lý do từ chối (bắt buộc)...'
                      : actionState.type === 'reminder'
                      ? 'Nội dung nhắc nhở cho độc giả...'
                      : actionState.type === 'lost'
                      ? 'Ghi chú về sách bị mất...'
                      : actionState.type === 'damaged'
                      ? 'Mô tả chi tiết tình trạng hư hỏng...'
                      : 'Ghi chú thêm...'
                  }
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end space-x-3">
            <button
              onClick={closeActionModal}
              disabled={actionLoading}
              className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleActionSubmit}
              disabled={actionLoading || (actionState.type === 'reject' && !actionNotes.trim())}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                actionState.type === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionState.type === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {actionLoading && <Loader2 className="animate-spin mr-2" size={18} />}
              {actionState.type === 'approve' ? 'Chấp nhận' : actionState.type === 'reject' ? 'Từ chối' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderToasts = () => {
    return (
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : toast.type === 'error' ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Bell className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={`text-sm font-medium ${
                  toast.type === 'success'
                    ? 'text-green-900'
                    : toast.type === 'error'
                    ? 'text-red-900'
                    : 'text-blue-900'
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Mượn / Trả Sách</h1>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi trạng thái mượn trả, xử lý yêu cầu và gửi nhắc nhở cho độc giả
          </p>
        </div>
        <button
          onClick={fetchBorrows}
          disabled={loading}
          className="flex items-center px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Chờ xác nhận</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-lg">
              <Bell className="text-yellow-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Chờ trả sách</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.returnRequested}</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-lg">
              <RotateCcw className="text-purple-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Đang mượn</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.borrowed}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <BookOpenCheck className="text-blue-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Quá hạn</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-200 rounded-lg">
              <AlertTriangle className="text-red-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Đã trả</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.returned}</p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <CheckCircle className="text-green-700" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        {/* Row 1: Search */}
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên độc giả, email, tiêu đề sách hoặc ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Date Range & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Từ ngày:</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Đến ngày:</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {(filters.startDate || filters.endDate) && (
              <button
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    startDate: undefined,
                    endDate: undefined,
                    page: 1,
                  }));
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Status & Sort */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={`${filters.sort}-${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setFilters((prev) => ({
                  ...prev,
                  sort,
                  order: order as 'asc' | 'desc',
                  page: 1,
                }));
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="createdAt-desc">Yêu cầu mới nhất</option>
              <option value="createdAt-asc">Yêu cầu cũ nhất</option>
              <option value="borrowDate-desc">Ngày mượn mới nhất</option>
              <option value="borrowDate-asc">Ngày mượn cũ nhất</option>
              <option value="dueDate-asc">Sắp hết hạn</option>
              <option value="dueDate-desc">Hạn xa nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-flex flex-col items-center text-gray-500 space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : displayedBorrows.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex flex-col items-center text-gray-400 space-y-3">
              <BookOpenCheck size={48} strokeWidth={1.5} />
              <p className="text-lg font-medium">Không có phiếu mượn nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">
                      Độc giả
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">
                      Sách
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">
                      Thời gian
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">
                      Trạng thái
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedBorrows.map((borrow) => {
                    const statusStyle = STATUS_STYLES[borrow.status] || STATUS_STYLES['Pending'];
                    const days = remainingDays(borrow.dueDate);
                    const isPending = borrow.status === 'Pending';
                    const isReturnRequested = borrow.status === 'ReturnRequested';
                    const showReminder =
                      borrow.status === 'Borrowed' || borrow.status === 'Overdue';
                    const allowReturn = borrow.status === 'Borrowed' || borrow.status === 'Overdue' || borrow.status === 'ReturnRequested';
                    const allowDamage = borrow.status === 'Borrowed' || borrow.status === 'Overdue' || borrow.status === 'ReturnRequested';

                    return (
                      <tr key={borrow._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{borrow.user.fullName}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail size={14} className="mr-1.5" />
                            {borrow.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 max-w-xs truncate">
                            {borrow.book.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{borrow.book.isbn}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isPending ? (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600">
                                Yêu cầu: <span className="font-medium">{formatDate(borrow.createdAt)}</span>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Chờ xác nhận
                              </span>
                            </div>
                          ) : isReturnRequested ? (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600">
                                Mượn: <span className="font-medium">{formatDate(borrow.borrowDate)}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Hạn: <span className="font-medium">{formatDate(borrow.dueDate)}</span>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Yêu cầu trả
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600">
                                Mượn: <span className="font-medium">{formatDate(borrow.borrowDate)}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Hạn: <span className="font-medium">{formatDate(borrow.dueDate)}</span>
                              </div>
                              {borrow.status === 'Borrowed' && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    days < 0
                                      ? 'bg-red-100 text-red-800'
                                      : days <= 3
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {days < 0
                                    ? `Quá hạn ${Math.abs(days)} ngày`
                                    : `Còn ${days} ngày`}
                                </span>
                              )}
                              {borrow.status === 'Overdue' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Quá hạn {Math.abs(days)} ngày
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${statusStyle.badge}`}>
                              <span className={`w-2 h-2 rounded-full mr-2 ${statusStyle.dot}`}></span>
                              {statusStyle.label}
                            </span>
                            {(borrow.lateFee ?? 0) > 0 && (
                              <div className="text-xs font-medium text-red-600">
                                Phí trễ: {(borrow.lateFee ?? 0).toLocaleString('vi-VN')}₫
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => openActionModal(borrow, 'approve')}
                                  className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium shadow-sm hover:shadow"
                                  title="Chấp nhận yêu cầu"
                                >
                                  <CheckCircle2 className="inline mr-1.5" size={16} />
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => openActionModal(borrow, 'reject')}
                                  className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium shadow-sm hover:shadow"
                                  title="Từ chối yêu cầu"
                                >
                                  <XCircle className="inline mr-1.5" size={16} />
                                  Từ chối
                                </button>
                              </>
                            )}
                            {showReminder && (
                              <button
                                onClick={() => openActionModal(borrow, 'reminder')}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200"
                                title="Gửi nhắc nhở"
                              >
                                <Bell size={18} />
                              </button>
                            )}
                            {allowReturn && (
                              <button
                                onClick={() => openActionModal(borrow, 'return')}
                                className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors border border-green-200"
                                title="Xác nhận trả sách"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                            {allowDamage && (
                              <>
                                <button
                                  onClick={() => openActionModal(borrow, 'lost')}
                                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors border border-gray-300"
                                  title="Đánh dấu mất"
                                >
                                  <PackageX size={18} />
                                </button>
                                <button
                                  onClick={() => openActionModal(borrow, 'damaged')}
                                  className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors border border-orange-200"
                                  title="Đánh dấu hư hỏng"
                                >
                                  <AlertTriangle size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!searchTerm.trim() && pagination.total > 0 && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị{' '}
                    <span className="font-semibold text-gray-900">
                      {Math.max(1, (pagination.page - 1) * pagination.limit + 1)}
                    </span>{' '}
                    đến{' '}
                    <span className="font-semibold text-gray-900">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    trong tổng số <span className="font-semibold text-gray-900">{pagination.total}</span> bản ghi
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Trước
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.pages }, (_, index) => index + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.pages ||
                            Math.abs(page - pagination.page) <= 1
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handleFilterChange('page', page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pagination.page === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-white text-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>
                    <button
                      onClick={() => handleFilterChange('page', Math.min(pagination.pages, (filters.page || 1) + 1))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {renderActionModal()}

      {/* Toast Notifications */}
      {renderToasts()}
    </div>
  );
};

export default LibrarianBorrowManagement;
