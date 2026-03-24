import { Search, Filter, Grid, List, X } from 'lucide-react';

interface SearchAndFilterBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    hasActiveFilters: boolean;
    activeFiltersCount: number;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    isSearching: boolean;
    onClearSearch: () => void;
}

const SearchAndFilterBar = ({
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    hasActiveFilters,
    activeFiltersCount,
    viewMode,
    setViewMode,
    isSearching,
    onClearSearch,
}: SearchAndFilterBarProps) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search Box */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm sách theo tên, tác giả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-20 py-3 border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                    />

                    {/* Right side icons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {/* Clear button */}
                        {searchQuery && (
                            <button
                                onClick={onClearSearch}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                title="Xóa tìm kiếm"
                            >
                                <X size={18} className="text-text-light" />
                            </button>
                        )}

                        {/* Loading spinner */}
                        {isSearching && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        )}
                    </div>
                </div>

                {/* Filter Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-6 py-3 border rounded-md transition-colors ${showFilters
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:bg-secondary'
                        }`}
                >
                    <Filter size={20} />
                    <span>Bộ lọc</span>
                    {hasActiveFilters && !showFilters && (
                        <span className="ml-1 bg-white text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {/* View Mode Toggle */}
                <div className="flex border border-border rounded-md overflow-hidden">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-3 transition-colors ${viewMode === 'grid'
                            ? 'bg-primary text-white'
                            : 'bg-white text-text hover:bg-gray-50'
                            }`}
                        title="Xem dạng lưới"
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-3 transition-colors ${viewMode === 'list'
                            ? 'bg-primary text-white'
                            : 'bg-white text-text hover:bg-gray-50'
                            }`}
                        title="Xem dạng danh sách"
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchAndFilterBar;
