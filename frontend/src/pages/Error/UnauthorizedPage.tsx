import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Unauthorized Page (403 Forbidden)
 *
 * Displayed when user tries to access a route without proper permissions
 */
export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-6 rounded-full">
            <ShieldAlert className="w-24 h-24 text-red-600" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Truy Cập Bị Từ Chối
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-2">
          Bạn không có quyền truy cập vào trang này.
        </p>

        {isAuthenticated ? (
          <p className="text-gray-500 mb-8">
            Vai trò hiện tại của bạn: <span className="font-semibold capitalize">{userRole}</span>
            <br />
            Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
          </p>
        ) : (
          <p className="text-gray-500 mb-8">
            Vui lòng đăng nhập để tiếp tục.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay Lại
          </button>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors duration-200"
          >
            <Home className="w-5 h-5" />
            Về Trang Chủ
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">
            Cần hỗ trợ?{' '}
            <Link to="/contact" className="text-primary hover:underline">
              Liên hệ với chúng tôi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
