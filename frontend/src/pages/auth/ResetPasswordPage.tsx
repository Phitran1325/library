import React, { useState } from "react";
import { resetPassword } from "@/services/auth.api";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout, AuthInput } from "@/components/auth";
import { PrimaryButton } from "@/components/common";
import useNotification from "@/hooks/userNotification";

interface Errors {
  otpCode?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || ""; // Lấy email từ navigate state
  const { showSuccess, showError } = useNotification(); // ✅ Thêm notifications

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateOTP = (value: string): string | undefined => {
    if (!value.trim()) return "OTP không được bỏ trống!";
    if (!/^\d{6}$/.test(value)) return "OTP phải là 6 chữ số!";
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value.trim()) return "Mật khẩu không được bỏ trống!";
    if (!passwordRegex.test(value))
      return "Mật khẩu phải có ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt!";
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (value !== newPassword) return "Mật khẩu xác nhận không khớp!";
  };

  const handleBlur = (field: keyof Errors) => {
    const newErrors: Errors = { ...errors };
    if (field === "otpCode") newErrors.otpCode = validateOTP(otpCode);
    if (field === "newPassword")
      newErrors.newPassword = validatePassword(newPassword);
    if (field === "confirmPassword")
      newErrors.confirmPassword = validateConfirmPassword(confirmPassword);
    setErrors(newErrors);
  };

  const clearError = (field: keyof Errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Errors = {
      otpCode: validateOTP(otpCode),
      newPassword: validatePassword(newPassword),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };

    if (Object.values(newErrors).some((msg) => msg)) {
      setErrors(newErrors);
      showError('Vui lòng kiểm tra lại thông tin!'); // ✅ Thông báo lỗi validation
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await resetPassword(email, otpCode, newPassword, confirmPassword);

      // ✅ Thông báo thành công
      showSuccess("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");

      // Navigate về trang login sau 1 giây
      setTimeout(() => {
        navigate("/login");
      }, 1000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Reset password error:', err);

      // ✅ Xử lý và hiển thị lỗi
      const errorMessage = err.response?.data?.message
        || err.message
        || "Đặt lại mật khẩu thất bại! Vui lòng kiểm tra lại mã OTP.";

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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Đặt lại mật khẩu
        </h2>
        <p className="text-gray-600 text-sm">
          Nhập mã OTP và mật khẩu mới của bạn
        </p>
        {email && (
          <p className="text-blue-600 font-semibold mt-1">{email}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="text"
          placeholder="Mã OTP (6 chữ số)"
          value={otpCode}
          onChange={(e) =>
            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          onBlur={() => handleBlur("otpCode")}
          onFocus={() => clearError("otpCode")}
          error={errors.otpCode}
          disabled={isLoading}
        />

        <AuthInput
          type="password"
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={() => handleBlur("newPassword")}
          onFocus={() => clearError("newPassword")}
          error={errors.newPassword}
          disabled={isLoading}
          className="mt-4"
        />

        <AuthInput
          type="password"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          onFocus={() => clearError("confirmPassword")}
          error={errors.confirmPassword}
          disabled={isLoading}
          className="mt-4"
        />

        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
          ĐẶT LẠI MẬT KHẨU
        </PrimaryButton>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-sm text-gray-500 hover:text-blue-500 cursor-pointer"
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;