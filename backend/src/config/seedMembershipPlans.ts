import MembershipPlan from '../models/MembershipPlan';

type UpsertPlanInput = {
  name: string;
  description: string;
  price: number;
  duration: number; // months
  maxBorrows: number; // 0 = unlimited per policy
  maxConcurrentBorrows: number;
  discountRate: number; // percent
  features?: string[];
};

async function upsertPlan(matchByName: string, data: UpsertPlanInput) {
  await MembershipPlan.updateOne(
    { name: matchByName },
    {
      $set: {
        ...data,
        isActive: true
      }
    },
    { upsert: true }
  );
}

export async function seedMembershipPlans(): Promise<void> {
  // Xóa các gói cũ để đảm bảo chỉ còn một gói duy nhất
  await MembershipPlan.deleteMany({ name: { $ne: 'Gói thành viên (Membership)' } });

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
      'Có thể mượn sách Premium và được ưu tiên xử lý',
      'Tải ebook và sách điện tử miễn phí'
    ]
  });
}


