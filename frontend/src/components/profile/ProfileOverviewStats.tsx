// src/components/profile/ProfileOverviewStats.tsx
import React from "react";
import { Award, CheckCircle2, XCircle, Calendar } from "lucide-react";

type ProfileOverviewStatsProps = {
  user: any;
  formatDate: (date: string) => string;
};

const ProfileOverviewStats: React.FC<ProfileOverviewStatsProps> = ({
  user,
  formatDate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Hạng thành viên */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
        <div className="relative">
          <p className="text-sm text-gray-500 font-medium mb-1">
            Hạng thành viên
          </p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {user?.membershipPlanId ? "Thành viên VIP" : "Thành viên thường"}
          </h3>
          <div className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
            <Award size={14} />
            <span>{user?.membershipPlanId ? "Premium" : "Standard"}</span>
          </div>
        </div>
      </div>

      {/* Trạng thái mượn */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
        <div className="relative">
          <p className="text-sm text-gray-500 font-medium mb-1">
            Trạng thái mượn
          </p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {user?.canBorrow ? "Được phép" : "Bị khóa"}
          </h3>
          <div
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
              user?.canBorrow
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
            }`}
          >
            {user?.canBorrow ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            <span>{user?.canBorrow ? "Active" : "Locked"}</span>
          </div>
        </div>
      </div>

      {/* Ngày tham gia */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
        <div className="relative">
          <p className="text-sm text-gray-500 font-medium mb-1">Ngày tham gia</p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {user?.createdAt ? formatDate(user.createdAt).split(" ")[0] : "N/A"}
          </h3>
          <div className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
            <Calendar size={14} />
            <span>Joined</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverviewStats;
