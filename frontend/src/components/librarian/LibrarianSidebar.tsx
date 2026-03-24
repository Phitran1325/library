import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BookCopy,
  Settings,
  DollarSign,
  Users,
  Bell,
  BookMarked,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LibrarianSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const LibrarianSidebar: React.FC<LibrarianSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Không render nếu chưa authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const menuItems: MenuItem[] = [
    {
      path: '/librarian',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/librarian/books',
      label: 'Quản Lý Sách',
      icon: BookOpen
    },
    {
      path: '/librarian/book-copies',
      label: 'Quản Lý Trạng Thái Sách',
      icon: Settings
    },
    {
      path: '/librarian/borrows',
      label: 'Quản Lý Mượn Trả',
      icon: BookCopy
    },
    {
      path: '/librarian/reminders',
      label: 'Quản Lý Nhắc Nhở',
      icon: Bell
    },
    {
      path: '/librarian/reservations',
      label: 'Quản Lý Đặt Trước',
      icon: BookMarked
    },
    {
      path: '/librarian/debt-payments',
      label: 'Thanh Toán Phí Nợ',
      icon: DollarSign
    },
    {
      path: '/librarian/memberships',
      label: 'Đăng Ký Thành Viên',
      icon: Users
    },
    {
      path: '/librarian/ebook-reports',
      label: 'Báo Cáo Ebook',
      icon: FileText
    },
  ];

  // Choose the most specific matching menu item (longest path) so only one item is active
  const activeItem: MenuItem | null = menuItems.reduce((best: MenuItem | null, it) => {
    if (location.pathname === it.path || location.pathname.startsWith(`${it.path}/`)) {
      if (!best || it.path.length > best.path.length) return it;
    }
    return best;
  }, null as MenuItem | null);

  return (
    <div className={`librarian-sidebar bg-gray-800 text-white transition-all duration-300 fixed left-0 top-0 h-full z-50 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {isOpen && (
            <h2 className="text-lg font-semibold">Quản Lý Thư Viện</h2>
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
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem?.path === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-700 ${
                isActive
                  ? 'bg-gray-700 border-r-4 border-blue-500 active'
                  : 'text-gray-300 hover:text-white'
              }`}
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

export default LibrarianSidebar;
