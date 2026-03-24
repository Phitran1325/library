
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

import {
  getAuthors,
  getLibrarianBookById,
  getPublishers,
  getTags,
  updateBook,
} from '../../services/librarian.api';
import type { CreateBookRequest } from '../../services/librarian.api';
import useNotification from '../../hooks/userNotification';

interface Author {
  _id: string;
  name: string;
}

interface Publisher {
  _id: string;
  name: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const LibrarianEditBook: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError, showWarning } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ebookFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingEbook, setUploadingEbook] = useState(false);
  const [selectedEbookFile, setSelectedEbookFile] = useState<File | null>(null);
  const [existingEbookUrl, setExistingEbookUrl] = useState<string>('');
  const [showEbookModal, setShowEbookModal] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateBookRequest>>({
    title: '',
    isbn: '',
    language: 'Vietnamese',
    category: 'Văn học',
    rentalPrice: 0,
    isNewRelease: false,
    authorId: '',
    publisherId: '',
    tags: [],
    available: 0,
  });
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Fetch book data on mount
  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        showToast('error', 'ID sách không hợp lệ');
        navigate('/librarian/books');
        return;
      }

      try {
        setFetching(true);
        const [book, authorsData, publishersData, tagsData] = await Promise.all([
          getLibrarianBookById(id),
          getAuthors(),
          getPublishers(),
          getTags(),
        ]);

        setAuthors(authorsData);
        setPublishers(publishersData);
        setTagsList(tagsData);

        if (book.coverImage) {
          setImagePreview(book.coverImage);
        }

        // Check if book has existing ebook files
        if (book.digitalFiles && book.digitalFiles.length > 0) {
          setExistingEbookUrl(book.digitalFiles[0]?.url || '');
        }

        setFormData({
          title: book.title,
          isbn: book.isbn,
          description: book.description,
          coverImage: book.coverImage,
          pages: book.pages,
          publicationYear: book.publicationYear,
          publishedDate: book.publishedDate,
          language: book.language,
          category: book.category,
          categoryId: book.categoryId,
          price: book.price,
          rentalPrice: book.rentalPrice,
          stock: book.stock,
          available: book.available,
          volume: book.volume,
          isNewRelease: book.isNewRelease,
          authorId: typeof book.authorId === 'string' ? book.authorId : book.authorId._id,
          publisherId: typeof book.publisherId === 'string' ? book.publisherId : book.publisherId._id,
          tags: book.tags,
        });
      } catch (error) {
        console.error('Error fetching book:', error);
        showError('Không thể tải thông tin sách!', 'Lỗi tải dữ liệu');

        navigate('/librarian/books');
      } finally {
        setFetching(false);
      }
    };

    fetchBook();
  }, [id, navigate, showToast]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddTag = (tag?: string) => {
    const newTag = tag || tagInput.trim();
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag],
      });
      setTagInput('');
      setSuggestedTags([]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    if (value) {
      setSuggestedTags(
        tagsList.filter((t) => t.toLowerCase().includes(value.toLowerCase()))
      );
    } else {
      setSuggestedTags([]);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showWarning('Vui lòng chọn file ảnh!', 'File không hợp lệ');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showWarning('Kích thước ảnh không được vượt quá 5MB!', 'File quá lớn');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const token = localStorage.getItem('token');
      if (!token) {
        showError('Vui lòng đăng nhập lại!', 'Chưa đăng nhập');
        setImagePreview('');
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/librarian/books/upload-image`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Upload thất bại';
        showError(errorMessage, 'Lỗi upload');
        setImagePreview('');
        return;
      }

      if (data.data?.url) {
        setFormData(prev => ({ ...prev, coverImage: data.data.url }));
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }

    } catch (error) {
      console.error('Error uploading image:', error);

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        showError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!', 'Lỗi kết nối');
      } else {
        showError(
          error instanceof Error ? error.message : 'Lỗi không xác định',
          'Không thể upload ảnh'
        );
      }

      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, coverImage: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUrlInput = (url: string) => {
    setFormData(prev => ({ ...prev, coverImage: url }));
    if (url) {
      setImagePreview(url);
    }
  };

  const handleEbookFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedEbookFile(file);
  };

  const handleRemoveEbookFile = () => {
    setSelectedEbookFile(null);
    if (ebookFileInputRef.current) {
      ebookFileInputRef.current.value = '';
    }
  };

  const handleUploadEbook = async () => {
    if (!selectedEbookFile || !id) return;

    setUploadingEbook(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedEbookFile);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/librarian/books/${id}/ebooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload thất bại');
      }

      const data = await response.json();
      showSuccess('File ebook đã được upload thành công!', 'Upload thành công');
      setShowEbookModal(false);
      setSelectedEbookFile(null);

      // Update existing ebook URL
      if (data.data?.ebookUrl) {
        setExistingEbookUrl(data.data.ebookUrl);
      }
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

  const sanitizePayload = (
    data: Partial<CreateBookRequest>
  ): Partial<CreateBookRequest> => {
    const payload: Partial<CreateBookRequest> & Record<string, any> = {
      ...data,
      tags: data.tags?.map((tag) => tag.trim()).filter(Boolean),
    };

    const optionalStringFields: (keyof CreateBookRequest)[] = [
      'isbn',
      'description',
      'coverImage',
      'categoryId',
    ];
    optionalStringFields.forEach((field) => {
      const value = payload[field];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          delete (payload as Record<string, any>)[field as string];
        } else {
          (payload as Record<string, any>)[field as string] = trimmed;
        }
      }
    });

    const optionalNumberFields: (keyof CreateBookRequest)[] = [
      'pages',
      'price',
      'volume',
      'publicationYear',
    ];
    optionalNumberFields.forEach((field) => {
      const value = payload[field];
      if (typeof value === 'number' && value <= 0) {
        delete (payload as Record<string, any>)[field as string];
      }
    });

    // Giữ lại stock và available ngay cả khi = 0 (vì 0 là giá trị hợp lệ)
    // Chỉ xóa nếu là số âm, NaN, hoặc undefined
    ['stock', 'available'].forEach((field) => {
      const value = payload[field as keyof CreateBookRequest];
      if (value === undefined || value === null) {
        delete (payload as Record<string, any>)[field];
      } else if (typeof value === 'number') {
        if (isNaN(value) || value < 0) {
          delete (payload as Record<string, any>)[field];
        }
      }
    });

    if (!payload.publishedDate) {
      delete (payload as Record<string, any>).publishedDate;
    }

    return payload;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = 'Tên sách là bắt buộc';
    if (!formData.authorId) newErrors.authorId = 'Chọn tác giả';
    if (!formData.publisherId) newErrors.publisherId = 'Chọn nhà xuất bản';
    if (!formData.rentalPrice || formData.rentalPrice <= 0)
      newErrors.rentalPrice = 'Giá thuê hợp lệ là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      showError('ID sách không hợp lệ', 'Lỗi');

      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      console.log('�� [LibrarianEditBook] FormData trước khi sanitize:', {
        stock: formData.stock,
        available: formData.available,
        stock_type: typeof formData.stock,
        available_type: typeof formData.available,
      });

      const sanitizedPayload = sanitizePayload(formData);

      console.log('📦 [LibrarianEditBook] Payload sau khi sanitize:', sanitizedPayload);
      console.log('📦 [LibrarianEditBook] Stock:', sanitizedPayload.stock, 'Available:', sanitizedPayload.available);
      console.log('📦 [LibrarianEditBook] Has stock?', 'stock' in sanitizedPayload);
      console.log('📦 [LibrarianEditBook] Has available?', 'available' in sanitizedPayload);

      const response = await updateBook(id, sanitizedPayload);
      console.log('✅ [LibrarianEditBook] Response từ server:', response);


      showToast('success', 'Cập nhật sách thành công!');
      setTimeout(() => {
        // Navigate về danh sách sách để tránh 404 nếu slug thay đổi
        navigate('/librarian/books');
      }, 1000);
    } catch (error: any) {
      console.error('❌ [LibrarianEditBook] Error updating book:', error);
      console.error('❌ [LibrarianEditBook] Error response:', error.response?.data);
      showToast('error', error.message || 'Không thể cập nhật sách!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Đang tải thông tin sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/librarian/books')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Sách</h1>
            <p className="text-sm text-gray-600 mt-1">
              Cập nhật thông tin sách: {formData.title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowEbookModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Upload size={18} />
          <span>Upload Ebook</span>
        </button>
      </div>

      {/* Ebook Upload Modal */}
      {showEbookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Upload Ebook PDF</h3>
                <button
                  onClick={() => {
                    setShowEbookModal(false);
                    setSelectedEbookFile(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Existing Ebook Display */}
                {existingEbookUrl && (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-sky-900">File ebook hiện tại:</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-sky-100 rounded">
                        <Upload className="text-sky-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {existingEbookUrl.split('/').pop()}
                        </p>
                        <a
                          href={existingEbookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:text-sky-700 underline"
                        >
                          Xem file
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {existingEbookUrl ? 'Chọn file mới để thay thế' : 'Chọn file PDF'}
                  </label>

                  {!selectedEbookFile ? (
                    <div
                      onClick={() => ebookFileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <input
                        ref={ebookFileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleEbookFileSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Upload className="text-emerald-600" size={32} />
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium">
                            Click để chọn file PDF
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Tối đa 50MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-100 rounded">
                            <Upload className="text-red-600" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedEbookFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedEbookFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveEbookFile}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X size={20} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800">
                    <strong>Lưu ý:</strong> File ebook sẽ được lưu trữ an toàn và chỉ người dùng được cấp quyền mới có thể truy cập.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEbookModal(false);
                    setSelectedEbookFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploadingEbook}
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadEbook}
                  disabled={!selectedEbookFile || uploadingEbook}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-colors"
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Thông tin cơ bản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên sách <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Nhập tên sách..."
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISBN
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="978-1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngôn ngữ <span className="text-red-500">*</span>
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Vietnamese">Tiếng Việt</option>
                <option value="English">Tiếng Anh</option>
                <option value="French">Tiếng Pháp</option>
                <option value="Chinese">Tiếng Trung</option>
                <option value="Japanese">Tiếng Nhật</option>
                <option value="Korean">Tiếng Hàn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thể loại <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Văn học">Văn học</option>
                <option value="Khoa học - Công nghệ">Khoa học - Công nghệ</option>
                <option value="Lịch sử - Địa lý">Lịch sử - Địa lý</option>
                <option value="Kinh tế - Kinh doanh">Kinh tế - Kinh doanh</option>
                <option value="Giáo dục - Đào tạo">Giáo dục - Đào tạo</option>
                <option value="Y học - Sức khỏe">Y học - Sức khỏe</option>
                <option value="Nghệ thuật - Thẩm mỹ">Nghệ thuật - Thẩm mỹ</option>
                <option value="Tôn giáo - Triết học">Tôn giáo - Triết học</option>
                <option value="Thiếu nhi - Thanh thiếu niên">
                  Thiếu nhi - Thanh thiếu niên
                </option>
                <option value="Thể thao - Giải trí">Thể thao - Giải trí</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số trang
              </label>
              <input
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Năm xuất bản
              </label>
              <input
                type="number"
                name="publicationYear"
                value={formData.publicationYear}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày xuất bản
              </label>
              <input
                type="date"
                name="publishedDate"
                value={formData.publishedDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tập
              </label>
              <input
                type="number"
                name="volume"
                value={formData.volume}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bìa sách
              </label>

              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                        <Upload className="text-gray-400" size={32} />
                      )}
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">
                        {uploading ? 'Đang upload...' : 'Kéo thả ảnh vào đây hoặc click để chọn'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF tối đa 5MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-48 h-64 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hoặc nhập URL ảnh</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.coverImage || ''}
                    onChange={(e) => handleImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.coverImage && !imagePreview && (
                    <button
                      type="button"
                      onClick={() => setImagePreview(formData.coverImage || '')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ImageIcon size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mô tả sách..."
              />
            </div>
          </div>
        </div>

        {/* Author & Publisher */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tác giả & Nhà xuất bản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tác giả <span className="text-red-500">*</span>
              </label>
              <select
                name="authorId"
                value={formData.authorId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.authorId ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Chọn tác giả</option>
                {authors.map((author) => (
                  <option key={author._id} value={author._id}>
                    {author.name}
                  </option>
                ))}
              </select>
              {errors.authorId && (
                <p className="text-red-500 text-sm mt-1">{errors.authorId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhà xuất bản <span className="text-red-500">*</span>
              </label>
              <select
                name="publisherId"
                value={formData.publisherId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.publisherId ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Chọn nhà xuất bản</option>
                {publishers.map((publisher) => (
                  <option key={publisher._id} value={publisher._id}>
                    {publisher.name}
                  </option>
                ))}
              </select>
              {errors.publisherId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.publisherId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Giá & Kho hàng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá bán (VNĐ)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thuê (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rentalPrice"
                value={formData.rentalPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.rentalPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="5000"
              />
              {errors.rentalPrice && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.rentalPrice}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tổng số lượng trong kho
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">Tổng số sách trong thư viện</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng có sẵn để mượn
              </label>
              <input
                type="number"
                name="available"
                value={formData.available}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">Số sách chưa được mượn</p>
            </div>
          </div>
        </div>

        {/* Tags & Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tags & Tùy chọn
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tag và nhấn Enter..."
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thêm
                </button>
              </div>
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm cursor-pointer hover:bg-gray-200"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isNewRelease"
                checked={formData.isNewRelease}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Đánh dấu là sách mới phát hành
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/librarian/books')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang cập nhật...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Cập nhật sách
              </>
            )}
          </button>
        </div>
      </form>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 ${toast.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
              }`}
          >
            <div className="shrink-0">
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
              className="shrink-0 ml-3 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibrarianEditBook;
