// src/pages/Info/Rules.tsx

import { UserCheck, BookOpen, Shield, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const Rules = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 relative overflow-hidden">
            {/* Decorative blur circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-[1000px] mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-8 py-6 border border-blue-100">
                        <h1 className="text-4xl font-bold text-text mb-4">
                            Quy chế hoạt động
                        </h1>
                        <p className="text-text-light">
                            Vui lòng đọc kỹ quy chế trước khi sử dụng dịch vụ
                        </p>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 space-y-8 border border-blue-100">

                    {/* Section 1 */}
                    <div>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                            <UserCheck className="text-primary" size={28} />
                            <span>1. Điều kiện thành viên</span>
                        </h2>
                        <ul className="space-y-3 ml-6">
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-text-light">Đăng ký tài khoản với thông tin chính xác</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-text-light">Cung cấp email hợp lệ để nhận thông báo</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-text-light">Tuân thủ quy định và chính sách của thư viện</span>
                            </li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                            <BookOpen className="text-primary" size={28} />
                            <span>2. Quy định mượn sách</span>
                        </h2>
                        <div className="space-y-4 ml-6">
                            <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                                    <BookOpen className="text-primary" size={18} />
                                    Mượn theo gói Membership:
                                </h3>
                                <ul className="space-y-2 text-text-light ml-6">
                                    <li>• Thời hạn mượn: 14 ngày</li>
                                    <li>• Số sách mượn đồng thời: Tối đa 5 cuốn</li>
                                    <li>• Gia hạn: Tối đa 2 lần, mỗi lần 7 ngày</li>
                                    <li>• Phí phạt trễ hạn: 3,000 VNĐ/ngày/cuốn</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                                    <DollarSign className="text-primary" size={18} />
                                    Mượn lẻ (Rental):
                                </h3>
                                <ul className="space-y-2 text-text-light ml-6">
                                    <li>• Thời hạn: 1-7 ngày (tùy chọn)</li>
                                    <li>• Phí thuê: Theo giá niêm yết/ngày</li>
                                    <li>• Không được gia hạn</li>
                                    <li>• Phải thanh toán trước khi nhận sách</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                            <Shield className="text-primary" size={28} />
                            <span>3. Trách nhiệm người mượn</span>
                        </h2>
                        <ul className="space-y-3 ml-6">
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-text-light">
                                    <strong className="text-text">Giữ gìn sách:</strong> Bảo quản sách trong tình trạng tốt, không làm rách, gấp góc, viết vẽ
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-gray-700">
                                    <strong>Trả đúng hạn:</strong> Trả sách đúng thời hạn để tránh phí phạt
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-gray-700">
                                    <strong>Bồi thường:</strong> Nếu làm mất hoặc hỏng sách, phải bồi thường 150% giá trị sách
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Section 4 */}
                    <div>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <Clock className="text-primary" size={28} />
                            <span className="text-primary">4.</span>
                            Đặt mượn trước
                        </h2>
                        <ul className="space-y-3 ml-6 text-text-light">
                            <li>• Có thể đặt trước sách đang được mượn bởi người khác</li>
                            <li>• Thời gian giữ sách sau khi có sẵn: 72 giờ</li>
                            <li>• Sẽ nhận thông báo qua email khi sách có sẵn</li>
                            <li>• Nếu không đến lấy sau 72h, đặt trước sẽ bị hủy</li>
                        </ul>
                    </div>

                    {/* Section 5 */}
                    <div>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <DollarSign className="text-primary" size={28} />
                            <span className="text-primary">5.</span>
                            Phí và thanh toán
                        </h2>
                        <ul className="space-y-3 ml-6 text-text-light">
                            <li>• Phí thành viên: 200,000 VNĐ/tháng</li>
                            <li>• Phí trễ hạn: 3,000 VNĐ/ngày</li>
                            <li>• Phí hư hỏng: Tùy mức độ, tối đa 150% giá sách</li>
                            <li>• Thanh toán qua: Chuyển khoản, ví điện tử, tiền mặt</li>
                        </ul>
                    </div>

                    {/* Section 6 */}
                    <div className="border-t border-border pt-6">
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-primary" size={28} />
                            <span className="text-primary">6.</span>
                            Quyền của thư viện
                        </h2>
                        <ul className="space-y-3 ml-6 text-text-light">
                            <li>• Từ chối cho mượn nếu vi phạm quy định</li>
                            <li>• Khóa tài khoản nếu vi phạm nghiêm trọng</li>
                            <li>• Thay đổi quy định khi cần thiết (có thông báo trước)</li>
                            <li>• Thu hồi sách nếu phát hiện hư hỏng nghiêm trọng</li>
                        </ul>
                    </div>

                    {/* Notice */}
                    <div className="bg-white border-l-4 border-primary p-6 rounded shadow-md">
                        <p className="text-text font-semibold mb-2 flex items-center gap-2">
                            <Shield className="text-primary" size={20} />
                            Lưu ý quan trọng:
                        </p>
                        <p className="text-text-light text-sm leading-relaxed">
                            Việc sử dụng dịch vụ của thư viện đồng nghĩa với việc bạn đã đọc,
                            hiểu và đồng ý tuân thủ các quy định trên. Mọi vi phạm sẽ bị xử lý
                            theo quy chế và có thể bị tính phí bồi thường.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rules;
