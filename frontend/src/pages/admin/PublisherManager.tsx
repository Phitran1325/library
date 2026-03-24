import { useEffect, useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import StyledSwitch from '@/components/common/StyledSwitch';
import { Edit, Trash2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/common/Notification';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  getPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
} from '@/services/admin.api';

type Publisher = {
  _id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
  bookCount?: number;
};

export default function PublisherManager() {
  const [localPublishers, setLocalPublishers] = useState<Publisher[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Publisher | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState<{ total: number; limit: number; page: number; pages: number }>({ total: 0, limit: 10, page: 1, pages: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', address: '', phone: '', email: '', website: '', isActive: true });
  const { token } = useAuth();
  const { showNotification } = useNotification();

  const load = async (pageIndex = 0, limit = rowsPerPage, q?: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const params: any = { page: pageIndex + 1, limit };
      if (q) params.q = q;
      const res = await getPublishers(token, { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : (data?.publishers ?? []);
      setLocalPublishers(list);
      const pag = data?.pagination ?? { total: list.length, limit, page: pageIndex + 1, pages: 1 };
      setPagination(pag);
    } catch (err) {
      console.error(err);
      showNotification('Không thể tải danh sách nhà xuất bản', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load(page, rowsPerPage, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => {
      setPage(0);
      load(0, rowsPerPage, searchQuery);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, token]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    load(newPage, rowsPerPage, searchQuery);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    load(0, newLimit, searchQuery);
  };

  const resetForm = () => setForm({ name: '', description: '', address: '', phone: '', email: '', website: '', isActive: true });

  const onOpenCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const onOpenEdit = (publisher: Publisher) => {
    setEditing(publisher);
    setForm({
      name: publisher.name,
      description: publisher.description ?? '',
      address: publisher.address ?? '',
      phone: publisher.phone ?? '',
      email: publisher.email ?? '',
      website: publisher.website ?? '',
      isActive: publisher.isActive ?? true,
    });
    setOpen(true);
  };

  const onSave = async () => {
    try {
      if (!form.name.trim()) {
        showNotification('Tên nhà xuất bản là bắt buộc', 'warning');
        return;
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        website: form.website.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await updatePublisher(editing._id, payload, token ?? undefined);
        showNotification('Cập nhật nhà xuất bản thành công', 'success');
      } else {
        await createPublisher(payload, token ?? undefined);
        showNotification('Thêm nhà xuất bản thành công', 'success');
      }
      setOpen(false);
      await load(page, rowsPerPage, searchQuery);
    } catch (err) {
      console.error(err);
      const message = (err as AxiosError<{ message?: string }>).response?.data?.message || 'Lưu thất bại';
      showNotification(message, 'error');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deletePublisher(id, token ?? undefined);
      showNotification('Xóa nhà xuất bản thành công', 'success');
      setDeleteConfirm(null);
      await load(page, rowsPerPage, searchQuery);
    } catch (err) {
      console.error(err);
      const message = (err as AxiosError<{ message?: string }>).response?.data?.message || 'Xóa thất bại';
      showNotification(message, 'error');
    }
  };

  return (
    <Box sx={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="column" spacing={0}>
          <h2 style={{ fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Nhà Xuất Bản</h2>
          <span style={{ color: '#6b7280', fontSize: '0.8125rem', fontWeight: 400 }}>Quản lý nhà xuất bản và trạng thái</span>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField size="small" placeholder="Tìm kiếm nhà xuất bản..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ minWidth: 260 }} />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 140 }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
          <Button
            variant="contained"
            onClick={() => {
              setPage(0);
              load(0, rowsPerPage, searchQuery);
            }}
            sx={{
              textTransform: 'none',
              backgroundColor: '#2563EB',
              color: '#fff',
              '&:hover': { backgroundColor: '#1e40af' },
              px: 2.5,
              py: 1,
              borderRadius: 2,
            }}
          >
            Tìm kiếm
          </Button>
          <Button
            variant="outlined"
            onClick={onOpenCreate}
            sx={{ textTransform: 'none', ml: 1 }}
          >
            Add publisher
          </Button>
        </Stack>
      </Box>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Website</TableCell>
                <TableCell>Books</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localPublishers
                .filter((p) => {
                  // Filter by search query
                  if (searchQuery.trim() && !(p.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())) {
                    return false;
                  }
                  // Filter by status
                  if (statusFilter === 'active' && p.isActive !== true) return false;
                  if (statusFilter === 'inactive' && p.isActive !== false) return false;
                  return true;
                })
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((publisher) => (
                  <TableRow key={publisher._id}>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <span>{publisher.name}</span>
                        {publisher.address && <span style={{ color: '#6b7280', fontSize: 12 }}>{publisher.address}</span>}
                      </Stack>
                    </TableCell>
                    <TableCell>{publisher.description}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <span>{publisher.phone ?? ''}</span>
                        <span>{publisher.email ?? ''}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {publisher.website ? (
                        <a href={publisher.website} target="_blank" rel="noreferrer">
                          {publisher.website}
                        </a>
                      ) : (
                        ''
                      )}
                    </TableCell>
                    <TableCell>{publisher.bookCount ?? 0}</TableCell>
                    <TableCell>
                      <Chip label={publisher.isActive ? 'Active' : 'Inactive'} color={publisher.isActive ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton onClick={() => onOpenEdit(publisher)}>
                            <Edit size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton onClick={() => setDeleteConfirm(publisher._id)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Box display="flex" justifyContent="flex-end" mt={1}>
        <TablePagination component="div" count={pagination.total ?? localPublishers.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[5, 10, 25]} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 12px 40px rgba(16,24,40,0.12)' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem', pb: 0 }}>{editing ? 'Edit publisher' : 'Create publisher'}</DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: 4, pb: 2 }}>
          <Stack spacing={2}>
            <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} />
            <TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
            <TextField fullWidth label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" />
            <FormControlLabel control={<StyledSwitch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" sx={{ ml: 0 }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Cancel</Button>
          <Button variant="contained" onClick={onSave} sx={{ textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', borderRadius: '10px', px: 3, py: 1, boxShadow: 'none', '&:hover': { boxShadow: '0 6px 18px rgba(102,126,234,0.24)' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} title="Xóa nhà xuất bản" message="Bạn có chắc chắn muốn xóa nhà xuất bản này không?" confirmText="Xóa" onConfirm={() => deleteConfirm && onDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} />
    </Box>
  );
}
