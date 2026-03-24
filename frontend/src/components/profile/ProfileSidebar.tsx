// src/components/profile/ProfileSidebar.tsx
import React from "react";
import {
  User,
  Lock,
  Camera,
  Wallet,
  AlertTriangle,
} from "lucide-react";

type ProfileSidebarProps = {
  user: any;
  activeTab: "info" | "password";
  setActiveTab: (tab: "info" | "password") => void;
  uploadAvatar: (file: File) => void;
  isUploading: boolean;
};

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  uploadAvatar,
  isUploading,
}) => {
  return (
    <div className="space-y-6">
      {/* User Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 text-center relative">
          {/* Avatar */}
          <div className="relative inline-block mb-4 group">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl mx-auto ring-4 ring-indigo-50">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.fullName}&background=random&size=256`
                }
                alt={user?.fullName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <label className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2.5 rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95">
              <Camera size={18} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                }}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Info */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {user?.fullName}
          </h2>
          <p className="text-gray-500 text-sm mb-4 font-medium">
            {user?.email}
          </p>

          {/* Badges */}
          <div className="flex justify-center gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-100">
              {user?.role}
            </span>
            {user?.membershipPlanId && (
              <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider border border-amber-100">
                VIP
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-6">
          <nav className="space-y-1">
            {[
              { id: "info", icon: User, label: "Thông tin cá nhân" },
              { id: "password", icon: Lock, label: "Đổi mật khẩu" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as "info" | "password")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  size={18}
                  className={
                    activeTab === item.id ? "text-indigo-600" : "text-gray-400"
                  }
                />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mt-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          Tổng quan
        </h3>
        <div className="space-y-4">
          {/* Chi tiêu */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Wallet size={18} />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Chi tiêu
              </span>
            </div>
            <span className="font-bold text-gray-900">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(user?.totalSpent || 0)}
            </span>
          </div>

          {/* Vi phạm */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Vi phạm
              </span>
            </div>
            <span className="font-bold text-gray-900">
              {user?.violationCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
