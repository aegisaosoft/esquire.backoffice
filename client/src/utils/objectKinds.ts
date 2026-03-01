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
