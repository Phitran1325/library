import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

/**
 * Hook để validate token với backend
 * Chạy khi app khởi động và mỗi 5 phút 1 lần
 */
export const useTokenValidation = () => {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu không có token, không cần validate
    if (!token || !user) {
      return;
    }

    const validateToken = async () => {
      try {
        // Gọi API verify token (backend cần có endpoint này)
        // Hoặc gọi bất kỳ protected endpoint nào (ví dụ: /auth/me)
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = response.data.user;

        // Kiểm tra isActive từ backend response
        if (userData && userData.isActive === false) {
          console.warn('[useTokenValidation] Account is locked. Logging out...');
          logout();
          navigate('/login', {
            state: { message: 'Tài khoản của bạn đã bị khóa' }
          });
        }
      } catch (error: any) {
        // Nếu token invalid (401/403), logout
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('[useTokenValidation] Token invalid. Logging out...');
          logout();
          navigate('/login', {
            state: { message: 'Phiên đăng nhập đã hết hạn' }
          });
        }
      }
    };

    // Validate ngay khi mount
    validateToken();

    // Validate mỗi 5 phút
    const interval = setInterval(validateToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, user, logout, navigate]);
};
