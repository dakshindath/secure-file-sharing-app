import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light', 
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: 'small', 
      },
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            height: '42px',
          },
          '& .MuiOutlinedInput-root': {
            fontSize: '0.9rem', 
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          padding: '0px 10px', 
        },
      },
    },
  },
});

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
