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
import React from 'react';
import {
  Toolbar as MuiToolbar,
  IconButton,
  Typography,
  Tooltip,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  ArrowUpward,
  Refresh,
  MoreHoriz,
  Logout,
} from '@mui/icons-material';
import { useExplorerStore } from '../../store/explorerStore';
import { api } from '../../api/client';

interface ToolbarProps {
  loading?: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onRefresh: () => void;
  onMore?: () => void;
  hasMore?: boolean;
  pathDisplay: string;
}

export const ExplorerToolbar: React.FC<ToolbarProps> = ({
  loading,
  onBack,
  onForward,
  onUp,
  onRefresh,
  onMore,
  hasMore,
  pathDisplay,
}) => {
  const { historyIndex, history } = useExplorerStore();

  return (
    <MuiToolbar variant="dense" sx={{ gap: 0.5, color: 'inherit' }}>
      <Tooltip title="Back">
        <span>
          <IconButton size="small" color="inherit" onClick={onBack} disabled={historyIndex <= 0}>
            <ArrowBack fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Forward">
        <span>
          <IconButton size="small" color="inherit" onClick={onForward} disabled={historyIndex >= history.length - 1}>
            <ArrowForward fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Up">
        <span>
          <IconButton size="small" color="inherit" onClick={onUp}>
            <ArrowUpward fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Refresh">
        <IconButton size="small" color="inherit" onClick={onRefresh}>
          {loading ? <CircularProgress size={18} color="inherit" /> : <Refresh fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Typography
        variant="body2"
        color="inherit"
        sx={{ flex: 1, ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {pathDisplay}
      </Typography>

      {hasMore && (
        <Tooltip title="Load more">
          <IconButton size="small" color="inherit" onClick={onMore}>
            <MoreHoriz fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Logout">
        <IconButton size="small" color="inherit" onClick={() => api.authLogout()} sx={{ ml: 1 }}>
          <Logout fontSize="small" />
        </IconButton>
      </Tooltip>
    </MuiToolbar>
  );
};
