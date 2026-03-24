import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/components/common/book/ConfirmModal';
import NotificationDropdown from '@/layouts/components/NotificationDropdown';

const LibrarianHeader: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Không render nếu chưa authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setShowUserMenu(false);
    logout();
  };


  const handleGoHome = () => {
    navigate('/');
    setShowUserMenu(false);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Left Side - Welcome Message with Home Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
              title="Trở về trang chủ"
            >
              <Home size={18} />
              <span className="text-sm font-medium">Trang chủ</span>
            </button>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Trang Quản Lý Thủ Thư
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Chúc bạn làm việc hiệu quả
              </p>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationDropdown variant="light" />

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-3 py-2 pr-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'Thủ thư'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {user?.fullName ? getInitials(user.fullName) : <User size={18} />}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName || 'Thủ thư'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email || ''}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Thủ thư
                      </span>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={handleGoHome}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Home size={16} className="text-gray-500" />
                      Về trang chủ
                    </button>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <User size={16} className="text-gray-500" />
                      Thông tin cá nhân
                    </button>
                  </div>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
          title="Xác nhận đăng xuất"
          message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
          confirmText="Đăng xuất"
          cancelText="Hủy"
          type="warning"
        />
      )}
    </>
  );
};

export default LibrarianHeader;
