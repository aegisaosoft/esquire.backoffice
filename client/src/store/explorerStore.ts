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
import { create } from 'zustand';
import type { EsqTreeNodeDto, EsqObjectKind, EsqAccessProfile } from '../api/types';

/* ───────────────────────────────────────────────────────────────
 * Mutable tree data — module-level, zero-copy.
 * Reads are O(1), writes are O(children.length) with NO full-map copy.
 * treeVersion counter in Zustand state forces dependent useMemo recomputation.
 * ─────────────────────────────────────────────────────────────── */
const _nodeMap = new Map<string, EsqTreeNodeDto>();
const _childMap = new Map<string, string[]>();

/** Read a single node by ID (zero-cost, no Zustand subscription) */
export function getNodeFromMap(id: string): EsqTreeNodeDto | undefined {
  return _nodeMap.get(id);
}

/** Read child IDs for a parent (zero-cost, no Zustand subscription) */
export function getChildIdsFromMap(parentId: string): string[] | undefined {
  return _childMap.get(parentId);
}

/* ─── Flat tree node for virtualized rendering ─── */
export interface FlatTreeNode {
  node: EsqTreeNodeDto;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
}

/** Walk expanded tree and return flat visible-node list for react-window */
export function computeVisibleNodes(
  rootIds: string[],
  expandedIds: Set<string>,
  loadingIds: Set<string>,
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];
  const walk = (ids: string[], depth: number) => {
    for (const id of ids) {
      const node = _nodeMap.get(id);
      if (!node) continue;
      const isExpanded = expandedIds.has(id);
      result.push({ node, depth, isExpanded, isLoading: loadingIds.has(id) });
      if (isExpanded) {
        const childIds = _childMap.get(id);
        if (childIds) walk(childIds, depth + 1);
      }
    }
  };
  walk(rootIds, 0);
  return result;
}

/* ─── Zustand store interface ─── */
interface ExplorerState {
  // Object kinds (loaded once)
  kinds: Map<number, EsqObjectKind>;
  setKinds: (kinds: EsqObjectKind[]) => void;
  getKind: (id: number) => EsqObjectKind | undefined;

  // Tree structure — rootIds + treeVersion in state; actual data in mutable maps above
  rootIds: string[];
  treeVersion: number;
  loadingIds: Set<string>;
  registerChildren: (parentId: string | null, children: EsqTreeNodeDto[]) => void;
  setNodeLoading: (id: string, loading: boolean) => void;
  getNode: (id: string) => EsqTreeNodeDto | undefined;

  // Selected tree node
  selectedNode: EsqTreeNodeDto | null;
  setSelectedNode: (node: EsqTreeNodeDto | null) => void;

  // Expanded tree node IDs
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  setExpanded: (id: string, expanded: boolean) => void;

  // List items (children of selected node)
  listItems: EsqTreeNodeDto[];
  setListItems: (items: EsqTreeNodeDto[]) => void;

  // Selected list item (by tree-node ID for stable identity across refetches)
  selectedListItemId: string | null;
  setSelectedListItemId: (id: string | null) => void;

  // Legacy index (kept for keyboard nav)
  selectedListIndex: number;
  setSelectedListIndex: (index: number) => void;

  // Update existing nodes in the tree map without touching structure
  updateNodes: (nodes: EsqTreeNodeDto[]) => void;

  // Optimistic patch: update a tree node found by entityId with changed fields
  patchNodeByEntity: (entityId: string | number, patch: Record<string, any>) => void;

  // Navigation history
  history: string[];
  historyIndex: number;
  pushHistory: (nodeId: string) => void;
  goBack: () => string | null;
  goForward: () => string | null;

  // Access profile
  accessProfile: EsqAccessProfile | null;
  setAccessProfile: (profile: EsqAccessProfile | null) => void;

  // Error message
  errorMessage: string;
  setErrorMessage: (msg: string) => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  // ── Kinds ──
  kinds: new Map(),
  setKinds: (kinds) => {
    const map = new Map<number, EsqObjectKind>();
    kinds.forEach(k => map.set(k.id, k));
    set({ kinds: map });
  },
  getKind: (id) => get().kinds.get(id),

  // ── Tree structure ──
  rootIds: [],
  treeVersion: 0,
  loadingIds: new Set(),

