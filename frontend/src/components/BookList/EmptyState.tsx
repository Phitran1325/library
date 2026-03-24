import { BookOpen } from 'lucide-react';

interface EmptyStateProps {
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

const EmptyState = ({ hasActiveFilters, onResetFilters }: EmptyStateProps) => {
    return (
        <div className="text-center py-20">
            <BookOpen className="mx-auto mb-4 text-gray-300" size={64} />
            <p className="text-text-light text-lg mb-2">Không tìm thấy sách phù hợp</p>
            {hasActiveFilters && (
                <button
                    onClick={onResetFilters}
                    className="text-primary hover:underline text-sm"
                >
                    Thử xóa bộ lọc để xem tất cả sách
                </button>
            )}
        </div>
    );
};

export default EmptyState;
