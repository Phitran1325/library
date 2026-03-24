import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  X,
  XCircle,
  Eye,
  FileText,
  Clock,
  User,
  BookOpen,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import {
  getAllEbookReports,
  getEbookReportById,
  updateEbookReport,
  type EbookContentReport,
  type EbookReportIssueType,
  type EbookReportStatus,
} from '../../services/ebook.api';

type ActionType = 'update' | 'view' | null;

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'IN_REVIEW', label: 'Đang xem xét' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'DISMISSED', label: 'Đã từ chối' },
];

const ISSUE_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại vấn đề' },
  { value: 'copyright', label: 'Bản quyền' },
  { value: 'formatting', label: 'Định dạng' },
  { value: 'broken_link', label: 'Link bị hỏng' },
  { value: 'typo', label: 'Lỗi chính tả' },
  { value: 'offensive', label: 'Nội dung phản cảm' },
  { value: 'other', label: 'Khác' },
];

const STATUS_STYLES: Record<
  string,
  { badge: string; dot: string; label: string; icon: React.ElementType }
> = {
  PENDING: {
    badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    dot: 'bg-yellow-500',
    label: 'Chờ xử lý',
    icon: Clock,
  },
  IN_REVIEW: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    label: 'Đang xem xét',
    icon: Eye,
  },
  RESOLVED: {
    badge: 'bg-green-50 text-green-700 border border-green-200',
    dot: 'bg-green-500',
    label: 'Đã giải quyết',
    icon: CheckCircle2,
  },
  DISMISSED: {
    badge: 'bg-gray-50 text-gray-700 border border-gray-200',
    dot: 'bg-gray-500',
    label: 'Đã từ chối',
    icon: XCircle,
  },
};

const ISSUE_TYPE_LABELS: Record<EbookReportIssueType, string> = {
  copyright: 'Bản quyền',
  formatting: 'Định dạng',
  broken_link: 'Link bị hỏng',
  typo: 'Lỗi chính tả',
  offensive: 'Nội dung phản cảm',
  other: 'Khác',
};

const EbookReportManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState<EbookContentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    issueType: '',
    search: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actionState, setActionState] = useState<{
    type: ActionType;
    report: EbookContentReport | null;
  }>({ type: null, report: null });
  const [selectedStatus, setSelectedStatus] = useState<EbookReportStatus>('PENDING');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [viewReport, setViewReport] = useState<EbookContentReport | null>(null);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.issueType) {
        params.issueType = filters.issueType;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const data = await getAllEbookReports(params);
      setReports(data.items);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      showToast('error', error.message || 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const openActionModal = async (report: EbookContentReport, type: 'update' | 'view') => {
    if (type === 'view') {
      try {
        // Fetch full report details
        const fullReport = await getEbookReportById(report._id);
        setViewReport(fullReport);
        setActionState({ type: 'view', report: fullReport });
      } catch (error: any) {
        console.error('Error fetching report details:', error);
        showToast('error', 'Không thể tải chi tiết báo cáo');
      }
    } else {
      setActionState({ type: 'update', report });
      setSelectedStatus(report.status as EbookReportStatus);
      setResolutionNotes('');
    }
  };

  const closeActionModal = () => {
    setActionState({ type: null, report: null });
    setViewReport(null);
    setResolutionNotes('');
    setActionLoading(false);
  };

  const handleUpdateReport = async () => {
    if (!actionState.report) return;

    if ((selectedStatus === 'RESOLVED' || selectedStatus === 'DISMISSED') && !resolutionNotes.trim()) {
      showToast('error', 'Vui lòng nhập ghi chú giải quyết');
      return;
    }

    setActionLoading(true);
    try {
      await updateEbookReport(actionState.report._id, {
        status: selectedStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      closeActionModal();
      showToast('success', 'Cập nhật trạng thái báo cáo thành công!');
      await fetchReports();
    } catch (error: any) {
      console.error('Update error:', error);
      showToast('error', error.message || 'Không thể cập nhật báo cáo');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      pending: reports.filter((r) => r.status === 'PENDING').length,
      inReview: reports.filter((r) => r.status === 'IN_REVIEW').length,
      resolved: reports.filter((r) => r.status === 'RESOLVED').length,
      dismissed: reports.filter((r) => r.status === 'DISMISSED').length,
    };
  }, [reports]);

  const formatDate = (value?: string) => {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditBook = (bookId: string) => {
    // Luôn chuyển sang trang quản lý/sửa sách của Thủ thư
    // (admin cũng có quyền vào khu vực này)
    navigate(`/librarian/books/edit/${bookId}`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            Quản Lý Báo Cáo Ebook
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Xem xét và xử lý các báo cáo về nội dung ebook từ độc giả
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
            <span className="text-2xl font-bold text-yellow-900">{stats.pending}</span>
          </div>
          <p className="text-sm font-medium text-yellow-700">Chờ xử lý</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-200 rounded-lg">
              <Eye className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-2xl font-bold text-blue-900">{stats.inReview}</span>
          </div>
          <p className="text-sm font-medium text-blue-700">Đang xem xét</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-700" />
            </div>
            <span className="text-2xl font-bold text-green-900">{stats.resolved}</span>
          </div>
          <p className="text-sm font-medium text-green-700">Đã giải quyết</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-200 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-700" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.dismissed}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Đã từ chối</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchReports()}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white min-w-[180px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.issueType}
            onChange={(e) => handleFilterChange('issueType', e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white min-w-[200px]"
          >
            {ISSUE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Không có báo cáo nào</p>
            <p className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc để tìm kiếm</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Sách
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Người báo cáo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Loại vấn đề
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.PENDING;
                    const StatusIcon = statusStyle.icon;
                    return (
                      <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {report.book?.coverImage ? (
                              <img
                                src={report.book.coverImage}
                                alt={report.book.title}
                                className="w-14 h-20 object-cover rounded-lg shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{report.book?.title || 'N/A'}</p>
                              {report.pageNumber && (
                                <p className="text-sm text-gray-500 mt-0.5">Trang {report.pageNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded-full">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {report.reporter?.fullName || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">{report.reporter?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {ISSUE_TYPE_LABELS[report.issueType] || report.issueType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusStyle.badge}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => openActionModal(report, 'view')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all text-xs font-medium"
                              title="Xem chi tiết báo cáo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem</span>
                            </button>
                            <button
                              onClick={() => openActionModal(report, 'update')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all text-xs font-medium"
                              title="Cập nhật trạng thái báo cáo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Cập nhật</span>
                            </button>
                            {report.book?._id && (
                              <button
                                onClick={() => handleEditBook(report.book._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all text-xs font-medium"
                                title="Sửa thông tin sách"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Sửa sách</span>
                              </button>
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
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số{' '}
                  <span className="font-medium">{pagination.total}</span> báo cáo
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Report Modal */}
      {actionState.type === 'view' && viewReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Chi tiết báo cáo
              </h2>
              <button
                onClick={closeActionModal}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sách</label>
                  <p className="text-base font-medium text-gray-900">{viewReport.book?.title || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người báo cáo</label>
                  <p className="text-base font-medium text-gray-900">
                    {viewReport.reporter?.fullName} ({viewReport.reporter?.email})
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại vấn đề</label>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {ISSUE_TYPE_LABELS[viewReport.issueType]}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_STYLES[viewReport.status]?.badge || ''}`}>
                      {STATUS_STYLES[viewReport.status]?.label || viewReport.status}
                    </span>
                  </p>
                </div>
              </div>
              
              {viewReport.pageNumber && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trang</label>
                  <p className="text-base font-medium text-gray-900">Trang {viewReport.pageNumber}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mô tả</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewReport.description}</p>
                </div>
              </div>

              {viewReport.evidenceUrls && viewReport.evidenceUrls.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bằng chứng</label>
                  <div className="mt-2 space-y-2">
                    {viewReport.evidenceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <p className="text-sm text-blue-700 font-medium truncate">{url}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewReport.handledBy && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người xử lý</label>
                  <p className="text-base font-medium text-gray-900">
                    {viewReport.handledBy.fullName} ({viewReport.handledBy.email})
                  </p>
                </div>
              )}

              {viewReport.resolutionNotes && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghi chú giải quyết</label>
                  <div className="mt-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewReport.resolutionNotes}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 pt-2 border-t border-gray-200">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày tạo</label>
                  <p className="text-sm text-gray-700">{formatDate(viewReport.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cập nhật lần cuối</label>
                  <p className="text-sm text-gray-700">{formatDate(viewReport.updatedAt)}</p>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              {viewReport.book?._id && (
                <button
                  onClick={() => {
                    closeActionModal();
                    handleEditBook(viewReport.book._id);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Sửa sách
                </button>
              )}
              <button
                onClick={closeActionModal}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {actionState.type === 'update' && actionState.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Cập nhật trạng thái
              </h2>
              <button
                onClick={closeActionModal}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as EbookReportStatus)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="IN_REVIEW">Đang xem xét</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="DISMISSED">Đã từ chối</option>
                </select>
              </div>
              {(selectedStatus === 'RESOLVED' || selectedStatus === 'DISMISSED') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ghi chú giải quyết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                    placeholder="Nhập ghi chú giải quyết..."
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Ghi chú này sẽ được gửi tới người báo cáo
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeActionModal}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateReport}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Cập nhật
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
                <Eye className="w-5 h-5 text-blue-600" />
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
    </div>
  );
};

export default EbookReportManagement;
