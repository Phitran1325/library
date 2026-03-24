import React from 'react';
import { Users } from 'lucide-react';

interface UserRolesCardProps {
    admin: number;
    librarian: number;
    reader: number;
    active: number;
    suspended: number;
    banned: number;
}

const UserRolesCard: React.FC<UserRolesCardProps> = ({
    admin,
    librarian,
    reader,
    active,
    suspended,
    banned,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Phân loại người dùng</h3>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Quản trị viên</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{admin}</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Thủ thư</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{librarian}</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Độc giả</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{reader}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Đang hoạt động</span>
                        <span className="text-base font-bold text-green-600">{active}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bị tạm khóa</span>
                        <span className="text-base font-bold text-orange-600">{suspended}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bị cấm</span>
                        <span className="text-base font-bold text-red-600">{banned}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRolesCard;
