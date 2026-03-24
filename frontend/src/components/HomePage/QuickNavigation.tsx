import { ArrowRight, BookOpen, Search } from "lucide-react";
import { TbBooks } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const QuickNavigation = () => {
    const navigate = useNavigate();
    const [containerRef, isVisible] = useIntersectionObserver({
        threshold: 0.2,
        freezeOnceVisible: true,
    });

    const quickLinks = [
        {
            icon: <BookOpen size={24} />,
            title: "Danh sách sách",
            subtitle: "Xem tất cả sách",
            description: "Khám phá toàn bộ kho sách với hơn 10,000 đầu sách đa dạng",
            path: "/books",
            action: "Xem ngay",
        },
        {
            icon: <Search size={24} />,
            title: "Tìm kiếm sách",
            subtitle: "Tìm sách theo tên, tác giả",
            description: "Tìm kiếm nhanh chóng với bộ lọc thông minh",
            path: "/books",
            action: "Tìm kiếm",
        },
        {
            icon: <TbBooks size={24} />,
            title: "Thể loại",
            subtitle: "Sách theo chủ đề",
            description: "Khám phá sách theo từng thể loại yêu thích",
            path: "/books",
            action: "Khám phá",
        },
    ];

    return (
        <div ref={containerRef} className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-8">
                {/* Title */}
                <div
                    className={`text-center mb-6 transition-all duration-700
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                >
                    <h2 className="text-2xl font-bold text-text mb-2">Khám phá thư viện</h2>
                    <p className="text-text-light">Tìm kiếm và khám phá hàng nghìn đầu sách phong phú</p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickLinks.map((link, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(link.path)}
                            className={`bg-linear-to-br from-primary to-primary-dark text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '700ms' }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    {link.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{link.title}</h3>
                                    <p className="text-sm opacity-90">{link.subtitle}</p>
                                </div>
                            </div>
                            <p className="text-sm opacity-90 mb-4">{link.description}</p>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span>{link.action}</span>
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickNavigation;