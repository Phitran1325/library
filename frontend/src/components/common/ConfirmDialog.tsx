import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmButtonColor?: 'inherit' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
};

export function ConfirmDialog({
  open,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
  confirmButtonColor = 'error',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>{cancelText}</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={confirmButtonColor}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Hook to use confirm dialog
export function useConfirm() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    message: string;
    resolver?: (value: boolean) => void;
  }>({
    open: false,
    title: '',
    message: '',
  });

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title,
        message,
        resolver: resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (dialogState.resolver) {
      dialogState.resolver(true);
    }
    setDialogState({ ...dialogState, open: false });
  };

  const handleCancel = () => {
    if (dialogState.resolver) {
      dialogState.resolver(false);
    }
    setDialogState({ ...dialogState, open: false });
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      title={dialogState.title}
      message={dialogState.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
