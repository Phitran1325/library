import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllLibrarianBooks, deleteBook } from '../../services/librarian.api';
import type { Book, Pagination } from '../../types';
import type { LibrarianBookFilters } from '../../services/librarian.api';
import { getBookImage } from '../../utils/book';

import ConfirmModal from '../../components/common/book/ConfirmModal';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}


const LibrarianBookManagement: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LibrarianBookFilters>({
    page: 1,
    limit: 10,
    search: '',
    category: '',
    isActive: '',
    sort: 'createdAt',
    order: 'desc',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; book: Book | null }>({
    isOpen: false,
    book: null,
  });

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

  // Fetch books
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getAllLibrarianBooks(filters);
      setBooks(data.books);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching books:', error);
      showToast('error', 'Không thể tải danh sách sách!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [filters.page, filters.limit, filters.sort, filters.order]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    fetchBooks();
  };

  const handleFilterChange = (key: keyof LibrarianBookFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const applyFilters = () => {
    fetchBooks();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      category: '',
      isActive: '',
      sort: 'createdAt',
      order: 'desc',
    });
    setShowFilters(false);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleDeleteClick = (book: Book) => {
    setDeleteModal({ isOpen: true, book });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.book) return;

    try {
      setLoading(true);
      await deleteBook(deleteModal.book._id);
      showToast('success', 'Xóa sách thành công!');
      setDeleteModal({ isOpen: false, book: null });
      // Refresh danh sách sau khi xóa
      await fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể xóa sách!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Sách</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng số: {pagination.total} sách
          </p>
        </div>
        <button
          onClick={() => navigate('/librarian/books/add')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center transition-colors shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Thêm sách mới
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, ISBN, tác giả..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            Tìm kiếm
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} className="mr-2" />
            Bộ lọc
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thể loại
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả thể loại</option>
                  <option value="Văn học">Văn học</option>
                  <option value="Khoa học - Công nghệ">Khoa học - Công nghệ</option>
                  <option value="Lịch sử - Địa lý">Lịch sử - Địa lý</option>
                  <option value="Kinh tế - Kinh doanh">Kinh tế - Kinh doanh</option>
                  <option value="Giáo dục - Đào tạo">Giáo dục - Đào tạo</option>
                  <option value="Y học - Sức khỏe">Y học - Sức khỏe</option>
                  <option value="Nghệ thuật - Thẩm mỹ">Nghệ thuật - Thẩm mỹ</option>
                  <option value="Tôn giáo - Triết học">Tôn giáo - Triết học</option>
                  <option value="Thiếu nhi - Thanh thiếu niên">Thiếu nhi - Thanh thiếu niên</option>
                  <option value="Thể thao - Giải trí">Thể thao - Giải trí</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={String(filters.isActive || '')}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Đã vô hiệu hóa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp theo
                </label>
                <select
                  value={`${filters.sort}-${filters.order}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setFilters({ ...filters, sort, order: order as 'asc' | 'desc' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Mới nhất</option>
                  <option value="createdAt-asc">Cũ nhất</option>
                  <option value="title-asc">Tên A-Z</option>
                  <option value="title-desc">Tên Z-A</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Không tìm thấy sách nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Sách
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Tác giả
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Thể loại
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Giá thuê
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Kho
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Trạng thái
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {books.map((book) => (
                    <tr
                      key={book._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-14 bg-gray-200 rounded flex-shrink-0 mr-3">
                            <img
                              src={getBookImage(book)}
                              alt={book.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {book.title}
                            </p>
                            <p className="text-xs text-gray-500">{book.isbn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {book.authorId?.name || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {book.category}
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                        {book.rentalPrice?.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className="text-gray-900 font-medium">
                          {book.available || 0}
                        </span>
                        <span className="text-gray-500">/{book.stock || 0}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${book.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {book.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/librarian/books/${book.slug || book._id}`)
                            }
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/librarian/books/edit/${book.slug || book._id}`)
                            }
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button

                            onClick={() => handleDeleteClick(book)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"

                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                đến{' '}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{' '}
                trong tổng số{' '}
                <span className="font-medium">{pagination.total}</span> kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.pages ||
                      Math.abs(page - pagination.page) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg transition-colors ${pagination.page === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.book && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, book: null })}
          onConfirm={handleDeleteConfirm}
          title="Xác nhận xóa sách"
          message={`Bạn có chắc muốn xóa sách "${deleteModal.book.title}"?\n\nLưu ý: Hành động này không thể hoàn tác!`}
          confirmText="Xóa sách"
          cancelText="Hủy"
          type="danger"
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 ${toast.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
              }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-900' : 'text-red-900'
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

export default LibrarianBookManagement;
