import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  FileText,
  CheckCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { useNotification } from '@/components/common/Notification';
import { useConfirm } from '@/components/common/ConfirmDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type ReservationStatus = 'Pending' | 'Assigned' | 'Fulfilled' | 'Cancelled' | 'Expired' | 'Rejected';

interface Reservation {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  book?: {
    _id: string;
    title: string;
    coverImage?: string;
    isbn?: string;
    available?: number;
  };
  status: ReservationStatus;
  expiresAt?: string;
  assignedAt?: string;
  fulfilledAt?: string;
  rejectionReason?: string;
  rejectedBy?: {
    _id: string;
    fullName: string;
  };
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
}

const LibrarianReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { showNotification } = useNotification();
  const { confirm, ConfirmDialog } = useConfirm();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [reservations, statusFilter, searchQuery]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.reservations || [];
      setReservations(data);
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Không thể tải danh sách đặt trước',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Filter by search query (user name, book title, email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.user?.fullName?.toLowerCase().includes(query) ||
          r.user?.email?.toLowerCase().includes(query) ||
          r.book?.title?.toLowerCase().includes(query) ||
          (r.book?.isbn && r.book.isbn.toLowerCase().includes(query))
      );
    }

    setFilteredReservations(filtered);
  };

  const handleApprove = async (reservationId: string) => {
    const reservation = reservations.find((r) => r._id === reservationId);
    if (!reservation || !reservation.user || !reservation.book) return;

    const bookAvailable = reservation.book.available || 0;
    const message =
      bookAvailable > 0
        ? `Duyệt đặt trước cho "${reservation.user.fullName}"? Sách hiện có sẵn ${bookAvailable} bản, sẽ giữ trong 3 ngày.`
        : `Duyệt đặt trước cho "${reservation.user.fullName}"? Sách hiện không có sẵn, sẽ thêm vào hàng chờ.`;

    const confirmed = await confirm('Xác nhận duyệt', message);
    if (!confirmed) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/reservations/${reservationId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data) {
        const updatedReservation = res.data.reservation;
        const newStatus = updatedReservation.status;

        if (newStatus === 'Assigned') {
          showNotification(
            `Đã duyệt và gán sách cho ${reservation.user.fullName}. Giữ trong 3 ngày.`,
            'success'
          );
        } else {
          showNotification(
            `Đã duyệt đặt trước. Sách chưa có sẵn, đã thêm vào hàng chờ.`,
            'success'
          );
        }

        fetchReservations();
      }
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Không thể duyệt đặt trước',
        'error'
      );
    }
  };

  const handleReject = async (reservationId: string) => {
    const reservation = reservations.find((r) => r._id === reservationId);
    if (!reservation || !reservation.user) return;

    // Prompt for rejection reason
    const reason = prompt(`Nhập lý do từ chối đặt trước của "${reservation.user.fullName}":`);
    if (!reason || reason.trim().length === 0) {
      showNotification('Vui lòng nhập lý do từ chối', 'warning');
      return;
    }

    if (reason.length > 300) {
      showNotification('Lý do từ chối không được vượt quá 300 ký tự', 'warning');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/reservations/${reservationId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification(
        `Đã từ chối đặt trước của ${reservation.user.fullName}`,
        'success'
      );
      fetchReservations();
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Không thể từ chối đặt trước',
        'error'
      );
    }
  };

  const handleFulfill = async (reservationId: string) => {
    const reservation = reservations.find((r) => r._id === reservationId);
    if (!reservation || !reservation.user || !reservation.book) return;

    // Kiểm tra sách còn sẵn
    if (reservation.book.available !== undefined && reservation.book.available <= 0) {
      showNotification('Sách không còn sẵn để mượn. Vui lòng kiểm tra lại.', 'error');
      return;
    }

    const confirmed = await confirm(
      'Xác nhận hoàn thành',
      `Người dùng "${reservation.user.fullName}" đã đến lấy sách "${reservation.book.title}"? Hệ thống sẽ tự động tạo phiếu mượn.`
    );
    if (!confirmed) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/reservations/${reservationId}/fulfill`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data) {
        showNotification(
          `Đã hoàn thành đặt trước. Phiếu mượn đã được tạo.`,
          'success'
        );
        fetchReservations();
      }
    } catch (error: any) {
      console.error('[handleFulfill] Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể hoàn thành đặt trước';
      showNotification(errorMessage, 'error');
    }
  };

  const handleCancel = async (reservationId: string) => {
    const reservation = reservations.find((r) => r._id === reservationId);
    if (!reservation || !reservation.user) return;

    const confirmed = await confirm(
      'Xác nhận hủy',
      `Bạn có chắc muốn hủy đặt trước của "${reservation.user.fullName}"?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/reservations/${reservationId}/cancel-by-librarian`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('Đã hủy đặt trước', 'success');
      fetchReservations();
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Không thể hủy đặt trước',
        'error'
      );
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const statusConfig: Record<
      ReservationStatus,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      Pending: {
        label: 'Chờ duyệt',
        color: 'bg-amber-50 text-amber-700 border border-amber-200',
        icon: <Clock className="w-3 h-3" />,
      },
      Assigned: {
        label: 'Đã gán',
        color: 'bg-sky-50 text-sky-700 border border-sky-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      Fulfilled: {
        label: 'Hoàn thành',
        color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        icon: <CheckCheck className="w-3 h-3" />,
      },
      Cancelled: {
        label: 'Đã hủy',
        color: 'bg-slate-50 text-slate-700 border border-slate-200',
        icon: <XCircle className="w-3 h-3" />,
      },
      Expired: {
        label: 'Hết hạn',
        color: 'bg-rose-50 text-rose-700 border border-rose-200',
        icon: <AlertCircle className="w-3 h-3" />,
      },
      Rejected: {
        label: 'Từ chối',
        color: 'bg-rose-50 text-rose-700 border border-rose-200',
        icon: <Ban className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const hoursLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  };

  const getExpiryWarning = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const hoursLeft = Math.max(
      0,
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (hoursLeft <= 0) {
      return (
        <span className="text-xs text-red-600 font-medium">Đã hết hạn</span>
      );
    }

    if (hoursLeft <= 24) {
      return (
        <span className="text-xs text-orange-600 font-medium">
          Còn {Math.round(hoursLeft)} giờ
        </span>
      );
    }

    return null;
  };

  const stats = {
    pending: reservations.filter((r) => r.status === 'Pending').length,
    assigned: reservations.filter((r) => r.status === 'Assigned').length,
    fulfilled: reservations.filter((r) => r.status === 'Fulfilled').length,
    rejected: reservations.filter((r) => r.status === 'Rejected').length,
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ConfirmDialog />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Quản Lý Đặt Trước
                </h1>
                <p className="text-sm text-slate-100">
                  Duyệt và quản lý yêu cầu đặt trước sách từ người dùng
                </p>
              </div>
            </div>

            <button
              onClick={fetchReservations}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Chờ duyệt</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-sky-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Đã gán</p>
                <p className="text-2xl font-bold text-sky-600">{stats.assigned}</p>
              </div>
              <div className="p-2 bg-sky-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-emerald-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Hoàn thành</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.fulfilled}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-rose-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Từ chối</p>
                <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg">
                <Ban className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tên người dùng, email, tên sách, ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'All')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="All">Tất cả</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Assigned">Đã gán</option>
                <option value="Fulfilled">Hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
                <option value="Expired">Hết hạn</option>
                <option value="Rejected">Từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy đặt trước nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người dùng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sách
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentReservations.map((reservation) => (
                      <tr
                        key={reservation._id}
                        className={`hover:bg-gray-50 transition ${reservation.status === 'Assigned' &&
                            isExpiringSoon(reservation.expiresAt)
                            ? 'bg-orange-50'
                            : ''
                          }`}
                      >
                        {/* User */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                              <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {reservation.user?.fullName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {reservation.user?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Book */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {reservation.book?.coverImage ? (
                              <img
                                src={reservation.book.coverImage}
                                alt={reservation.book.title}
                                className="w-10 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {reservation.book?.title || 'N/A'}
                              </div>
                              {reservation.book?.isbn && (
                                <div className="text-xs text-gray-500">
                                  ISBN: {reservation.book.isbn}
                                </div>
                              )}
                              {reservation.book?.available !== undefined && (
                                <div className="text-xs text-gray-500">
                                  Có sẵn: {reservation.book.available} bản
                                </div>
                              )}
                              {reservation.status === 'Pending' &&
                                reservation.queuePosition !== undefined &&
                                reservation.queuePosition > 0 && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    Vị trí: #{reservation.queuePosition}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getStatusBadge(reservation.status)}
                            {reservation.status === 'Rejected' &&
                              reservation.rejectionReason && (
                                <div className="text-xs text-gray-600 max-w-xs">
                                  <FileText className="w-3 h-3 inline mr-1" />
                                  {reservation.rejectionReason}
                                </div>
                              )}
                          </div>
                        </td>

                        {/* Time */}
                        <td className="px-4 py-4">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span className="text-xs">Tạo:</span>
                              <span className="text-xs">
                                {formatDate(reservation.createdAt)}
                              </span>
                            </div>
                            {reservation.assignedAt && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-xs">Gán:</span>
                                <span className="text-xs">
                                  {formatDate(reservation.assignedAt)}
                                </span>
                              </div>
                            )}
                            {reservation.expiresAt && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">Hết hạn:</span>
                                <span className="text-xs">
                                  {formatDate(reservation.expiresAt)}
                                </span>
                                {getExpiryWarning(reservation.expiresAt)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {reservation.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(reservation._id)}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg hover:bg-emerald-100 transition flex items-center gap-1 border border-emerald-200 font-medium min-w-[80px] justify-center"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => handleReject(reservation._id)}
                                  className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs rounded-lg hover:bg-rose-100 transition flex items-center gap-1 border border-rose-200 font-medium min-w-[80px] justify-center"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Từ chối
                                </button>
                              </>
                            )}

                            {reservation.status === 'Assigned' && (
                              <button
                                onClick={() => handleFulfill(reservation._id)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition flex items-center gap-1 border border-blue-200 font-medium min-w-[100px] justify-center"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Hoàn thành
                              </button>
                            )}

                            {(reservation.status === 'Pending' ||
                              reservation.status === 'Assigned') && (
                                <button
                                  onClick={() => handleCancel(reservation._id)}
                                  className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition flex items-center gap-1 border border-gray-200 font-medium min-w-[70px] justify-center"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Hủy
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, filteredReservations.length)}</span> trong tổng số <span className="font-semibold">{filteredReservations.length}</span> đặt trước
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Trang <span className="font-semibold">{currentPage}</span> / {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm ${currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                      >
                        <ChevronLeft size={16} />
                        <span>Trước</span>
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm ${currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                      >
                        <span>Tiếp</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarianReservations;
