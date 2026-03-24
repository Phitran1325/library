import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BookMarked, AlertTriangle } from 'lucide-react';
import { getAdminDashboard, getBookStatistics } from '../../services/admin.api';
import StatCard from '../../components/admin/dashboard/StatCard';
import RevenueCard from '../../components/admin/dashboard/RevenueCard';
import BookStockCard from '../../components/admin/dashboard/BookStockCard';
import MembershipCard from '../../components/admin/dashboard/MembershipCard';
import BorrowingActivityCard from '../../components/admin/dashboard/BorrowingActivityCard';
import ViolationsReviewsCard from '../../components/admin/dashboard/ViolationsReviewsCard';
import UserRolesCard from '../../components/admin/dashboard/UserRolesCard';
import ReservationsPaymentsCard from '../../components/admin/dashboard/ReservationsPaymentsCard';
// import BookStatisticsCard from '../../components/admin/dashboard/BookStatisticsCard';
// import NotificationStats from '../../components/admin/NotificationStats';

interface DashboardData {
  overview: {
    users: { total: number; active: number; inactive: number };
    books: { total: number; active: number; totalStock: number; availableStock: number; borrowedStock: number; lowStock: number };
    borrows: { total: number; active: number; overdue: number };
    reservations: { total: number; pending: number };
  };
  borrowing: {
    byStatus: { Borrowed: number; Returned: number; Overdue: number; Cancelled: number };
    byType: { InLibrary: number; TakeHome: number };
    renewals: { total: number; average: number; borrowsWithRenewals: number };
    recent: { newLast30Days: number; returnedLast30Days: number };
  };
  financial: {
    revenue: { total: number; last30Days: number };
    fees: { totalLateFee: number; totalDamageFee: number; total: number; unpaidLateFee: number };
    byPaymentType: Record<string, { count: number; total: number }>;
    pendingPayments: number;
  };
  users: {
    byRole: { Admin: number; Librarian: number; Reader: number };
    byStatus: { Active: number; Suspended: number; Banned: number };
    membership: { withMembership: number; withoutMembership: number; activeSubscriptions: number };
    newLast30Days: number;
  };
  violations: {
    total: number;
    last30Days: number;
    byType: Record<string, number>;
    bySeverity: { Low: number; Medium: number; High: number };
  };
  reviews: {
    total: number;
    pending: number;
    averageRating: number;
  };
  trends: {
    newUsers: Array<{ _id: string; count: number }>;
    newBorrows: Array<{ _id: string; count: number }>;
    revenue: Array<{ _id: string; total: number; count: number }>;
  };
}

