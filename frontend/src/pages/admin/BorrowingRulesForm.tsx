import { useEffect, useState } from 'react';
import { Box, TextField, Switch, FormControlLabel, Button, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getBorrowRules, saveBorrowRules } from '../../services/admin.api';

type Rules = {
  maxBooksPerUser: number;
  maxDays: number;
  overdueFinePerDay: number;
  allowRenewWhenPending: boolean;
  autoBorrowWhenReturned: boolean;
  dailyOverdueCheck: boolean;
};

export default function BorrowingRulesForm() {
  const { token } = useAuth();
  const [data, setData] = useState<Rules>({
    maxBooksPerUser: 5,
    maxDays: 14,
    overdueFinePerDay: 1000,
    allowRenewWhenPending: false,
    autoBorrowWhenReturned: true,
    dailyOverdueCheck: true,
  });

  useEffect(() => {
    (async () => {
      try {
        if (token) {
          const res = await getBorrowRules(token);
          if (res.data?.data) setData(res.data.data);
        }
      } catch (e) { /* ignore */ }
    })();
  }, [token]);

  const onSave = async () => {
    try {
      if (token) {
        await saveBorrowRules(data, token);
        alert('Saved');
      }
    } catch (e) { console.error(e); alert('Save failed'); }
  };

  return (
    <Paper sx={{p:3}}>
      <h2>Borrowing Rules</h2>
      <Box display="grid" gridTemplateColumns={{xs: '1fr', md: '1fr 1fr'}} gap={2}>
        <TextField label="Max books per user" type="number" value={data.maxBooksPerUser} onChange={(e)=>setData({...data, maxBooksPerUser: Number(e.target.value)})} />
        <TextField label="Max days loan" type="number" value={data.maxDays} onChange={(e)=>setData({...data, maxDays: Number(e.target.value)})} />
        <TextField label="Overdue fine per day" type="number" value={data.overdueFinePerDay} onChange={(e)=>setData({...data, overdueFinePerDay: Number(e.target.value)})} />
        <FormControlLabel control={<Switch checked={data.allowRenewWhenPending} onChange={(e)=>setData({...data, allowRenewWhenPending: e.target.checked})} />} label="Allow renew when reservation pending" />
        <FormControlLabel control={<Switch checked={data.autoBorrowWhenReturned} onChange={(e)=>setData({...data, autoBorrowWhenReturned: e.target.checked})} />} label="Auto borrow from reservation when returned" />
        <FormControlLabel control={<Switch checked={data.dailyOverdueCheck} onChange={(e)=>setData({...data, dailyOverdueCheck: e.target.checked})} />} label="Enable daily overdue check (cron)" />
      </Box>
      <Box mt={2}>
        <Button variant="contained" onClick={onSave}>Save rules</Button>
      </Box>
    </Paper>
  );
}
