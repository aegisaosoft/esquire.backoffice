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
import { Box, Typography, AppBar, Snackbar, Alert } from '@mui/material';
import { ExplorerToolbar } from './Toolbar';
import { TreePanel } from '../tree/TreePanel';
import { ListView } from '../list/ListView';
import { ResizablePanel } from '../common/ResizablePanel';
import { EntityDetailsDialog } from '../details/EntityDetailsDialog';
import { AccessProfileDialog } from '../dialogs/AccessProfileDialog';
import { ConfirmCommandDialog } from '../dialogs/ConfirmCommandDialog';
import { MoveDialog } from '../dialogs/MoveDialog';
import { NewEntityDialog } from '../dialogs/NewEntityDialog';
import { ContextMenu, type ContextMenuItem } from '../common/ContextMenu';
import { useExplorerStore } from '../../store/explorerStore';
import { useTreeNodes, useAccessProfile } from '../../api/hooks';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { getChildKinds } from '../../utils/objectKinds';
import type { EsqTreeNodeDto } from '../../api/types';

/* ─── Known command metadata (optional overrides for label/icon/shortcut/confirm).
 *     Unknown commands from dictionary are auto-rendered with generated label.
 *     This map only provides nicer display for well-known commands.
 *     confirm: true → show confirmation dialog before executing.
 *     confirmText: optional message shown in the confirmation dialog. ─── */
interface CmdMeta {
  label: string;
  icon: string;
  shortcut?: string;
  confirm?: boolean;
  confirmText?: string;
}

const CMD_META: Record<string, CmdMeta> = {
  details:  { label: 'Details',         icon: 'info',           shortcut: 'F4' },
  key:      { label: 'Access Profile',  icon: 'verified_user'  },
  acct:     { label: 'Accounting',      icon: 'account_balance' },
  move:     { label: 'Move',            icon: 'drive_file_move' },
  delete:   { label: 'Delete',          icon: 'delete',         confirm: true, confirmText: 'This action cannot be undone.' },
};

/** Generate menu metadata for any command. Known commands get nice labels; unknown ones auto-generate. */
function cmdMeta(cmd: string): CmdMeta {
  if (CMD_META[cmd]) return CMD_META[cmd];
  // Auto-generate: "my_command" → "My command"
  const label = cmd.charAt(0).toUpperCase() + cmd.slice(1).replace(/[_-]/g, ' ');
  return { label, icon: 'extension' };
}


