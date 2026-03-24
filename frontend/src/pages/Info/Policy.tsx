// src/pages/Info/Policy.tsx
import { Lock, FileText, DollarSign, Copyright, Scale, Phone, AlertTriangle } from 'lucide-react';

const Policy = () => {
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
                            Chính sách & Điều khoản
                        </h1>
                        <p className="text-text-light">
                            Cập nhật lần cuối: Tháng 12, 2025
                        </p>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 space-y-10 border border-blue-100">

                    {/* Privacy Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <Lock className="text-primary" size={28} />
                            Chính sách bảo mật
                        </h2>

                        <div className="space-y-4 text-text-light">
                            <div>
                                <h3 className="font-semibold text-text mb-2">Thu thập thông tin</h3>
                                <p className="ml-4">
                                    Chúng tôi thu thập thông tin cá nhân (họ tên, email, số điện thoại) khi bạn đăng ký tài khoản.
                                    Thông tin này chỉ được sử dụng cho mục đích quản lý tài khoản và cung cấp dịch vụ.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Sử dụng thông tin</h3>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li>Quản lý tài khoản và dịch vụ mượn sách</li>
                                    <li>Gửi thông báo về trạng thái mượn sách, phí thanh toán</li>
                                    <li>Cải thiện trải nghiệm người dùng</li>
                                    <li>Gửi thông tin về chương trình khuyến mãi (nếu đồng ý)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Bảo vệ thông tin</h3>
                                <p className="ml-4">
                                    Chúng tôi cam kết bảo mật thông tin cá nhân của bạn. Dữ liệu được mã hóa và lưu trữ an toàn.
                                    Chúng tôi không bán hoặc chia sẻ thông tin cá nhân với bên thứ ba mà không có sự đồng ý của bạn.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Terms of Service */}
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <FileText className="text-primary" size={28} />
                            Điều khoản sử dụng
                        </h2>

                        <div className="space-y-4 text-text-light">
                            <div>
                                <h3 className="font-semibold text-text mb-2">Chấp nhận điều khoản</h3>
                                <p className="ml-4">
                                    Bằng việc sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
                                    Nếu không đồng ý, vui lòng không sử dụng dịch vụ.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Quyền và trách nhiệm người dùng</h3>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li>Cung cấp thông tin chính xác khi đăng ký</li>
                                    <li>Bảo mật thông tin tài khoản (mật khẩu)</li>
                                    <li>Tuân thủ quy định về mượn và trả sách</li>
                                    <li>Thanh toán đầy đủ các khoản phí phát sinh</li>
                                    <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Quyền của thư viện</h3>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li>Từ chối hoặc tạm ngưng dịch vụ nếu vi phạm quy định</li>
                                    <li>Thay đổi điều khoản và chính sách (có thông báo trước)</li>
                                    <li>Thu hồi sách nếu cần thiết</li>
                                    <li>Khóa tài khoản có hành vi gian lận</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Refund Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <DollarSign className="text-primary" size={28} />
                            Chính sách hoàn tiền
                        </h2>

                        <div className="space-y-4 text-text-light">
                            <div>
                                <h3 className="font-semibold text-text mb-2">Gói Membership</h3>
                                <p className="ml-4">
                                    Phí thành viên không được hoàn lại sau khi kích hoạt. Trong trường hợp lỗi hệ thống,
                                    vui lòng liên hệ để được hỗ trợ trong vòng 7 ngày.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Phí thuê sách (Rental)</h3>
                                <p className="ml-4">
                                    Phí thuê không được hoàn lại sau khi xác nhận đặt sách. Nếu thư viện không thể cung cấp sách,
                                    toàn bộ phí sẽ được hoàn lại.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Phí phạt</h3>
                                <p className="ml-4">
                                    Phí phạt trễ hạn hoặc hư hỏng sách không được hoàn lại. Nếu có tranh chấp,
                                    vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Copyright */}
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <Copyright className="text-primary" size={28} />
                            Bản quyền
                        </h2>

                        <div className="space-y-4 text-text-light">
                            <p className="ml-4">
                                Tất cả nội dung trên website (bao gồm văn bản, hình ảnh, logo, thiết kế) thuộc quyền sở hữu
                                của Library Management System. Nghiêm cấm sao chép, phân phối hoặc sử dụng cho mục đích thương mại
                                mà không có sự cho phép.
                            </p>

                            <div>
                                <h3 className="font-semibold text-text mb-2">Nội dung sách</h3>
                                <p className="ml-4">
                                    Sách và nội dung sách thuộc bản quyền của tác giả và nhà xuất bản. Người mượn không được sao chép,
                                    phân phối hoặc sử dụng nội dung sách cho mục đích thương mại.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <Scale className="text-primary" size={28} />
                            Giới hạn trách nhiệm
                        </h2>

                        <div className="space-y-4 text-text-light">
                            <p className="ml-4">
                                Thư viện không chịu trách nhiệm về:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Mất mát hoặc hư hỏng dữ liệu cá nhân do lỗi người dùng</li>
                                <li>Tình trạng sách (đã được kiểm tra trước khi cho mượn)</li>
                                <li>Nội dung sách và quan điểm của tác giả</li>
                                <li>Gián đoạn dịch vụ do sự cố kỹ thuật hoặc bất khả kháng</li>
                            </ul>
                        </div>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                            <Phone className="text-primary" size={28} />
                            Liên hệ
                        </h2>

                        <div className="space-y-2 text-text-light ml-4">
                            <p>Nếu bạn có bất kỳ thắc mắc nào về chính sách này, vui lòng liên hệ:</p>
                            <ul className="space-y-1">
                                <li><strong className="text-text">Email:</strong> support@example.com</li>
                                <li><strong className="text-text">Hotline:</strong> (028) 1234 5678</li>
                                <li><strong className="text-text">Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</li>
                            </ul>
                        </div>
                    </section>

                    {/* Agreement */}
                    <div className="bg-white border-l-4 border-primary p-6 rounded mt-8 shadow-md">
                        <p className="text-text font-semibold mb-2 flex items-center gap-2">
                            <AlertTriangle className="text-primary" size={20} />
                            Lưu ý quan trọng
                        </p>
                        <p className="text-text-light text-sm leading-relaxed">
                            Việc tiếp tục sử dụng dịch vụ của chúng tôi có nghĩa là bạn đã đọc, hiểu và đồng ý
                            với tất cả các điều khoản và chính sách được nêu trong tài liệu này. Chúng tôi có quyền
                            cập nhật các điều khoản và sẽ thông báo cho người dùng trước khi các thay đổi có hiệu lực.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Policy;
