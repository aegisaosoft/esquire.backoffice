/**
 * Esquire Backoffice
 * Copyright (C) 2026 AegisAOSoft
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
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