export const AppShell: React.FC = () => {
  const {
    selectedNode,
    setSelectedNode,
    getKind,
    getNode,
    kinds,
    history,
    historyIndex,
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

  // Entity details dialog (cmd: 'details' | 'acct')
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; kind: number; id: string; cmd?: string }>({
    open: false, kind: 0, id: '',
  });

  // Access profile dialog
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; id: string }>({
    open: false, id: '',
  });

  // Universal confirmation dialog (for any command with confirm: true)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; cmd: string; node: EsqTreeNodeDto | null }>({
    open: false, cmd: '', node: null,
  });

  // Move dialog
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; node: EsqTreeNodeDto | null }>({
    open: false, node: null,
  });

  // New entity dialog
  const [newDialog, setNewDialog] = useState<{ open: boolean; parentNode: EsqTreeNodeDto | null; childKind: number }>({
    open: false, parentNode: null, childKind: 0,
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

  // ── Navigate to a tree node by id ──
  const navigateToNode = useCallback((nodeId: string | null, addToHistory = false) => {
    if (!nodeId) return;
    const node = getNode(nodeId);
    if (!node) return;
    setSelectedNode(node);
    if (addToHistory) pushHistory(node.id);
  }, [getNode, setSelectedNode, pushHistory]);

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

  // Navigation
  const handleBack = useCallback(() => {
    const id = goBack();
    if (id) navigateToNode(id);
  }, [goBack, navigateToNode]);

  const handleForward = useCallback(() => {
    const id = goForward();
    if (id) navigateToNode(id);
  }, [goForward, navigateToNode]);

  const handleUp = useCallback(() => {
    if (selectedNode?.parentId) {
      navigateToNode(selectedNode.parentId, true);
    }
  }, [selectedNode, navigateToNode]);

  // Go to origin (for shortcut/link nodes)
  const handleGoToOrigin = useCallback((node: EsqTreeNodeDto) => {
    if (node.linkId) {
      navigateToNode(node.linkId, true);
    }
  }, [navigateToNode]);

  // ── Command action dispatcher (fully dynamic) ──
  // 1. Commands with confirm: true in CMD_META → show universal confirmation dialog.
  // 2. Commands with special UI ('key', 'move') → dedicated dialogs.
  // 3. Everything else (including unknown future commands from dictionary)
  //    → EntityDetailsDialog with cmd=X.
  const executeCommand = useCallback((cmd: string, node: EsqTreeNodeDto) => {
    const meta = cmdMeta(cmd);

    // Any command with confirm flag → universal confirmation dialog
    if (meta.confirm) {
      setConfirmDialog({ open: true, cmd, node });
      return;
    }

    switch (cmd) {
      case 'key':
        setProfileDialog({ open: true, id: String(node.entityId) });
        break;
      case 'move':
        setMoveDialog({ open: true, node });
        break;
      default:
        // Generic view command: 'details', 'acct', or any new command from dictionary
        setDetailsDialog({ open: true, kind: node.kind, id: String(node.entityId), cmd });
        break;
    }
  }, []);

  // ── Build context menu items (dictionary-driven from kind.commands) ──
  const buildContextMenuItems = useCallback((node: EsqTreeNodeDto): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const kind = getKind(node.kind);
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    const hasParent = !!selectedNode?.parentId;

    // --- Navigation section ---
    items.push({
      label: 'Open',
      icon: 'open_in_new',
      shortcut: 'Enter',
      onClick: () => handleNodeActivate(node),
    });

    items.push({
      label: 'Back',
      icon: 'arrow_back',
      shortcut: 'Ctrl+\u25C4',
      onClick: handleBack,
      disabled: !canGoBack,
    });
    items.push({
      label: 'Forward',
      icon: 'arrow_forward',
      shortcut: 'Ctrl+\u25BA',
      onClick: handleForward,
      disabled: !canGoForward,
    });
    items.push({
      label: 'Up',
      icon: 'arrow_upward',
      shortcut: 'Ctrl+\u25B2',
      onClick: handleUp,
      disabled: !hasParent,
    });

    // Go to origin — only for shortcut/link nodes
    if (node.linkId) {
      items.push({
        label: 'Go to origin',
        icon: 'link',
        onClick: () => handleGoToOrigin(node),
      });
    }

    // --- Commands section ---
    // Standard commands (from CMD_META) are always shown; disabled if NOT in kind.commands.
    // This matches Angular canCmdClick() = kind.isCommandAllowed(cmd).
    // Additional unknown commands from kind.commands are also shown (always enabled).
    const commandSet = new Set(kind?.commands ?? []);
    let firstCmd = true;

    // 1) Standard commands — always visible, enabled only if in kind.commands
    for (const cmd of Object.keys(CMD_META)) {
      const meta = cmdMeta(cmd);
      const enabled = commandSet.has(cmd);
      items.push({
        label: meta.label,
        icon: meta.icon,
        shortcut: meta.shortcut,
        onClick: enabled ? () => executeCommand(cmd, node) : () => {},
        disabled: !enabled,
        dividerBefore: firstCmd,
      });
      firstCmd = false;
    }

    // 2) Extra commands from dictionary not in CMD_META — always enabled
    for (const cmd of commandSet) {
      if (CMD_META[cmd]) continue; // already shown above
      const meta = cmdMeta(cmd);
      items.push({
        label: meta.label,
        icon: meta.icon,
        shortcut: meta.shortcut,
        onClick: () => executeCommand(cmd, node),
      });
    }

    // --- New... section (child kinds from dictionary) ---
    const childKinds = getChildKinds(kind, kinds);
    let firstNew = true;
    for (const ck of childKinds) {
      const childKindId = ck.id;
      items.push({
        label: `New ${ck.title}`,
        icon: 'add_circle',
        onClick: () => setNewDialog({ open: true, parentNode: node, childKind: childKindId }),
        dividerBefore: firstNew,
      });
      firstNew = false;
    }

    return items;
  }, [getKind, kinds, historyIndex, history.length, selectedNode,
      handleNodeActivate, handleBack, handleForward, handleUp, handleGoToOrigin, executeCommand]);

  // Context menu handler
  const handleContextMenu = useCallback((node: EsqTreeNodeDto, x: number, y: number) => {
    setContextMenu({ open: true, position: { x, y }, node });
  }, []);

  // Open details for a node (F4 / Alt+Enter)
  const handleOpenDetails = useCallback((node: EsqTreeNodeDto) => {
    executeCommand('details', node);
  }, [executeCommand]);

  // Keyboard navigation
  useKeyboardNav({
    onActivate: handleNodeActivate,
    onOpenDetails: handleOpenDetails,
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

      {/* Entity details / accounting dialog */}
      <EntityDetailsDialog
        open={detailsDialog.open}
        kind={detailsDialog.kind}
        entityId={detailsDialog.id}
        cmd={detailsDialog.cmd}
        onClose={() => setDetailsDialog(d => ({ ...d, open: false }))}
      />

      {/* Access profile dialog */}
      <AccessProfileDialog
        open={profileDialog.open}
        entityId={profileDialog.id}
        onClose={() => setProfileDialog(d => ({ ...d, open: false }))}
      />

      {/* Universal confirmation dialog (delete or any command with confirm: true) */}
      <ConfirmCommandDialog
        open={confirmDialog.open}
        cmd={confirmDialog.cmd}
        cmdLabel={cmdMeta(confirmDialog.cmd).label}
        cmdIcon={cmdMeta(confirmDialog.cmd).icon}
        confirmText={cmdMeta(confirmDialog.cmd).confirmText}
        node={confirmDialog.node}
        onClose={() => setConfirmDialog({ open: false, cmd: '', node: null })}
        onConfirmed={() => { setConfirmDialog({ open: false, cmd: '', node: null }); refetch(); }}
      />

      {/* Move entity dialog */}
      <MoveDialog
        open={moveDialog.open}
        node={moveDialog.node}
        onClose={() => setMoveDialog({ open: false, node: null })}
        onMoved={() => { setMoveDialog({ open: false, node: null }); refetch(); }}
      />

      {/* New entity dialog */}
      <NewEntityDialog
        open={newDialog.open}
        parentNode={newDialog.parentNode}
        childKind={newDialog.childKind}
        onClose={() => setNewDialog({ open: false, parentNode: null, childKind: 0 })}
        onCreated={() => { setNewDialog({ open: false, parentNode: null, childKind: 0 }); refetch(); }}
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
