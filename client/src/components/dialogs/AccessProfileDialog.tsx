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
import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import { Close, Refresh, Edit, Save } from '@mui/icons-material';
import { useAccessProfile, useSaveAccessProfile } from '../../api/hooks';
import { parseFlags } from '../../utils/permissions';
import type { EsqPermission, EsqRole } from '../../api/types';

interface AccessProfileDialogProps {
  open: boolean;
  entityId: string;
  onClose: () => void;
}

export const AccessProfileDialog: React.FC<AccessProfileDialogProps> = ({
  open,
  entityId,
  onClose,
}) => {
  const { data: profile, isLoading, refetch } = useAccessProfile(entityId);
  const saveMutation = useSaveAccessProfile();

  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState<Record<string, any>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    setEdited({});
    setEditMode(false);
  }, [entityId]);

  const getValue = useCallback((field: string) => {
    if (field in edited) return edited[field];
    return (profile as any)?.[field] ?? '';
  }, [edited, profile]);

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync({ id: entityId, body: edited });
      setEdited({});
      setEditMode(false);
      setSnackbar({ open: true, message: 'Profile saved', severity: 'success' });
      refetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.detail || 'Save failed', severity: 'error' });
    }
  }, [entityId, edited, saveMutation, refetch]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Access Profile: {profile?.name || entityId}
          </Typography>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : profile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* User info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField
                  size="small" label="Login ID" value={getValue('loginId')}
                  onChange={(e) => setEdited(p => ({ ...p, loginId: e.target.value }))}
                  slotProps={{ input: { readOnly: !editMode } }}
                />
                <TextField
                  size="small" label="Email" value={getValue('email')}
                  onChange={(e) => setEdited(p => ({ ...p, email: e.target.value }))}
                  slotProps={{ input: { readOnly: !editMode } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={getValue('pwdChangeForced') === 'Y'}
                      onChange={(e) => setEdited(p => ({ ...p, pwdChangeForced: e.target.checked ? 'Y' : 'N' }))}
                      disabled={!editMode}
                      size="small"
                    />
                  }
                  label="Force Password Change"
                />
                <TextField
                  size="small" label="2FA Method" value={getValue('tfaMethod')}
                  onChange={(e) => setEdited(p => ({ ...p, tfaMethod: e.target.value }))}
                  slotProps={{ input: { readOnly: !editMode } }}
                />
              </Box>

              <Divider />

              {/* Roles */}
              <Typography variant="subtitle2">Roles</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {profile.roles?.map((r: EsqRole) => (
                  <Chip key={r.id} label={r.name} size="small"
                    color={r.adminFlg === 'Y' ? 'secondary' : 'default'} />
                ))}
              </Box>

              <Divider />

              {/* Permissions */}
              <Typography variant="subtitle2">Permissions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Permission</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Kind</TableCell>
                      <TableCell>Flags</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...(profile.admin || []), ...(profile.tools || [])].map((p: EsqPermission, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.type}</TableCell>
                        <TableCell>{p.kind}</TableCell>
                        <TableCell>
                          {parseFlags(p.flags || []).map(f => (
                            <Chip key={f} label={f} size="small" sx={{ mr: 0.5 }} />
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography color="error">No profile data</Typography>
          )}
        </DialogContent>

        <DialogActions>
          {!editMode ? (
            <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>Edit</Button>
          ) : (
            <>
              <Button onClick={() => { setEditMode(false); setEdited({}); }}>Cancel</Button>
              <Button variant="contained" startIcon={<Save />}
                onClick={handleSave}
                disabled={Object.keys(edited).length === 0 || saveMutation.isPending}>
                Save
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};
