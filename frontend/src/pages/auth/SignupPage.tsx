import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "@/services/auth.api";
import { AuthLayout, AuthTabs, AuthInput } from "@/components/auth";
import { PrimaryButton, SocialLoginButton } from "@/components/common";
import useNotification from "@/hooks/userNotification";

interface Errors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification(); // ✅ Thêm showError và showInfo

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateFullName = (value: string): string | undefined => {
    if (!value.trim()) return "Họ và tên không được bỏ trống!";
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email không được bỏ trống!";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Email không hợp lệ!";
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value.trim()) return "Mật khẩu không được bỏ trống!";
    if (!passwordRegex.test(value))
      return "Mật khẩu phải ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt!";
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (value !== password) return "Mật khẩu xác nhận không khớp!";
  };

  const handleBlur = (field: keyof Errors) => {
    const newErrors: Errors = { ...errors };
    if (field === "fullName") newErrors.fullName = validateFullName(fullName);
    if (field === "email") newErrors.email = validateEmail(email);
    if (field === "password") newErrors.password = validatePassword(password);
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
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };

    if (Object.values(newErrors).some((msg) => msg)) {
      setErrors(newErrors);
      showError('Vui lòng kiểm tra lại thông tin!'); // ✅ Hiển thị lỗi validation
      return;
    }

    setIsLoading(true);
    try {
      await signup(fullName, email, password, confirmPassword);

      // ✅ Hiển thị thông báo thành công
      showSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');

      // ✅ Thêm thông báo bổ sung
      showInfo('Mã OTP đã được gửi đến email của bạn.');

      // Navigate đến trang verify email và pass email qua state
      navigate("/verify-email", { state: { email } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Signup error:', err);

      // ✅ Hiển thị thông báo lỗi từ API hoặc lỗi mặc định
      const errorMessage = err.response?.data?.message
        || err.message
        || 'Lỗi khi đăng ký! Vui lòng thử lại.';

      showError(errorMessage);

      // Vẫn set error vào state để hiển thị dưới form nếu cần
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-md">
      <AuthTabs activeTab="signup" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="text"
          placeholder="Họ và tên"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => handleBlur("fullName")}
          onFocus={() => clearError("fullName")}
          error={errors.fullName}
        />

        <AuthInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur("email")}
          onFocus={() => clearError("email")}
          error={errors.email}
          className="mt-4"
        />

        <AuthInput
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur("password")}
          onFocus={() => clearError("password")}
          error={errors.password}
          className="mt-4"
        />

        <AuthInput
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          onFocus={() => clearError("confirmPassword")}
          error={errors.confirmPassword}
          className="mt-4"
        />

        {/* ✅ Có thể bỏ phần này nếu đã dùng toast notification */}
        {errors.general && (
          <p className="text-red-500 text-sm mt-1">{errors.general}</p>
        )}

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-5">
          ĐĂNG KÝ
        </PrimaryButton>
      </form>

      <SocialLoginButton />
    </AuthLayout>
  );
};

export default SignUpPage;