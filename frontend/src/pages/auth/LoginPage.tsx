import React, { useState } from "react";
import { login } from "@/services/auth.api";
import { useNavigate } from "react-router-dom";
import {
  AuthLayout,
  AuthTabs,
  AuthInput,
  AuthLinks,
} from "@/components/auth";
import { PrimaryButton, SocialLoginButton } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import useNotification from "@/hooks/userNotification";

interface Errors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useNotification(); // ✅ Thêm showError

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email không được bỏ trống!";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Email không hợp lệ!";
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value.trim()) return "Mật khẩu không được bỏ trống!";
    if (!passwordRegex.test(value))
      return "Mật khẩu phải có ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt!";
  };

  const handleBlur = (field: "email" | "password") => {
    const newErrors: Errors = { ...errors };

    if (field === "email") newErrors.email = validateEmail(email);
    if (field === "password") newErrors.password = validatePassword(password);

    setErrors(newErrors);
  };

  const clearError = (field: "email" | "password") => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      showError('Vui lòng kiểm tra lại thông tin đăng nhập!'); // ✅ Thông báo lỗi validation
      return;
    }

    setIsLoading(true);
    try {
      const { token, user } = await login(email, password);

      // 🔍 DEBUG: Log backend response
      console.log('[LoginPage] Backend response:', {
        user,
        hasIsActive: 'isActive' in user,
        isActiveValue: user.isActive,
        status: user.status
      });

      // Lưu vào AuthContext
      authLogin(user, token);

      // ✅ Thông báo đăng nhập thành công
      showSuccess(`Xin chào ${user.fullName}! Đăng nhập thành công.`);
      navigate("/");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Login error:', err);

      // ✅ Xử lý và hiển thị lỗi từ API
      const errorMessage = err.response?.data?.message
        || err.message
        || "Đăng nhập thất bại! Vui lòng kiểm tra lại email và mật khẩu.";

      showError(errorMessage);
      setErrors({ general: errorMessage });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthTabs activeTab="login" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur("email")}
          onFocus={() => clearError("email")}
          error={errors.email}
        />

        <AuthInput
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur("password")}
          onFocus={() => clearError("password")}
          error={errors.password}
          className="mt-5"
        />

        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <div className="text-right">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-blue-500 text-sm hover:underline cursor-pointer"
          >
            Quên mật khẩu?
          </button>
        </div>

        <PrimaryButton type="submit" isLoading={isLoading}>
          ĐĂNG NHẬP
        </PrimaryButton>
      </form>

      <AuthLinks showSignup showHome />

      <SocialLoginButton />
    </AuthLayout>
  );
};

export default LoginPage;