import React, { useState } from 'react';
import { BarChart3, TrendingUp, Filter, Package, DollarSign, BookOpen, Star, AlertTriangle } from 'lucide-react';

interface BookStatisticsCardProps {
    books?: {
        overview?: {
            totalBooks?: number;
            activeBooks?: number;
            inactiveBooks?: number;
            newBooks?: number;
            period?: string;
        };
        byStatus?: {
            available?: number;
            out_of_stock?: number;
            discontinued?: number;
        };
        byCategory?: Array<{
            _id: string;
            count: number;
            totalStock?: number;
            totalAvailable?: number;
        }>;
        stock?: {
            totalStock?: number;
            totalAvailable?: number;
            totalBorrowed?: number;
            averageStock?: number;
            averageAvailable?: number;
        };
        topBorrowedBooks?: Array<{
            bookId: string;
            title: string;
            category?: string;
            borrowCount: number;
            activeBorrows?: number;
            stock?: number;
            available?: number;
        }>;
        topRatedBooks?: Array<{
            _id: string;
            title: string;
            rating: number;
            reviewCount: number;
        }>;
        lowStockBooks?: Array<{
            _id: string;
            title: string;
            stock: number;
            available: number;
            availabilityRate: number;
        }>;
    };
    borrowing?: {
        overview?: {
            totalBorrows?: number;
            newBorrows?: number;
            activeBorrows?: number;
            overdueBorrows?: number;
            returnedBorrows?: number;
        };
        byStatus?: Record<string, number>;
        byType?: Record<string, number>;
        fees?: {
            totalLateFee?: number;
            totalDamageFee?: number;
            totalFees?: number;
            averageLateFee?: number;
            borrowsWithLateFee?: number;
        };
        renewals?: {
            totalRenewals?: number;
            averageRenewals?: number;
            borrowsWithRenewals?: number;
        };
    };
}

