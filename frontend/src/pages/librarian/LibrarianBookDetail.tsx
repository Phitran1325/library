import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  Tag,
  DollarSign,
  Package,
  Globe,
  User,
  Building,
  Upload,
  FileText,
  X,
} from 'lucide-react';
import { getLibrarianBookById } from '../../services/librarian.api';
import type { Book } from '../../types';
import useNotification from '../../hooks/userNotification';
import { getBookImage } from '../../utils/book';

const LibrarianBookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingEbook, setUploadingEbook] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchBookDetail();
    }
  }, [id]);

  const fetchBookDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLibrarianBookById(id!);
      setBook(data);
    } catch (err: unknown) {
      console.error('Error fetching book detail:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin sách!');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa sách này?')) {
      return;
    }
    // TODO: Implement delete API
    showInfo('Chức năng xóa sẽ được phát triển', 'Thông báo');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      showWarning('Chỉ chấp nhận file PDF!', 'Loại file không hợp lệ');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showWarning('Kích thước file không được vượt quá 50MB!', 'File quá lớn');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadEbook = async () => {
    if (!selectedFile || !book) return;

    setUploadingEbook(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/librarian/books/${book._id}/ebooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload thất bại');
      }

      await response.json();
      showSuccess('File ebook đã được upload thành công!', 'Upload thành công');
      setShowUploadModal(false);
      setSelectedFile(null);

      // Refresh book data
      await fetchBookDetail();
    } catch (error) {
      console.error('Error uploading ebook:', error);
      showError(
        error instanceof Error ? error.message : 'Không thể upload ebook. Vui lòng thử lại!',
        'Lỗi upload'
      );
    } finally {
      setUploadingEbook(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Không tìm thấy sách'}</p>
          <button
            onClick={() => navigate('/librarian/books')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/librarian/books')}
          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại danh sách</span>
        </button>

        {/* Title and Actions */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{book.title}</h1>
              <p className="text-slate-200 mt-1 text-sm flex items-center gap-2">
                <BookOpen size={14} />
                Chi tiết thông tin sách
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Upload size={18} />
                <span>Upload Ebook</span>
              </button>
              <button
                onClick={() => navigate(`/librarian/books/edit/${book._id}`)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Edit size={18} />
                <span>Chỉnh sửa</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Trash2 size={18} />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Ebook Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Upload Ebook PDF</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn file PDF
                  </label>

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="text-blue-600" size={32} />
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium">
                            Click để chọn file PDF
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Tối đa 50MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-100 rounded">
                            <FileText className="text-red-600" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X size={20} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Lưu ý:</strong> File ebook sẽ được lưu trữ an toàn và chỉ người dùng được cấp quyền mới có thể truy cập.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploadingEbook}
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadEbook}
                  disabled={!selectedFile || uploadingEbook}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {uploadingEbook ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="mr-2" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Cover & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cover Image */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={getBookImage(book)}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Trạng thái
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Hoạt động</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${book.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                    }`}
                >
                  {book.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Sách mới</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${book.isNewRelease
                    ? 'bg-sky-50 text-sky-700'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  {book.isNewRelease ? 'Phát hành mới' : 'Không'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Trạng thái kho</span>
                <span className="text-sm font-medium text-gray-900">
                  {book.status === 'available'
                    ? 'Có sẵn'
                    : book.status === 'unavailable'
                      ? 'Không có sẵn'
                      : 'Sắp ra mắt'}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="text-slate-600" size={18} />
              Thông tin kho
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Tổng số</span>
                <span className="text-xl font-bold text-slate-700">
                  {book.stock || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Có sẵn</span>
                <span className="text-xl font-bold text-emerald-600">
                  {book.available || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Đang mượn</span>
                <span className="text-xl font-bold text-amber-600">
                  {(book.stock || 0) - (book.available || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin chi tiết
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={BookOpen} label="ISBN" value={book.isbn || 'N/A'} />
              <InfoItem
                icon={Globe}
                label="Ngôn ngữ"
                value={book.language || 'N/A'}
              />
              <InfoItem icon={Tag} label="Thể loại" value={book.category} />
              <InfoItem
                icon={Calendar}
                label="Năm xuất bản"
                value={book.publicationYear?.toString() || 'N/A'}
              />
              <InfoItem
                icon={BookOpen}
                label="Số trang"
                value={book.pages?.toString() || 'N/A'}
              />
              <InfoItem
                icon={Package}
                label="Số tập"
                value={book.volume?.toString() || '1'}
              />
            </div>
          </div>

          {/* Author & Publisher */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tác giả & Nhà xuất bản
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <User size={20} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600 font-medium mb-1">Tác giả</p>
                  <p className="text-base font-semibold text-gray-900">
                    {book.authorId?.name || 'N/A'}
                  </p>
                  {book.authorId?.nationality && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <Globe size={14} />
                      {book.authorId.nationality}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Nhà xuất bản</p>
                  <p className="text-base font-semibold text-gray-900">
                    {book.publisherId?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={20} />
              Thông tin giá
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-700 font-medium mb-2">Giá bán</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {book.price
                    ? `${book.price.toLocaleString('vi-VN')}đ`
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-sky-50 rounded-lg">
                <p className="text-xs text-sky-700 font-medium mb-2">Giá thuê / ngày</p>
                <p className="text-2xl font-bold text-sky-700">
                  {book.rentalPrice
                    ? `${book.rentalPrice.toLocaleString('vi-VN')}đ`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="text-gray-600" size={18} />
                Mô tả
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag className="text-gray-600" size={18} />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {book.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="text-gray-600" size={18} />
              Thông tin hệ thống
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Ngày tạo</span>
                <span className="font-medium text-gray-900">
                  {new Date(book.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Cập nhật lần cuối</span>
                <span className="font-medium text-gray-900">
                  {new Date(book.updatedAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-gray-600 block mb-1">ID</span>
                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded break-all inline-block">
                  {book._id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Info Item Component
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon size={18} className="text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default LibrarianBookDetail;
