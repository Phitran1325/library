import React from "react";

interface AuthInputProps {
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const AuthInput: React.FC<AuthInputProps> = ({
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={className}>
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full bg-blue-50 border ${
          error ? "border-red-500" : "border-gray-200"
        } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default AuthInput;