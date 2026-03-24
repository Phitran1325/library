// src/pages/Info/Guide.tsx

import { Link } from 'react-router-dom';
import { BookOpen, Search, ShoppingCart, Clock, CreditCard, Star } from 'lucide-react';

const Guide = () => {
    const steps = [
        {
            icon: <Search size={32} />,
            title: 'Tìm kiếm sách',
            description: 'Sử dụng thanh tìm kiếm để tìm sách theo tên, tác giả hoặc thể loại',
            details: [
                'Nhập từ khóa vào ô tìm kiếm trên header',
                'Chọn sách từ kết quả gợi ý',
                'Hoặc vào trang Danh sách sách để xem tất cả'
            ]
        },
        {
            icon: <BookOpen size={32} />,
            title: 'Xem chi tiết sách',
            description: 'Click vào sách để xem thông tin chi tiết, đánh giá và tình trạng',
            details: [
                'Xem mô tả, tác giả, nhà xuất bản',
                'Kiểm tra số lượng còn lại',
                'Đọc đánh giá từ người dùng khác'
            ]
        },
        {
            icon: <ShoppingCart size={32} />,
            title: 'Mượn sách',
            description: 'Chọn hình thức mượn phù hợp: Membership hoặc Rental',
            details: [
                'Membership: Mượn theo gói với thời hạn 14 ngày',
                'Rental: Mượn lẻ với phí theo ngày (1-7 ngày)',
                'Chọn số ngày và xác nhận'
            ]
        },
        {
            icon: <Clock size={32} />,
            title: 'Quản lý mượn sách',
            description: 'Theo dõi sách đang mượn và thời hạn trả',
            details: [
                'Vào "Danh sách mượn" để xem sách đang mượn',
                'Kiểm tra thời hạn trả còn lại',
                'Gia hạn nếu cần (chỉ Membership)'
            ]
        },
        {
            icon: <Star size={32} />,
            title: 'Đánh giá sách',
            description: 'Chia sẻ trải nghiệm của bạn sau khi đọc',
            details: [
                'Vào trang sách đã mượn',
                'Click nút "Đánh giá"',
                'Cho điểm và viết nhận xét'
            ]
        },
        {
            icon: <CreditCard size={32} />,
            title: 'Thanh toán phí',
            description: 'Thanh toán phí trễ hạn hoặc phí hư hỏng nếu có',
            details: [
                'Vào "Thanh toán phí" trong menu',
                'Xem danh sách phí cần thanh toán',
                'Chọn phương thức và hoàn tất thanh toán'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 relative overflow-hidden">
            {/* Decorative blur circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-8 py-6 border border-blue-100">
                        <h1 className="text-4xl font-bold text-text mb-4">
                            Hướng dẫn sử dụng
                        </h1>
                        <p className="text-text-light text-lg">
                            Cách sử dụng hệ thống thư viện một cách dễ dàng và hiệu quả
                        </p>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>
                </div>

                {/* Quick Start */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 mb-12 border-l-4 border-blue-500">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                        <Star className="text-blue-600" size={28} />
                        Bắt đầu nhanh
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-blue-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-blue-600">1</span>
                            </div>
                            <h3 className="font-semibold text-text mb-2">Đăng ký tài khoản</h3>
                            <p className="text-sm text-text-light">Tạo tài khoản miễn phí để bắt đầu sử dụng</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-purple-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-purple-600">2</span>
                            </div>
                            <h3 className="font-semibold text-text mb-2">Tìm sách yêu thích</h3>
                            <p className="text-sm text-text-light">Duyệt qua hàng nghìn đầu sách</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-green-100">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-green-600">3</span>
                            </div>
                            <h3 className="font-semibold text-text mb-2">Mượn và đọc</h3>
                            <p className="text-sm text-text-light">Chọn hình thức mượn và bắt đầu đọc</p>
                        </div>
                    </div>
                </div>

                {/* Step by Step Guide */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-text mb-8 text-center">
                        Hướng dẫn chi tiết
                    </h2>

                    {steps.map((step, index) => (
                        <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-blue-100">
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    {step.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl font-bold text-primary">
                                            Bước {index + 1}
                                        </span>
                                        <h3 className="text-xl font-bold text-text">
                                            {step.title}
                                        </h3>
                                    </div>
                                    <p className="text-text-light mb-4">{step.description}</p>
                                    <ul className="space-y-2">
                                        {step.details.map((detail, i) => (
                                            <li key={i} className="flex items-start gap-2 text-text-light">
                                                <span className="text-primary mt-1">✓</span>
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tips */}
                <div className="mt-12 bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
                        <Star className="text-primary" size={24} />
                        Mẹo sử dụng
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="font-semibold text-text mb-2">Tìm kiếm nhanh</h3>
                            <p className="text-text-light text-sm">
                                Sử dụng thanh tìm kiếm trên header để tìm sách nhanh chóng mọi lúc mọi nơi
                            </p>
                        </div>
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="font-semibold text-text mb-2">Đặt mượn trước</h3>
                            <p className="text-text-light text-sm">
                                Nếu sách đang hết, bạn có thể đặt mượn trước để được ưu tiên khi có sẵn
                            </p>
                        </div>
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="font-semibold text-text mb-2">Gói Membership</h3>
                            <p className="text-text-light text-sm">
                                Đăng ký gói thành viên để mượn sách miễn phí với nhiều quyền lợi hấp dẫn
                            </p>
                        </div>
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="font-semibold text-text mb-2">Nhận thông báo</h3>
                            <p className="text-text-light text-sm">
                                Bật thông báo để nhận nhắc nhở về hạn trả sách và sách yêu thích có sẵn
                            </p>
                        </div>
                    </div>
                </div>

                {/* Need Help */}
                <div className="mt-8 bg-white border-l-4 border-primary rounded-lg shadow-md p-6 text-center">
                    <h3 className="text-xl font-bold text-text mb-2">
                        Cần hỗ trợ thêm?
                    </h3>
                    <p className="text-text-light mb-4">
                        Liên hệ với chúng tôi qua hotline hoặc email để được hỗ trợ chi tiết
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            to="/contact"
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Liên hệ ngay
                        </Link>
                        <Link
                            to="/faq"
                            className="px-6 py-2 border border-border text-text bg-secondary rounded-lg hover:bg-primary/10 transition-colors"
                        >
                            Xem FAQ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Guide;
