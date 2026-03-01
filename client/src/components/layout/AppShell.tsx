import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, AppBar, Snackbar, Alert } from '@mui/material';
import { ExplorerToolbar } from './Toolbar';
import { TreePanel } from '../tree/TreePanel';
import { ListView } from '../list/ListView';
import { ResizablePanel } from '../common/ResizablePanel';
import { EntityDetailsDialog } from '../details/EntityDetailsDialog';
import { AccessProfileDialog } from '../dialogs/AccessProfileDialog';
import { ContextMenu, type ContextMenuItem } from '../common/ContextMenu';
import { useExplorerStore } from '../../store/explorerStore';
import { useTreeNodes, useAccessProfile } from '../../api/hooks';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { isCommandAllowed } from '../../utils/permissions';
import { getChildKinds } from '../../utils/objectKinds';
import { CMD_DEFAULT, CMD_KEY, CMD_NEW } from '../../api/types';
import type { EsqTreeNodeDto } from '../../api/types';

export const AppShell: React.FC = () => {
  const {
    selectedNode,
    setSelectedNode,
    getKind,
    kinds,
    pushHistory,
    goBack,
    goForward,
    errorMessage,
    setErrorMessage,
    accessProfile,
    setAccessProfile,
    setListItems,
    updateNodes,
  } = useExplorerStore();

  // Load children when selected node changes
  const { data: children, isLoading, refetch } = useTreeNodes(selectedNode?.id);

  useEffect(() => {
    if (children) {
      setListItems(children);
      // Sync tree _nodeMap so the tree panel also reflects updated data (e.g. desc, name)
      updateNodes(children);
    }
  }, [children, setListItems, updateNodes]);

  // Load access profile
  const { data: profileData } = useAccessProfile();
  useEffect(() => {
    if (profileData) setAccessProfile(profileData);
  }, [profileData, setAccessProfile]);

  // Entity details dialog
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; kind: number; id: string }>({
    open: false, kind: 0, id: '',
  });

  // Access profile dialog
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; id: string }>({
    open: false, id: '',
  });

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    position: { x: number; y: number } | null;
    node: EsqTreeNodeDto | null;
  }>({ open: false, position: null, node: null });

  // Path display
  const pathDisplay = selectedNode
    ? `${getKind(selectedNode.kind)?.title || ''} / ${selectedNode.name}`
    : 'Esquire Office';

  // Double-click: folder → navigate into, leaf → open details
  const handleNodeActivate = useCallback((node: EsqTreeNodeDto) => {
    const kind = getKind(node.kind);
    if (kind?.childKinds?.length) {
      setSelectedNode(node);
      pushHistory(node.id);
    } else {
      setDetailsDialog({ open: true, kind: node.kind, id: String(node.entityId) });
    }
  }, [getKind, setSelectedNode, pushHistory]);

  // Build context menu items
  const buildContextMenuItems = useCallback((node: EsqTreeNodeDto): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const kind = getKind(node.kind);

    // Details — always available
    items.push({
      label: 'Details',
      icon: 'info',
      onClick: () => setDetailsDialog({ open: true, kind: node.kind, id: String(node.entityId) }),
    });

    // Access Profile
    if (isCommandAllowed(accessProfile, CMD_KEY, node.kind)) {
      items.push({
        label: 'Access Profile',
        icon: 'verified_user',
        onClick: () => setProfileDialog({ open: true, id: String(node.entityId) }),
        dividerAfter: true,
      });
    }

    // New... submenu (flat)
    const childKinds = getChildKinds(kind, kinds);
    childKinds.forEach(ck => {
      if (isCommandAllowed(accessProfile, CMD_NEW, ck.id)) {
        items.push({
          label: `New ${ck.title}`,
          icon: 'add_circle',
          onClick: () => { /* TODO: new entity flow */ },
        });
      }
    });

    return items;
  }, [getKind, kinds, accessProfile]);

  // Context menu handler
  const handleContextMenu = useCallback((node: EsqTreeNodeDto, x: number, y: number) => {
    setContextMenu({ open: true, position: { x, y }, node });
  }, []);

  // Navigation
  const handleBack = useCallback(() => {
    const id = goBack();
    // TODO: navigate to node by ID
  }, [goBack]);

  const handleForward = useCallback(() => {
    const id = goForward();
    // TODO: navigate to node by ID
  }, [goForward]);

  const handleUp = useCallback(() => {
    if (selectedNode?.parentId) {
      // TODO: navigate to parent
    }
  }, [selectedNode]);

  // Keyboard navigation
  useKeyboardNav({
    onActivate: handleNodeActivate,
    onBack: handleBack,
    onForward: handleForward,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top app bar */}
      <AppBar position="static" color="primary" elevation={1}>
        <ExplorerToolbar
          loading={isLoading}
          onBack={handleBack}
          onForward={handleForward}
          onUp={handleUp}
          onRefresh={() => refetch()}
          pathDisplay={pathDisplay}
        />
      </AppBar>

      {/* Main content: tree | list */}
      <ResizablePanel
        left={<TreePanel onContextMenu={handleContextMenu} onOpenDetails={(node) => setDetailsDialog({ open: true, kind: node.kind, id: String(node.entityId) })} />}
        right={
          <ListView
            onDoubleClick={handleNodeActivate}
            onContextMenu={handleContextMenu}
          />
        }
        initialWidth={320}
      />

      {/* Entity details dialog */}
      <EntityDetailsDialog
        open={detailsDialog.open}
        kind={detailsDialog.kind}
        entityId={detailsDialog.id}
        onClose={() => setDetailsDialog(d => ({ ...d, open: false }))}
      />

      {/* Access profile dialog */}
      <AccessProfileDialog
        open={profileDialog.open}
        entityId={profileDialog.id}
        onClose={() => setProfileDialog(d => ({ ...d, open: false }))}
      />

      {/* Context menu */}
      <ContextMenu
        open={contextMenu.open}
        position={contextMenu.position}
        items={contextMenu.node ? buildContextMenuItems(contextMenu.node) : []}
        onClose={() => setContextMenu(c => ({ ...c, open: false }))}
      />

      {/* Error snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={5000}
        onClose={() => setErrorMessage('')}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
