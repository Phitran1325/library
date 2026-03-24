import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';

const BookManagement: React.FC = () => {
  return (
    <div className="space-y-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800" style={{ letterSpacing: '-0.02em' }}>Quản Lý Sách</h1>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 flex items-center transition-all shadow-sm hover:shadow-md" style={{ fontWeight: 500, fontSize: '0.9375rem' }}>
          <Plus size={20} className="mr-2" />
          Thêm sách mới
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md" style={{ fontWeight: 500, fontSize: '0.9375rem' }}>
            <Search size={18} className="mr-2" />
            Tìm kiếm
          </button>
          <button className="flex items-center px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all" style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#374151' }}>
            <Filter size={18} className="mr-2" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Chức năng quản lý sách sẽ được phát triển ở đây</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookManagement;
