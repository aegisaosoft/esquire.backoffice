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
import { Box, Typography, Paper } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

/**
 * Reports plugin — placeholder content.
 */
export const ReportsContent: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 3,
      bgcolor: 'grey.50',
    }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'white',
        borderRadius: 2,
      }}
    >
      <AssessmentIcon sx={{ fontSize: 64, color: 'primary.main' }} />
      <Typography variant="h5" color="text.primary">
        Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        This plugin is under development.
      </Typography>
    </Paper>
  </Box>
);
