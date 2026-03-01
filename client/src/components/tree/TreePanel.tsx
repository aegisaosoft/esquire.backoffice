import React, { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import { List, type RowComponentProps, type ListProps } from 'react-window';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import Icon from '@mui/material/Icon';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { useKinds } from '../../api/hooks';
import { api } from '../../api/client';
import {
  useExplorerStore,
  computeVisibleNodes,
  getChildIdsFromMap,
  type FlatTreeNode,
} from '../../store/explorerStore';
import { getStatusColor } from '../../utils/nodeStatus';
import { resolveNodeIcon } from '../../utils/kindIcons';
import type { EsqTreeNodeDto } from '../../api/types';

const ROW_HEIGHT = 30;

/* ─── Additional props passed to every row via rowProps ─── */
interface TreeRowProps {
  nodes: FlatTreeNode[];
  selectedId: string | null;
  onSelect: (node: EsqTreeNodeDto) => void;
  onDoubleClick: (node: EsqTreeNodeDto) => void;
  onToggle: (nodeId: string, expand: boolean) => void;
  onContextMenu: (node: EsqTreeNodeDto, x: number, y: number) => void;
}

/* ─── Public props ─── */
interface TreePanelProps {
  onContextMenu: (node: EsqTreeNodeDto, x: number, y: number) => void;
  onOpenDetails: (node: EsqTreeNodeDto) => void;
}

/* ─── Single virtualized tree row (memoized) ─── */
const TreeRow = React.memo(
  ({ index, style, nodes, selectedId, onSelect, onDoubleClick, onToggle, onContextMenu }: RowComponentProps<TreeRowProps>): ReactElement | null => {
    const { node, depth, isExpanded, isLoading } = nodes[index];

    // Granular selector: only re-render when this node's kind changes
    const kind = useExplorerStore(s => s.kinds.get(node.kind));
    const icon = resolveNodeIcon(node.name, kind?.icon);
    const statusColor = getStatusColor(node.statusCode);
    const isSelected = node.id === selectedId;

    return (
      <Box
        style={style as CSSProperties}
        onClick={() => onSelect(node)}
        onDoubleClick={() => onDoubleClick(node)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(node, e.clientX, e.clientY); }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: `${depth * 20 + 4}px`,
          pr: 1,
          cursor: 'pointer',
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
          userSelect: 'none',
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id, !isExpanded);
          }}
          sx={{ p: 0.25, minWidth: 24 }}
        >
          {isLoading ? (
            <CircularProgress size={14} />
          ) : isExpanded ? (
            <ExpandMore sx={{ fontSize: 18 }} />
          ) : (
            <ChevronRight sx={{ fontSize: 18 }} />
          )}
        </IconButton>

        <Icon baseClassName="material-icons-outlined" sx={{ color: statusColor, fontSize: 18, mx: 0.25 }}>{icon}</Icon>

        <Typography
          variant="body2"
          noWrap
          sx={{ color: statusColor, ml: 0.5, flex: 1, lineHeight: `${ROW_HEIGHT}px` }}
        >
          {node.name}
        </Typography>
      </Box>
    );
  },
);

/* ─── Virtualized tree panel ─── */
export const TreePanel: React.FC<TreePanelProps> = ({ onContextMenu, onOpenDetails }) => {
  const queryClient = useQueryClient();

  // ── Minimal Zustand subscriptions (individual selectors = no cascade re-renders) ──
  const rootIds = useExplorerStore(s => s.rootIds);
  const expandedIds = useExplorerStore(s => s.expandedIds);
  const treeVersion = useExplorerStore(s => s.treeVersion);
  const loadingIds = useExplorerStore(s => s.loadingIds);
  const selectedNodeId = useExplorerStore(s => s.selectedNode?.id ?? null);

  // ── Flat visible nodes — recomputed only when tree structure changes ──
  const visibleNodes = useMemo(
    () => computeVisibleNodes(rootIds, expandedIds, loadingIds),
    // treeVersion forces recomputation when mutable maps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootIds, expandedIds, loadingIds, treeVersion],
  );

  // ── Load kinds once ──
  const { data: kindsData } = useKinds();
  useEffect(() => {
    if (kindsData) useExplorerStore.getState().setKinds(kindsData);
  }, [kindsData]);

  // ── Load root nodes on mount ──
  const [rootLoading, setRootLoading] = useState(true);
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const roots = await queryClient.fetchQuery({
          queryKey: ['tree', 'root'],
          queryFn: () => api.esquire(undefined),
        });
        useExplorerStore.getState().registerChildren(null, roots);
      } catch {
        setRootError('Failed to load tree');
      } finally {
        setRootLoading(false);
      }
    })();
  }, [queryClient]);

  // ── Select node (single click) ──
  const handleSelect = useCallback((node: EsqTreeNodeDto) => {
    const s = useExplorerStore.getState();
    s.setSelectedNode(node);
    s.pushHistory(node.id);
  }, []);

  // ── Expand / collapse node (loads children on first expand) ──
  const handleToggle = useCallback(
    async (nodeId: string, expand: boolean) => {
      const s = useExplorerStore.getState();
      s.setExpanded(nodeId, expand);

      // Lazy-load children on first expand
      if (expand && !getChildIdsFromMap(nodeId)) {
        s.setNodeLoading(nodeId, true);
        try {
          const children = await queryClient.fetchQuery({
            queryKey: ['tree', nodeId],
            queryFn: () => api.esquire(nodeId),
          });
          s.registerChildren(nodeId, children);
        } catch {
          s.setErrorMessage('Failed to load children');
          s.setExpanded(nodeId, false);
        } finally {
          s.setNodeLoading(nodeId, false);
        }
      }
    },
    [queryClient],
  );

  // ── Double-click: folder → expand, leaf → open details ──
  const handleDoubleClick = useCallback((node: EsqTreeNodeDto) => {
    const kind = useExplorerStore.getState().kinds.get(node.kind);
    if (kind?.childKinds?.length) {
      handleSelect(node);
      handleToggle(node.id, true);
    } else {
      onOpenDetails(node);
    }
  }, [handleSelect, handleToggle, onOpenDetails]);

  // ── Row props for react-window (re-evaluated only when data/selection change) ──
  const rowProps = useMemo<TreeRowProps>(
    () => ({
      nodes: visibleNodes,
      selectedId: selectedNodeId,
      onSelect: handleSelect,
      onDoubleClick: handleDoubleClick,
      onToggle: handleToggle,
      onContextMenu,
    }),
    [visibleNodes, selectedNodeId, handleSelect, handleDoubleClick, handleToggle, onContextMenu],
  );

  // ── Render states ──
  if (rootLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (rootError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{rootError}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <List<TreeRowProps>
        rowCount={visibleNodes.length}
        rowHeight={ROW_HEIGHT}
        rowComponent={TreeRow as ListProps<TreeRowProps>['rowComponent']}
        rowProps={rowProps}
        overscanCount={10}
        style={{ height: '100%' }}
      />
    </Box>
  );
};
