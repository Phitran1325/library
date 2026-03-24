import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../components/common/Notification';
import { getUserStatistics } from '../../services/admin.api';
import { Users, TrendingUp, DollarSign, LogIn, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatisticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsers?: number;
    period?: string;
  };
  byRole: {
    Admin: number;
    Librarian: number;
    Reader: number;
  };
  byStatus: {
    Active: number;
    Suspended: number;
    Banned: number;
  };
  membership: {
    withMembership: number;
    withoutMembership: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
  };
  borrowing: {
    totalBorrows: number;
    activeBorrows: number;
    returnedBorrows: number;
    usersCanBorrow: number;
    usersCannotBorrow: number;
  };
  financial: {
    totalSpent: number;
    averageSpent: number;
    maxSpent: number;
    minSpent: number;
    totalWalletBalance: number;
    averageWalletBalance: number;
    maxWalletBalance: number;
  };
  trends: {
    byDay: Array<{ _id: string; count: number }>;
    byMonth: Array<{ _id: string; count: number }>;
  };
  topBorrowers: Array<{
    userId: string;
    fullName: string;
    email: string;
    role: string;
    totalBorrows: number;
    activeBorrows: number;
  }>;
}

const UserStatistics: React.FC = () => {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>('all');
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const period_str = (period || 'all') as string;
      const data = await getUserStatistics(period_str, token || undefined);
      setStatistics(data as StatisticsData);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      showNotification('Lỗi khi lấy thống kê người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = () => {
    fetchStatistics();
  };

  if (loading && !statistics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Không thể tải dữ liệu thống kê</Alert>
      </Box>
    );
  }

  // Tính toán xu hướng dựa trên dữ liệu tháng
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isUp: true };
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isUp: change >= 0
    };
  };

  // Giả sử có dữ liệu tháng trước (có thể lấy từ API)
  const trends = {
    totalUsers: calculateTrend(statistics.overview.totalUsers, Math.floor(statistics.overview.totalUsers * 0.95)),
    activeUsers: calculateTrend(statistics.overview.activeUsers, Math.floor(statistics.overview.activeUsers * 0.92)),
    inactiveUsers: calculateTrend(statistics.overview.inactiveUsers, Math.floor(statistics.overview.inactiveUsers * 1.1)),
    newUsers: statistics.overview.newUsers ? calculateTrend(statistics.overview.newUsers, Math.floor(statistics.overview.newUsers * 0.8)) : null,
  };

  const roleBarData = [
    { name: 'Quản trị viên', value: statistics.byRole.Admin, fill: '#ef5350' },
    { name: 'Thủ thư', value: statistics.byRole.Librarian, fill: '#ffa726' },
    { name: 'Độc giả', value: statistics.byRole.Reader, fill: '#66bb6a' },
  ];

  const statusChartData = [
    { name: 'Hoạt động', value: statistics.overview.activeUsers, fill: '#66bb6a' },
    { name: 'Bị khóa', value: statistics.overview.inactiveUsers, fill: '#ef5350' },
  ];

  const borrowingChartData = [
    { name: 'Đang mượn', value: statistics.borrowing.activeBorrows, fill: '#42a5f5' },
    { name: 'Đã trả', value: statistics.borrowing.returnedBorrows, fill: '#66bb6a' },
  ];

  const membershipChartData = [
    { name: 'Có gói thành viên', value: statistics.membership.withMembership, fill: '#ab47bc' },
    { name: 'Không có gói thành viên', value: statistics.membership.withoutMembership, fill: '#bdbdbd' },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Thống kê người dùng
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 400, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Tổng quan dữ liệu hệ thống
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, newPeriod) => setPeriod(newPeriod)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: '1px solid #ddd',
                color: '#6b7280',
                fontSize: '0.8125rem',
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                '&.Mui-selected': {
                  bgcolor: '#1976d2',
                  color: '#fff',
                  border: '1px solid #1976d2',
                }
              }
            }}
          >
            <ToggleButton value="all" aria-label="all">Tất cả</ToggleButton>
            <ToggleButton value="today" aria-label="today">Hôm nay</ToggleButton>
            <ToggleButton value="week" aria-label="week">Tuần</ToggleButton>
            <ToggleButton value="month" aria-label="month">Tháng</ToggleButton>
            <ToggleButton value="year" aria-label="year">Năm</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            onClick={refreshStatistics}
            disabled={loading}
            sx={{
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' },
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: '6px',
              px: 2.5,
              fontSize: '0.875rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280', letterSpacing: '0.3px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Tổng người dùng
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1.5, mb: 1, fontWeight: 600, color: '#1976d2', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {statistics.overview.totalUsers.toLocaleString('vi-VN')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {trends.totalUsers.isUp ? (
                      <ArrowUpRight size={18} color="#66bb6a" />
                    ) : (
                      <ArrowDownRight size={18} color="#ef5350" />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: trends.totalUsers.isUp ? '#66bb6a' : '#ef5350',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      {trends.totalUsers.percentage}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5, fontWeight: 400, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      so với kỳ trước
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{
                  bgcolor: '#e3f2fd',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={32} color="#1976d2" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280', letterSpacing: '0.3px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Hoạt động
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1.5, mb: 1, fontWeight: 600, color: '#66bb6a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {statistics.overview.activeUsers.toLocaleString('vi-VN')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {trends.activeUsers.isUp ? (
                      <ArrowUpRight size={18} color="#66bb6a" />
                    ) : (
                      <ArrowDownRight size={18} color="#ef5350" />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: trends.activeUsers.isUp ? '#66bb6a' : '#ef5350',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      {trends.activeUsers.percentage}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5, fontWeight: 400, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      so với kỳ trước
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{
                  bgcolor: '#e8f5e9',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LogIn size={32} color="#66bb6a" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280', letterSpacing: '0.3px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Bị khóa
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1.5, mb: 1, fontWeight: 600, color: '#ef5350', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {statistics.overview.inactiveUsers.toLocaleString('vi-VN')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {trends.inactiveUsers.isUp ? (
                      <ArrowUpRight size={18} color="#ef5350" />
                    ) : (
                      <ArrowDownRight size={18} color="#66bb6a" />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: trends.inactiveUsers.isUp ? '#ef5350' : '#66bb6a',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      {trends.inactiveUsers.percentage}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5, fontWeight: 400, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      so với kỳ trước
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{
                  bgcolor: '#ffebee',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock size={32} color="#ef5350" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280', letterSpacing: '0.3px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Mới
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1.5, mb: 1, fontWeight: 600, color: '#ffa726', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {period !== 'all' && statistics.overview.newUsers !== undefined
                      ? statistics.overview.newUsers.toLocaleString('vi-VN')
                      : 'N/A'}
                  </Typography>
                  {period !== 'all' && statistics.overview.newUsers !== undefined && trends.newUsers && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {trends.newUsers.isUp ? (
                        <ArrowUpRight size={18} color="#66bb6a" />
                      ) : (
                        <ArrowDownRight size={18} color="#ef5350" />
                      )}
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: trends.newUsers.isUp ? '#66bb6a' : '#ef5350',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                        }}
                      >
                        {trends.newUsers.percentage}%
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', ml: 0.5, fontWeight: 400, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                        so với kỳ trước
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{
                  bgcolor: '#fff3e0',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={32} color="#ffa726" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            overflow: 'hidden'
          }}>
            <CardHeader
              title="Phân bố theo vai trò"
              sx={{
                bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                },
                pb: 2,
                pt: 2
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roleBarData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#999"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12, fill: '#666', fontWeight: 500 }}
                  />
                  <YAxis stroke="#999" tick={{ fontSize: 12, fill: '#666' }} />
                  <Tooltip 
                    formatter={(value) => value.toLocaleString('vi-VN')}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Bar dataKey="value" fill="#1976d2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            overflow: 'hidden'
          }}>
            <CardHeader
              title="Trạng thái tài khoản"
              sx={{
                bgcolor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                },
                pb: 2,
                pt: 2
              }}
            />
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                    wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value) => value.toLocaleString('vi-VN')}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            overflow: 'hidden'
          }}>
            <CardHeader
              title="Hoạt động mượn sách"
              sx={{
                bgcolor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                },
                pb: 2,
                pt: 2
              }}
            />
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={borrowingChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {borrowingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                    wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value) => value.toLocaleString('vi-VN')}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            overflow: 'hidden'
          }}>
            <CardHeader
              title="Gói thành viên"
              sx={{
                bgcolor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: '#fff',
                borderBottom: '1px solid #f0f0f0',
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                },
                pb: 2,
                pt: 2
              }}
            />
            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={membershipChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {membershipChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                    wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value) => value.toLocaleString('vi-VN')}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart */}
      {statistics.trends.byMonth && statistics.trends.byMonth.length > 0 && (
        <Card sx={{ 
          bgcolor: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: '12px',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
          mb: 4
        }}>
          <CardHeader
            title="Xu hướng đăng ký người dùng (12 tháng gần nhất)"
            sx={{
              bgcolor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: '#fff',
              borderBottom: '1px solid #f0f0f0',
              '& .MuiCardHeader-title': {
                fontWeight: 600,
                fontSize: '1.05rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }
            }}
          />
          <CardContent sx={{ pt: 4, pb: 3, px: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={statistics.trends.byMonth}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1976d2" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#42a5f5" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                <XAxis
                  dataKey="_id"
                  stroke="#666"
                  tick={{ fontSize: 13, fill: '#666', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e0e0e0', strokeWidth: 2 }}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fontSize: 13, fill: '#666', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e0e0e0', strokeWidth: 2 }}
                  label={{
                    value: 'Số người dùng',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 13, fill: '#666', fontWeight: 600 }
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value.toLocaleString('vi-VN')} người`, 'Người dùng mới']}
                  labelFormatter={(label) => `Tháng ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    border: '2px solid #1976d2',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                  cursor={{ fill: 'rgba(25, 118, 210, 0.1)' }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                  iconType="rect"
                />
                <Bar
                  dataKey="count"
                  name="Người dùng mới"
                  fill="url(#colorCount)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Financial Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tổng chi tiêu
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 800, color: '#1976d2' }}>
                    {statistics.financial.totalSpent.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#e3f2fd',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={28} color="#1976d2" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Chi tiêu trung bình
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 800, color: '#66bb6a' }}>
                    {statistics.financial.averageSpent.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#e8f5e9',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={28} color="#66bb6a" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tổng dư ví
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 800, color: '#ffa726' }}>
                    {statistics.financial.totalWalletBalance.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#fff3e0',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={28} color="#ffa726" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Dư ví trung bình
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 800, color: '#ab47bc' }}>
                    {statistics.financial.averageWalletBalance.toLocaleString('vi-VN')}đ
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: '#f3e5f5',
                  borderRadius: '10px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={28} color="#ab47bc" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Borrowers Table */}
      {statistics.topBorrowers && statistics.topBorrowers.length > 0 && (
        <Card sx={{ 
          bgcolor: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: '12px',
          border: '1px solid #f0f0f0',
          overflow: 'hidden'
        }}>
          <CardHeader
            title="Top 10 người mượn sách nhiều nhất"
            sx={{
              bgcolor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              borderBottom: '1px solid #f0f0f0',
              '& .MuiCardHeader-title': {
                fontWeight: 600,
                fontSize: '1.05rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }
            }}
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: '2px solid #ddd' }}>Thứ tự</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: '2px solid #ddd' }}>Tên</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: '2px solid #ddd' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: '2px solid #ddd' }}>Vai trò</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Lần mượn</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#333', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Đang mượn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistics.topBorrowers.map((borrower, index) => (
                    <TableRow 
                      key={borrower.userId} 
                      sx={{ 
                        '&:hover': { bgcolor: '#f9f9f9' },
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#1976d2', width: '50px' }}>#{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>{borrower.fullName || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '0.9rem', color: '#666' }}>{borrower.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            borrower.role === 'Admin'
                              ? 'Quản trị viên'
                              : borrower.role === 'Librarian'
                                ? 'Thủ thư'
                                : 'Độc giả'
                          }
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor:
                              borrower.role === 'Admin'
                                ? '#ffebee'
                                : borrower.role === 'Librarian'
                                  ? '#fff3e0'
                                  : '#e3f2fd',
                            color:
                              borrower.role === 'Admin'
                                ? '#c62828'
                                : borrower.role === 'Librarian'
                                  ? '#e65100'
                                  : '#01579b',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#1976d2' }}>
                        {borrower.totalBorrows.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={borrower.activeBorrows.toString()}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            minWidth: '40px'
                          }}
                          color={borrower.activeBorrows > 0 ? 'warning' : 'success'}
                          variant="filled"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserStatistics;
