import type { EsqAccessProfile, EsqPermission } from '../api/types';
import { CMD_DEFAULT, CMD_NEW, CMD_DELETE, CMD_KEY, CMD_ACCT, CMD_MOVE } from '../api/types';

/**
 * Permission flag indices in the flags bitmap string.
 * Matches Angular EsqAccessProfile.isCommandAllowed logic.
 */
const CMD_FLAG_MAP: Record<string, number> = {
  [CMD_DEFAULT]: 1,  // Read
  [CMD_NEW]: 0,      // Create
  [CMD_DELETE]: 3,    // Delete
  [CMD_MOVE]: 2,     // Update
  [CMD_KEY]: 4,       // Key
  [CMD_ACCT]: 5,      // Acct
};

/**
 * Check if a command is allowed for a given entity kind.
 * personalMode = true when user is viewing their own profile.
 */
export function isCommandAllowed(
  profile: EsqAccessProfile | null,
  cmd: string,
  entityKind: number,
  personalMode: boolean = false,
): boolean {
  // Always allow details
  if (cmd === CMD_DEFAULT) return true;

  // Personal mode allows all commands on own entity
  if (personalMode) return true;

  if (!profile) return false;

  const flagIndex = CMD_FLAG_MAP[cmd];
  if (flagIndex === undefined) return false;

  // Check admin permissions for the entity kind
  const permission = profile.admin?.find((p: EsqPermission) => p.kind === entityKind);
  if (permission?.flags == null) return false;

  // Backend may send flags as number or string — normalise
  const flagStr = String(permission.flags);
  return flagStr.charAt(flagIndex) === '1';
}

/**
 * Parse flags string into readable CRUD labels.
 */
export function parseFlags(flags: string | number | undefined | null): string[] {
  const labels = ['Create', 'Read', 'Update', 'Delete', 'Key', 'Acct'];
  if (!flags && flags !== 0) return [];
  const str = String(flags);
  return labels.filter((_, i) => str.charAt(i) === '1');
}
