import React, { useState, useRef, useEffect } from 'react';
import { Home, LogOut, User, ChevronDown, Repeat2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../../layouts/components/NotificationDropdown';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const AdminHeader: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Không render nếu chưa authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Đóng menu khi click bên ngoài
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

  const handleLogout = () => {
    setShowLogoutDialog(true);
    setShowUserMenu(false);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleGoHome = () => {
    navigate('/');
    setShowUserMenu(false);
  };

  const handleGoLibrarian = () => {
    navigate('/librarian');
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản Trị Hệ Thống</h1>
            <p className="text-sm text-gray-500">Xin chào, {user?.fullName}</p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Home Button */}
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Về trang chủ"
            >
              <Home size={18} />
              <span className="hidden sm:inline">Trang chủ</span>
            </button>

            {/* Switch to Librarian workspace */}
            <button
              onClick={handleGoLibrarian}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              title="Chuyển sang trang quản lý Thủ thư"
            >
              <Repeat2 size={18} />
              <span>Trang Thủ thư</span>
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium hidden lg:inline">{user?.fullName}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[220px] overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize font-medium">
                      {user?.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleGoHome}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Home size={16} />
                      <span>Về trang chủ</span>
                    </button>

                    <button
                      onClick={handleGoLibrarian}
                      className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <Repeat2 size={16} />
                      <span>Đi tới trang Thủ thư</span>
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={showLogoutDialog}
        onClose={cancelLogout}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          fontSize: '1.125rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          pb: 1
        }}>
          Xác nhận đăng xuất
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            color: '#6b7280',
            fontSize: '0.9375rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            Bạn có chắc muốn đăng xuất?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={cancelLogout}
            sx={{
              textTransform: 'none',
              color: '#6b7280',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2.5,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              '&:hover': {
                bgcolor: '#f3f4f6'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            color="error"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2.5,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            Đăng xuất
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  );
};

export default AdminHeader;
