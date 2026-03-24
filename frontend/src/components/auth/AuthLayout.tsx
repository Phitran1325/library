import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  maxWidth = "max-w-sm",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-blue-100 to-blue-200 px-4">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} p-6 sm:p-8`}
      >
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;