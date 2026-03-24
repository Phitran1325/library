import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BookOpen, Package, AlertTriangle, TrendingUp, Activity, Users, ShieldAlert, Calendar, Clock, DollarSign, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getPersonalStatistics,
  getActivityHistory,
  type LibrarianStatistics,
  type Activity as ActivityType,
} from '../../services/librarianStatistics.api';
// import NotificationStats from '../../components/admin/NotificationStats';

const LibrarianDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LibrarianStatistics | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const activitiesPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, [period, currentPage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statisticsData, activityData] = await Promise.all([
        getPersonalStatistics(period),
        getActivityHistory(currentPage, activitiesPerPage),
      ]);
      setStats(statisticsData);
      setActivities(activityData.activities);
      setTotalActivities(activityData.pagination.total);
      setTotalPages(Math.ceil(activityData.pagination.total / activitiesPerPage));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'year' | 'all') => {
    setPeriod(newPeriod);
    setCurrentPage(1); // Reset về trang 1 khi đổi period
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error || 'Không có dữ liệu'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Calculate total fees
  const totalFees = stats.borrows.totalLateFees + stats.borrows.totalDamageFees;

  // Prepare category data for pie chart
  const categoryData = Object.entries(stats.books.byCategory || {})
    .filter(([_, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name),
    }));

  // Prepare borrow status data for bar chart
  const borrowStatusData = Object.entries(stats.borrows.byStatus || {})
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status: translateStatus(status),
      originalStatus: status,
      count,
      fill: getStatusColor(status),
    }));

  // Prepare reservation status data
  const reservationStatusData = Object.entries(stats.reservations.byStatus || {})
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status: translateReservationStatus(status),
      count,
      fill: getReservationStatusColor(status),
    }));

  // Prepare violation severity data
  const violationSeverityData = Object.entries(stats.violations.bySeverity || {})
    .filter(([_, count]) => count > 0)
    .map(([severity, count]) => ({
      severity: translateSeverity(severity),
      count,
      fill: getSeverityColor(severity),
    }));

  // Prepare book copy status data
  const bookCopyStatusData = Object.entries(stats.bookCopies.byStatus || {})
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: translateBookCopyStatus(status),
      value: count,
      color: getBookCopyStatusColor(status),
    }));

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Dashboard Thủ Thư</h1>
          <p className="text-sm text-gray-600 mt-1">Thống kê hoạt động và hiệu suất làm việc</p>
        </div>
        <select
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
        >
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {/* Critical Metrics - Highlighted */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Sách quá hạn"
          value={stats.borrows.overdue.toString()}
          icon={Clock}
          iconBg="from-rose-100 to-rose-200"
          description={`Trong khoảng ${getPeriodText(period)}`}
          trend={stats.borrows.overdue > 0 ? 'warning' : 'good'}
          tooltip="Số lượng sách được mượn trong khoảng thời gian đã chọn và hiện đang quá hạn"
        />
        <StatCard
          title="Tổng phí đã thu"
          value={`${totalFees.toLocaleString('vi-VN')}₫`}
          icon={DollarSign}
          iconBg="from-emerald-100 to-emerald-200"
          description="Phí trễ hạn + Phí hư hỏng"
          breakdown={`Trễ: ${stats.borrows.totalLateFees.toLocaleString('vi-VN')}₫ | Hỏng: ${stats.borrows.totalDamageFees.toLocaleString('vi-VN')}₫`}
          tooltip="Tổng phí trễ hạn và phí hư hỏng đã ghi nhận trong khoảng thời gian"
        />
        <StatCard
          title="Tổng mượn sách"
          value={stats.borrows.total.toString()}
          icon={Users}
          iconBg="from-blue-100 to-blue-200"
          description={`Trong khoảng ${getPeriodText(period)}`}
          tooltip="Tổng số lượt mượn sách được tạo trong khoảng thời gian"
        />
        <StatCard
          title="Vi phạm"
          value={stats.violations.total.toString()}
          icon={ShieldAlert}
          iconBg="from-amber-100 to-amber-200"
          description={`Trong khoảng ${getPeriodText(period)}`}
          tooltip="Tổng số vi phạm được ghi nhận"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Sách đã tạo"
          value={stats.books.totalCreated.toString()}
          icon={BookOpen}
          iconBg="from-indigo-100 to-indigo-200"
          description="Thêm mới vào hệ thống"
        />
        <StatCard
          title="Bản sao đã tạo"
          value={stats.bookCopies.totalCreated.toString()}
          icon={Package}
          iconBg="from-purple-100 to-purple-200"
          description="Bản sao vật lý"
        />
        <StatCard
          title="Yêu cầu đặt trước"
          value={stats.reservations.total.toString()}
          icon={Calendar}
          iconBg="from-cyan-100 to-cyan-200"
          description={`${stats.reservations.rejected} từ chối`}
        />
        <StatCard
          title="Sách phát hành mới"
          value={stats.books.newReleases.toString()}
          icon={TrendingUp}
          iconBg="from-pink-100 to-pink-200"
          description="Đánh dấu mới phát hành"
        />
      </div>

      {/* Timeline Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TimelineCard title="Hôm nay" stats={stats.timeline.today} />
        <TimelineCard title="Tuần này" stats={stats.timeline.thisWeek} />
        <TimelineCard title="Tháng này" stats={stats.timeline.thisMonth} />
      </div>

      {/* Main Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Borrow Status */}
        <ChartCard title="Trạng thái mượn sách" icon={Users}>
          {borrowStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={borrowStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="status"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Users} text="Chưa có dữ liệu mượn sách" />
          )}
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="Phân bố thể loại sách" icon={BookOpen}>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-5 grid grid-cols-2 gap-3 max-h-[120px] overflow-y-auto pr-2">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center text-xs py-1">
                    <div
                      className="w-3 h-3 rounded-sm mr-2.5 shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-700 truncate flex-1">{item.name}</span>
                    <span className="font-semibold text-gray-800 ml-2">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={BookOpen} text="Chưa có dữ liệu thể loại" />
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reservation Status */}
        <ChartCard title="Trạng thái đặt trước" icon={Calendar}>
          {reservationStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={reservationStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="status"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Calendar} text="Chưa có dữ liệu đặt trước" />
          )}
        </ChartCard>

        {/* Violation Severity */}
        <ChartCard title="Mức độ vi phạm" icon={ShieldAlert}>
          {violationSeverityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={violationSeverityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="severity" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }}
                />
                <Bar dataKey="count" name="Số lượng" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={ShieldAlert} text="Chưa có dữ liệu vi phạm" />
          )}
        </ChartCard>
      </div>

      {/* Book Copy Status - Full Width */}
      {bookCopyStatusData.length > 0 && (
        <ChartCard title="Trạng thái bản sao sách" icon={Package}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Pie Chart */}
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={bookCopyStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : '0%'}
                  >
                    {bookCopyStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend with Stats */}
            <div className="lg:col-span-3 flex items-center">
              <div className="grid grid-cols-2 gap-4 w-full">
                {bookCopyStatusData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center min-w-0">
                      <div
                        className="w-4 h-4 rounded-full mr-3 shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="text-xl font-semibold text-gray-800 ml-3">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-700 flex items-center">
            <Activity className="mr-2 text-gray-500" size={20} strokeWidth={2} />
            Hoạt động gần đây
          </h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {totalActivities > 0 ? `${totalActivities} hoạt động` : 'Không có hoạt động'}
          </span>
        </div>
        {activities.length > 0 ? (
          <>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                >
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${activity.type === 'mark_lost'
                      ? 'bg-red-100 text-red-600'
                      : activity.type === 'mark_damaged'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-100 text-blue-600'
                      }`}
                  >
                    {activity.type === 'mark_lost' || activity.type === 'mark_damaged' ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <Calendar size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 mb-1">{activity.action}</p>
                    {activity.borrow && (
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p className="truncate">
                          <span className="font-medium">Sách:</span> {activity.borrow.book?.title || 'N/A'}
                        </p>
                        <p className="truncate">
                          <span className="font-medium">Độc giả:</span> {activity.borrow.user?.fullName || 'N/A'}
                        </p>
                        {(activity.borrow.lateFee > 0 || activity.borrow.damageFee > 0) && (
                          <div className="flex gap-3 mt-1">
                            {activity.borrow.lateFee > 0 && (
                              <p className="text-red-600 font-medium">
                                Phí trễ: {activity.borrow.lateFee.toLocaleString('vi-VN')}₫
                              </p>
                            )}
                            {activity.borrow.damageFee > 0 && (
                              <p className="text-orange-600 font-medium">
                                Phí hỏng: {activity.borrow.damageFee.toLocaleString('vi-VN')}₫
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {activity.reservation && (
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p className="truncate">
                          <span className="font-medium">Sách:</span> {activity.reservation.book?.title || 'N/A'}
                        </p>
                        <p className="truncate">
                          <span className="font-medium">Độc giả:</span> {activity.reservation.user?.fullName || 'N/A'}
                        </p>
                        {activity.reservation.reason && (
                          <p className="text-orange-600 italic mt-1">
                            Lý do: {activity.reservation.reason}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(activity.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Trang <span className="font-semibold text-gray-800">{currentPage}</span> / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                  >
                    <ChevronLeft size={16} />
                    <span>Trước</span>
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                  >
                    <span>Tiếp</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Activity className="mb-4 text-gray-300" size={56} />
            <p className="text-base font-medium">Chưa có hoạt động nào</p>
            <p className="text-sm text-gray-400 mt-1">Các hoạt động của bạn sẽ hiển thị ở đây</p>
          </div>
        )}
      </div>

      {/* Notification Statistics */}
      {/* <NotificationStats /> */}
    </div>
  );
};

// ==================== COMPONENTS ====================

// Stat Card Component with Tooltip
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  description: string;
  trend?: 'good' | 'warning' | 'neutral';
  breakdown?: string;
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBg,
  description,
  trend,
  breakdown,
  tooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Lấy màu icon dựa trên background gradient
  const getIconColor = () => {
    if (iconBg.includes('rose')) return 'text-rose-600';
    if (iconBg.includes('emerald')) return 'text-emerald-600';
    if (iconBg.includes('blue')) return 'text-blue-600';
    if (iconBg.includes('amber')) return 'text-amber-600';
    if (iconBg.includes('indigo')) return 'text-indigo-600';
    if (iconBg.includes('purple')) return 'text-purple-600';
    if (iconBg.includes('cyan')) return 'text-cyan-600';
    if (iconBg.includes('pink')) return 'text-pink-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:border-gray-200 relative group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            {tooltip && (
              <div className="relative">
                <Info
                  size={14}
                  className="text-gray-400 cursor-help hover:text-gray-600 transition-colors"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute left-0 top-6 z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                    {tooltip}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${trend === 'warning' ? 'text-red-600' :
            trend === 'good' ? 'text-green-600' :
              'text-gray-800'
            }`}>
            {value}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          {breakdown && (
            <p className="text-xs text-gray-500 mt-2.5 pt-2.5 border-t border-gray-100">{breakdown}</p>
          )}
        </div>
        <div className={`bg-gradient-to-br ${iconBg} rounded-xl p-3.5`}>
          <Icon className={getIconColor()} size={26} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};

// Chart Card Component
interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon: Icon, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <h3 className="text-base font-semibold text-gray-700 mb-5 flex items-center pb-3 border-b border-gray-100">
        <Icon className="mr-2 text-gray-500" size={20} strokeWidth={2} />
        {title}
      </h3>
      {children}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType;
  text: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, text }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[320px] text-gray-400">
      <Icon size={56} className="mb-4 text-gray-300" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
};

