import { TiTick } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import type { Book } from '../../types';

interface DetailsTabProps {
    book: Book;
}

export const DetailsTab = ({ book }: DetailsTabProps) => {
    return (
        <div>
            <h3 className="text-xl font-bold text-text mb-6">Mô tả chi tiết</h3>
            <div className="prose prose-lg max-w-none">
                <p className="text-text-light leading-relaxed mb-6">
                    {book.description}
                </p>

                <h4 className="text-lg font-semibold text-text mb-4">Đặc điểm nổi bật</h4>
                <ul className="space-y-3 mb-6">
                    <FeatureItem text={`Tác giả nổi tiếng: ${book.author}`} />
                    <FeatureItem text={`Xuất bản bởi ${book.publisher}`} />
                    <FeatureItem text={`${book.pages} trang nội dung phong phú`} />
                    <FeatureItem text={`Thể loại ${book.category} được yêu thích`} />
                </ul>

                <h4 className="text-lg font-semibold text-text mb-4">Tình trạng</h4>
                <div className="flex items-center gap-2">
                    {book.isAvailable !== false ? (
                        <>
                            <TiTick className="text-success" size={24} />
                            <span className="text-success font-medium">Sẵn sàng cho mượn</span>
                        </>
                    ) : (
                        <>
                            <IoClose className="text-error" size={24} />
                            <span className="text-error font-medium">Tạm thời hết hàng</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

interface FeatureItemProps {
    text: string;
}

const FeatureItem = ({ text }: FeatureItemProps) => (
    <li className="flex items-start gap-2 text-text-light">
        <TiTick className="text-success mt-1 shrink-0" size={20} />
        <span>{text}</span>
    </li>
);