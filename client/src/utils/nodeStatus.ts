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
 * Status codes from backend:
 * 0 = normal
 * 1 = deleted/closed
 * 2 = locked
 */

export function getStatusColor(statusCode: number): string {
  switch (statusCode) {
    case 1: return '#f44336';   // red — deleted/closed
    case 2: return '#ff9800';   // orange — locked
    default: return 'inherit';   // normal
  }
}

export function getStatusIcon(statusCode: number): string | null {
  switch (statusCode) {
    case 1: return 'cancel';       // deleted/closed
    case 2: return 'lock';         // locked
    default: return null;
  }
}

export function getStatusTooltip(statusCode: number): string {
  switch (statusCode) {
    case 1: return 'Deleted / Closed';
    case 2: return 'Locked';
    default: return '';
  }
}
