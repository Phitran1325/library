import { useState } from "react";
import { useProfile } from "../../hooks/useProfile";
import { formatDate } from "../../types";

import ProfileSidebar from "../../components/profile/ProfileSidebar";
import ProfileOverviewStats from "../../components/profile/ProfileOverviewStats";
import PersonalInfoForm from "../../components/profile/PersonalForm";
import ChangePasswordForm from "../../components/profile/ChangePasswordForm";

const ProfilePage = () => {
  const { user, isLoading, updateProfile, isUpdating, uploadAvatar, isUploading } = useProfile();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600 font-bold text-xs">
            LOADING
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-55/45 pb-12">
      {/* Banner */}
      <div className="h-70 relative overflow-hidden">
        <img
          src="/banner.jpg"
          className="absolute inset-0 w-full h-full object-fit"
          alt="Cover"
        />
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <ProfileSidebar
              user={user}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              uploadAvatar={uploadAvatar}
              isUploading={isUploading}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Stats Grid (chỉ hiện ở tab info) */}
            {activeTab === "info" && (
              <ProfileOverviewStats
                user={user}
                formatDate={formatDate}
              />
            )}

            {/* Card nội dung chính */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 min-h-[500px]">
              {activeTab === "info" && (
                <PersonalInfoForm
                  user={user}
                  updateProfile={updateProfile}
                  isUpdating={isUpdating}
                />
              )}

              {activeTab === "password" && <ChangePasswordForm />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;