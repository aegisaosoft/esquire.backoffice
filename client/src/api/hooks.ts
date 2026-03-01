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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { EsqTreeNodeDto, EsqObjectKind, EsqEntity, EsqAccessProfile, AuthState } from './types';

// ── Auth ──
export function useAuth() {
  return useQuery<AuthState>({
    queryKey: ['auth'],
    queryFn: () => api.authMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Tree nodes ──
export function useTreeNodes(parentId?: string) {
  return useQuery<EsqTreeNodeDto[]>({
    queryKey: ['tree', parentId ?? 'root'],
    queryFn: () => api.esquire(parentId),
    enabled: true,
  });
}

// ── Entity kinds (loaded once) ──
export function useKinds() {
  return useQuery<EsqObjectKind[]>({
    queryKey: ['kinds'],
    queryFn: () => api.esquireKinds(),
    staleTime: Infinity,
  });
}

// ── Entity details ──
export function useEntityDetails(kind: number, id: string, cmd?: string) {
  return useQuery<EsqEntity>({
    queryKey: ['entity', kind, id, cmd],
    queryFn: () => api.esquireCmd(kind, id, cmd || 'details'),
    enabled: !!id && kind != null,
  });
}

// ── Entity dictionary (field definitions per kind) ──
export function useDictionary(kind: number) {
  return useQuery<any>({
    queryKey: ['dictionary', kind],
    queryFn: () => api.esquireDictionary(kind),
    enabled: kind != null,
    staleTime: Infinity,
  });
}

// ── Entity node (find by kind+id or kind+name) ──
export function useEntityNode(kind: number, id?: string, name?: string) {
  return useQuery<EsqTreeNodeDto>({
    queryKey: ['enode', kind, id, name],
    queryFn: () => api.esquireEntityNode(kind, id, name),
    enabled: !!kind && (!!id || !!name),
  });
}

// ── Access profile ──
export function useAccessProfile(id?: string) {
  return useQuery<EsqAccessProfile>({
    queryKey: ['accessProfile', id],
    queryFn: () => api.esquireKey(id),
    enabled: true,
  });
}

// ── Node path ──
export function useNodePath(id: string) {
  return useQuery<any>({
    queryKey: ['nodePath', id],
    queryFn: () => api.esquirePath(id),
    enabled: !!id,
  });
}

// ── Save entity ──
export function useSaveEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, body, cmd }: { kind: number; id: string; body: any; cmd?: string }) =>
      api.esquireCmdSave(kind, id, body, cmd),
    onSuccess: () => {
      // Invalidate all entity queries — kind in cache may differ from save kind
      // (e.g. shortcut kind 53 cached, but save uses resolved kind 52)
      qc.invalidateQueries({ queryKey: ['entity'] });
      // Also refresh tree nodes so ListView reflects updated fields (e.g. desc)
      qc.invalidateQueries({ queryKey: ['tree'] });
    },
  });
}

// ── Save account entity ──
export function useSaveAccountEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, body }: { kind: number; id: string; body: any }) =>
      api.esquireCmdAsave(kind, id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity'] });
      // Also refresh tree nodes so ListView reflects updated fields (e.g. desc)
      qc.invalidateQueries({ queryKey: ['tree'] });
    },
  });
}

// ── Save access profile ──
export function useSaveAccessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.esquireKeySave(id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['accessProfile', vars.id] });
    },
  });
}
