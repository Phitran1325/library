// src/pages/Info/FAQ.tsx

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, User, CreditCard, Star, HelpCircle, Library } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const faqs: FAQItem[] = [
        {
            category: 'account',
            question: 'Làm thế nào để đăng ký tài khoản?',
            answer: 'Bạn click vào nút "Đăng ký" trên trang chủ, điền đầy đủ thông tin (email, mật khẩu, họ tên) và xác nhận email để kích hoạt tài khoản.'
        },
        {
            category: 'account',
            question: 'Quên mật khẩu phải làm sao?',
            answer: 'Click vào "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu về email của bạn.'
        },
        {
            category: 'borrowing',
            question: 'Sự khác biệt giữa Membership và Rental?',
            answer: 'Membership là gói thành viên trả phí hàng tháng, cho phép mượn sách miễn phí trong 14 ngày. Rental là thuê sách theo ngày (1-7 ngày) với phí tính theo giá niêm yết.'
        },
        {
            category: 'borrowing',
            question: 'Có thể mượn bao nhiêu sách cùng lúc?',
            answer: 'Với gói Membership, bạn có thể mượn tối đa 5 cuốn cùng lúc. Với Rental không giới hạn số lượng nhưng phải trả phí cho mỗi cuốn.'
        },
        {
            category: 'borrowing',
            question: 'Có thể gia hạn sách không?',
            answer: 'Chỉ sách mượn theo Membership mới được gia hạn, tối đa 2 lần, mỗi lần 7 ngày. Sách thuê Rental không được gia hạn.'
        },
        {
            category: 'borrowing',
            question: 'Làm sao để đặt mượn trước sách đang hết?',
            answer: 'Vào trang chi tiết sách, click nút "Đặt mượn trước". Khi sách có sẵn, bạn sẽ nhận thông báo qua email và có 72h để đến lấy sách.'
        },
        {
            category: 'payment',
            question: 'Phí trễ hạn là bao nhiêu?',
            answer: 'Phí trễ hạn là 3,000 VNĐ/ngày/cuốn. Phí sẽ được tính từ ngày hết hạn đến ngày trả sách thực tế.'
        },
        {
            category: 'payment',
            question: 'Phương thức thanh toán nào được chấp nhận?',
            answer: 'Chúng tôi chấp nhận chuyển khoản ngân hàng, ví điện tử (Momo, ZaloPay) và tiền mặt tại quầy thư viện.'
        },
        {
            category: 'payment',
            question: 'Làm sao để thanh toán phí trễ hạn?',
            answer: 'Vào mục "Thanh toán phí" trong menu, chọn các khoản phí cần thanh toán, chọn phương thức và hoàn tất thanh toán.'
        },
        {
            category: 'membership',
            question: 'Gói Membership có những quyền lợi gì?',
            answer: 'Gói Membership cho phép mượn sách miễn phí, thời hạn 14 ngày, được gia hạn 2 lần, mượn tối đa 5 cuốn cùng lúc, và được ưu tiên đặt mượn trước.'
        },
        {
            category: 'membership',
            question: 'Giá gói Membership là bao nhiêu?',
            answer: 'Hiện tại chúng tôi có nhiều gói: Cơ bản (200,000đ/tháng), Nâng cao (500,000đ/3 tháng), Cao cấp (1,500,000đ/năm).'
        },
        {
            category: 'membership',
            question: 'Có thể hủy Membership không?',
            answer: 'Có thể hủy bất kỳ lúc nào. Tuy nhiên phí đã thanh toán sẽ không được hoàn lại. Gói sẽ còn hiệu lực đến hết chu kỳ đã thanh toán.'
        },
        {
            category: 'other',
            question: 'Nếu làm mất hoặc hỏng sách phải làm sao?',
            answer: 'Bạn cần bồi thường 150% giá trị sách. Vui lòng liên hệ thư viện ngay để được hướng dẫn cụ thể.'
        },
        {
            category: 'other',
            question: 'Có thể đọc sách điện tử không?',
            answer: 'Có, một số sách có phiên bản điện tử. Bạn có thể đọc trực tiếp trên website sau khi mượn sách.'
        },
        {
            category: 'other',
            question: 'Giờ làm việc của thư viện?',
            answer: 'Thứ 2 - Thứ 6: 8:00 - 18:00. Thứ 7 - CN: 9:00 - 17:00. Nghỉ các ngày lễ, tết.'
        }
    ];

    const categories = [
        { id: 'all', label: 'Tất cả', Icon: Library },
        { id: 'account', label: 'Tài khoản', Icon: User },
        { id: 'borrowing', label: 'Mượn sách', Icon: BookOpen },
        { id: 'payment', label: 'Thanh toán', Icon: CreditCard },
        { id: 'membership', label: 'Gói thành viên', Icon: Star },
        { id: 'other', label: 'Khác', Icon: HelpCircle }
    ];

    const filteredFAQs = selectedCategory === 'all'
        ? faqs
        : faqs.filter(faq => faq.category === selectedCategory);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

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
                            Câu hỏi thường gặp
                        </h1>
                        <p className="text-text-light text-lg">
                            Tìm câu trả lời nhanh chóng cho các thắc mắc của bạn
                        </p>
                        <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-blue-100">
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Chủ đề</h2>
                    <div className="flex flex-wrap gap-3">
                        {categories.map((category) => {
                            const IconComponent = category.Icon;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${selectedCategory === category.id
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                            : 'bg-white text-text hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border border-blue-100'
                                        }`}
                                >
                                    <IconComponent size={18} />
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-blue-100"
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary transition-colors"
                                >
                                    <h3 className="text-lg font-semibold text-text pr-4">
                                        {faq.question}
                                    </h3>
                                    {openIndex === index ? (
                                        <ChevronUp className="text-primary shrink-0" size={24} />
                                    ) : (
                                        <ChevronDown className="text-text-light shrink-0" size={24} />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <div className="px-6 pb-4 pt-2 border-t border-border bg-secondary/30">
                                        <p className="text-text-light leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <HelpCircle className="mx-auto text-text-light mb-3" size={48} />
                            <p className="text-text-light">Không tìm thấy câu hỏi nào</p>
                        </div>
                    )}
                </div>

                {/* Contact Section */}
                <div className="mt-12 bg-white rounded-lg shadow-md p-8 border-l-4 border-primary">
                    <h2 className="text-2xl font-bold text-text mb-3 text-center">
                        Không tìm thấy câu trả lời?
                    </h2>
                    <p className="mb-6 text-text-light text-center">
                        Liên hệ với chúng tôi để được hỗ trợ trực tiếp
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="/contact"
                            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                        >
                            Liên hệ ngay
                        </a>
                        <a
                            href="/guide"
                            className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                        >
                            Xem hướng dẫn
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
