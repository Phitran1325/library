import { BookOpen, Clock, Star } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const LibraryFeatures = () => {
    const [containerRef, isVisible] = useIntersectionObserver({
        threshold: 0.2,
        freezeOnceVisible: true,
    });

    const features = [
        {
            icon: <BookOpen className="text-primary" size={24} />,
            title: "Mượn sách dễ dàng",
            description:
                "Quy trình mượn sách đơn giản, nhanh chóng. Thành viên được mượn tối đa 5 cuốn cùng lúc trong 14 ngày.",
        },
        {
            icon: <Clock className="text-primary" size={24} />,
            title: "Gia hạn online",
            description:
                "Gia hạn sách trực tuyến tiện lợi, không cần đến thư viện. Gia hạn tối đa 1 lần, mỗi lần 14 ngày.",
        },
        {
            icon: <Star className="text-primary" size={24} />,
            title: "Gói thành viên",
            description:
                "Đăng ký gói thành viên để mượn sách tối đa 5 cuốn cùng lúc trong 14 ngày. Ngoài ra có thể thuê sách lẻ theo ngày.",
        },
    ];

    return (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-primary
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '700ms' }}
                >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2">{feature.title}</h3>
                    <p className="text-sm text-text-light">{feature.description}</p>
                </div>
            ))}
        </div>
    );
};

export default LibraryFeatures;