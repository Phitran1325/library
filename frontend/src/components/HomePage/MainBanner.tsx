import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

// ==================== TYPES ====================
interface Banner {
    id: string;
    text: string;
    title?: string;
    imageUrl?: string;
    link?: string;
    active?: boolean;
    order?: number;
    startDate?: string;
    endDate?: string;
    type?: 'main' | 'side' | 'popup';
}

// ==================== HARDCODED BANNERS ====================
const DEFAULT_BANNERS: Banner[] = [
    {
        id: "1",
        text: "ƯU ĐÃI THÀNH VIÊN - TÍCH ĐIỂM ĐỔI QUÀ",
        active: true,
        order: 1,
        type: 'main'
    },
    {
        id: "2",
        text: "LIGHT NOVEL MỚI NHẤT - ĐẶT TRƯỚC NGAY",
        active: true,
        order: 2,
        type: 'main'
    },
    {
        id: "3",
        text: "MANGA BÁN CHẠY - FREESHIP TOÀN QUỐC",
        active: true,
        order: 3,
        type: 'main'
    },
    {
        id: "4",
        text: "GIẢM GIÁ ĐẾN 50% - BỘ SƯU TẬP MÙA HÈ",
        active: true,
        order: 4,
        type: 'main'
    },
    {
        id: "5",
        text: "COMBO SÁCH HAY - GIẢM THÊM 10%",
        active: true,
        order: 5,
        type: 'main'
    }
];

// ==================== COMPONENT ====================
interface MainBannerProps {
    autoSlide?: boolean;
    autoSlideInterval?: number; // milliseconds
}

const MainBanner = ({
    autoSlide = true,
    autoSlideInterval = 4000
}: MainBannerProps) => {
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Sử dụng banners cứng, chỉ lấy những banner active
    const banners = DEFAULT_BANNERS.filter(banner => banner.active !== false);

    const prevBanner = () => {
        setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const nextBanner = () => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    };

    const goToBanner = (index: number) => {
        setCurrentBannerIndex(index);
    };

    // Auto slide effect
    useEffect(() => {
        if (!autoSlide || banners.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            nextBanner();
        }, autoSlideInterval);

        return () => clearInterval(interval);
    }, [autoSlide, autoSlideInterval, banners.length, isPaused, currentBannerIndex]);

    // Pause auto-slide on hover
    const handleMouseEnter = () => {
        if (autoSlide) setIsPaused(true);
    };

    const handleMouseLeave = () => {
        if (autoSlide) setIsPaused(false);
    };

    if (banners.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                <BookOpen className="mb-4 text-primary" size={64} />
                <h2 className="text-3xl text-text font-semibold leading-tight mb-2">
                    Chào mừng đến với Thư viện
                </h2>
                <p className="text-text-light text-lg">Khám phá tri thức - Mở rộng tầm nhìn</p>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full relative flex items-center justify-center cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Previous Button */}
            {banners.length > 1 && (
                <button
                    onClick={prevBanner}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-none rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10 transition-all hover:scale-110 shadow-lg"
                    aria-label="Previous banner"
                >
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
            )}

            {/* Banner Content */}
            <div className="w-full px-16 py-8 flex flex-col items-center justify-center text-center">
                <BookOpen className="mb-6 text-primary" size={64} />
                <h2 className="text-4xl text-text font-bold leading-tight mb-3 transition-opacity duration-300 max-w-3xl">
                    {banners[currentBannerIndex].text}
                </h2>
                <p className="text-text-light text-lg mt-2">
                    Khám phá tri thức - Mở rộng tầm nhìn
                </p>
            </div>

            {/* Next Button */}
            {banners.length > 1 && (
                <button
                    onClick={nextBanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-none rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10 transition-all hover:scale-110 shadow-lg"
                    aria-label="Next banner"
                >
                    <ChevronRight size={24} className="text-gray-700" />
                </button>
            )}

            {/* Pagination Dots */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all hover:scale-125 ${index === currentBannerIndex
                                ? 'bg-primary w-8'
                                : 'bg-gray-400 hover:bg-gray-500'
                                }`}
                            onClick={() => goToBanner(index)}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}


        </div>
    );
};

export default MainBanner;