import React from "react";
import GoogleLoginButton from "../auth/GoogleLoginButton";

interface SocialLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ onSuccess, onError }) => {
  return (
    <div className="mt-5">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
        </div>
      </div>

      <div className="mt-4">
        <GoogleLoginButton onSuccess={onSuccess} onError={onError} />
      </div>
    </div>
  );
};

export default SocialLoginButton;