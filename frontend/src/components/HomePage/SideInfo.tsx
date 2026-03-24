import { Clock, Star } from "lucide-react";


const SideInfo = () => {

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="bg-primary text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                    <Clock size={24} />
                    <h3 className="text-lg font-semibold">Giờ mở cửa</h3>
                </div>
                <p className="text-sm opacity-90 leading-relaxed">
                    Thứ 2 - Thứ 6: 8:00 - 21:00<br />
                    Thứ 7 - CN: 9:00 - 18:00
                </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20">
                <div className="flex items-center gap-3 mb-3 text-primary">
                    <Star size={24} />
                    <h3 className="text-lg font-semibold">Dịch vụ nổi bật</h3>
                </div>
                <ul className="text-sm text-text-light space-y-2">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        Mượn sách theo gói Membership
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        Không gian học tập
                    </li>
                </ul>
            </div>
        </div>
    )
}


export default SideInfo;