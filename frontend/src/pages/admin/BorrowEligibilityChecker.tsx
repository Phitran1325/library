import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import axios, { type AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/common/Notification';

type BorrowValidationResponse = {
  isValid: boolean;
  errors: string[];
};

type BorrowRow = {
  _id: string;
  status: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  lateFee?: number;
  damageFee?: number;
  book?: {
    title: string;
    isbn?: string;
  };
  user?: {
    fullName?: string;
    email?: string;
  };
};

type User = {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
};

type Book = {
  _id: string;
  title: string;
  isbn?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function BorrowEligibilityChecker() {
  const { token, userRole } = useAuth();
  const { showNotification } = useNotification();
  const [bookId, setBookId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [validation, setValidation] = useState<BorrowValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [borrowList, setBorrowList] = useState<BorrowRow[]>([]);
  const [loadingBorrows, setLoadingBorrows] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const loadUsers = async () => {
    if (!token) return;
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });
      const data = res.data?.data;
      if (data?.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadBooks = async () => {
    if (!token) return;
    try {
      setLoadingBooks(true);
      const res = await axios.get(`${API_BASE_URL}/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });
      const data = res.data?.data;
      if (data?.books) {
        setBooks(data.books);
      }
    } catch (err) {
      console.error('Error loading books:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadBorrows = async () => {
    if (!token) {
      console.log('[BorrowEligibilityChecker] No token available, skipping load');
      return;
    }
    try {
      setLoadingBorrows(true);
      setBorrowError(null);
      console.log('[BorrowEligibilityChecker] Loading with token:', token?.substring(0, 20) + '...');
      const res = await axios.get(`${API_BASE_URL}/borrows`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 10,
        },
      });
      const data = res.data?.data;
      if (data?.borrows) {
        setBorrowList(data.borrows);
      } else {
        setBorrowList([]);
      }
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        'Không thể tải danh sách phiếu mượn';
      setBorrowError(message);
    } finally {
      setLoadingBorrows(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBorrows();
      loadUsers();
      loadBooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onValidate = async () => {
    if (!bookId.trim()) {
      showNotification('Vui lòng nhập Book ID', 'warning');
      return;
    }
    if (!token) {
      showNotification('Vui lòng đăng nhập để tiếp tục', 'error');
      return;
    }
    try {
      setValidating(true);
      setValidation(null);

      const payload: Record<string, string> = { bookId: bookId.trim() };
      if (targetUserId.trim()) {
        payload.userId = targetUserId.trim();
      }

      const res = await axios.post(`${API_BASE_URL}/borrows/validate`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = res.data?.data ?? res.data;
      if (responseData) {
        setValidation({
          isValid: Boolean(responseData.isValid),
          errors: responseData.errors ?? [],
        });
      } else {
        setValidation({
          isValid: res.data?.success ?? true,
          errors: res.data?.errors ?? [],
        });
      }
    } catch (err) {
      console.error('Error validating borrow:', err);
      const axiosError = err as AxiosError<{ message?: string; errors?: string[]; error?: string }>;
      console.error('Response data:', axiosError.response?.data);
      console.error('Response status:', axiosError.response?.status);

      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        'Không thể kiểm tra điều kiện mượn';
      const errors =
        axiosError.response?.data?.errors ?? [message];
      setValidation({
        isValid: false,
        errors,
      });
    } finally {
      setValidating(false);
      loadBorrows();
    }
  };

  const canCheckOtherUser = userRole === 'admin' || userRole === 'librarian';

  const filteredBorrowList = statusFilter === 'all'
    ? borrowList
    : borrowList.filter(borrow => borrow.status === statusFilter);

  return (
    <Box sx={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#1a1a1a' }}>
        Kiểm tra điều kiện mượn sách
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3} sx={{ fontSize: '0.8125rem', fontWeight: 400, color: '#6b7280' }}>
        Nhập ID sách và (tuỳ chọn) ID độc giả để hệ thống thực hiện toàn bộ bước kiểm tra: hạn mức,
        gói thành viên, nợ phạt, trạng thái sách và quyền Premium. Kết quả phản hồi rõ ràng giúp
        bạn xử lý ngay các vấn đề phát sinh.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Card variant="outlined" sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <FormControl fullWidth required>
                  <InputLabel id="book-select-label">Book</InputLabel>
                  <Select
                    labelId="book-select-label"
                    value={bookId}
                    label="Book"
                    onChange={(e) => setBookId(e.target.value)}
                    disabled={loadingBooks}
                    sx={{
                      borderRadius: '10px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontSize: '0.9375rem'
                    }}
                  >
                    <MenuItem value="">
                      <em>Chọn sách</em>
                    </MenuItem>
                    {books.map((book) => (
                      <MenuItem key={book._id} value={book._id}>
                        {book.title} {book.isbn && `(${book.isbn})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={!canCheckOtherUser}>
                  <InputLabel id="user-select-label">User (tuỳ chọn)</InputLabel>
                  <Select
                    labelId="user-select-label"
                    value={targetUserId}
                    label="User (tuỳ chọn)"
                    onChange={(e) => setTargetUserId(e.target.value)}
                    disabled={!canCheckOtherUser || loadingUsers}
                    sx={{
                      borderRadius: '10px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontSize: '0.9375rem'
                    }}
                  >
                    <MenuItem value="">
                      <em>{canCheckOtherUser ? 'Kiểm tra cho chính bạn' : 'Chỉ admin/thủ thư mới có thể kiểm tra cho người khác'}</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.fullName || user.username} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={onValidate}
                  disabled={validating}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    py: 1.25,
                    borderRadius: '10px',
                    boxShadow: 'none',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
                    }
                  }}
                >
                  {validating ? 'Đang kiểm tra…' : 'Kiểm tra điều kiện mượn'}
                </Button>
                {validation && (
                  <Alert severity={validation.isValid ? 'success' : 'error'}>
                    {validation.isValid
                      ? 'Đủ điều kiện mượn. Bạn có thể tiến hành tạo phiếu mượn.'
                      : (
                        <Stack spacing={1}>
                          <span>Không đáp ứng điều kiện mượn:</span>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {validation.errors.map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                          </ul>
                        </Stack>
                      )
                    }
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Tự động hoá sau khi mượn/trả
              </Typography>
              <Stack spacing={1.5} color="text.secondary">
                <Typography variant="body2">
                  • Cron hàng ngày tính phí trễ hạn, gửi email nhắc và cập nhật trạng thái phiếu mượn.
                </Typography>
                <Typography variant="body2">
                  • Khi trả, hệ thống tự đổi trạng thái bản sao sách (Available, Borrowed, Damaged, Lost) và cập nhật kho.
                </Typography>
                <Typography variant="body2">
                  • Đặt trước sẽ được xử lý tự động: nếu đủ điều kiện, reservation chuyển sang phiếu mượn và email gửi tới độc giả.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box mt={4}>

        <Paper>
          <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Phiếu mượn gần nhất</Typography>
            <Box display="flex" gap={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Trạng thái</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: '8px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontSize: '0.9375rem'
                  }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="Borrowed">Borrowed</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                  <MenuItem value="Returned">Returned</MenuItem>
                  <MenuItem value="Lost">Lost</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="text"
                onClick={loadBorrows}
                disabled={loadingBorrows}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  borderRadius: '8px'
                }}
              >
                Làm mới
              </Button>
            </Box>
          </Box>
          {loadingBorrows ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
              <CircularProgress size={28} />
            </Box>
          ) : borrowError ? (
            <Alert severity="error" sx={{ mx: 3, mb: 3 }}>{borrowError}</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Độc giả</TableCell>
                  <TableCell>Sách</TableCell>
                  <TableCell>Ngày mượn</TableCell>
                  <TableCell>Hạn trả</TableCell>
                  <TableCell>Trả</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Phí</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBorrowList.map((borrow) => {
                  const isOverdue = borrow.status === 'Overdue';
                  const statusColor =
                    borrow.status === 'Borrowed'
                      ? 'primary'
                      : borrow.status === 'Overdue'
                        ? 'error'
                        : borrow.status === 'Returned'
                          ? 'success'
                          : 'default';
                  return (
                    <TableRow key={borrow._id} sx={isOverdue ? { backgroundColor: 'rgba(255,0,0,0.05)' } : undefined}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <span>{borrow.user?.fullName ?? '—'}</span>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>{borrow.user?.email ?? '—'}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>{borrow.book?.title ?? '—'}</TableCell>
                      <TableCell>{formatDateTime(borrow.borrowDate)}</TableCell>
                      <TableCell>{formatDateTime(borrow.dueDate)}</TableCell>
                      <TableCell>{formatDateTime(borrow.returnDate)}</TableCell>
                      <TableCell>
                        <Chip label={borrow.status} color={statusColor as any} size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <span>Trễ: {borrow.lateFee ?? 0}</span>
                          <span>Hư hỏng: {borrow.damageFee ?? 0}</span>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
