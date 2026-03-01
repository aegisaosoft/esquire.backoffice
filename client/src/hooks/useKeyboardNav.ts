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
import { useEffect, useCallback } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import type { EsqTreeNodeDto } from '../api/types';

interface UseKeyboardNavOptions {
  /** Callback when Enter is pressed on the selected list item */
  onActivate?: (node: EsqTreeNodeDto) => void;
  /** Callback when F4 or Alt+Enter is pressed — open details for the selected item */
  onOpenDetails?: (node: EsqTreeNodeDto) => void;
  /** Callback when navigating back */
  onBack?: () => void;
  /** Callback when navigating forward */
  onForward?: () => void;
}

/**
 * Hook that provides keyboard navigation for the explorer.
 *
 * Keybindings:
 * - ArrowUp/ArrowDown — move selection in the list
 * - Enter — activate the selected item (open details)
 * - Alt+Left — go back in history
 * - Alt+Right — go forward in history
 * - Backspace — go up to parent node
 * - F4 — open details for the selected item
 * - Alt+Enter — open details for the selected item
 * - F5 — refresh (preventDefault to avoid page reload)
 */
export function useKeyboardNav({ onActivate, onOpenDetails, onBack, onForward }: UseKeyboardNavOptions = {}) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { listItems, selectedListIndex, setSelectedListIndex } = useExplorerStore.getState();
    const target = e.target as HTMLElement;

    // Don't interfere with inputs, textareas, selects, or dialog fields
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = Math.min(selectedListIndex + 1, listItems.length - 1);
        setSelectedListIndex(nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = Math.max(selectedListIndex - 1, 0);
        setSelectedListIndex(prevIndex);
        break;
      }

      case 'Enter': {
        if (selectedListIndex >= 0 && selectedListIndex < listItems.length) {
          e.preventDefault();
          if (e.altKey) {
            // Alt+Enter → open details
            onOpenDetails?.(listItems[selectedListIndex]);
          } else {
            onActivate?.(listItems[selectedListIndex]);
          }
        }
        break;
      }

      case 'F4': {
        // F4 → open details for the selected item
        if (selectedListIndex >= 0 && selectedListIndex < listItems.length) {
          e.preventDefault();
          onOpenDetails?.(listItems[selectedListIndex]);
        }
        break;
      }

      case 'ArrowLeft': {
        if (e.altKey) {
          e.preventDefault();
          onBack?.();
        }
        break;
      }

      case 'ArrowRight': {
        if (e.altKey) {
          e.preventDefault();
          onForward?.();
        }
        break;
      }

      case 'Backspace': {
        e.preventDefault();
        // Navigate up to parent — handled by the consumer
        const { selectedNode } = useExplorerStore.getState();
        if (selectedNode?.parentId) {
          onBack?.();
        }
        break;
      }

      case 'F5': {
        // Prevent default browser refresh and let the app handle it
        e.preventDefault();
        break;
      }

      case 'Home': {
        if (listItems.length > 0) {
          e.preventDefault();
          setSelectedListIndex(0);
        }
        break;
      }

      case 'End': {
        if (listItems.length > 0) {
          e.preventDefault();
          setSelectedListIndex(listItems.length - 1);
        }
        break;
      }

      default:
        break;
    }
  }, [onActivate, onOpenDetails, onBack, onForward]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
