import React from "react";
import { useNavigate } from "react-router-dom";

interface AuthLinksProps {
  showSignup?: boolean;
  showLogin?: boolean;
  showHome?: boolean;
  className?: string;
}

const AuthLinks: React.FC<AuthLinksProps> = ({
  showSignup = true,
  showLogin = false,
  showHome = true,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:justify-between items-center text-sm text-gray-500 mt-4 gap-2 sm:gap-0 ${className}`}
    >
      {showLogin && (
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"
        >
          ← Quay lại đăng nhập
        </button>
      )}
      {showSignup && (
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"
        >
          <span>＋</span> Đăng ký tài khoản
        </button>
      )}
      {showHome && (
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"
        >
          🎧 Về trang chủ
        </button>
      )}
    </div>
  );
};

export default AuthLinks;