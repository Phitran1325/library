import React from 'react';
import { UserCheck } from 'lucide-react';

interface MembershipCardProps {
    withMembership: number;
    withoutMembership: number;
    activeSubscriptions: number;
    newUsers30Days: number;
}

const MembershipCard: React.FC<MembershipCardProps> = ({
    withMembership,
    withoutMembership,
    activeSubscriptions,
    newUsers30Days,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Thành viên</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Có gói thành viên</span>
                    <span className="text-lg font-bold text-purple-600">{withMembership}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Chưa có gói</span>
                    <span className="text-lg font-bold text-gray-600">{withoutMembership}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Đang hoạt động</span>
                    <span className="text-lg font-bold text-green-600">{activeSubscriptions}</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Người dùng mới (30 ngày)</p>
                    <p className="text-xl font-bold text-blue-600">{newUsers30Days}</p>
                </div>
            </div>
        </div>
    );
};

export default MembershipCard;
