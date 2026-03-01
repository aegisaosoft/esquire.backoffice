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
