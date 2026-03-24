import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { createBook, getAuthors, getPublishers, getTags } from '../../services/librarian.api';
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

const LibrarianAddBook: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);


  const [formData, setFormData] = useState<CreateBookRequest>({
    title: '',
    isbn: '',
    language: 'Vietnamese',
    category: 'Văn học',
    rentalPrice: 0,
    stock: 0,
    isNewRelease: false,
    authorId: '',
    publisherId: '',
    tags: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authorsData = await getAuthors();
        setAuthors(authorsData);
        const publishersData = await getPublishers();
        setPublishers(publishersData);
        const tagsData = await getTags();
        setTagsList(tagsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [name]: '' });
  };

  const handleAddTag = (tag?: string) => {
    const newTag = tag || tagInput.trim();
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag] });
      setTagInput('');
      setSuggestedTags([]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tagToRemove) });
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    if (value) {
      setSuggestedTags(tagsList.filter(t => t.toLowerCase().includes(value.toLowerCase())));
    } else {
      setSuggestedTags([]);
    }
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {

      showWarning('Vui lòng chọn file ảnh!', 'File không hợp lệ');

      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {

      showWarning('Kích thước ảnh không được vượt quá 5MB!', 'File quá lớn');

      return;
    }

    setUploading(true);

    try {
      // Show local preview first
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Vui lòng đăng nhập lại!', 'Chưa đăng nhập');
        setImagePreview('');
        return;
      }

      console.log('Uploading via backend...');

      // Prepare FormData
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      // Upload via backend
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/librarian/books/upload-image`;
      console.log('Upload URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      console.log('Upload response status:', response.status);

      // Parse response
      const data = await response.json();
      console.log('Upload response data:', data);

      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Upload thất bại';
        console.error('Upload error:', errorMessage);
        showError(errorMessage, 'Lỗi upload');
        setImagePreview('');
        return;
      }

      // Success - update form data with image URL from backend
      if (data.data?.url) {
        setFormData(prev => ({ ...prev, coverImage: data.data.url }));
        console.log('Image uploaded successfully:', data.data.url);
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

  const sanitizePayload = (data: CreateBookRequest): CreateBookRequest => {
    const payload: CreateBookRequest & Record<string, unknown> = {
      ...data,
      tags: data.tags?.map(tag => tag.trim()).filter(Boolean) || [],
    };

    const optionalStringFields: (keyof CreateBookRequest)[] = ['isbn', 'description', 'coverImage', 'categoryId'];
    optionalStringFields.forEach(field => {
      const value = payload[field];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          delete (payload as Record<string, unknown>)[field as string];
        } else {
          (payload as Record<string, unknown>)[field as string] = trimmed;
        }
      }
    });

    if (!payload.pages || payload.pages <= 0) {
      delete (payload as Record<string, unknown>).pages;
    }

    if (!payload.price || payload.price <= 0) {
      delete (payload as Record<string, unknown>).price;
    }

    if (!payload.volume || payload.volume <= 0) {
      delete (payload as Record<string, unknown>).volume;
    }

    if (!payload.stock && payload.stock !== 0) {
      delete (payload as Record<string, unknown>).stock;
    }

    return payload;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Tên sách là bắt buộc';
    if (!formData.authorId) newErrors.authorId = 'Chọn tác giả';
    if (!formData.publisherId) newErrors.publisherId = 'Chọn nhà xuất bản';
    if (!formData.rentalPrice || formData.rentalPrice <= 0) newErrors.rentalPrice = 'Giá thuê hợp lệ là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const sanitizedPayload = sanitizePayload(formData);
      const newBook = await createBook(sanitizedPayload);

      showSuccess('Tạo sách thành công!', 'Thành công');
      navigate(`/librarian/books/${newBook.slug || newBook._id}`);
    } catch (error: unknown) {
      console.error('Error creating book:', error);
      showError(
        error instanceof Error ? error.message : 'Không thể tạo sách mới!',
        'Lỗi tạo sách'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/librarian/books')}
              className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Thêm Sách Mới</h1>
              <p className="text-slate-200 text-sm mt-1">Nhập thông tin sách để thêm vào thư viện</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Thông tin cơ bản</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sách *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${errors.title ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300'}`}
              />
              {errors.title && <span className="text-rose-600 text-sm mt-1 block">{errors.title}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ *</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all border-gray-300"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all border-gray-300"
              >
                {[
                  'Văn học',
                  'Khoa học - Công nghệ',
                  'Lịch sử - Địa lý',
                  'Kinh tế - Kinh doanh',
                  'Giáo dục - Đào tạo',
                  'Y học - Sức khỏe',
                  'Nghệ thuật - Thẩm mỹ',
                  'Tôn giáo - Triết học',
                  'Thiếu nhi - Thanh thiếu niên',
                  'Thể thao - Giải trí',
                ].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Ảnh bìa sách</h3>

          <div className="space-y-4">
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-pointer bg-gray-50"
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
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                    ) : (
                      <Upload className="text-slate-400" size={32} />
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
                  className="w-48 h-64 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 transition-colors shadow-md"
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
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all border-gray-300"
                />
                {formData.coverImage && !imagePreview && (
                  <button
                    type="button"
                    onClick={() => setImagePreview(formData.coverImage || '')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    <ImageIcon size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Author & Publisher */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Tác giả & Nhà xuất bản</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả *</label>
              <select
                name="authorId"
                value={formData.authorId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${errors.authorId ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300'}`}
              >
                <option value="">Chọn tác giả</option>
                {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
              {errors.authorId && <span className="text-rose-600 text-sm mt-1 block">{errors.authorId}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà xuất bản *</label>
              <select
                name="publisherId"
                value={formData.publisherId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${errors.publisherId ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300'}`}
              >
                <option value="">Chọn nhà xuất bản</option>
                {publishers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {errors.publisherId && <span className="text-rose-600 text-sm mt-1 block">{errors.publisherId}</span>}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Tags</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all border-gray-300"
                placeholder="Nhập tag..."
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
              >
                Thêm
              </button>
            </div>
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-gray-600 w-full mb-1">Gợi ý:</p>
                {suggestedTags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price & Stock */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Giá & Số lượng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê (VNĐ) *</label>
              <input
                type="number"
                name="rentalPrice"
                value={formData.rentalPrice}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${errors.rentalPrice ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300'}`}
              />
              {errors.rentalPrice && <span className="text-rose-600 text-sm mt-1 block">{errors.rentalPrice}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng trong kho</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isNewRelease"
              checked={formData.isNewRelease}
              onChange={handleChange}
              className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
            />
            <label className="text-sm font-medium text-gray-700">Đánh dấu là sách mới phát hành</label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/librarian/books')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={18} />
                Lưu sách
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

export default LibrarianAddBook;
