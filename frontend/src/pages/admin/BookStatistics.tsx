import React, { useState, useEffect } from 'react';
import { getBookStatistics } from '../../services/admin.api';
import { Loader2, BarChart3, TrendingUp, Package, BookOpen, AlertTriangle, Users } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BookStatistics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<{
        books?: any;
        borrowing?: any;
    }>({});

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const data = await getBookStatistics('all', token || undefined);
            setStatistics(data);
        } catch (err: any) {
            console.error('Error fetching book statistics:', err);
            setError(err.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 font-medium">Lỗi: {error}</p>
                <button
                    onClick={fetchStatistics}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

    // Prepare chart data
    const categoryData = statistics.books?.byCategory?.slice(0, 6).map(cat => ({
        name: cat._id,
        count: cat.count,
        stock: cat.totalStock || 0,
        available: cat.totalAvailable || 0,
    })) || [];

    const statusData = statistics.books?.byStatus ? [
        { name: 'Có sẵn', value: statistics.books.byStatus.available || 0, color: '#10b981' },
        { name: 'Hết hàng', value: statistics.books.byStatus.out_of_stock || 0, color: '#f59e0b' },
        { name: 'Ngừng cung cấp', value: statistics.books.byStatus.discontinued || 0, color: '#ef4444' },
    ] : [];

    const borrowingStatusData = statistics.borrowing?.byStatus ?
        Object.entries(statistics.borrowing.byStatus).map(([key, value]) => ({
            name: key,
            value: value as number,
        })) : [];

    const topBorrowedData = statistics.books?.topBorrowedBooks?.slice(0, 5).map(book => ({
        name: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
        borrowCount: book.borrowCount,
        available: book.available || 0,
    })) || [];

    return (
        <div className="space-y-5 p-4 bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Thống kê Sách & Hoạt động Mượn</h1>
                        <p className="text-sm text-gray-500">
                            Tổng quan chi tiết về hệ thống thư viện
                        </p>
                    </div>
                    <button
                        onClick={fetchStatistics}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium border border-gray-300"
                    >
                        <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-5 border border-blue-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                                <p className="text-xs text-gray-600 font-medium">Tổng số sách</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{statistics.books?.overview?.totalBooks?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {statistics.books?.overview?.activeBooks || 0} đang hoạt động
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-green-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="h-5 w-5 text-green-600" />
                                <p className="text-xs text-gray-600 font-medium">Tồn kho</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{statistics.books?.stock?.totalStock?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {statistics.books?.stock?.totalAvailable || 0} có sẵn
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-purple-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                <p className="text-xs text-gray-600 font-medium">Đang mượn</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{statistics.borrowing?.overview?.activeBorrows?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {statistics.borrowing?.overview?.overdueBorrows || 0} quá hạn
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-orange-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="h-5 w-5 text-orange-600" />
                                <p className="text-xs text-gray-600 font-medium">Tổng phiếu mượn</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{statistics.borrowing?.overview?.totalBorrows?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {statistics.borrowing?.overview?.returnedBorrows || 0} đã trả
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chart - Full Width */}
            {categoryData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Thống kê theo Thể loại</h3>
                            <p className="text-xs text-gray-500">Top 6 thể loại có nhiều sách nhất</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                angle={-12}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="count" fill="#9ca3af" name="Số lượng sách" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="available" fill="#10b981" name="Có sẵn" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Two Column Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Pie Chart */}
                {statusData.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <Package className="h-5 w-5 text-gray-600" />
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">Trạng thái Sách</h3>
                                <p className="text-xs text-gray-500">Phân bổ theo trạng thái</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Borrowing Status */}
                {borrowingStatusData.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <Users className="h-5 w-5 text-gray-600" />
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">Trạng thái Phiếu Mượn</h3>
                                <p className="text-xs text-gray-500">Phân bổ theo trạng thái</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={borrowingStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {borrowingStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Top Borrowed Books - Full Width */}
            {topBorrowedData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Top 5 Sách được Mượn</h3>
                            <p className="text-xs text-gray-500">Sách phổ biến nhất trong hệ thống</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={topBorrowedData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={140}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar dataKey="borrowCount" fill="#6b7280" name="Lượt mượn" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Fees and Renewals Stats */}
            {(statistics.borrowing?.fees || statistics.borrowing?.renewals) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Fees */}
                    {statistics.borrowing?.fees && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h3 className="text-base font-semibold text-gray-800 mb-4">Thống kê Phí Phạt</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700">Tổng phí trễ hạn</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                            .format(statistics.borrowing.fees.totalLateFee || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700">Tổng phí hư hỏng</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                            .format(statistics.borrowing.fees.totalDamageFee || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                                    <span className="text-sm text-gray-900 font-semibold">Tổng cộng</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                            .format(statistics.borrowing.fees.totalFees || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Renewals */}
                    {statistics.borrowing?.renewals && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h3 className="text-base font-semibold text-gray-800 mb-4">Thống kê Gia Hạn</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700">Tổng lượt gia hạn</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        {statistics.borrowing.renewals.totalRenewals?.toLocaleString() || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700">Trung bình/phiếu</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        {statistics.borrowing.renewals.averageRenewals?.toFixed(2) || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700">Phiếu có gia hạn</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        {statistics.borrowing.renewals.borrowsWithRenewals?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Low Stock Alert */}
            {statistics.books?.lowStockBooks && statistics.books.lowStockBooks.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Cảnh báo: Sách Sắp Hết</h3>
                            <p className="text-xs text-gray-500">Các đầu sách có tồn kho dưới 10%</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {statistics.books.lowStockBooks.slice(0, 6).map((book) => (
                            <div key={book._id} className="bg-red-50 border border-red-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                <p className="font-medium text-gray-900 text-sm mb-2 truncate">{book.title}</p>
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-600">
                                        <p>Tồn kho: <span className="font-medium">{book.stock}</span></p>
                                        <p>Có sẵn: <span className="font-medium text-green-600">{book.available}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-red-600">
                                            {(book.availabilityRate * 100).toFixed(0)}%
                                        </p>
                                        <p className="text-xs text-gray-500">còn lại</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookStatistics;