  registerChildren: (parentId, children) => {
    // Mutate module-level maps — O(children.length), no full-map copy
    children.forEach(c => _nodeMap.set(c.id, c));
    const ids = children.map(c => c.id);
    if (parentId === null) {
      set(state => ({ rootIds: ids, treeVersion: state.treeVersion + 1 }));
    } else {
      _childMap.set(parentId, ids);
      set(state => ({ treeVersion: state.treeVersion + 1 }));
    }
  },

  setNodeLoading: (id, loading) => set(state => {
    const next = new Set(state.loadingIds);
    if (loading) next.add(id); else next.delete(id);
    return { loadingIds: next };
  }),

  getNode: (id) => _nodeMap.get(id),

  // ── Selected node ──
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node, selectedListIndex: -1, selectedListItemId: null }),

  // ── Expanded ──
  expandedIds: new Set(),
  toggleExpanded: (id) => set((state) => {
    const next = new Set(state.expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { expandedIds: next };
  }),
  setExpanded: (id, expanded) => set((state) => {
    const next = new Set(state.expandedIds);
    if (expanded) next.add(id); else next.delete(id);
    return { expandedIds: next };
  }),

  // ── Update existing nodes (sync data without touching structure) ──
  updateNodes: (nodes) => {
    let changed = false;
    for (const n of nodes) {
      const existing = _nodeMap.get(n.id);
      if (!existing || existing !== n) {
        _nodeMap.set(n.id, n);
        changed = true;
      }
    }
    if (changed) {
      set(state => ({ treeVersion: state.treeVersion + 1 }));
    }
  },

  // ── Optimistic patch by entityId ──
  patchNodeByEntity: (entityId, patch) => {
    const eid = String(entityId);
    // Only patch fields that exist on EsqTreeNodeDto (desc, name, statusCode, etc.)
    const treeFields = ['name', 'desc', 'statusCode'] as const;
    const treePatch: Partial<EsqTreeNodeDto> = {};
    for (const key of treeFields) {
      if (key in patch) (treePatch as any)[key] = patch[key];
    }
    if (Object.keys(treePatch).length === 0) return;

    // Find and update in _nodeMap
    let patchedId: string | null = null;
    for (const [id, node] of _nodeMap) {
      if (String(node.entityId) === eid) {
        _nodeMap.set(id, { ...node, ...treePatch });
        patchedId = id;
        break;
      }
    }
    if (!patchedId) return;

    // Also update listItems array and bump treeVersion
    const pid = patchedId;
    set(state => ({
      listItems: state.listItems.map(item =>
        item.id === pid ? { ...item, ...treePatch } : item,
      ),
      treeVersion: state.treeVersion + 1,
    }));
  },

  // ── List ──
  listItems: [],
  setListItems: (items) => set(state => {
    // Preserve selected item if it still exists in the new data
    const prevId = state.selectedListItemId;
    const stillExists = prevId != null && items.some(i => i.id === prevId);
    const nextId = stillExists ? prevId : (items.length > 0 ? items[0].id : null);
    const nextIndex = nextId ? items.findIndex(i => i.id === nextId) : -1;
    return { listItems: items, selectedListItemId: nextId, selectedListIndex: nextIndex };
  }),

  selectedListItemId: null,
  setSelectedListItemId: (id) => set(state => {
    const idx = state.listItems.findIndex(i => i.id === id);
    return { selectedListItemId: id, selectedListIndex: idx };
  }),

  selectedListIndex: -1,
  setSelectedListIndex: (index) => set(state => {
    const id = state.listItems[index]?.id ?? null;
    return { selectedListIndex: index, selectedListItemId: id };
  }),

  // ── History ──
  history: [],
  historyIndex: -1,
  pushHistory: (nodeId) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(nodeId);
    return { history: newHistory, historyIndex: newHistory.length - 1 };
  }),
  goBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    set({ historyIndex: historyIndex - 1 });
    return history[historyIndex - 1];
  },
  goForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    set({ historyIndex: historyIndex + 1 });
    return history[historyIndex + 1];
  },

  // ── Access profile ──
  accessProfile: null,
  setAccessProfile: (profile) => set({ accessProfile: profile }),

  // ── Error ──
  errorMessage: '',
  setErrorMessage: (msg) => set({ errorMessage: msg }),
}));
