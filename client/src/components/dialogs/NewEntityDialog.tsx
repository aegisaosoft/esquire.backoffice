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
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { AddCircle, Save, Close } from '@mui/icons-material';
import { useDictionary, useSaveEntity } from '../../api/hooks';
import { useExplorerStore } from '../../store/explorerStore';
import { EntityDetailsContent } from '../details/EntityDetailsContent';
import type { EsqTreeNodeDto } from '../../api/types';

interface NewEntityDialogProps {
  open: boolean;
  parentNode: EsqTreeNodeDto | null;
  childKind: number;
  onClose: () => void;
  onCreated: () => void;
}

export const NewEntityDialog: React.FC<NewEntityDialogProps> = ({
  open,
  parentNode,
  childKind,
  onClose,
  onCreated,
}) => {
  const { getKind } = useExplorerStore();
  const { data: dictData, isLoading: dictLoading } = useDictionary(childKind);
  const saveMutation = useSaveEntity();

  const [fields, setFields] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const kindDef = getKind(childKind);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFields({});
      setError(null);
    }
  }, [open, childKind]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFields(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!parentNode) return;
    setError(null);
    try {
      await saveMutation.mutateAsync({
        kind: childKind,
        id: String(parentNode.entityId),
        body: fields,
        cmd: 'new',
      });
      onCreated();
    } catch (err: any) {
      setError(err.detail || err.message || 'Create failed');
    }
  }, [parentNode, childKind, fields, saveMutation, onCreated]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AddCircle color="primary" />
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          New {kindDef?.title || 'Entity'}
        </Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {parentNode && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creating in: {parentNode.name}
          </Typography>
        )}

        {dictLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <EntityDetailsContent
            entity={null}
            dictData={dictData}
            editedFields={fields}
            editMode={true}
            onFieldChange={handleFieldChange}
            loading={false}
          />
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleCreate}
          disabled={Object.keys(fields).length === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
