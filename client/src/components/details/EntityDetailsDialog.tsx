import React, { useState, useCallback, useEffect } from 'react';
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
import { Refresh, Edit, Save, Close } from '@mui/icons-material';
import { useEntityDetails, useDictionary, useSaveEntity, useSaveAccountEntity } from '../../api/hooks';
import { useExplorerStore } from '../../store/explorerStore';
import { EntityDetailsContent } from './EntityDetailsContent';

interface EntityDetailsDialogProps {
  open: boolean;
  kind: number;
  entityId: string;
  onClose: () => void;
}

export const EntityDetailsDialog: React.FC<EntityDetailsDialogProps> = ({
  open,
  kind,
  entityId,
  onClose,
}) => {
  const { getKind, patchNodeByEntity } = useExplorerStore();

  const { data: entity, isLoading: entityLoading, refetch } = useEntityDetails(kind, entityId);

  // Entity response may carry a different kind than the tree node
  // (e.g. shortcut kind 53 → real entity kind 52).
  const resolvedKind = entity?.kind ?? kind;
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

  // Reset edit state when entity changes
  useEffect(() => {
    setEditedFields({});
    setEditMode(false);
  }, [entityId, kind]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [name]: value }));
  }, []);

  const isDirty = Object.keys(editedFields).length > 0;

  const handleSave = useCallback(async () => {
    try {
      if (isAcctKind) {
        await saveAcct.mutateAsync({ kind: resolvedKind, id: entityId, body: editedFields });
      } else {
        await saveEntity.mutateAsync({ kind: resolvedKind, id: entityId, body: editedFields });
      }
      patchNodeByEntity(entityId, editedFields);
      setEditedFields({});
      setEditMode(false);
      setSnackbar({ open: true, message: 'Saved successfully', severity: 'success' });
      refetch();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.detail || 'Save failed', severity: 'error' });
    }
  }, [resolvedKind, entityId, editedFields, isAcctKind, saveEntity, saveAcct, refetch, patchNodeByEntity]);

  const loading = entityLoading || dictLoading;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="span" sx={{ flex: 1 }}>
            {kindDef?.title || 'Entity'}: {entity?.name || entityId}
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