// Timeline Card Component
interface TimelineCardProps {
  title: string;
  stats: Partial<LibrarianStatistics['overview']>;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ title, stats }) => {
  const totalFees = (stats.totalLateFeesRecorded || 0) + (stats.totalDamageFeesRecorded || 0);
  const hasData =
    (stats.totalBooksMarkedLost || 0) > 0 ||
    (stats.totalBooksMarkedDamaged || 0) > 0 ||
    (stats.totalReservationsRejected || 0) > 0 ||
    totalFees > 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
      <h3 className="text-base font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-200">
        {title}
      </h3>
      {hasData ? (
        <div className="space-y-3">
          {(stats.totalBooksMarkedLost || 0) > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Sách mất:</span>
              <span className="font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm border border-red-200">
                {stats.totalBooksMarkedLost || 0}
              </span>
            </div>
          )}
          {(stats.totalBooksMarkedDamaged || 0) > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Sách hư hỏng:</span>
              <span className="font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm border border-orange-200">
                {stats.totalBooksMarkedDamaged || 0}
              </span>
            </div>
          )}
          {(stats.totalReservationsRejected || 0) > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Đặt trước từ chối:</span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm border border-blue-200">
                {stats.totalReservationsRejected || 0}
              </span>
            </div>
          )}
          {totalFees > 0 && (
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-200">
              <span className="text-sm text-gray-600">Tổng phí:</span>
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm border border-emerald-200">
                {totalFees.toLocaleString('vi-VN')}₫
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Clock className="mx-auto mb-2 text-gray-300" size={28} strokeWidth={1.5} />
          <p className="text-sm">Chưa có dữ liệu</p>
        </div>
      )}
    </div>
  );
};