const BookStatisticsCard: React.FC<BookStatisticsCardProps> = ({
    books,
    borrowing,
}) => {
    const [selectedTab, setSelectedTab] = useState<'books' | 'borrowing'>('books');

    const hasData = books || borrowing;

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">
                        Dữ liệu thống kê sách chưa có sẵn.<br />
                        API endpoint: <code className="text-xs bg-gray-100 px-2 py-1 rounded">/api/admin/books/statistics</code>
                    </p>
                </div>
            </div>
        );
    }

    const formatNumber = (num?: number) => num?.toLocaleString('vi-VN') || '0';
    const formatCurrency = (amount?: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Thống kê sách & hoạt động mượn</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Tổng quan chi tiết về hệ thống
                            {books?.overview?.period && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                    {books.overview.period === 'today' && 'Hôm nay'}
                                    {books.overview.period === 'week' && '7 ngày qua'}
                                    {books.overview.period === 'month' && 'Tháng này'}
                                    {books.overview.period === 'year' && 'Năm này'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedTab('books')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedTab === 'books'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Sách
                    </button>
                    <button
                        onClick={() => setSelectedTab('borrowing')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedTab === 'borrowing'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Hoạt động mượn
                    </button>
                </div>
            </div>

            {/* Content */}
            {selectedTab === 'books' && books && (
                <div className="space-y-6">
                    {/* Overview Stats */}
                    {books.overview && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    <p className="text-sm font-medium text-blue-900">
                                        {books.overview.period ? 'Sách mới thêm' : 'Tổng số sách'}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatNumber(books.overview.period ? books.overview.newBooks : books.overview.totalBooks)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {books.overview.period ? (
                                        <>Tổng: {formatNumber(books.overview.totalBooks)}</>
                                    ) : (
                                        <>Hoạt động: {formatNumber(books.overview.activeBooks)}</>
                                    )}
                                </p>
                            </div>

                            {books.stock && (
                                <>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-5 w-5 text-green-600" />
                                            <p className="text-sm font-medium text-green-900">Tồn kho</p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-700">{formatNumber(books.stock.totalStock)}</p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Có sẵn: {formatNumber(books.stock.totalAvailable)}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-5 w-5 text-purple-600" />
                                            <p className="text-sm font-medium text-purple-900">Đang mượn</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-700">{formatNumber(books.stock.totalBorrowed)}</p>
                                        <p className="text-xs text-purple-600 mt-1">
                                            TB/cuốn: {books.stock.averageStock?.toFixed(1) || '0'}
                                        </p>
                                    </div>
                                </>
                            )}

                            {books.byStatus && (
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Filter className="h-5 w-5 text-orange-600" />
                                        <p className="text-sm font-medium text-orange-900">Trạng thái</p>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-700">{formatNumber(books.byStatus.available)}</p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Hết: {formatNumber(books.byStatus.out_of_stock)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Borrowed Books */}
                        {books.topBorrowedBooks && books.topBorrowedBooks.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <h4 className="text-base font-bold text-gray-800">Top sách được mượn nhiều nhất</h4>
                                </div>
                                <div className="space-y-2">
                                    {books.topBorrowedBooks.slice(0, 3).map((book, index) => (
                                        <div key={book.bookId} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                                                <p className="text-xs text-gray-500">{book.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">{formatNumber(book.borrowCount)}</p>
                                                <p className="text-xs text-gray-500">lượt mượn</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Categories */}
                        {books.byCategory && books.byCategory.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="h-5 w-5 text-purple-600" />
                                    <h4 className="text-base font-bold text-gray-800">Thống kê theo thể loại</h4>
                                </div>
                                <div className="space-y-2">
                                    {books.byCategory.slice(0, 4).map((category, index) => (
                                        <div key={category._id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{category._id}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Tồn kho: {formatNumber(category.totalStock)} |
                                                        Có sẵn: {formatNumber(category.totalAvailable)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-purple-600">{formatNumber(category.count)}</p>
                                                <p className="text-xs text-gray-500">đầu sách</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Low Stock Books */}
                    {books.lowStockBooks && books.lowStockBooks.length > 0 && (
                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <h4 className="text-base font-bold text-red-800">Sách sắp hết (dưới 10% tồn kho)</h4>
                            </div>
                            <div className="space-y-2">
                                {books.lowStockBooks.slice(0, 3).map((book) => (
                                    <div key={book._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{book.title}</p>
                                            <p className="text-xs text-gray-500">
                                                Tồn kho: {book.stock} | Có sẵn: {book.available}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-red-600">
                                                {(book.availabilityRate * 100).toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-gray-500">còn lại</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'borrowing' && borrowing && (
                <div className="space-y-6">
                    {/* Borrowing Overview */}
                    {borrowing.overview && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm font-medium text-blue-900 mb-2">
                                    {books?.overview?.period ? 'Mượn mới' : 'Tổng số'}
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatNumber(books?.overview?.period ? borrowing.overview.newBorrows : borrowing.overview.totalBorrows)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {books?.overview?.period ? <>Tổng: {formatNumber(borrowing.overview.totalBorrows)}</> : 'phiếu mượn'}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-sm font-medium text-green-900 mb-2">Đang mượn</p>
                                <p className="text-2xl font-bold text-green-700">{formatNumber(borrowing.overview.activeBorrows)}</p>
                                <p className="text-xs text-green-600 mt-1">phiếu</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-sm font-medium text-red-900 mb-2">Quá hạn</p>
                                <p className="text-2xl font-bold text-red-700">{formatNumber(borrowing.overview.overdueBorrows)}</p>
                                <p className="text-xs text-red-600 mt-1">phiếu</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-sm font-medium text-purple-900 mb-2">Đã trả</p>
                                <p className="text-2xl font-bold text-purple-700">{formatNumber(borrowing.overview.returnedBorrows)}</p>
                                <p className="text-xs text-purple-600 mt-1">phiếu</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Status */}
                        {borrowing.byStatus && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-base font-bold text-gray-800 mb-4">Thống kê theo trạng thái</h4>
                                <div className="space-y-2">
                                    {Object.entries(borrowing.byStatus).map(([status, count]) => (
                                        <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">{status}</span>
                                            <span className="text-base font-bold text-gray-900">{formatNumber(count)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* By Type */}
                        {borrowing.byType && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-base font-bold text-gray-800 mb-4">Thống kê theo loại mượn</h4>
                                <div className="space-y-2">
                                    {Object.entries(borrowing.byType).map(([type, count]) => (
                                        <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700">{type}</span>
                                            <span className="text-base font-bold text-gray-900">{formatNumber(count)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fees Statistics */}
                    {borrowing.fees && (
                        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-5 w-5 text-orange-600" />
                                <h4 className="text-base font-bold text-orange-900">Thống kê phí phạt</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-white rounded-lg border border-orange-200">
                                    <p className="text-sm text-gray-600 mb-1">Phí trễ hạn</p>
                                    <p className="text-xl font-bold text-orange-600">{formatCurrency(borrowing.fees.totalLateFee)}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatNumber(borrowing.fees.borrowsWithLateFee)} phiếu
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-orange-200">
                                    <p className="text-sm text-gray-600 mb-1">Phí hư hỏng</p>
                                    <p className="text-xl font-bold text-red-600">{formatCurrency(borrowing.fees.totalDamageFee)}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-orange-200">
                                    <p className="text-sm text-gray-600 mb-1">Tổng phí</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(borrowing.fees.totalFees)}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-orange-200">
                                    <p className="text-sm text-gray-600 mb-1">Phí TB/phiếu</p>
                                    <p className="text-xl font-bold text-gray-700">{formatCurrency(borrowing.fees.averageLateFee)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Renewals */}
                    {borrowing.renewals && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-base font-bold text-gray-800 mb-4">Thống kê gia hạn</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-900 mb-1">Tổng lượt gia hạn</p>
                                    <p className="text-2xl font-bold text-blue-700">{formatNumber(borrowing.renewals.totalRenewals)}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-900 mb-1">TB gia hạn/phiếu</p>
                                    <p className="text-2xl font-bold text-green-700">{borrowing.renewals.averageRenewals?.toFixed(2) || '0'}</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-purple-900 mb-1">Phiếu có gia hạn</p>
                                    <p className="text-2xl font-bold text-purple-700">{formatNumber(borrowing.renewals.borrowsWithRenewals)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookStatisticsCard;
