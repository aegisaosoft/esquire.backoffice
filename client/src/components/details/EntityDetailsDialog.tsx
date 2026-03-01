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
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Refresh, Edit, Save, Close, ArrowBack } from '@mui/icons-material';
import { useEntityDetails, useDictionary, useSaveEntity, useSaveAccountEntity } from '../../api/hooks';
import { useExplorerStore } from '../../store/explorerStore';
import { EntityDetailsContent } from './EntityDetailsContent';

interface EntityDetailsDialogProps {
  open: boolean;
  kind: number;
  entityId: string;
  /** Command: 'details' (default) or 'acct' for accounting view */
  cmd?: string;
  onClose: () => void;
}

interface NavEntry {
  kind: number;
  entityId: string;
}

export const EntityDetailsDialog: React.FC<EntityDetailsDialogProps> = ({
  open,
  kind,
  entityId,
  cmd,
  onClose,
}) => {
  const { getKind, patchNodeByEntity } = useExplorerStore();

  // ── Navigation stack for drilling into sub-entities ──
  const [navStack, setNavStack] = useState<NavEntry[]>([]);
  const [current, setCurrent] = useState<NavEntry>({ kind, entityId });

  // Sync with props when dialog opens or props change
  useEffect(() => {
    setCurrent({ kind, entityId });
    setNavStack([]);
  }, [kind, entityId, open]);

  const canGoBack = navStack.length > 0;

  const handleNavigate = useCallback((itemKind: number, itemId: string) => {
    setNavStack(prev => [...prev, current]);
    setCurrent({ kind: itemKind, entityId: itemId });
  }, [current]);

  const handleBack = useCallback(() => {
    setNavStack(prev => {
      const next = [...prev];
      const entry = next.pop();
      if (entry) setCurrent(entry);
      return next;
    });
  }, []);

  // ── Data fetching uses current navigation state ──
  // Top-level uses the cmd prop (e.g. 'acct'); sub-navigation always uses 'details'
  const activeCmd = navStack.length === 0 ? (cmd || 'details') : 'details';
  const { data: entity, isLoading: entityLoading, refetch } = useEntityDetails(current.kind, current.entityId, activeCmd);

  const resolvedKind = entity?.kind ?? current.kind;
  const kindDef = getKind(resolvedKind);
  const isAcctKind = kindDef?.acct ?? false;

  const { data: dictData, isLoading: dictLoading } = useDictionary(resolvedKind);
  const saveEntity = useSaveEntity();
  const saveAcct = useSaveAccountEntity();

  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Reset edit state when navigated entity changes
  useEffect(() => {
    setEditedFields({});
    setEditMode(false);
  }, [current.entityId, current.kind]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [name]: value }));
  }, []);

  const isDirty = Object.keys(editedFields).length > 0;

  const handleSave = useCallback(async () => {
    try {
      if (isAcctKind) {
        await saveAcct.mutateAsync({ kind: resolvedKind, id: current.entityId, body: editedFields });
      } else {
        await saveEntity.mutateAsync({ kind: resolvedKind, id: current.entityId, body: editedFields });
      }
      patchNodeByEntity(current.entityId, editedFields);
      setEditedFields({});
      setEditMode(false);
      setSnackbar({ open: true, message: 'Saved successfully', severity: 'success' });
      refetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.detail || 'Save failed', severity: 'error' });
    }
  }, [resolvedKind, current.entityId, editedFields, isAcctKind, saveEntity, saveAcct, refetch, patchNodeByEntity]);

  const loading = entityLoading || dictLoading;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {canGoBack && (
            <IconButton size="small" onClick={handleBack}><ArrowBack fontSize="small" /></IconButton>
          )}
          <Typography variant="h6" component="span" sx={{ flex: 1 }}>
            {activeCmd === 'acct' ? 'Accounting' : kindDef?.title || 'Entity'}: {entity?.name || current.entityId}
          </Typography>
          <IconButton size="small" onClick={() => refetch()}><Refresh fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <EntityDetailsContent
            entity={entity}
            dictData={dictData}
            editedFields={editedFields}
            editMode={editMode}
            onFieldChange={handleFieldChange}
            onItemOpen={handleNavigate}
            loading={loading}
          />
        </DialogContent>

        <DialogActions>
          {!editMode ? (
            <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>Edit</Button>
          ) : (
            <>
              <Button onClick={() => { setEditMode(false); setEditedFields({}); }}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!isDirty || saveEntity.isPending || saveAcct.isPending}
              >
                Save
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
