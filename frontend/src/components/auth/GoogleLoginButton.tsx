import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/common/Notification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  const handleGoogleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        tokenId: credential,
      });

      if (response.data.token && response.data.user) {
        // Login thành công
        login(response.data.user, response.data.token);
        showNotification('Đăng nhập Google thành công!', 'success');

        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect based on role
          const userRole = response.data.user.role;
          if (userRole === 'Admin') {
            navigate('/admin');
          } else if (userRole === 'Librarian') {
            navigate('/librarian');
          } else {
            navigate('/');
          }
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.message || 'Đăng nhập Google thất bại';
      showNotification(errorMessage, 'error');
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Kiểm tra client ID
    if (!clientId || clientId.trim() === '') {
      console.error('[GoogleLogin] VITE_GOOGLE_CLIENT_ID is not configured');
      showNotification(
        'Google Login chưa được cấu hình. Vui lòng thêm VITE_GOOGLE_CLIENT_ID vào file .env',
        'error'
      );
      return;
    }

    console.log('[GoogleLogin] Client ID:', clientId.substring(0, 20) + '...');

    // Kiểm tra nếu script đã được load
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    if (existingScript) {
      // Script đã load, khởi tạo ngay
      if (window.google) {
        initializeGoogleSignIn(clientId);
      }
      return;
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[GoogleLogin] Google SDK loaded successfully');
      if (window.google) {
        initializeGoogleSignIn(clientId);
      }
    };

    script.onerror = () => {
      console.error('[GoogleLogin] Failed to load Google SDK');
      showNotification('Không thể tải Google Login. Vui lòng thử lại.', 'error');
    };

    document.body.appendChild(script);

    return () => {
      // Không xóa script để tránh load lại nhiều lần
      // document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = (clientId: string) => {
    if (!window.google) {
      console.error('[GoogleLogin] window.google is not available');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          console.log('[GoogleLogin] Received credential from Google');
          handleGoogleLogin(response.credential);
        },
        auto_select: false,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 350,
          }
        );
        console.log('[GoogleLogin] Button rendered successfully');
      }
    } catch (error) {
      console.error('[GoogleLogin] Initialization error:', error);
      showNotification('Lỗi khởi tạo Google Login', 'error');
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = clientId && clientId.trim() !== '';

  return (
    <div className="w-full">
      {isConfigured ? (
        <>
          <div ref={googleButtonRef} className="flex justify-center"></div>
          {loading && (
            <div className="flex justify-center mt-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </>
      ) : (
        <div className="flex justify-center">
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-3 rounded-lg">
            <p className="text-center">
              Google Login chưa được cấu hình.
            </p>
            <p className="text-xs text-center mt-1">
              Vui lòng thêm <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> vào file .env
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
