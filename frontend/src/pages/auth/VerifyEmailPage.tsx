import React, { useState, useCallback } from "react";
import { verifyEmail, resendOTP } from "@/services/auth.api";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout, AuthInput } from "@/components/auth";
import { PrimaryButton } from "@/components/common";
import useNotification from "@/hooks/userNotification";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Errors {
  otpCode?: string;
  general?: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || ""; // Lấy email từ navigate state

  const [otpCode, setOtpCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const navigate = useNavigate();

  const {showSuccess, showError} =  useNotification();


  const validateOTP = (value: string): string | undefined => {
    if (!value.trim()) return "OTP không được bỏ trống!";
    if (!/^\d{6}$/.test(value)) return "OTP phải là 6 chữ số!";
  };

  const handleBlur = () => {
    setErrors({ ...errors, otpCode: validateOTP(otpCode) });
  };

  const clearError = () => {
    setErrors((prev) => ({ ...prev, otpCode: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpError = validateOTP(otpCode);
    if (otpError) {
      setErrors({ otpCode: otpError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await verifyEmail(email, otpCode);

      showSuccess("Xác thực email thành công!");
      navigate("/login");
    } catch (err: any) {
      setErrors({ general: err.message || "Xác thực thất bại!" });
      showError(err.message || "Xác thực thất bại!");

    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setErrors({});

    try {
      await resendOTP(email);
      showSuccess("Đã gửi lại mã OTP! Vui lòng kiểm tra email.");

    } catch (err: any) {
      const errorMessage = err.message || "Gửi lại OTP thất bại!";
      setErrors({ general: errorMessage });
      showError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Xác thực Email
        </h2>
        <p className="text-gray-600 text-sm">
          Chúng tôi đã gửi mã OTP (6 chữ số) đến email
        </p>
        <p className="text-blue-600 font-semibold mt-1">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="text"
          placeholder="Nhập mã OTP (6 chữ số)"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onBlur={handleBlur}
          onFocus={clearError}
          error={errors.otpCode}
          disabled={isLoading}
        />

        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
          XÁC THỰC
        </PrimaryButton>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600 mb-2">Không nhận được mã?</p>
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={isResending}
          className="text-blue-600 font-medium hover:text-blue-700 disabled:text-gray-400 cursor-pointer"
        >
          {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
        </button>
      </div>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-sm text-gray-500 hover:text-blue-500 cursor-pointer"
        >
          ← Quay lại đăng nhập
        </button>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {toast.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;