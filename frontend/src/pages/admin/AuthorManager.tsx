import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Avatar,
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
  TablePagination,
  TextField,
  Tooltip,
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
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from '@/services/admin.api';
import { Role } from '@/types';

type Author = {
  _id: string;
  name: string;
  biography?: string;
  nationality?: string;
  website?: string;
  birthDate?: string;
  isActive?: boolean;
  bookCount?: number;
};

const formatDate = (input?: string) => {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function AuthorManager() {
  // client-side filtered view
  const [localAuthors, setLocalAuthors] = useState<Author[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [form, setForm] = useState({
    name: '',
    biography: '',
    nationality: '',
    website: '',
    birthDate: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { token, userRole } = useAuth();
  const { showNotification } = useNotification();

  const canEdit = useMemo(() => userRole === Role.ADMIN, [userRole]);

  const load = async (pageIndex = 0, limit = rowsPerPage, q?: string) => {
    if (!token) {
      console.log('[AuthorManager] No token available, skipping load');
      return;
    }
    try {
      setLoading(true);
      console.log('[AuthorManager] Loading with token:', token?.substring(0, 20) + '...');
      const params: any = { page: pageIndex + 1, limit };
      if (q) params.q = q;
      const res = await getAuthors(token, { params });
      const data = res.data?.data;
      if (data) {
        const list = data.authors ?? [];
        setLocalAuthors(list);
      } else {
        setLocalAuthors([]);
      }
    } catch (err) {
      console.error(err);
      showNotification('Không thể tải danh sách tác giả', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load(page, rowsPerPage, searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, token]);

  // debounce search
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => {
      setPage(0);
      load(0, rowsPerPage, searchQuery);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, token]);

  // apply client-side filter to authors (works on the loaded page)
  const filteredAuthors = useMemo(() => {
    let result = localAuthors;

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((a) => (a.name || '').toLowerCase().includes(q));
    }

    // Filter by status
    if (statusFilter === 'active') {
      result = result.filter((a) => a.isActive === true);
    } else if (statusFilter === 'inactive') {
      result = result.filter((a) => a.isActive === false);
    }

    return result;
  }, [localAuthors, searchQuery, statusFilter]);

  const resetForm = () => {
    setForm({
      name: '',
      biography: '',
      nationality: '',
      website: '',
      birthDate: '',
      isActive: true,
    });
  };

  const onOpenCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const onOpenEdit = (author: Author) => {
    setEditing(author);
    setForm({
      name: author.name,
      biography: author.biography ?? '',
      nationality: author.nationality ?? '',
      website: author.website ?? '',
      birthDate: formatDate(author.birthDate),
      isActive: author.isActive ?? true,
    });
    setOpen(true);
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      showNotification('Tên tác giả là bắt buộc', 'warning');
      return;
    }

    // Validate max lengths
    if (form.name.trim().length > 100) {
      showNotification('Tên tác giả không được vượt quá 100 ký tự', 'warning');
      return;
    }
    if (form.biography.trim().length > 1000) {
      showNotification('Tiểu sử không được vượt quá 1000 ký tự', 'warning');
      return;
    }
    if (form.nationality.trim().length > 50) {
      showNotification('Quốc tịch không được vượt quá 50 ký tự', 'warning');
      return;
    }

    // Validate website URL if provided
    const websiteValue = form.website.trim();
    if (websiteValue && !websiteValue.startsWith('http://') && !websiteValue.startsWith('https://')) {
      showNotification('Website phải bắt đầu bằng http:// hoặc https://', 'warning');
      return;
    }

    // Validate birthDate is not in the future
    if (form.birthDate) {
      const birthDate = new Date(form.birthDate);
      if (birthDate > new Date()) {
        showNotification('Ngày sinh không thể là ngày trong tương lai', 'warning');
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      biography: form.biography.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
      website: websiteValue || undefined,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await updateAuthor(editing._id, payload, token ?? undefined);
        showNotification('Cập nhật tác giả thành công', 'success');
      } else {
        console.log('Creating author with payload:', payload);
        await createAuthor(payload, token ?? undefined);
        showNotification('Thêm tác giả thành công', 'success');
      }
      setOpen(false);
      await load(page, rowsPerPage);
    } catch (err) {
      console.error('Error saving author:', err);
      const axiosError = err as AxiosError<{ message?: string; errors?: string[] }>;
      console.error('Response data:', axiosError.response?.data);
      console.error('Response status:', axiosError.response?.status);

      let message = 'Lưu thất bại';
      if (axiosError.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
        message = axiosError.response.data.errors.join(', ');
      } else if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      }

      showNotification(message, 'error');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteAuthor(id, token ?? undefined);
      showNotification('Xóa tác giả thành công', 'success');
      setDeleteConfirm(null);
      await load(page, rowsPerPage);
    } catch (err) {
      console.error(err);
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message || 'Xóa thất bại';
      showNotification(message, 'error');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
  };

  return (
    <Box sx={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="column" spacing={0}>
            <h2 style={{ fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Tác Giả</h2>
            <span style={{ color: '#6b7280', fontSize: '0.8125rem', fontWeight: 400 }}>
              Quản lý tác giả và trạng thái
            </span>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Tìm kiếm tác giả..."
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
            disabled={!canEdit}
            sx={{ textTransform: 'none', ml: 1 }}
          >
            Add author
          </Button>
        </Stack>
      </Box>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Avatar</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Nationality</TableCell>
                  <TableCell>Website</TableCell>
                  <TableCell>Books</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAuthors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((author) => (
                  <TableRow key={author._id}>
                    <TableCell>
                      <Avatar>{author.name?.[0]}</Avatar>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <span>{author.name}</span>
                        {author.biography && (
                          <span style={{ color: '#6b7280', fontSize: 12 }}>
                            {author.biography.slice(0, 60)}
                            {author.biography.length > 60 ? '…' : ''}
                          </span>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{author.nationality}</TableCell>
                    <TableCell>
                      {author.website ? (
                        <a href={author.website} target="_blank" rel="noreferrer">
                          {author.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{author.bookCount ?? 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={author.isActive ? 'Active' : 'Inactive'}
                        color={author.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton onClick={() => onOpenEdit(author)} disabled={!canEdit}>
                            <Edit size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            onClick={() => setDeleteConfirm(author._id)}
                            disabled={!canEdit}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredAuthors.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(16,24,40,0.12)',
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem', pb: 0 }}>
          {editing ? 'Edit author' : 'Create author'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: 4, pb: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Biography"
              value={form.biography}
              onChange={(e) => setForm({ ...form, biography: e.target.value })}
            />
            <TextField
              fullWidth
              label="Nationality"
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            />
            <TextField
              fullWidth
              label="Website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
              helperText="Phải bắt đầu bằng http:// hoặc https://"
            />
            <TextField
              fullWidth
              type="date"
              label="Birth date"
              InputLabelProps={{ shrink: true }}
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
            <FormControlLabel
              control={
                <StyledSwitch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Active"
              sx={{ ml: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
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
        title="Xóa tác giả"
        message="Bạn có chắc chắn muốn xóa tác giả này không?"
        confirmText="Xóa"
        onConfirm={() => deleteConfirm && onDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
}
