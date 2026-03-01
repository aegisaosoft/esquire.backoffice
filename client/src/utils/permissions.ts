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
import type { EsqAccessProfile, EsqPermission } from '../api/types';
import { CMD_DEFAULT, CMD_NEW, CMD_DELETE, CMD_KEY, CMD_ACCT, CMD_MOVE } from '../api/types';

/**
 * Permission flag indices in the flags array.
 * Matches Angular EsqAccessProfile.FLAG_INDEX exactly:
 *   CMD_NEW → 0, CMD_DEFAULT/CMD_MOVE → 1, CMD_DELETE → 2, CMD_KEY → 3, CMD_ACCT → 4
 *
 * flags is an array of 'Y'/'N' strings from the backend.
 */
const CMD_FLAG_MAP: Record<string, number> = {
  [CMD_NEW]:     0,  // Create
  [CMD_DEFAULT]: 1,  // Read
  [CMD_MOVE]:    1,  // Read (same as details in Angular)
  [CMD_DELETE]:  2,  // Delete
  [CMD_KEY]:     3,  // Key / Access Profile
  [CMD_ACCT]:    4,  // Accounting
};

/**
 * Check if a command is allowed for a given entity kind based on access profile permissions.
 * Matches Angular EsqAccessProfile.isCommandAllowed() logic:
 *   1. "Personal" mode: if profile.id === entityId → allow all
 *   2. Kind rounding: Math.floor(kind / 2) * 2
 *   3. Lookup permission by rounded kind in profile.admin[]
 *   4. Check flags[flagIndex] === 'Y'
 */
export function isCommandAllowed(
  profile: EsqAccessProfile | null,
  cmd: string,
  entityKind: number,
  entityId?: string,
): boolean {
  if (!profile) return false;

  // "Personal" mode: user can do anything on their own entity
  if (entityId && String(profile.id) === String(entityId)) return true;

  const effectiveCmd = cmd || CMD_DEFAULT;
  const flagIndex = CMD_FLAG_MAP[effectiveCmd];
  if (flagIndex === undefined) return false;

  // Kind rounding — Angular: Math.floor(kind / 2) * 2
  const roundedKind = Math.floor(entityKind / 2) * 2;

  // Find permission entry for the rounded kind
  const permission = profile.admin?.find((p: EsqPermission) => p.kind === roundedKind);
  if (!permission) return false;

  // flags is an array of 'Y'/'N' strings
  const flags = permission.flags;
  if (!flags || flagIndex >= flags.length) return false;

  return flags[flagIndex] === 'Y';
}

/**
 * Parse flags array into readable CRUD labels.
 */
export function parseFlags(flags: string[] | string | number | undefined | null): string[] {
  const labels = ['Create', 'Read', 'Delete', 'Key', 'Acct'];
  if (!flags) return [];
  if (Array.isArray(flags)) {
    return labels.filter((_, i) => i < flags.length && flags[i] === 'Y');
  }
  const str = String(flags);
  return labels.filter((_, i) => str.charAt(i) === '1');
}
