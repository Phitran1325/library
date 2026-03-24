# BookList Components

Thư mục này chứa các component con được tách ra từ `BookList.tsx` để tối ưu hóa code và tăng tính tái sử dụng.

## Cấu trúc Components

### 1. SearchAndFilterBar

- **Mục đích**: Thanh tìm kiếm và nút bộ lọc
- **Chức năng**: 
  - Input tìm kiếm với debounce
  - Nút toggle bộ lọc với badge số lượng filter active
  - Toggle chế độ xem (grid/list)
- **Props**: searchQuery, setSearchQuery, showFilters, hasActiveFilters, viewMode, etc.

### 2. FiltersPanel

- **Mục đích**: Panel hiển thị các bộ lọc chi tiết
- **Chức năng**:
  - Filter theo danh mục (categories)
  - Filter theo tình trạng sách (availability)
  - Sắp xếp (sort options)
  - Nút reset tất cả filters
- **Props**: categories, selectedCategory, availabilityFilter, sortBy, etc.

### 3. BookCard

- **Mục đích**: Component hiển thị thông tin một cuốn sách
- **Chức năng**:
  - Hiển thị hình ảnh sách với badge borrowCount
  - Thông tin sách (title, volume, rating, status)
  - Hỗ trợ cả grid và list view
- **Props**: book, viewMode, onClick

### 4. BookGrid

- **Mục đích**: Container hiển thị danh sách sách
- **Chức năng**:
  - Render danh sách BookCard
  - Responsive grid layout
- **Props**: books, viewMode, onBookClick

### 5. ResultsInfo

- **Mục đích**: Hiển thị thông tin kết quả và filter tags
- **Chức năng**:
  - Hiển thị số lượng kết quả tìm thấy
  - Hiển thị các filter đang active
  - Nút xóa tất cả filters
- **Props**: filteredBooksCount, totalBooksCount, hasActiveFilters, etc.

### 6. EmptyState

- **Mục đích**: Hiển thị khi không có kết quả
- **Chức năng**:
  - Icon và message không có kết quả
  - Nút reset filters nếu có filter active
- **Props**: hasActiveFilters, onResetFilters

### 7. Pagination

- **Mục đích**: Phân trang cho danh sách sách
- **Chức năng**:
  - Hiển thị số trang
  - Nút Previous/Next
  - Logic phân trang thông minh
- **Props**: currentPage, totalPages, onPageChange, hasNextPage, hasPrevPage

## Lợi ích của việc tách component

1. **Tái sử dụng**: Các component có thể được sử dụng ở nhiều nơi khác
2. **Bảo trì**: Dễ dàng sửa đổi từng phần riêng biệt
3. **Testing**: Có thể test từng component độc lập
4. **Performance**: Tối ưu re-render với React.memo
5. **Code organization**: Code dễ đọc và hiểu hơn

## Cách sử dụng

```tsx
import {
    SearchAndFilterBar,
    FiltersPanel,
    BookGrid,
    ResultsInfo,
    EmptyState,
    Pagination
} from '../../components/BookList';

// Sử dụng trong component chính
<SearchAndFilterBar {...props} />
<FiltersPanel {...props} />
<BookGrid {...props} />
```

## Notes

- Tất cả components đều được typed với TypeScript
- Props được định nghĩa rõ ràng cho từng component
- Styling sử dụng Tailwind CSS với các class tối ưu
- Components được thiết kế để có thể hoạt động độc lập