// ==================== HELPER FUNCTIONS ====================

function getPeriodText(period: string): string {
  const texts: Record<string, string> = {
    'today': 'hôm nay',
    'week': 'tuần này',
    'month': 'tháng này',
    'year': 'năm nay',
    'all': 'tất cả thời gian',
  };
  return texts[period] || period;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Văn học': '#3b82f6',
    'Khoa học - Công nghệ': '#8b5cf6',
    'Lịch sử - Địa lý': '#06b6d4',
    'Kinh tế - Kinh doanh': '#f59e0b',
    'Giáo dục - Đào tạo': '#10b981',
    'Y học - Sức khỏe': '#ef4444',
    'Nghệ thuật - Thẩm mỹ': '#ec4899',
    'Tôn giáo - Triết học': '#6366f1',
    'Thiếu nhi - Thanh thiếu niên': '#14b8a6',
    'Thể thao - Giải trí': '#f97316',
  };
  return colors[category] || '#9ca3af';
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    'Pending': 'Chờ duyệt',
    'Borrowed': 'Đang mượn',
    'Returned': 'Đã trả',
    'Overdue': 'Quá hạn',
    'Lost': 'Mất',
    'Damaged': 'Hư hỏng',
    'Cancelled': 'Đã hủy',
    'ReturnRequested': 'Chờ trả',
    'Rejected': 'Từ chối',
  };
  return translations[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Pending': '#f59e0b',
    'Borrowed': '#3b82f6',
    'Returned': '#10b981',
    'Overdue': '#ef4444',
    'Lost': '#dc2626',
    'Damaged': '#f97316',
    'Cancelled': '#6b7280',
    'ReturnRequested': '#8b5cf6',
    'Rejected': '#991b1b',
  };
  return colors[status] || '#3b82f6';
}

