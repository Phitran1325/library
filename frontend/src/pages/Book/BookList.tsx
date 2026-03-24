import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Book } from '../../types';
import { bookService } from '../../services/book.service';
import { useDebounce } from '@/hooks/useDebounce';
import { BookGrid, EmptyState, FiltersPanel, Pagination, ResultsInfo, SearchAndFilterBar } from '@/components';

const BookList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Debounce search query với delay 500ms
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // ✅ Đọc search query từ URL khi component mount
    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            console.log('🔍 [BookList] Search from URL:', searchFromUrl);
            setSearchQuery(searchFromUrl);
        }
    }, [searchParams]);

    // Categories - Khớp với API response
    const categories = [
        { id: 'all', name: 'Tất cả' },
        { id: 'Văn học', name: 'Văn học' },
        { id: 'Khoa học - Công nghệ', name: 'Khoa học - Công nghệ' },
        { id: 'Lịch sử - Địa lý', name: 'Lịch sử - Địa lý' },
        { id: 'Kinh tế - Kinh doanh', name: 'Kinh tế - Kinh doanh' },
        { id: 'Giáo dục - Đào tạo', name: 'Giáo dục - Đào tạo' },
        { id: 'Y học - Sức khỏe', name: 'Y học - Sức khỏe' },
        { id: 'Nghệ thuật - Thẩm mỹ', name: 'Nghệ thuật - Thẩm mỹ' },
        { id: 'Tôn giáo - Triết học', name: 'Tôn giáo - Triết học' },
        { id: 'Thiếu nhi - Thanh thiếu niên', name: 'Thiếu nhi - Thanh thiếu niên' },
        { id: 'Thể thao - Giải trí', name: 'Thể thao - Giải trí' },
    ];

    const availabilityOptions = [
        { id: 'all', name: 'Tất cả' },
        { id: 'available', name: 'Còn sách' },
        { id: 'unavailable', name: 'Hết sách' },
    ];

    const sortOptions = [
        { id: 'popular', name: 'Phổ biến nhất' },
        { id: 'newest', name: 'Mới nhất' },
        { id: 'rating', name: 'Đánh giá cao' },
        { id: 'az', name: 'A-Z' },
        { id: 'za', name: 'Z-A' },
    ];

    // Fetch books với filters
    const fetchBooks = async (filters?: { title?: string; category?: string }) => {
        try {
            setLoading(true);
            const filterParams: { 
                page: number; 
                limit: number; 
                title?: string; 
                category?: string;
            } = {
                page: 1,
                limit: 100 // Lấy nhiều hơn để filter frontend
            };

            // Nếu có search query, sử dụng API search theo title
            if (filters?.title) {
                filterParams.title = filters.title;
            }

            // Nếu có category filter, thêm vào API call
            if (filters?.category && filters.category !== 'all') {
                filterParams.category = filters.category;
            }

            const data = await bookService.getBooks(filterParams);
            setBooks(data);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    // Detect khi đang typing để hiển thị loading indicator
    useEffect(() => {
        if (searchQuery !== debouncedSearchQuery) {
            setIsSearching(true);
        } else {
            setIsSearching(false);
        }
    }, [searchQuery, debouncedSearchQuery]);

    // Fetch books khi filters thay đổi (search query hoặc category)
    useEffect(() => {
        const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
        const hasCategoryFilter = selectedCategory !== 'all';

        if (hasSearchQuery) {
            // Có search query - gọi API với title parameter
            fetchBooks({ 
                title: debouncedSearchQuery.trim(),
                category: hasCategoryFilter ? selectedCategory : undefined
            });
        } else if (hasCategoryFilter) {
            // Chỉ có category filter - gọi API với category parameter
            fetchBooks({ category: selectedCategory });
        } else {
            // Không có filter - fetch tất cả books
            fetchBooks();
        }
    }, [debouncedSearchQuery, selectedCategory]);

    // Helper: Check if book is available
    const isBookAvailable = (book: Book): boolean => {
        return book.status === 'available' && (book.availableCopies || book.available || 0) > 0;
    };

    // Client-side filtering và sorting (chỉ cho availability và sorting vì đã filter qua API cho search và category)
    const filteredBooks = useMemo(() => {
        let result = [...books];

        // 1. Filter by search query - Đã được xử lý bởi API khi có debouncedSearchQuery
        // Nếu không có search query từ API, không cần filter lại ở client-side

        // 2. Filter by category - Đã được xử lý bởi API khi selectedCategory !== 'all'
        // Nếu không có category filter từ API, không cần filter lại ở client-side

        // 3. Filter by availability - Vẫn filter client-side vì API có thể không support
        if (availabilityFilter === 'available') {
            result = result.filter(book => isBookAvailable(book));
        } else if (availabilityFilter === 'unavailable') {
            result = result.filter(book => !isBookAvailable(book));
        }

        // 4. Sort
        switch (sortBy) {
            case 'popular':
                // Sort by rating (vì không có borrowCount trong API)
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'newest':
                // Sort by createdAt
                result.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'az':
                result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
                break;
            case 'za':
                result.sort((a, b) => b.title.localeCompare(a.title, 'vi'));
                break;
            default:
                break;
        }

        return result;
    }, [books, availabilityFilter, sortBy]);

    const handleBookClick = (bookId: string) => {
        console.log('📖 [BookList] Navigate to book:', bookId);
        navigate(`/books/${bookId}`);
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchQuery('');
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setAvailabilityFilter('all');
        setSortBy('popular');
    };

    // Check if any filter is active
    const hasActiveFilters =
        searchQuery !== '' ||
        selectedCategory !== 'all' ||
        availabilityFilter !== 'all' ||
        sortBy !== 'popular';

    // Calculate active filters count
    const activeFiltersCount = [
        searchQuery && 1,
        selectedCategory !== 'all' && 1,
        availabilityFilter !== 'all' && 1,
        sortBy !== 'popular' && 1
    ].filter(Boolean).length;

    // Pagination logic
    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, selectedCategory, availabilityFilter, sortBy]);

    // Loading screen chỉ hiển thị lần đầu
    if (loading && books.length === 0) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-light text-lg">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary">
            <main className="max-w-[1400px] mx-auto p-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text mb-2">Thư Viện Sách</h1>
                    <p className="text-text-light">Khám phá hàng nghìn đầu sách phong phú</p>
                </div>

                {/* Search and Filter Bar */}
                <SearchAndFilterBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFiltersCount={activeFiltersCount}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    isSearching={isSearching}
                    onClearSearch={handleClearSearch}
                />

                {/* FilterPanel */}
                <FiltersPanel
                    showFilters={showFilters}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    availabilityOptions={availabilityOptions}
                    availabilityFilter={availabilityFilter}
                    setAvailabilityFilter={setAvailabilityFilter}
                    sortOptions={sortOptions}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    hasActiveFilters={hasActiveFilters}
                    searchQuery={searchQuery}
                    onResetFilters={handleResetFilters}
                />

                <ResultsInfo
                    filteredBooksCount={filteredBooks.length}
                    totalBooksCount={books.length}
                    hasActiveFilters={hasActiveFilters}
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                    availabilityFilter={availabilityFilter}
                    sortBy={sortBy}
                    categories={categories}
                    availabilityOptions={availabilityOptions}
                    sortOptions={sortOptions}
                    onResetFilters={handleResetFilters}
                />

                {/* Books Grid/List */}
                {filteredBooks.length === 0 ? (
                    <EmptyState
                        hasActiveFilters={hasActiveFilters}
                        onResetFilters={handleResetFilters}
                    />
                ) : (
                    <BookGrid
                        books={paginatedBooks}
                        viewMode={viewMode}
                        onBookClick={handleBookClick}
                    />
                )}

                {/* Pagination */}
                {filteredBooks.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        hasNextPage={currentPage < totalPages}
                        hasPrevPage={currentPage > 1}
                    />
                )}
            </main>
        </div>
    );
};

export default BookList;