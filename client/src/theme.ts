import { createTheme } from '@mui/material/styles';

// Match Angular Material indigo-pink theme
export const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // indigo
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e91e63', // pink
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
  },
  components: {
    MuiToolbar: {
      styleOverrides: {
        dense: {
          minHeight: 48,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '4px 8px',
          fontSize: '0.85rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&.MuiIconButton-colorInherit': {
            color: 'inherit',
          },
        },
      },
    },
    // MUI X TreeItem styles are applied via sx props in TreePanel
  },
});
