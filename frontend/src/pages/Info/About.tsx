// src/pages/Info/About.tsx

import { useState, useEffect } from 'react';
import { getDashboardStatistics } from '@/services/book.api';
import { Target, Eye, Briefcase, TrendingUp, BookOpen, Users, Star, Award } from 'lucide-react';

interface StatisticsData {
    totalBooks: number;
    totalReaders: number;
    totalBorrowsLast30Days: number;
    averageRating: number;
}

const About = () => {
    const [stats, setStats] = useState<StatisticsData>({
        totalBooks: 0,
        totalReaders: 0,
        totalBorrowsLast30Days: 0,
        averageRating: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                const data = await getDashboardStatistics();
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard statistics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    // Format number with thousands separator
    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K+`;
        }
        return num.toString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/10 to-purple-100/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-8 py-6 border border-blue-100">
                        <h1 className="text-4xl font-bold mb-4 text-text">
                            Giới thiệu về Thư viện
                        </h1>
                        <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>
                </div>                {/* Content */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 mb-12 border border-blue-50">
                    <h2 className="text-2xl font-bold text-text mb-6">
                        Chào mừng đến với Hệ thống Quản lý Thư viện
                    </h2>

                    <div className="space-y-10 text-text-light leading-relaxed">
                        <p className="text-lg text-text">
                            Thư viện của chúng tôi là một không gian tri thức hiện đại, nơi kết nối độc giả
                            với hàng nghìn đầu sách phong phú thuộc nhiều lĩnh vực khác nhau.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mb-1">
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Target className="text-blue-600" size={24} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-text">Sứ mệnh</h3>
                                </div>
                                <p>
                                    Xây dựng một cộng đồng yêu sách, khuyến khích văn hóa đọc và cung cấp
                                    dịch vụ thư viện chất lượng cao cho mọi người.
                                </p>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Eye className="text-purple-600" size={24} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-text">Tầm nhìn</h3>
                                </div>
                                <p>
                                    Trở thành thư viện số 1 về chất lượng dịch vụ và trải nghiệm người dùng,
                                    ứng dụng công nghệ hiện đại để phục vụ độc giả tốt nhất.
                                </p>
                            </div>
                        </div>

                        <div className="mb-1 p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Briefcase className="text-green-600" size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-text">Dịch vụ của chúng tôi</h3>
                            </div>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Mượn sách truyền thống với thời hạn linh hoạt</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Đặt mượn trước sách đang được mượn</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Đọc sách điện tử trực tuyến</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Gói thành viên với nhiều ưu đãi hấp dẫn</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Hệ thống tìm kiếm và gợi ý sách thông minh</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mb-1 p-6 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <TrendingUp className="text-amber-600" size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-text">Thống kê thư viện</h3>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-text-light mt-4">Đang tải thống kê...</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border-l-4 border-blue-400 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <BookOpen className="text-blue-600" size={20} />
                                            </div>
                                            <p className="font-semibold text-text">Kho sách</p>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600 ml-11">{formatNumber(stats.totalBooks)}</p>
                                        <p className="text-sm text-text-light ml-11">đầu sách</p>
                                    </div>
                                    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border-l-4 border-green-400 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <Users className="text-green-600" size={20} />
                                            </div>
                                            <p className="font-semibold text-text">Thành viên</p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600 ml-11">{formatNumber(stats.totalReaders)}</p>
                                        <p className="text-sm text-text-light ml-11">độc giả</p>
                                    </div>
                                    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border-l-4 border-purple-400 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <TrendingUp className="text-purple-600" size={20} />
                                            </div>
                                            <p className="font-semibold text-text">Lượt mượn</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-600 ml-11">{formatNumber(stats.totalBorrowsLast30Days)}</p>
                                        <p className="text-sm text-text-light ml-11">lượt/tháng</p>
                                    </div>
                                    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border-l-4 border-amber-400 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <Star className="text-amber-600" size={20} />
                                            </div>
                                            <p className="font-semibold text-text">Đánh giá</p>
                                        </div>
                                        <p className="text-2xl font-bold text-amber-600 ml-11">{stats.averageRating.toFixed(1)}/5</p>
                                        <p className="text-sm text-text-light ml-11">từ người dùng</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team */}
                <div className="mb-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-blue-100 mt-12">
                    <h2 className="text-2xl font-bold text-text mb-3 text-center">
                        Đội ngũ của chúng tôi
                    </h2>
                    <p className="text-center text-text-light mb-8">
                        Đội ngũ thư viện viên tận tâm, chuyên nghiệp luôn sẵn sàng hỗ trợ bạn
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { role: 'Quản lý', icon: Award },
                            { role: 'Thủ thư', icon: BookOpen },
                            { role: 'Hỗ trợ', icon: Users }
                        ].map((item, index) => (
                            <div key={index} className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-blue-100">
                                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <item.icon className="text-primary" size={32} />
                                </div>
                                <h3 className="font-semibold text-text mb-2">Đội ngũ {item.role}</h3>
                                <p className="text-sm text-text-light">Luôn sẵn sàng hỗ trợ bạn</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
