import { useState, useEffect } from 'react';
import { Bell, TrendingUp, Users, BookOpen, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface NotificationStats {
  totalNotifications: number; 
  unreadNotifications: number;
  readNotifications: number;
  notificationsByType: {
    'favorite-available': number;
    'borrow-reminder': number;
    'reservation-ready': number;
    'membership-expiring': number;
  };
  recentActivity: {
    todayCount: number;
    weekCount: number;
    monthCount: number;
  };
}

const NotificationStats = () => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get<{
        success: boolean;
        data: NotificationStats;
      }>(`${API_BASE_URL}/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
      setError('Không thể tải thống kê thông báo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error || 'Lỗi tải dữ liệu'}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const unreadPercentage = stats.totalNotifications > 0 
    ? Math.round((stats.unreadNotifications / stats.totalNotifications) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="text-blue-600" size={28} />
            Thống Kê Thông Báo
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng quan về thông báo trong hệ thống
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <TrendingUp size={18} />
          Làm mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Notifications */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Bell size={24} />
            </div>
            <TrendingUp className="text-white/60" size={20} />
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.totalNotifications.toLocaleString()}</h3>
          <p className="text-blue-100 text-sm">Tổng thông báo</p>
        </div>

        {/* Unread Notifications */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
              {unreadPercentage}%
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.unreadNotifications.toLocaleString()}</h3>
          <p className="text-orange-100 text-sm">Chưa đọc</p>
        </div>

        {/* Read Notifications */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.readNotifications.toLocaleString()}</h3>
          <p className="text-green-100 text-sm">Đã đọc</p>
        </div>

        {/* Today's Activity */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.recentActivity.todayCount.toLocaleString()}</h3>
          <p className="text-purple-100 text-sm">Hôm nay</p>
        </div>
      </div>

      {/* Notifications by Type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          Phân Loại Thông Báo
        </h3>

        <div className="space-y-4">
          {/* Favorite Available */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Sách yêu thích có sẵn</p>
                <p className="text-sm text-gray-600">favorite-available</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {stats.notificationsByType['favorite-available']?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">thông báo</p>
            </div>
          </div>

          {/* Borrow Reminder */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Nhắc nhở trả sách</p>
                <p className="text-sm text-gray-600">borrow-reminder</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">
                {stats.notificationsByType['borrow-reminder']?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">thông báo</p>
            </div>
          </div>

          {/* Reservation Ready */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Đặt trước sẵn sàng</p>
                <p className="text-sm text-gray-600">reservation-ready</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {stats.notificationsByType['reservation-ready']?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">thông báo</p>
            </div>
          </div>

          {/* Membership Expiring */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Gói thành viên sắp hết hạn</p>
                <p className="text-sm text-gray-600">membership-expiring</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.notificationsByType['membership-expiring']?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">thông báo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          Hoạt Động Gần Đây
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={28} className="text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats.recentActivity.todayCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 font-medium">Hôm nay</p>
          </div>

          {/* This Week */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={28} className="text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats.recentActivity.weekCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 font-medium">Tuần này</p>
          </div>

          {/* This Month */}
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={28} className="text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {stats.recentActivity.monthCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 font-medium">Tháng này</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationStats;
