import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { useConfirm } from '@/components/common/ConfirmDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

type BookCopyRow = {
  _id: string;
  barcode: string;
  bookId: {
    _id: string;
    title: string;
    isbn?: string;
  };
  status: 'available' | 'borrowed' | 'reserved' | 'maintenance' | 'lost' | 'damaged';
  condition: 'new' | 'good' | 'fair' | 'poor';
  location?: string;
  notes?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, any> = {
  available: 'success',
  borrowed: 'primary',
  reserved: 'warning',
  maintenance: 'default',
  lost: 'error',
  damaged: 'error',
};

const CONDITION_COLORS: Record<string, any> = {
  new: 'success',
  good: 'primary',
  fair: 'warning',
  poor: 'error',
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function BookCopyStatusManagement() {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const { confirm, ConfirmDialog } = useConfirm();
  const [bookCopies, setBookCopies] = useState<BookCopyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchBarcode, setSearchBarcode] = useState('');

  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<BookCopyRow | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newCondition, setNewCondition] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadBookCopies = async () => {
    if (!token) {
      console.log('[BookCopyStatusManagement] No token available');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        limit: 50,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchBarcode.trim()) {
        params.barcode = searchBarcode.trim();
      }

      const res = await axios.get(`${API_BASE_URL}/admin/book-copies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      const data = res.data?.data || res.data;
      if (data?.bookCopies) {
        setBookCopies(data.bookCopies);
      } else {
        setBookCopies([]);
      }
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        'Không thể tải danh sách bản sao sách';
      setError(message);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBookCopies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const handleSearch = () => {
    loadBookCopies();
  };

  const handleReset = () => {
    setStatusFilter('all');
    setSearchBarcode('');
  };

  const handleOpenEditDialog = (copy: BookCopyRow) => {
    setSelectedCopy(copy);
    setNewStatus(copy.status);
    setNewCondition(copy.condition);
    setNewNotes(copy.notes || '');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCopy(null);
    setNewStatus('');
    setNewCondition('');
    setNewNotes('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedCopy) return;

    try {
      setUpdating(true);

      const payload: Record<string, any> = {};
      if (newStatus !== selectedCopy.status) {
        payload.status = newStatus;
      }
      if (newCondition !== selectedCopy.condition) {
        payload.condition = newCondition;
      }
      if (newNotes !== (selectedCopy.notes || '')) {
        payload.notes = newNotes;
      }

      await axios.put(
        `${API_BASE_URL}/admin/book-copies/${selectedCopy._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification('Cập nhật trạng thái thành công', 'success');
      handleCloseEditDialog();
      loadBookCopies();
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        'Không thể cập nhật trạng thái';
      showNotification(message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkDamaged = async (copy: BookCopyRow) => {
    const confirmed = await confirm(
      'Xác nhận đánh dấu hư hỏng',
      `Bạn có chắc chắn muốn đánh dấu bản sao "${copy.barcode}" là Hư hỏng?`
    );
    if (!confirmed) return;

    try {
      await axios.put(
        `${API_BASE_URL}/admin/book-copies/${copy._id}/mark-damaged`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification('Đã đánh dấu hư hỏng', 'success');
      loadBookCopies();
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        'Không thể đánh dấu hư hỏng';
      showNotification(message, 'error');
    }
  };

  const handleMarkLost = async (copy: BookCopyRow) => {
    const confirmed = await confirm(
      'Xác nhận đánh dấu mất',
      `Bạn có chắc chắn muốn đánh dấu bản sao "${copy.barcode}" là Mất?`
    );
    if (!confirmed) return;

    try {
      await axios.put(
        `${API_BASE_URL}/admin/book-copies/${copy._id}/mark-lost`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification('Đã đánh dấu mất', 'success');
      loadBookCopies();
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        'Không thể đánh dấu mất';
      showNotification(message, 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Quản lý trạng thái sách
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Đánh dấu sách hư hỏng hoặc mất để hệ thống ghi nhận và xử lý phí bồi thường.
      </Typography>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Bộ lọc
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
            <TextField
              label="Tìm theo mã vạch"
              value={searchBarcode}
              onChange={(e) => setSearchBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1 }}
              placeholder="Nhập mã vạch sách..."
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="available">Có sẵn</MenuItem>
                <MenuItem value="borrowed">Đang mượn</MenuItem>
                <MenuItem value="reserved">Đã đặt trước</MenuItem>
                <MenuItem value="maintenance">Bảo trì</MenuItem>
                <MenuItem value="damaged">Hư hỏng</MenuItem>
                <MenuItem value="lost">Mất</MenuItem>
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
            {bookCopies.length > 0 ? `${bookCopies.length} bản sao` : 'Danh sách bản sao sách'}
          </Typography>
          <Button variant="text" onClick={loadBookCopies} disabled={loading}>
            Làm mới
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mx: 3, mb: 3 }}>{error}</Alert>
        ) : bookCopies.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <Typography color="text.secondary">Không có dữ liệu</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã vạch</TableCell>
                <TableCell>Sách</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Tình trạng</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookCopies.map((copy) => (
                <TableRow key={copy._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {copy.barcode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={500}>
                        {copy.bookId?.title || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ISBN: {copy.bookId?.isbn || '—'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{copy.location || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={copy.status}
                      color={STATUS_COLORS[copy.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={copy.condition}
                      color={CONDITION_COLORS[copy.condition] || 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {copy.notes || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEditDialog(copy)}
                      >
                        Sửa
                      </Button>
                      {copy.status !== 'damaged' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleMarkDamaged(copy)}
                        >
                          Hư hỏng
                        </Button>
                      )}
                      {copy.status !== 'lost' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleMarkLost(copy)}
                        >
                          Mất
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái bản sao</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Cập nhật trạng thái và tình trạng của bản sao: <strong>{selectedCopy?.barcode}</strong>
          </DialogContentText>
          <Stack spacing={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="available">Có sẵn</MenuItem>
                <MenuItem value="borrowed">Đang mượn</MenuItem>
                <MenuItem value="reserved">Đã đặt trước</MenuItem>
                <MenuItem value="maintenance">Bảo trì</MenuItem>
                <MenuItem value="damaged">Hư hỏng</MenuItem>
                <MenuItem value="lost">Mất</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tình trạng</InputLabel>
              <Select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                label="Tình trạng"
              >
                <MenuItem value="new">Mới</MenuItem>
                <MenuItem value="good">Tốt</MenuItem>
                <MenuItem value="fair">Trung bình</MenuItem>
                <MenuItem value="poor">Kém</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Ghi chú"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Thêm ghi chú về tình trạng sách..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={updating}>
            Hủy
          </Button>
          <Button onClick={handleUpdateStatus} variant="contained" disabled={updating}>
            {updating ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </Box>
  );
}
