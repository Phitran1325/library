import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import axios, { type AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/common/Notification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type SubscriptionHistoryRow = {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  plan: {
    _id: string;
    name: string;
    price: number;
    duration: number;
  };
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Canceled';
  source: 'Payment' | 'Admin';
  createdAt: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN');
};

export default function MembershipHistory() {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const [history, setHistory] = useState<SubscriptionHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchEmail, setSearchEmail] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  const loadHistory = async () => {
    if (!token) {
      console.log('[MembershipHistory] No token available');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page,
        limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (sourceFilter !== 'all') {
        params.source = sourceFilter;
      }
      if (searchEmail.trim()) {
        params.email = searchEmail.trim();
      }

      const res = await axios.get(`${API_BASE_URL}/admin-memberships/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      const data = res.data?.data || res.data;
      if (data?.history) {
        setHistory(data.history);
        setTotalPages(data.pagination?.pages || 1);
        setTotalRecords(data.pagination?.total || 0);
      } else {
        setHistory([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        'Không thể tải lịch sử đăng ký thành viên';
      setError(message);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, statusFilter, sourceFilter]);

  const handleSearch = () => {
    setPage(1);
    loadHistory();
  };

  const handleReset = () => {
    setStatusFilter('all');
    setSourceFilter('all');
    setSearchEmail('');
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
        return 'default';
      case 'Canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Payment':
        return 'primary';
      case 'Admin':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Lịch sử đăng ký thành viên
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Xem lịch sử đăng ký thành viên của tất cả người dùng, bao gồm các gói đã đăng ký,
        thời gian và nguồn đăng ký (thanh toán hoặc admin gán).
      </Typography>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Bộ lọc
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
            <TextField
              label="Tìm theo email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1 }}
              placeholder="Nhập email người dùng..."
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="Active">Đang hoạt động</MenuItem>
                <MenuItem value="Expired">Hết hạn</MenuItem>
                <MenuItem value="Canceled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Nguồn</InputLabel>
              <Select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                label="Nguồn"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="Payment">Thanh toán</MenuItem>
                <MenuItem value="Admin">Admin gán</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleSearch}>
              Tìm kiếm
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Đặt lại
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Results */}
      <Paper>
        <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={2}>
          <Typography variant="h6">
            {totalRecords > 0 ? `${totalRecords} bản ghi` : 'Lịch sử đăng ký'}
          </Typography>
          <Button variant="text" onClick={loadHistory} disabled={loading}>
            Làm mới
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mx: 3, mb: 3 }}>{error}</Alert>
        ) : history.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <Typography color="text.secondary">Không có dữ liệu</Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Gói thành viên</TableCell>
                  <TableCell>Bắt đầu</TableCell>
                  <TableCell>Kết thúc</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Nguồn</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {row.user?.fullName || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.user?.email || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {row.plan?.name || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.plan?.price?.toLocaleString('vi-VN')} VNĐ / {row.plan?.duration} tháng
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDate(row.startDate)}</TableCell>
                    <TableCell>{formatDate(row.endDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={getStatusColor(row.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.source}
                        color={getSourceColor(row.source) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDateTime(row.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" py={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
