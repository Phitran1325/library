import { useNavigate } from "react-router-dom";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const CallToAction = () => {
    const navigate = useNavigate();
    const [containerRef, isVisible] = useIntersectionObserver({
        threshold: 0.3,
        freezeOnceVisible: true,
    });

    return ( 
        <div
            ref={containerRef}
            className={`bg-linear-to-r from-primary to-primary-dark rounded-lg shadow-lg p-8 text-center text-white transition-all duration-700
                ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
            <h2 className="text-3xl font-bold mb-4">Bắt đầu hành trình đọc sách của bạn!</h2>
            <p className="text-lg mb-6 opacity-90">
                Đăng ký thành viên ngay hôm nay để trải nghiệm dịch vụ thư viện hiện đại
            </p>
            <div className="flex gap-4 justify-center">
                <button
                    className="bg-white text-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors shadow-md cursor-pointer"
                    onClick={() => navigate("/membership")}
                >
                    Đăng ký ngay
                </button>
                <button
                    onClick={() => navigate("/membership")}
                    className="cursor-pointer bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white/10 transition-colors"
                >
                    Tìm hiểu thêm
                </button>
            </div>
        </div>
    );
};

export default CallToAction;