import { Search } from 'lucide-react';

interface ResultsInfoProps {
    filteredBooksCount: number;
    totalBooksCount: number;
    hasActiveFilters: boolean;
    searchQuery: string;
    selectedCategory: string;
    availabilityFilter: string;
    sortBy: string;
    categories: Array<{ id: string; name: string }>;
    availabilityOptions: Array<{ id: string; name: string }>;
    sortOptions: Array<{ id: string; name: string }>;
    onResetFilters: () => void;
}

const ResultsInfo = ({
    filteredBooksCount,
    totalBooksCount,
    hasActiveFilters,
    searchQuery,
    selectedCategory,
    availabilityFilter,
    sortBy,
    categories,
    availabilityOptions,
    sortOptions,
    onResetFilters,
}: ResultsInfoProps) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <p className="text-text-light">
                    Tìm thấy <span className="font-semibold text-primary">{filteredBooksCount}</span> kết quả
                    {totalBooksCount > 0 && <span className="text-xs ml-1">(từ {totalBooksCount} sách)</span>}
                </p>
            </div>

            {/* Active filters display - Always show if has filters */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-text-light">Lọc:</span>
                    {searchQuery && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md flex items-center gap-1">
                            <Search size={12} />
                            "{searchQuery.substring(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                        </span>
                    )}
                    {selectedCategory !== 'all' && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                            {categories.find(c => c.id === selectedCategory)?.name}
                        </span>
                    )}
                    {availabilityFilter !== 'all' && (
                        <span className="px-2 py-1 bg-success/10 text-success rounded-md">
                            {availabilityOptions.find(a => a.id === availabilityFilter)?.name}
                        </span>
                    )}
                    {sortBy !== 'popular' && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                            {sortOptions.find(s => s.id === sortBy)?.name}
                        </span>
                    )}
                    <button
                        onClick={onResetFilters}
                        className="text-error hover:underline ml-1"
                    >
                        Xóa tất cả
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResultsInfo;