const AdminDashboard = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [bookStats, setBookStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [dashboardResponse, bookStatsResponse] = await Promise.all([
          getAdminDashboard(token || undefined),
          getBookStatistics(timePeriod, token || undefined).catch(() => null),
        ]);

        if (!mounted) return;

        if (dashboardResponse.data?.success) {
          setDashboardData(dashboardResponse.data.data);
        } else {
          setError('Không thể tải dữ liệu dashboard');
        }

        if (bookStatsResponse) {
          console.log('Book Stats Response:', bookStatsResponse);
          console.log('Period:', timePeriod);
          console.log('Books Overview:', bookStatsResponse?.books?.overview);
          console.log('Top Books:', bookStatsResponse?.books?.topBorrowedBooks);
          console.log('By Category:', bookStatsResponse?.books?.byCategory);
          console.log('By Status:', bookStatsResponse?.books?.byStatus);
          setBookStats(bookStatsResponse);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (!mounted) return;
        console.error('Failed to load dashboard data:', err);
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, [timePeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Không thể tải dữ liệu'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Quản Trị</h1>
            <p className="text-gray-600 mt-2">Tổng quan về hệ thống thư viện</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Lọc theo thời gian:</span>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm này</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 pb-6">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-1.5">
          <StatCard
            icon={Users}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-100"
            title="Người dùng"
            value={dashboardData.overview.users.total}
            subtitle="Hoạt động"
            subtitleValue={dashboardData.overview.users.active}
            subtitleColor="text-blue-600"
            onMouseEnter={() => setHoveredCard('users')}
            onMouseLeave={() => setHoveredCard(null)}
          />
          <StatCard
            icon={BookOpen}
            iconColor="text-green-600"
            bgColor="bg-green-50"
            borderColor="border-green-100"
            title="Sách"
            value={dashboardData.overview.books.total}
            subtitle="Tồn kho"
            subtitleValue={dashboardData.overview.books.totalStock}
            subtitleColor="text-green-600"
            onMouseEnter={() => setHoveredCard('books')}
            onMouseLeave={() => setHoveredCard(null)}
          />
          <StatCard
            icon={BookMarked}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
            borderColor="border-purple-100"
            title="Đang mượn"
            value={dashboardData.overview.borrows.active}
            subtitle="Tổng"
            subtitleValue={dashboardData.overview.borrows.total}
            subtitleColor="text-purple-600"
            onMouseEnter={() => setHoveredCard('borrows')}
            onMouseLeave={() => setHoveredCard(null)}
          />
          <StatCard
            icon={AlertTriangle}
            iconColor="text-red-600"
            bgColor="bg-red-50"
            borderColor="border-red-100"
            title="Quá hạn"
            value={dashboardData.overview.borrows.overdue}
            subtitle="Cần xử lý"
            subtitleValue={dashboardData.overview.borrows.overdue}
            subtitleColor="text-red-600"
            onMouseEnter={() => setHoveredCard('overdue')}
            onMouseLeave={() => setHoveredCard(null)}
          />
        </div>

        {/* Financial & Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-1.5">
          <RevenueCard
            totalRevenue={dashboardData.financial.revenue.total}
            last30Days={dashboardData.financial.revenue.last30Days}
            unpaidFees={dashboardData.financial.fees.unpaidLateFee}
            formatCurrency={formatCurrency}
          />
          <BookStockCard
            totalStock={dashboardData.overview.books.totalStock}
            availableStock={dashboardData.overview.books.availableStock}
            borrowedStock={dashboardData.overview.books.borrowedStock}
            lowStock={dashboardData.overview.books.lowStock}
          />
          <MembershipCard
            withMembership={dashboardData.users.membership.withMembership}
            withoutMembership={dashboardData.users.membership.withoutMembership}
            activeSubscriptions={dashboardData.users.membership.activeSubscriptions}
            newUsers30Days={dashboardData.users.newLast30Days}
          />
        </div>

        {/* Borrowing & Violations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-1.5">
          <BorrowingActivityCard
            borrowed={dashboardData.borrowing.byStatus.Borrowed}
            returned={dashboardData.borrowing.byStatus.Returned}
            overdue={dashboardData.borrowing.byStatus.Overdue}
            cancelled={dashboardData.borrowing.byStatus.Cancelled}
            newLast30Days={dashboardData.borrowing.recent.newLast30Days}
            returnedLast30Days={dashboardData.borrowing.recent.returnedLast30Days}
          />
          <ViolationsReviewsCard
            lowSeverity={dashboardData.violations.bySeverity.Low}
            mediumSeverity={dashboardData.violations.bySeverity.Medium}
            highSeverity={dashboardData.violations.bySeverity.High}
            totalViolations={dashboardData.violations.total}
            violationsLast30Days={dashboardData.violations.last30Days}
            averageRating={dashboardData.reviews.averageRating}
            pendingReviews={dashboardData.reviews.pending}
          />
        </div>

        {/* User Roles & Reservations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-1.5">
          <UserRolesCard
            admin={dashboardData.users.byRole.Admin}
            librarian={dashboardData.users.byRole.Librarian}
            reader={dashboardData.users.byRole.Reader}
            active={dashboardData.users.byStatus.Active}
            suspended={dashboardData.users.byStatus.Suspended}
            banned={dashboardData.users.byStatus.Banned}
          />
          <ReservationsPaymentsCard
            totalReservations={dashboardData.overview.reservations.total}
            pendingReservations={dashboardData.overview.reservations.pending}
            pendingPayments={dashboardData.financial.pendingPayments}
            membershipRevenue={dashboardData.financial.byPaymentType.Membership?.total || 0}
            rentalRevenue={dashboardData.financial.byPaymentType.Rental?.total || 0}
            debtRevenue={dashboardData.financial.byPaymentType.Debt?.total || 0}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Book Statistics */}
        <div className="grid grid-cols-1 gap-5 mb-1.5">
          {/* <BookStatisticsCard
            books={bookStats?.books}
            borrowing={bookStats?.borrowing}
          /> */}
        </div>
        {/* Notification Statistics */}
        {<div className="mb-1.5">
          {/* <NotificationStats /> */}
        </div>}
      </div>
    </div>
  );
};

export default AdminDashboard;
