import React from "react";
import { useNavigate } from "react-router-dom";

interface AuthTabsProps {
  activeTab: "login" | "signup";
}

const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center mb-6 border-b">
      <button
        onClick={() => navigate("/login")}
        className={`pb-2 px-4 cursor-pointer ${
          activeTab === "login"
            ? "font-semibold text-blue-600 border-b-2 border-blue-600"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        LOGIN
      </button>
      <button
        onClick={() => navigate("/signup")}
        type="button"
        className={`pb-2 px-4 cursor-pointer ${
          activeTab === "signup"
            ? "font-semibold text-blue-600 border-b-2 border-blue-600"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        SIGN UP
      </button>
    </div>
  );
};

export default AuthTabs;