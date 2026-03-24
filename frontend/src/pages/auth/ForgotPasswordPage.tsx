import React, { useState } from "react";
import { forgotPassword } from "@/services/auth.api";
import { useNavigate } from "react-router-dom";
import { AuthLayout, AuthInput, AuthLinks } from "@/components/auth";
import { PrimaryButton } from "@/components/common";
import useNotification from "@/hooks/userNotification";

interface Errors {
  email?: string;
  general?: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification(); // ✅ Thêm notifications

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email không được bỏ trống!";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Email không hợp lệ!";
  };

  const handleBlur = () => {
    const newErrors: Errors = { ...errors };
    newErrors.email = validateEmail(email);
    setErrors(newErrors);
  };

  const clearError = () => {
    setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);

    if (emailError) {
      setErrors({ email: emailError });
      showError('Vui lòng nhập email hợp lệ!'); // ✅ Thông báo lỗi validation
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await forgotPassword(email);

      // ✅ Thông báo thành công
      showSuccess('Đã gửi mã OTP đến email của bạn!');
      showInfo('Vui lòng kiểm tra hộp thư đến hoặc thư rác.'); // ✅ Thông tin bổ sung

      // Navigate đến trang reset password và pass email qua state
      navigate("/reset-password", { state: { email } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Forgot password error:', err);

      // ✅ Xử lý và hiển thị lỗi
      const errorMessage = err.response?.data?.message
        || err.message
        || "Gửi email thất bại! Vui lòng thử lại.";

      showError(errorMessage);
      setErrors({ general: errorMessage });

    } finally {
      setIsLoading(false);
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
          Quên mật khẩu?
        </h2>
        <p className="text-gray-600 text-sm">
          Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleBlur}
          onFocus={clearError}
          error={errors.email}
          disabled={isLoading}
        />

        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
          GỬI MÃ OTP
        </PrimaryButton>
      </form>

      <AuthLinks showLogin showSignup showHome className="mt-6" />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;