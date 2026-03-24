import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { debtPaymentService } from '@/services/debtPayment.api';
import type { DebtPayment, Pagination } from '@/types';

type FilterStatus = '' | 'Pending' | 'Approved' | 'Rejected';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const DebtPaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('Pending');
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | null;
    payment: DebtPayment | null;
  }>({ type: null, payment: null });
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      const id = toastIdCounter;
      setToastIdCounter((prev) => prev + 1);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [toastIdCounter]
  );

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await debtPaymentService.getPendingPayments(
        pagination.page,
        pagination.limit,
        statusFilter || undefined
      );
      setPayments(data.requests);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      showToast('error', error.message || 'Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, showToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleStatusFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openActionModal = (payment: DebtPayment, type: 'approve' | 'reject') => {
    setActionModal({ type, payment });
    setActionNotes('');
  };

  const closeActionModal = () => {
    setActionModal({ type: null, payment: null });
    setActionNotes('');
    setActionLoading(false);
  };

  const handleApprove = async () => {
    if (!actionModal.payment) return;
    setActionLoading(true);
    try {
      await debtPaymentService.approvePayment(actionModal.payment._id, actionNotes || undefined);
      showToast('success', 'Đã duyệt thanh toán thành công!');
      closeActionModal();
      await fetchPayments();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      showToast('error', error.message || 'Không thể duyệt thanh toán');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal.payment || !actionNotes.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(true);
    try {
      await debtPaymentService.rejectPayment(actionModal.payment._id, actionNotes);
      showToast('success', 'Đã từ chối yêu cầu thanh toán!');
      closeActionModal();
      await fetchPayments();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      showToast('error', error.message || 'Không thể từ chối thanh toán');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = React.useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const term = searchTerm.trim().toLowerCase();
    return payments.filter(
      (p) =>
        p.user?.fullName?.toLowerCase().includes(term) ||
        p.user?.email?.toLowerCase().includes(term) ||
        p.user?.phoneNumber?.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  const stats = React.useMemo(() => {
    return {
      pending: payments.filter((p) => p.status === 'Pending').length,
      approved: payments.filter((p) => p.status === 'Approved').length,
      rejected: payments.filter((p) => p.status === 'Rejected').length,
      totalAmount: payments
        .filter((p) => p.status === 'Pending')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments]);

  const getStatusBadge = (status: string) => {
    const config = {
      Pending: {
        bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'Chờ duyệt',
      },
      Approved: {
        bg: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Đã duyệt',
      },
      Rejected: {
        bg: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Từ chối',
      },
    };
    const statusConfig = config[status as keyof typeof config] || config.Pending;
    const Icon = statusConfig.icon;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${statusConfig.bg}`}
      >
        <Icon size={14} className="mr-1.5" />
        {statusConfig.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Thanh Toán Phí Nợ</h1>
          <p className="text-sm text-gray-600 mt-1">Xét duyệt yêu cầu thanh toán phí phạt của độc giả</p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-lg">
              <Clock className="text-yellow-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Đã duyệt</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <CheckCircle className="text-green-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Từ chối</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-200 rounded-lg">
              <XCircle className="text-red-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Tổng tiền chờ</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <DollarSign className="text-blue-700" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as FilterStatus)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
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
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex flex-col items-center text-gray-400 space-y-3">
              <AlertCircle size={48} strokeWidth={1.5} />
              <p className="text-lg font-medium">Không có yêu cầu thanh toán nào</p>
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
                      Số tiền
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">
                      Nợ hiện tại
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
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                            {payment.user?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{payment.user?.fullName || 'N/A'}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Mail size={14} className="mr-1" />
                              {payment.user?.email || 'N/A'}
                            </div>
                            {payment.user?.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                                <Phone size={14} className="mr-1" />
                                {payment.user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-lg text-blue-600">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-600">
                            Trước: <span className="font-medium text-red-600">{formatCurrency(payment.debtBefore)}</span>
                          </div>
                          <div className="text-gray-600 mt-1">
                            Sau: <span className="font-medium text-green-600">{formatCurrency(payment.debtAfter || 0)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div>Tạo: {formatDate(payment.createdAt)}</div>
                          {payment.processedAt && (
                            <div className="mt-1">Xử lý: {formatDate(payment.processedAt)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {payment.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => openActionModal(payment, 'approve')}
                                className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium border border-emerald-200 min-w-[90px]"
                                title="Duyệt thanh toán"
                              >
                                <CheckCircle className="inline mr-1.5" size={16} />
                                Duyệt
                              </button>
                              <button
                                onClick={() => openActionModal(payment, 'reject')}
                                className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors text-sm font-medium border border-rose-200 min-w-[90px]"
                                title="Từ chối"
                              >
                                <XCircle className="inline mr-1.5" size={16} />
                                Từ chối
                              </button>
                            </>
                          )}
                          {payment.status !== 'Pending' && payment.processedBy && (
                            <div className="text-sm text-gray-500">
                              Bởi: {(payment.processedBy as any)?.fullName || 'N/A'}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!searchTerm.trim() && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Hiển thị{' '}
                    <span className="font-semibold">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    đến{' '}
                    <span className="font-semibold">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    trong tổng số <span className="font-semibold">{pagination.total}</span> bản ghi
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Trước
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                      Trang {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
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

      {/* Action Modal */}
      {actionModal.type && actionModal.payment && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={closeActionModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      actionModal.type === 'approve' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {actionModal.type === 'approve' ? (
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    ) : (
                      <XCircle className="text-red-600 w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {actionModal.type === 'approve' ? 'Duyệt thanh toán' : 'Từ chối thanh toán'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {actionModal.payment.user?.fullName || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeActionModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền thanh toán:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(actionModal.payment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nợ trước khi trả:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(actionModal.payment.debtBefore)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Nợ còn lại:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(
                        Math.max(0, actionModal.payment.debtBefore - actionModal.payment.amount)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {actionModal.type === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    Xác nhận đã nhận tiền mặt?
                  </p>
                  <p className="text-sm text-gray-600">
                    Sau khi duyệt, nợ của độc giả sẽ được giảm và quyền mượn sách có thể được mở khóa.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ghi chú {actionModal.type === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder={
                    actionModal.type === 'reject'
                      ? 'Nhập lý do từ chối (bắt buộc)...'
                      : 'Ghi chú thêm (tùy chọn)...'
                  }
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={actionModal.type === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading || (actionModal.type === 'reject' && !actionNotes.trim())}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                }`}
              >
                {actionLoading && <Loader2 className="animate-spin mr-2" size={18} />}
                {actionModal.type === 'approve' ? 'Duyệt thanh toán' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={`text-sm font-medium ${
                  toast.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebtPaymentManagement;