function translateReservationStatus(status: string): string {
  const translations: Record<string, string> = {
    'Pending': 'Chờ duyệt',
    'Ready': 'Sẵn sàng',
    'Assigned': 'Đã gán',
    'Completed': 'Hoàn tất',
    'Fulfilled': 'Hoàn thành',
    'Cancelled': 'Đã hủy',
    'Expired': 'Hết hạn',
    'Rejected': 'Từ chối',
  };
  return translations[status] || status;
}

function getReservationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Pending': '#f59e0b',
    'Ready': '#10b981',
    'Assigned': '#3b82f6',
    'Completed': '#06b6d4',
    'Fulfilled': '#10b981',
    'Cancelled': '#6b7280',
    'Expired': '#ef4444',
    'Rejected': '#ef4444',
  };
  return colors[status] || '#9ca3af';
}

function translateSeverity(severity: string): string {
  const translations: Record<string, string> = {
    'Low': 'Nhẹ',
    'Medium': 'Trung bình',
    'High': 'Cao',
    'Critical': 'Nghiêm trọng',
  };
  return translations[severity] || severity;
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#f97316',
    'Critical': '#ef4444',
  };
  return colors[severity] || '#9ca3af';
}

function translateBookCopyStatus(status: string): string {
  const translations: Record<string, string> = {
    'Available': 'Có sẵn',
    'Borrowed': 'Đang mượn',
    'Reserved': 'Đã đặt',
    'Lost': 'Mất',
    'Damaged': 'Hư hỏng',
    'UnderMaintenance': 'Bảo trì',
  };
  return translations[status] || status;
}

function getBookCopyStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Available': '#10b981',
    'Borrowed': '#3b82f6',
    'Reserved': '#f59e0b',
    'Lost': '#ef4444',
    'Damaged': '#f97316',
    'UnderMaintenance': '#8b5cf6',
  };
  return colors[status] || '#9ca3af';
}

export default LibrarianDashboard;
