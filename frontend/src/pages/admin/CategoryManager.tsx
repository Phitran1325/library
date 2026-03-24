import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  FormControlLabel,
  Chip,
  CircularProgress,
  Tooltip,
  Stack,
  Select,
  MenuItem,
} from '@mui/material';
import StyledSwitch from '@/components/common/StyledSwitch';
import { Edit, Trash2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/common/Notification';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/admin.api';

type Category = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  slug?: string;
  createdAt?: string;
};

export default function CategoryManager() {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState<{ total: number; limit: number; page: number; pages: number }>({ total: 0, limit: 10, page: 1, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { token } = useAuth();
  const { showNotification } = useNotification();

  const load = async (pageIndex = 0, limit = rowsPerPage, q?: string) => {
    if (!token) {
      console.log('[CategoryManager] No token available, skipping load');
      return;
    }
    try {
      setLoading(true);
      const params: any = { page: pageIndex + 1, limit };
      if (q) params.q = q;
      const res = await getCategories(token, { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : (data?.categories ?? []);
      setLocalCategories(list);
      const pag = data?.pagination ?? { total: list.length, limit, page: pageIndex + 1, pages: 1 };
      setPagination(pag);
    } catch (err) {
      console.error(err);
      showNotification('Không thể tải danh sách thể loại', 'error');
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

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    load(0, newLimit, searchQuery);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsActive(true);
  };

  const onOpenCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const onOpenEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description || '');
    setIsActive(c.isActive ?? true);
    setOpen(true);
  };

  const onSave = async () => {
    try {
      if (!name.trim()) {
        showNotification('Tên thể loại là bắt buộc', 'warning');
        return;
      }
      const payload = { name: name.trim(), description: description.trim() || undefined, isActive };
      if (editing) {
        await updateCategory(editing._id, payload, token ?? undefined);
        showNotification('Cập nhật thể loại thành công', 'success');
      } else {
        await createCategory(payload, token ?? undefined);
        showNotification('Thêm thể loại thành công', 'success');
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
      await deleteCategory(id, token ?? undefined);
      showNotification('Xóa thể loại thành công', 'success');
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
          <h2 style={{ fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Thể Loại</h2>
          <span style={{ color: '#6b7280', fontSize: '0.8125rem', fontWeight: 400 }}>Quản lý thể loại và trạng thái</span>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Tìm kiếm thể loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
          />
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
            Add category
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
                <TableCell>Status</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localCategories
                .filter((c) => {
                  // Filter by search query
                  if (searchQuery.trim() && !(c.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())) {
                    return false;
                  }
                  // Filter by status
                  if (statusFilter === 'active' && c.isActive !== true) return false;
                  if (statusFilter === 'inactive' && c.isActive !== false) return false;
                  return true;
                })
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.isActive ? 'Active' : 'Inactive'}
                        color={c.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{c.slug}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onOpenEdit(c)}><Edit size={18} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => setDeleteConfirm(c._id)}><Trash2 size={18} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Box display="flex" justifyContent="flex-end" mt={1}>
        <TablePagination
          component="div"
          count={pagination.total ?? localCategories.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(16,24,40,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem', pb: 0 }}>
          {editing ? 'Edit category' : 'Create category'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: 4, pb: 2 }}>
          <Stack spacing={2}>
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
            <FormControlLabel
              control={<StyledSwitch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="Active"
              sx={{ ml: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onSave}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
              borderRadius: '10px',
              px: 3,
              py: 1,
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 6px 18px rgba(102,126,234,0.24)' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Xóa thể loại"
        message="Bạn có chắc chắn muốn xóa thể loại này không?"
        confirmText="Xóa"
        onConfirm={() => deleteConfirm && onDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
}
