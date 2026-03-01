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
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import Icon from '@mui/material/Icon';
import { Warning } from '@mui/icons-material';
import { useSaveEntity } from '../../api/hooks';
import { useExplorerStore } from '../../store/explorerStore';
import type { EsqTreeNodeDto } from '../../api/types';

interface ConfirmCommandDialogProps {
  open: boolean;
  cmd: string;
  cmdLabel: string;
  cmdIcon: string;
  confirmText?: string;
  node: EsqTreeNodeDto | null;
  onClose: () => void;
  onConfirmed: () => void;
}

/**
 * Universal confirmation dialog for any command that requires user confirmation
 * before execution (e.g. delete, or any future command with confirm: true in CMD_META).
 * Fully dynamic — label, icon and confirmation text are passed from the caller.
 */
export const ConfirmCommandDialog: React.FC<ConfirmCommandDialogProps> = ({
  open,
  cmd,
  cmdLabel,
  cmdIcon,
  confirmText,
  node,
  onClose,
  onConfirmed,
}) => {
  const { getKind } = useExplorerStore();
  const saveMutation = useSaveEntity();
  const [error, setError] = useState<string | null>(null);

  const kindDef = node ? getKind(node.kind) : undefined;

  const handleConfirm = useCallback(async () => {
    if (!node) return;
    setError(null);
    try {
      await saveMutation.mutateAsync({
        kind: node.kind,
        id: String(node.entityId),
        body: {},
        cmd,
      });
      onConfirmed();
    } catch (err: any) {
      setError(err.detail || err.message || `${cmdLabel} failed`);
    }
  }, [node, cmd, cmdLabel, saveMutation, onConfirmed]);

  // Determine button color: 'delete' → error, others → primary
  const isDestructive = cmd === 'delete';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        {cmdLabel} {kindDef?.title || 'Entity'}
      </DialogTitle>

      <DialogContent>
        <Typography>
          Are you sure you want to {cmdLabel.toLowerCase()} <strong>{node?.name}</strong>?
        </Typography>
        {confirmText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {confirmText}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isDestructive ? 'error' : 'primary'}
          startIcon={
            <Icon baseClassName="material-icons-outlined" fontSize="small">
              {cmdIcon}
            </Icon>
          }
          onClick={handleConfirm}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? `${cmdLabel}...` : cmdLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
