import { X } from "lucide-react"

interface FilterPanelProps {
    showFilters: boolean;
    selectedCategory: string;
    categories: Array<{ id: string; name: string }>;
    setSelectedCategory: (category: string) => void;
    availabilityFilter: 'all' | 'available' | 'unavailable';
    availabilityOptions: Array<{ id: string; name: string }>
    setAvailabilityFilter: (filter: 'all' | 'available' | 'unavailable') => void;
    setSortBy: (sort: string) => void;
    sortOptions: Array<{ id: string; name: string }>;
    hasActiveFilters: boolean;
    searchQuery: string;
    sortBy: string;
    onResetFilters: () => void;
}

const FiltersPanel = ({
    showFilters,
    selectedCategory,
    categories,
    setSelectedCategory,
    availabilityFilter,
    availabilityOptions,
    setAvailabilityFilter,
    setSortBy,
    sortOptions,
    hasActiveFilters,
    searchQuery,
    sortBy,
    onResetFilters
}: FilterPanelProps) => {

    if (!showFilters) return null;

    return (
        <div className="mt-6 pt-6 border-t border-border overflow-hidden">
            {/* Main Filter Container với animation */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Category Filter */}
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-75">
                        <label className="block text-sm font-semibold text-text mb-3">
                            Danh mục
                            {selectedCategory !== 'all' && (
                                <span className="ml-2 text-xs font-normal text-primary animate-in fade-in zoom-in-95 duration-200">
                                    ({categories.find(c => c.id === selectedCategory)?.name})
                                </span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category, index) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 animate-in fade-in zoom-in-95 ${selectedCategory === category.id
                                        ? 'bg-primary text-white shadow-md scale-105'
                                        : 'bg-secondary text-text hover:bg-primary/10 hover:scale-105'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Availability Filter */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                        <label className="block text-sm font-semibold text-text mb-3">
                            Tình trạng
                            {availabilityFilter !== 'all' && (
                                <span className="ml-2 text-xs font-normal text-primary animate-in fade-in zoom-in-95 duration-200">
                                    ({availabilityOptions.find(a => a.id === availabilityFilter)?.name})
                                </span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availabilityOptions.map((option, index) => (
                                <button
                                    key={option.id}
                                    onClick={() => setAvailabilityFilter(option.id as 'all' | 'available' | 'unavailable')}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 animate-in fade-in zoom-in-95 ${availabilityFilter === option.id
                                        ? 'bg-primary text-white shadow-md scale-105'
                                        : 'bg-secondary text-text hover:bg-primary/10 hover:scale-105'
                                        }`}
                                >
                                    {option.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Filter */}
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300 delay-150">
                        <label className="block text-sm font-semibold text-text mb-3">
                            Sắp xếp theo
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer hover:border-primary/50 transition-all duration-200 bg-white"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Reset filters button */}
                {hasActiveFilters && (
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
                        <p className="text-sm text-text-light animate-in fade-in slide-in-from-left-2 duration-300 delay-300">
                            Đang áp dụng {[
                                searchQuery && 'tìm kiếm',
                                selectedCategory !== 'all' && 'danh mục',
                                availabilityFilter !== 'all' && 'tình trạng',
                                sortBy !== 'popular' && 'sắp xếp'
                            ].filter(Boolean).join(', ')}
                        </p>
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-right-2 delay-300"
                        >
                            <X size={16} className="transition-transform group-hover:rotate-90 duration-300" />
                            Xóa tất cả bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FiltersPanel