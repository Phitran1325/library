import { useEffect, useState } from 'react';
import { Box, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getReservations, approveReservation, denyReservation } from '../../services/admin.api';

type Reservation = {
  _id: string;
  user: { _id: string; fullName?: string; email?: string };
  bookCopyId: string;
  bookTitle?: string;
  status: string; // pending, approved, denied, cancelled
  createdAt: string;
};

export default function Reservations() {
  const { token } = useAuth();
  const [items, setItems] = useState<Reservation[]>([]);
  const [denyOpen, setDenyOpen] = useState(false);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const load = async () => {
    try {
      if (token) {
        const res = await getReservations('?status=pending', token);
        const data = res.data?.data || res.data;
        setItems(data || []);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, [token]);

  const approve = async (r: Reservation) => {
    if (!confirm('Approve this reservation?')) return;
    try {
      if (token) {
        await approveReservation(r._id, token);
        await load();
      }
    } catch (err) { console.error(err); alert('Approve failed'); }
  };

  const openDeny = (r: Reservation) => { setSelected(r); setDenyReason(''); setDenyOpen(true); };
  const doDeny = async () => {
    if (!selected || !token) return;
    try {
      await denyReservation(selected._id, { reason: denyReason }, token);
      setDenyOpen(false);
      await load();
    } catch (err) { console.error(err); alert('Deny failed'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <h2>Reservations (pending)</h2>
        <Button onClick={load}>Refresh</Button>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Book</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(r => (
              <TableRow key={r._id}>
                <TableCell>{r.user?.fullName || r.user?.email}</TableCell>
                <TableCell>{r.bookTitle || r.bookCopyId}</TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => approve(r)}>Approve</Button>
                  <Button size="small" color="error" onClick={() => openDeny(r)}>Deny</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={denyOpen} onClose={() => setDenyOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Deny reservation</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Reason" value={denyReason} onChange={(e)=>setDenyReason(e.target.value)} multiline minRows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDenyOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={doDeny}>Deny</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
