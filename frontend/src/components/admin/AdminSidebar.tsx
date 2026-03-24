import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, CreditCard, BarChart3 } from 'lucide-react';
import {
  BookOpen,
  // Users,
  // User,
  // FileText,
  // Package,
  // Settings,
  ChevronLeft,
  ChevronRight,
  Tags,
  Building2,
  PenSquare,
  // ShieldCheck,
  History,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Không render nếu chưa authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const menuItems = [
    { path: '/admin', label: 'Trang Chủ', icon: BookOpen },
    { path: '/admin/book-statistics', label: 'Thống Kê Sách', icon: BarChart3 },
    { path: '/admin/categories', label: 'Thể Loại', icon: Tags },
    { path: '/admin/publishers', label: 'Nhà Xuất Bản', icon: Building2 },
    { path: '/admin/authors', label: 'Tác Giả', icon: PenSquare },
    { path: '/admin/users', label: 'Quản Lý Người Dùng', icon: Users },
    { path: '/admin/users/statistics', label: 'Thống Kê Người Dùng', icon: CreditCard },
    // { path: '/admin/borrow-eligibility', label: 'Kiểm Tra Mượn', icon: ShieldCheck },
    { path: '/admin/membership-history', label: 'Lịch Sử Thành Viên', icon: History },
    { path: '/admin/ebook-reports', label: 'Báo Cáo Ebook', icon: FileText },
    // { path: '/admin/staff', label: 'Quản Lý Nhân Viên', icon: Users },
    // { path: '/admin/customers', label: 'Quản Lý Khách Hàng', icon: User },
    // { path: '/admin/orders', label: 'Quản Lý Hóa Đơn', icon: FileText },
    // { path: '/admin/inventory', label: 'Quản Lý Kho', icon: Package },
    // { path: '/admin/settings', label: 'Cài Đặt', icon: Settings },
  ];

  // Choose the most specific matching menu item (longest path) so only one item is active
  const activeItem = menuItems.reduce((best: any, it) => {
    if (location.pathname === it.path || location.pathname.startsWith(`${it.path}/`)) {
      if (!best || it.path.length > best.path.length) return it;
    }
    return best;
  }, null as any);

  return (
    <div className={`admin-sidebar bg-gray-800 text-white transition-all duration-300 fixed left-0 top-0 h-full z-50 ${isOpen ? 'w-64' : 'w-16'
      }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {isOpen && (
            <h2 className="text-base font-medium" style={{ letterSpacing: '-0.01em' }}>Trang Quản Lý</h2>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem?.path === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm transition-colors hover:bg-gray-700 ${isActive
                ? 'bg-gray-700 border-r-4 border-blue-500 text-white active'
                : 'text-gray-300 hover:text-white'
                }`}
              style={{ fontWeight: isActive ? 600 : 400, letterSpacing: '-0.01em' }}
            >
              <Icon size={28} className="flex-shrink-0" />
              {isOpen && (
                <span className="ml-3">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
