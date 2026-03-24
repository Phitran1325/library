import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
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
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import {
  librarianMembershipService,
  type MembershipRequest,
  type MembershipRequestStatus,
} from '@/services/librarianMembership.api';
import type { Pagination } from '@/types';

type FilterStatus = '' | 'Pending' | 'Approved' | 'Rejected';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const LibrarianMembershipManagement: React.FC = () => {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
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
    request: MembershipRequest | null;
  }>({ type: null, request: null });
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
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

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await librarianMembershipService.getMembershipRequests(
        pagination.page,
        pagination.limit,
        statusFilter || undefined
      );
      setRequests(data.requests || []);
      setPagination(data.pagination);
    } catch (error: any) {
      showToast('error', error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!actionModal.request) return;

    setActionLoading(true);
    try {
      await librarianMembershipService.approveMembershipRequest(
        actionModal.request._id,
        actionNotes || undefined
      );
      showToast('success', 'Đã duyệt yêu cầu đăng ký thành viên thành công!');
      setActionModal({ type: null, request: null });
      setActionNotes('');
      fetchRequests();
    } catch (error: any) {
      showToast('error', error.message || 'Không thể duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal.request) return;

    if (!rejectionReason.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    try {
      await librarianMembershipService.rejectMembershipRequest(
        actionModal.request._id,
        rejectionReason,
        actionNotes || undefined
      );
      showToast('success', 'Đã từ chối yêu cầu đăng ký thành viên');
      setActionModal({ type: null, request: null });
      setActionNotes('');
      setRejectionReason('');
      fetchRequests();
    } catch (error: any) {
      showToast('error', error.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      req.user?.fullName?.toLowerCase().includes(term) ||
      req.user?.email?.toLowerCase().includes(term) ||
      req.plan?.name?.toLowerCase().includes(term)
    );
  });

  const stats = {
    pending: requests.filter((r) => r.status === 'Pending').length,
    approved: requests.filter((r) => r.status === 'Approved').length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
  };

  const getStatusBadge = (status: MembershipRequestStatus) => {
    const statusConfig = {
      Pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
      Approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      Rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản Lý Yêu Cầu Đăng Ký Thành Viên</h1>
            <p className="text-sm text-gray-500 mt-1">Phê duyệt hoặc từ chối yêu cầu đăng ký thành viên</p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Đã duyệt</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.approved}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Từ chối</p>
                <p className="text-3xl font-bold text-red-900 mt-2">{stats.rejected}</p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, gói thành viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as FilterStatus);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-500 mt-4">Không có yêu cầu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gói thành viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày yêu cầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{request.user?.fullName}</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Mail size={12} />
                            {request.user?.email}
                          </div>
                          {request.user?.phoneNumber && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Phone size={12} />
                              {request.user.phoneNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{request.plan?.name}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <DollarSign size={12} />
                            {request.plan?.price?.toLocaleString('vi-VN')}₫
                            <span>•</span>
                            <Calendar size={12} />
                            {request.plan?.duration} ngày
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {new Date(request.requestDate).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActionModal({ type: 'approve', request })}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 min-w-[80px]"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'reject', request })}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm rounded-lg hover:bg-rose-100 transition-colors border border-rose-200 min-w-[80px]"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                        {request.status === 'Approved' && request.processedBy && (
                          <div className="text-xs text-gray-500">
                            Duyệt bởi: {request.processedBy.fullName}
                          </div>
                        )}
                        {request.status === 'Rejected' && (
                          <div className="text-xs text-red-600">
                            {request.rejectionReason && <div>Lý do: {request.rejectionReason}</div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!searchTerm.trim() && pagination.total > 0 && pagination.pages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200">
            <div className="text-sm text-gray-600">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} yêu cầu
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.type && actionModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              {actionModal.type === 'approve' ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <XCircle className="text-red-600" size={24} />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {actionModal.type === 'approve' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Người dùng:</span>
                <span className="font-medium">{actionModal.request.user?.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gói:</span>
                <span className="font-medium">{actionModal.request.plan?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giá:</span>
                <span className="font-medium">{actionModal.request.plan?.price?.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {actionModal.type === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Thêm ghi chú..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModal({ type: null, request: null });
                  setActionNotes('');
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={actionModal.type === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Đang xử lý...
                  </>
                ) : actionModal.type === 'approve' ? (
                  'Xác nhận duyệt'
                ) : (
                  'Xác nhận từ chối'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slideIn ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibrarianMembershipManagement;
