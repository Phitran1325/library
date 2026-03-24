import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  Stack,
  TextField,
  Alert,
} from '@mui/material';
import { Edit, Lock, LockOpen, AlertCircle } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/components/common/Notification';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { 
  getAllUsers,
  updateUserRole,
  lockUserAccount,
  unlockUserAccount,
  autoLockOverdueUsers,
  autoLockPenaltyDebtUsers,
} from '@/services/admin.api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Librarian' | 'Reader';
  isActive: boolean;
  createdAt: string;
  fullName?: string;
  phone?: string;
  status?: string;
  updatedAt?: string;
}

const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const { showNotification } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [openLockDialog, setOpenLockDialog] = useState(false);
  const [lockAction, setLockAction] = useState<{ userId: string; action: 'lock' | 'unlock' }>({
    userId: '',
    action: 'lock',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [autoLockLoading, setAutoLockLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers(token ?? '');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const error = err as AxiosError;
      showNotification(
        (error.response?.data as any)?.message || 'Lỗi tải danh sách người dùng',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setOpenEditDialog(true);
  };

  const handleSaveRole = async () => {
    if (!editingUser || selectedRole === editingUser.role) {
      setOpenEditDialog(false);
      return;
    }

    try {
      setLoading(true);
      await updateUserRole(editingUser._id, selectedRole as 'Admin' | 'Librarian' | 'Reader', token ?? '');
      showNotification('Cập nhật vai trò thành công', 'success');
      setUsers(prev =>
        prev.map(u => (u._id === editingUser._id ? { ...u, role: selectedRole as User['role'] } : u))
      );
      setOpenEditDialog(false);
    } catch (err) {
      const error = err as AxiosError;
      showNotification((error.response?.data as any)?.message || 'Lỗi cập nhật vai trò', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user: User) => {
    setDetailUser(user);
    setOpenDetailDialog(true);
  };

  const handleLockUnlock = (userId: string, isCurrentlyActive: boolean) => {
    setLockAction({
      userId,
      action: isCurrentlyActive ? 'lock' : 'unlock',
    });
    setOpenLockDialog(true);
  };

  const confirmLockUnlock = async () => {
    try {
      setLoading(true);
      if (lockAction.action === 'lock') {
        await lockUserAccount(lockAction.userId, token ?? '');
        showNotification('Khóa tài khoản thành công', 'success');
      } else {
        await unlockUserAccount(lockAction.userId, token ?? '');
        showNotification('Mở khóa tài khoản thành công', 'success');
      }
      setUsers(prev =>
        prev.map(u => (u._id === lockAction.userId ? { ...u, isActive: lockAction.action !== 'lock' } : u))
      );
      setOpenLockDialog(false);
    } catch (err) {
      const error = err as AxiosError;
      showNotification((error.response?.data as any)?.message || 'Lỗi thay đổi trạng thái tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || user.role === filterRole;
    const matchesStatus =
      filterStatus === '' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'locked' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'error';
      case 'Librarian': return 'warning';
      case 'Reader': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'Quản trị viên';
      case 'Librarian': return 'Thủ thư';
      case 'Reader': return 'Độc giả';
      default: return role;
    }
  };

  const handleAutoLockOverdue = async () => {
    try {
      setAutoLockLoading(true);
      const result = await autoLockOverdueUsers(token ?? '');
      showNotification(`Đã khóa ${result.data?.lockedCount || 0} tài khoản trễ hạn`, 'success');
      await fetchUsers();
    } catch (err) {
      const error = err as AxiosError;
      showNotification((error.response?.data as any)?.message || 'Lỗi khi khóa tài khoản trễ hạn', 'error');
    } finally {
      setAutoLockLoading(false);
    }
  };

  const handleAutoLockPenaltyDebt = async () => {
    try {
      setAutoLockLoading(true);
      const result = await autoLockPenaltyDebtUsers(token ?? '');
      showNotification(`Đã khóa ${result.data?.lockedCount || 0} tài khoản nợ phạt`, 'success');
      await fetchUsers();
    } catch (err) {
      const error = err as AxiosError;
      showNotification((error.response?.data as any)?.message || 'Lỗi khi khóa tài khoản nợ phạt', 'error');
    } finally {
      setAutoLockLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Box sx={{ mb: 3 }}>
        <h1 style={{ margin: 0, marginBottom: '0.5rem', color: '#1a1a1a', fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
          Quản lý Người dùng
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8125rem', fontWeight: 400 }}>
          Tìm kiếm, lọc và quản lý tài khoản người dùng
        </p>
      </Box>

      {/* Filters & Auto-lock Buttons */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                fontSize: '0.9375rem',
              },
            }}
            size="small"
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: '0.9375rem' }}>Lọc theo vai trò</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              label="Lọc theo vai trò"
              size="small"
              sx={{ borderRadius: '10px', fontSize: '0.9375rem' }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="Admin">Quản trị viên</MenuItem>
              <MenuItem value="Librarian">Thủ thư</MenuItem>
              <MenuItem value="Reader">Độc giả</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: '0.9375rem' }}>Lọc theo trạng thái</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Lọc theo trạng thái"
              size="small"
              sx={{ borderRadius: '10px', fontSize: '0.9375rem' }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="active">Hoạt động</MenuItem>
              <MenuItem value="locked">Bị khóa</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={fetchUsers}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
              px: 3,
              borderRadius: '10px',
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)' },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Tải lại'}
          </Button>
        </Stack>

        {/* === 2 NÚT GIỐNG HỆT HÌNH === */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            onClick={handleAutoLockOverdue}
            disabled={loading || autoLockLoading}
            startIcon={
              autoLockLoading ? (
                <CircularProgress size={20} sx={{ color: '#ea580c' }} />
              ) : (
                <Lock size={20} style={{ color: '#ea580c' }} />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#ea580c',
              borderColor: '#fdba74',
              backgroundColor: '#fff7ed',
              borderRadius: '16px',
              px: 4,
              py: 2,
              borderWidth: '2px',
              minHeight: 64,
              '&:hover': {
                borderColor: '#fb923c',
                backgroundColor: '#ffedd5',
                borderWidth: '2px',
              },
              '&.Mui-disabled': {
                borderColor: '#fed7aa',
                backgroundColor: '#fff7ed',
                color: '#fb923c',
                opacity: 0.6,
              },
            }}
          >
            Khóa tài khoản trễ hạn
          </Button>

          <Button
            variant="outlined"
            onClick={handleAutoLockPenaltyDebt}
            disabled={loading || autoLockLoading}
            startIcon={
              autoLockLoading ? (
                <CircularProgress size={20} sx={{ color: '#ea580c' }} />
              ) : (
                <Lock size={20} style={{ color: '#ea580c' }} />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#ea580c',
              borderColor: '#fdba74',
              backgroundColor: '#fff7ed',
              borderRadius: '16px',
              px: 4,
              py: 2,
              borderWidth: '2px',
              minHeight: 64,
              '&:hover': {
                borderColor: '#fb923c',
                backgroundColor: '#ffedd5',
                borderWidth: '2px',
              },
              '&.Mui-disabled': {
                borderColor: '#fed7aa',
                backgroundColor: '#fff7ed',
                color: '#fb923c',
                opacity: 0.6,
              },
            }}
          >
            Khóa tài khoản nợ phạt
          </Button>
        </Stack>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ overflow: 'auto' }}>
        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#999' }}>
                    Không có người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          bgcolor: getRoleBadgeColor(user.role) === 'error' ? '#ffebee' :
                                   getRoleBadgeColor(user.role) === 'warning' ? '#fff3e0' : '#e3f2fd',
                          color: getRoleBadgeColor(user.role) === 'error' ? '#c62828' :
                                 getRoleBadgeColor(user.role) === 'warning' ? '#e65100' : '#01579b',
                        }}
                      >
                        {getRoleLabel(user.role)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          bgcolor: user.isActive ? '#e8f5e9' : '#ffebee',
                          color: user.isActive ? '#2e7d32' : '#c62828',
                        }}
                      >
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small" onClick={() => handleViewDetails(user)} sx={{ color: '#9C27B0' }}>
                          <AlertCircle size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Thay đổi vai trò">
                        <IconButton size="small" onClick={() => handleEditRole(user)} sx={{ color: '#2196F3' }}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                        <IconButton
                          size="small"
                          onClick={() => handleLockUnlock(user._id, user.isActive)}
                          sx={{ color: user.isActive ? '#f44336' : '#4caf50' }}
                        >
                          {user.isActive ? <Lock size={18} /> : <LockOpen size={18} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Các Dialog còn lại giữ nguyên (Edit Role, Detail, Confirm Lock) */}
      {/* ... (giữ nguyên phần Dialog như code gốc của bạn) ... */}

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thay đổi vai trò người dùng</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editingUser && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Đang thay đổi vai trò cho <strong>{editingUser.username}</strong>
              </Alert>
              <FormControl fullWidth>
                <InputLabel>Vai trò</InputLabel>
                <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} label="Vai trò">
                  <MenuItem value="Admin">Quản trị viên (Admin)</MenuItem>
                  <MenuItem value="Librarian">Thủ thư (Librarian)</MenuItem>
                  <MenuItem value="Reader">Độc giả (Reader)</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button onClick={handleSaveRole} variant="contained" disabled={loading || selectedRole === editingUser?.role}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thông tin chi tiết người dùng</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {detailUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                  Username
                </Box>
                <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                  {detailUser.username}
                </Box>
              </Box>

              <Box>
                <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                  Email
                </Box>
                <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                  {detailUser.email}
                </Box>
              </Box>

              {detailUser.fullName && (
                <Box>
                  <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                    Họ và tên
                  </Box>
                  <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {detailUser.fullName}
                  </Box>
                </Box>
              )}

              {detailUser.phone && (
                <Box>
                  <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                    Số điện thoại
                  </Box>
                  <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {detailUser.phone}
                  </Box>
                </Box>
              )}

              <Box>
                <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                  Vai trò
                </Box>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    bgcolor: getRoleBadgeColor(detailUser.role) === 'error' ? '#ffebee' :
                             getRoleBadgeColor(detailUser.role) === 'warning' ? '#fff3e0' : '#e3f2fd',
                    color: getRoleBadgeColor(detailUser.role) === 'error' ? '#c62828' :
                           getRoleBadgeColor(detailUser.role) === 'warning' ? '#e65100' : '#01579b',
                  }}
                >
                  {getRoleLabel(detailUser.role)}
                </Box>
              </Box>

              <Box>
                <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                  Trạng thái
                </Box>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    bgcolor: detailUser.isActive ? '#e8f5e9' : '#ffebee',
                    color: detailUser.isActive ? '#2e7d32' : '#c62828',
                  }}
                >
                  {detailUser.isActive ? 'Hoạt động' : 'Bị khóa'}
                </Box>
              </Box>

              {detailUser.status && (
                <Box>
                  <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                    Status
                  </Box>
                  <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {detailUser.status}
                  </Box>
                </Box>
              )}

              <Box>
                <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                  Ngày tạo
                </Box>
                <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                  {new Date(detailUser.createdAt).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Box>
              </Box>

              {detailUser.updatedAt && (
                <Box>
                  <Box sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                    Cập nhật lần cuối
                  </Box>
                  <Box sx={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {new Date(detailUser.updatedAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openLockDialog}
        title={lockAction.action === 'lock' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
        message={
          lockAction.action === 'lock'
            ? 'Bạn có chắc muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập được.'
            : 'Bạn có chắc muốn mở khóa tài khoản này? Người dùng sẽ có thể đăng nhập lại.'
        }
        onConfirm={confirmLockUnlock}
        onCancel={() => setOpenLockDialog(false)}
        loading={loading}
        confirmButtonColor={lockAction.action === 'lock' ? 'error' : 'success'}
      />
    </Box>
  );
};

export default UserManagement;