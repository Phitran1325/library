import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { useNotification } from '@/components/common/Notification';
import { useConfirm } from '@/components/common/ConfirmDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

interface BookCopy {
  _id: string;
  barcode: string;
  bookId: {
    _id: string;
    title: string;
    isbn?: string;
  };
  status: 'available' | 'borrowed' | 'reserved' | 'maintenance' | 'lost' | 'damaged';
  condition: 'new' | 'good' | 'fair' | 'poor';
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  available: number;
  borrowed: number;
  damaged: number;
  lost: number;
  maintenance: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  available: {
    label: 'Có sẵn',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle size={16} />,
  },
  borrowed: {
    label: 'Đang mượn',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock size={16} />,
  },
  reserved: {
    label: 'Đã đặt',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertCircle size={16} />,
  },
  maintenance: {
    label: 'Bảo trì',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <RefreshCw size={16} />,
  },
  damaged: {
    label: 'Hư hỏng',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle size={16} />,
  },
  lost: {
    label: 'Mất',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <AlertCircle size={16} />,
  },
};

const CONDITION_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Mới', className: 'bg-green-50 text-green-700' },
  good: { label: 'Tốt', className: 'bg-blue-50 text-blue-700' },
  fair: { label: 'Khá', className: 'bg-yellow-50 text-yellow-700' },
  poor: { label: 'Kém', className: 'bg-red-50 text-red-700' },
};

