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
/**
 * Maps backend .ico icon paths → Material Icons names.
 * Used in TreePanel and ListView to display appropriate icons.
 */

/** Backend icon path → MUI icon name */
const ICO_TO_MUI: Record<string, string> = {
  'img/folders/system.ico': 'dns',
  'img/folders/folder.ico': 'folder',
  'img/org.ico':            'corporate_fare',
  'img/sysadmin.ico':       'admin_panel_settings',
  'img/admin.ico':          'manage_accounts',
  'img/client.ico':         'person',
  'img/merchant.ico':       'store',
  'img/acct.ico':           'account_balance',
  'img/acctl.ico':          'account_balance',
  'img/macct.ico':          'account_balance_wallet',
  'img/macctl.ico':         'account_balance_wallet',
  'img/pacct.ico':          'receipt_long',
  'img/pacctl.ico':         'receipt_long',
  'img/terminal.ico':       'point_of_sale',
};

/**
 * Resolve the MUI icon name for a tree/list node.
 *
 * Priority:
 * 1. Node name starting with "All" → folder icon
 * 2. Kind icon path mapped to MUI icon
 * 3. Fallback: 'description'
 */
export function resolveNodeIcon(nodeName: string, kindIcon?: string): string {
  // Nodes named "All ..." are virtual folders
  if (nodeName.startsWith('All ')) return 'folder';

  // Map .ico path to MUI icon
  if (kindIcon) {
    const mui = ICO_TO_MUI[kindIcon];
    if (mui) return mui;

    // Handle folders generically
    if (kindIcon.includes('folder')) return 'folder';
  }

  return 'description';
}
