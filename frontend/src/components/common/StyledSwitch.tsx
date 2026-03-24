import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import type { SwitchProps } from '@mui/material/Switch';

const StyledSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName="Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 46,
  height: 28,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        background: 'linear-gradient(90deg,#3b82f6 0%,#1e40af 100%)',
        opacity: 1,
        border: 0,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 4px 12px rgba(16,24,40,0.18)',
    width: 22,
    height: 22,
    backgroundColor: '#fff',
  },
  '& .MuiSwitch-track': {
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    opacity: 1,
  },
}));

export default StyledSwitch;
