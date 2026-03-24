"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMembershipPlans = seedMembershipPlans;
const MembershipPlan_1 = __importDefault(require("../models/MembershipPlan"));
async function upsertPlan(matchByName, data) {
    await MembershipPlan_1.default.updateOne({ name: matchByName }, {
        $set: {
            ...data,
            isActive: true
        }
    }, { upsert: true });
}
async function seedMembershipPlans() {
    // Xóa các gói cũ để đảm bảo chỉ còn một gói duy nhất
    await MembershipPlan_1.default.deleteMany({ name: { $ne: 'Gói thành viên (Membership)' } });
    await upsertPlan('Gói thành viên (Membership)', {
        name: 'Gói thành viên (Membership)',
        description: 'Một gói duy nhất cho tất cả thành viên thư viện với đặc quyền đầy đủ.',
        price: 200000,
        duration: 1,
        maxBorrows: 10,
        maxConcurrentBorrows: 5,
        discountRate: 0,
        features: [
            'Giá: 200.000 VNĐ/tháng',
            'Mượn tối đa 5 cuốn cùng lúc, mỗi cuốn 14 ngày',
            'Gia hạn tối đa 2 lần, mỗi lần +7 ngày',
            'Giới hạn 10 lượt mượn mỗi tháng',
            'Phí phạt trễ hạn: 3.000 VNĐ/ngày',
            'Đặt trước tối đa 5 sách, giữ trong 72 giờ',
            'Có thể mượn sách Premium và được ưu tiên xử lý'
        ]
    });
}
//# sourceMappingURL=seedMembershipPlans.js.map