const LibrarianBookCopies: React.FC = () => {
  const { showNotification } = useNotification();
  const { confirm, ConfirmDialog } = useConfirm();
  const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);

  // Create modal state
  const [createForm, setCreateForm] = useState({
    bookId: '',
    barcode: '',
    status: 'available',
    condition: 'good',
    location: '',
    notes: '',
  });

  // Book search for create modal
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<Array<{ _id: string; title: string; isbn?: string }>>([]);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ _id: string; title: string } | null>(null);

  // Bulk create modal state
  const [bulkCreateForm, setBulkCreateForm] = useState({
    bookId: '',
    count: 1,
    barcodePrefix: '',
    status: 'available',
    condition: 'good',
    location: '',
    notes: '',
  });

  // Book search for bulk create modal
  const [bulkBookSearchQuery, setBulkBookSearchQuery] = useState('');
  const [bulkBookSearchResults, setBulkBookSearchResults] = useState<Array<{ _id: string; title: string; isbn?: string }>>([]);
  const [showBulkBookSearch, setShowBulkBookSearch] = useState(false);
  const [selectedBulkBook, setSelectedBulkBook] = useState<{ _id: string; title: string } | null>(null);

  // Edit modal state
  const [editForm, setEditForm] = useState({
    status: 'available',
    condition: 'good',
    location: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  // Search books for create modal
  const searchBooks = async (query: string, isBulk: boolean = false) => {
    if (!query || query.length < 2) {
      if (isBulk) {
        setBulkBookSearchResults([]);
      } else {
        setBookSearchResults([]);
      }
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/books`, {
        params: { search: query, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const books = res.data?.data?.books || res.data?.books || [];
      if (isBulk) {
        setBulkBookSearchResults(books);
      } else {
        setBookSearchResults(books);
      }
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  // Select book for create modal
  const handleSelectBook = (book: { _id: string; title: string }, isBulk: boolean = false) => {
    if (isBulk) {
      setSelectedBulkBook(book);
      setBulkCreateForm({ ...bulkCreateForm, bookId: book._id });
      setBulkBookSearchQuery(book.title);
      setShowBulkBookSearch(false);
      setBulkBookSearchResults([]);
    } else {
      setSelectedBook(book);
      setCreateForm({ ...createForm, bookId: book._id });
      setBookSearchQuery(book.title);
      setShowBookSearch(false);
      setBookSearchResults([]);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/librarian/book-copies/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const data = res.data.data;
        const statusDist = data.statusDistribution || {};

        // Map backend data structure to frontend structure
        setStatistics({
          total: data.total || 0,
          available: statusDist.available || 0,
          borrowed: statusDist.borrowed || 0,
          damaged: statusDist.damaged || 0,
          lost: statusDist.lost || 0,
          maintenance: statusDist.maintenance || 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      showNotification(error.response?.data?.message || 'Không thể tải thống kê', 'error');
    }
  };

  // Fetch book copies
  const fetchBookCopies = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchBarcode.trim()) params.barcode = searchBarcode.trim();

      const res = await axios.get(`${API_BASE_URL}/librarian/book-copies`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.success) {
        setBookCopies(res.data.data.bookCopies || []);
        const pagination = res.data.data.pagination;
        if (pagination) {
          setTotalPages(pagination.pages || 1);
          setTotalItems(pagination.total || 0);
        }
      }
    } catch (error: any) {
      console.error('Error fetching book copies:', error);
      showNotification(error.response?.data?.message || 'Không thể tải danh sách bản sao', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create book copy
  const handleCreate = async () => {
    if (!createForm.bookId || !createForm.barcode) {
      showNotification('Vui lòng chọn sách và nhập mã vạch', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📝 [Create] Sending request to:', `${API_BASE_URL}/librarian/book-copies`);
      console.log('📝 [Create] Payload:', createForm);
      console.log('📝 [Create] Token:', token ? 'EXISTS' : 'MISSING');

      const response = await axios.post(
        `${API_BASE_URL}/librarian/book-copies`,
        createForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ [Create] Success:', response.data);
      showNotification('Tạo bản sao thành công!', 'success');
      setShowCreateModal(false);
      setCreateForm({
        bookId: '',
        barcode: '',
        status: 'available',
        condition: 'good',
        location: '',
        notes: '',
      });
      setSelectedBook(null);
      setBookSearchQuery('');
      setCurrentPage(1);
      fetchBookCopies();
      fetchStatistics();
    } catch (error: any) {
      console.error('❌ [Create] Error creating book copy:', error);
      console.error('❌ [Create] Error response:', error.response?.data);
      showNotification(error.response?.data?.message || 'Không thể tạo bản sao', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk create book copies
  const handleBulkCreate = async () => {
    if (!bulkCreateForm.bookId || bulkCreateForm.count < 1) {
      showNotification('Vui lòng chọn sách và nhập số lượng (> 0)', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📦 [Bulk Create] Sending request to:', `${API_BASE_URL}/librarian/book-copies/bulk`);
      console.log('📦 [Bulk Create] Payload:', bulkCreateForm);
      console.log('📦 [Bulk Create] Token:', token ? 'EXISTS' : 'MISSING');

      const res = await axios.post(
        `${API_BASE_URL}/librarian/book-copies/bulk`,
        bulkCreateForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ [Bulk Create] Success:', res.data);

      const errors = res.data.data?.errors;
      if (errors && errors.length > 0) {
        showNotification(`${res.data.message}\n\nLỗi:\n${errors.join('\n')}`, 'warning');
      } else {
        showNotification(res.data.message || 'Tạo nhiều bản sao thành công!', 'success');
      }

      setShowBulkCreateModal(false);
      setBulkCreateForm({
        bookId: '',
        count: 1,
        barcodePrefix: '',
        status: 'available',
        condition: 'good',
        location: '',
        notes: '',
      });
      setSelectedBulkBook(null);
      setBulkBookSearchQuery('');
      setCurrentPage(1);
      fetchBookCopies();
      fetchStatistics();
    } catch (error: any) {
      console.error('❌ [Bulk Create] Error bulk creating book copies:', error);
      console.error('❌ [Bulk Create] Error response:', error.response?.data);
      showNotification(error.response?.data?.message || 'Không thể tạo nhiều bản sao', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (copy: BookCopy) => {
    setSelectedCopy(copy);
    setEditForm({
      status: copy.status,
      condition: copy.condition,
      location: copy.location || '',
      notes: copy.notes || '',
    });
    setShowEditModal(true);
  };

  // Update book copy
  const handleUpdate = async () => {
    if (!selectedCopy) return;

    setSubmitting(true);
    try {
      await axios.put(
        `${API_BASE_URL}/librarian/book-copies/${selectedCopy._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification('Cập nhật bản sao thành công!', 'success');
      setShowEditModal(false);
      setSelectedCopy(null);
      fetchBookCopies();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error updating book copy:', error);
      showNotification(error.response?.data?.message || 'Không thể cập nhật bản sao', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete book copy
  const handleDelete = async (id: string) => {
    const confirmed = await confirm('Xác nhận xóa', 'Bạn có chắc muốn xóa bản sao này?');
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/librarian/book-copies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification('Xóa bản sao thành công!', 'success');

      // If we deleted the last item on the page and we're not on page 1, go back a page
      if (bookCopies.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchBookCopies();
      }
      fetchStatistics();
    } catch (error: any) {
      console.error('Error deleting book copy:', error);
      showNotification(error.response?.data?.message || 'Không thể xóa bản sao', 'error');
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchBookCopies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Bản Sao Sách</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý các bản sao vật lý của sách trong thư viện
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Package size={18} />
            Tạo nhiều bản sao
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Tạo bản sao
          </button>
        </div>
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
              <BookOpen size={32} className="text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Có sẵn</p>
                <p className="text-2xl font-bold text-green-600">{statistics.available}</p>
              </div>
              <CheckCircle size={32} className="text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang mượn</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.borrowed}</p>
              </div>
              <Clock size={32} className="text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bảo trì</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.maintenance}</p>
              </div>
              <RefreshCw size={32} className="text-orange-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hư hỏng</p>
                <p className="text-2xl font-bold text-red-600">{statistics.damaged}</p>
              </div>
              <XCircle size={32} className="text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mất</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.lost}</p>
              </div>
              <AlertCircle size={32} className="text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm theo mã vạch..."
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBookCopies()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Có sẵn</option>
              <option value="borrowed">Đang mượn</option>
              <option value="reserved">Đã đặt</option>
              <option value="maintenance">Bảo trì</option>
              <option value="damaged">Hư hỏng</option>
              <option value="lost">Mất</option>
            </select>
          </div>

          <button
            onClick={fetchBookCopies}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Book Copies Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã vạch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tình trạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : bookCopies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Không có bản sao nào
                  </td>
                </tr>
              ) : (
                bookCopies.map((copy) => (
                  <tr key={copy._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {copy.barcode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{copy.bookId?.title}</div>
                      {copy.bookId?.isbn && (
                        <div className="text-sm text-gray-500">ISBN: {copy.bookId.isbn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {copy.location || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          STATUS_CONFIG[copy.status]?.className
                        }`}
                      >
                        {STATUS_CONFIG[copy.status]?.icon}
                        {STATUS_CONFIG[copy.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          CONDITION_CONFIG[copy.condition]?.className
                        }`}
                      >
                        {CONDITION_CONFIG[copy.condition]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {copy.notes || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(copy)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(copy._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Hiển thị {bookCopies.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} bản sao
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

              {/* Page numbers */}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Tạo bản sao mới</h3>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => {
                    setBookSearchQuery(e.target.value);
                    searchBooks(e.target.value, false);
                    setShowBookSearch(true);
                  }}
                  onFocus={() => setShowBookSearch(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Gõ tên sách để tìm kiếm..."
                />
                {selectedBook && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-green-700">
                      ✓ Đã chọn: <strong>{selectedBook.title}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedBook(null);
                        setBookSearchQuery('');
                        setCreateForm({ ...createForm, bookId: '' });
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {showBookSearch && bookSearchResults.length > 0 && !selectedBook && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {bookSearchResults.map((book) => (
                      <button
                        key={book._id}
                        onClick={() => handleSelectBook(book, false)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-800">{book.title}</div>
                        {book.isbn && (
                          <div className="text-xs text-gray-500">ISBN: {book.isbn}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã vạch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.barcode}
                  onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: BOOK001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Có sẵn</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="lost">Mất</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                <select
                  value={createForm.condition}
                  onChange={(e) => setCreateForm({ ...createForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">Mới</option>
                  <option value="good">Tốt</option>
                  <option value="fair">Khá</option>
                  <option value="poor">Kém</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Kệ A1, Tầng 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Thêm ghi chú..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang tạo...' : 'Tạo bản sao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Tạo nhiều bản sao</h3>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bulkBookSearchQuery}
                  onChange={(e) => {
                    setBulkBookSearchQuery(e.target.value);
                    searchBooks(e.target.value, true);
                    setShowBulkBookSearch(true);
                  }}
                  onFocus={() => setShowBulkBookSearch(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Gõ tên sách để tìm kiếm..."
                />
                {selectedBulkBook && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-green-700">
                      ✓ Đã chọn: <strong>{selectedBulkBook.title}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedBulkBook(null);
                        setBulkBookSearchQuery('');
                        setBulkCreateForm({ ...bulkCreateForm, bookId: '' });
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {showBulkBookSearch && bulkBookSearchResults.length > 0 && !selectedBulkBook && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {bulkBookSearchResults.map((book) => (
                      <button
                        key={book._id}
                        onClick={() => handleSelectBook(book, true)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-800">{book.title}</div>
                        {book.isbn && (
                          <div className="text-xs text-gray-500">ISBN: {book.isbn}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkCreateForm.count}
                  onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, count: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền tố mã vạch (tùy chọn)
                </label>
                <input
                  type="text"
                  value={bulkCreateForm.barcodePrefix}
                  onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, barcodePrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: BOOK (sẽ tạo BOOK0001, BOOK0002...)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu bỏ trống, hệ thống sẽ dùng 8 ký tự đầu của Book ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái mặc định</label>
                <select
                  value={bulkCreateForm.status}
                  onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Có sẵn</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng mặc định</label>
                <select
                  value={bulkCreateForm.condition}
                  onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">Mới</option>
                  <option value="good">Tốt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <input
                  type="text"
                  value={bulkCreateForm.location}
                  onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Kệ A1, Tầng 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú chung</label>
                <textarea
                  value={bulkCreateForm.notes}
                  onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ghi chú áp dụng cho tất cả bản sao..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkCreateModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCreate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang tạo...' : 'Tạo bản sao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCopy && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Chỉnh sửa bản sao</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mã vạch: <span className="font-mono font-bold">{selectedCopy.barcode}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Có sẵn</option>
                  <option value="borrowed">Đang mượn</option>
                  <option value="reserved">Đã đặt</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="lost">Mất</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                <select
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">Mới</option>
                  <option value="good">Tốt</option>
                  <option value="fair">Khá</option>
                  <option value="poor">Kém</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Kệ A1, Tầng 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Thêm ghi chú..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCopy(null);
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default LibrarianBookCopies;
