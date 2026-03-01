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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box,
  IconButton,
  Alert,
} from '@mui/material';
import Icon from '@mui/material/Icon';
import { DriveFileMove, ArrowBack } from '@mui/icons-material';
import { api } from '../../api/client';
import { useSaveEntity } from '../../api/hooks';
import { useExplorerStore } from '../../store/explorerStore';
import { resolveNodeIcon } from '../../utils/kindIcons';
import type { EsqTreeNodeDto } from '../../api/types';

interface MoveDialogProps {
  open: boolean;
  node: EsqTreeNodeDto | null;
  onClose: () => void;
  onMoved: () => void;
}

export const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  node,
  onClose,
  onMoved,
}) => {
  const { getKind } = useExplorerStore();
  const saveMutation = useSaveEntity();
  const [error, setError] = useState<string | null>(null);

  // Tree browser state for target selection
  const [browsePath, setBrowsePath] = useState<{ id?: string; name: string }[]>([]);
  const [children, setChildren] = useState<EsqTreeNodeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<EsqTreeNodeDto | null>(null);

  // Load root when dialog opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedTarget(null);
    setBrowsePath([{ name: 'Esquire' }]);
    loadChildren(undefined);
  }, [open]);

  const loadChildren = useCallback(async (parentId?: string) => {
    setLoading(true);
    try {
      const data = await api.esquire(parentId);
      setChildren(data);
    } catch (err: any) {
      setError(err.detail || 'Failed to load tree');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNavigateInto = useCallback((target: EsqTreeNodeDto) => {
    const kind = getKind(target.kind);
    if (kind?.childKinds?.length) {
      setBrowsePath(prev => [...prev, { id: target.id, name: target.name }]);
      setSelectedTarget(null);
      loadChildren(target.id);
    } else {
      setSelectedTarget(target);
    }
  }, [getKind, loadChildren]);

  const handleGoBack = useCallback(() => {
    setBrowsePath(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      const parentId = next[next.length - 1]?.id;
      setSelectedTarget(null);
      loadChildren(parentId);
      return next;
    });
  }, [loadChildren]);

  const handleMove = useCallback(async () => {
    if (!node || !selectedTarget) return;
    setError(null);
    try {
      await saveMutation.mutateAsync({
        kind: node.kind,
        id: String(node.entityId),
        body: { targetId: selectedTarget.id },
        cmd: 'move',
      });
      onMoved();
    } catch (err: any) {
      setError(err.detail || err.message || 'Move failed');
    }
  }, [node, selectedTarget, saveMutation, onMoved]);

  const kindDef = node ? getKind(node.kind) : undefined;
  const currentFolder = browsePath[browsePath.length - 1]?.name || 'Esquire';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DriveFileMove color="primary" />
        Move {kindDef?.title || 'Entity'}: {node?.name}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Select destination folder:
        </Typography>

        {/* Breadcrumb / back */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <IconButton
            size="small"
            onClick={handleGoBack}
            disabled={browsePath.length <= 1}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="body2" fontWeight={600}>{currentFolder}</Typography>
        </Box>

        {/* Tree browser */}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : children.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No items
            </Typography>
          ) : (
            <List dense disablePadding>
              {children
                .filter(c => !node || c.id !== node.id) // exclude the node being moved
                .map(c => {
                  const ck = getKind(c.kind);
                  const iconName = resolveNodeIcon(c.name, ck?.icon);
                  const isFolder = !!ck?.childKinds?.length;
                  const isSelected = selectedTarget?.id === c.id;
                  return (
                    <ListItemButton
                      key={c.id}
                      selected={isSelected}
                      onClick={() => setSelectedTarget(c)}
                      onDoubleClick={() => handleNavigateInto(c)}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Icon baseClassName="material-icons-outlined" fontSize="small">{iconName}</Icon>
                      </ListItemIcon>
                      <ListItemText
                        primary={c.name}
                        secondary={isFolder ? 'Folder' : c.desc}
                      />
                    </ListItemButton>
                  );
                })}
            </List>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<DriveFileMove />}
          onClick={handleMove}
          disabled={!selectedTarget || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Moving...' : `Move to ${selectedTarget?.name || '...'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
