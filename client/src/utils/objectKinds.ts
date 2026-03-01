import type { EsqObjectKind } from '../api/types';

/**
 * Map Material icon names from Angular to MUI icon names.
 * Angular uses string names like 'account_balance', MUI uses the same.
 */
export function getKindIcon(kind: EsqObjectKind | undefined): string {
  if (!kind) return 'folder';
  return kind.icon || 'folder';
}

/**
 * Check if a kind represents an organization entity.
 */
export function isOrgKind(kind: EsqObjectKind | undefined): boolean {
  return kind?.org ?? false;
}

/**
 * Check if a kind represents a user entity.
 */
export function isUsrKind(kind: EsqObjectKind | undefined): boolean {
  return kind?.usr ?? false;
}

/**
 * Check if a kind represents an account entity.
 */
export function isAcctKind(kind: EsqObjectKind | undefined): boolean {
  return kind?.acct ?? false;
}

/**
 * Get child kinds that can be created under a given parent kind.
 */
export function getChildKinds(
  parentKind: EsqObjectKind | undefined,
  allKinds: Map<number, EsqObjectKind>,
): EsqObjectKind[] {
  if (!parentKind?.childKinds) return [];
  return parentKind.childKinds
    .map(id => allKinds.get(id))
    .filter((k): k is EsqObjectKind => !!k);
}
