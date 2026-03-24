import React from "react";

interface PrimaryButtonProps {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  type = "button",
  onClick,
  disabled = false,
  isLoading = false,
  children,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? "Đang xử lý..." : children}
    </button>
  );
};

export default PrimaryButton;