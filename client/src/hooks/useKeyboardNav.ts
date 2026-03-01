import { useEffect, useCallback } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import type { EsqTreeNodeDto } from '../api/types';

interface UseKeyboardNavOptions {
  /** Callback when Enter is pressed on the selected list item */
  onActivate?: (node: EsqTreeNodeDto) => void;
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
 * - F5 — refresh (preventDefault to avoid page reload)
 */
export function useKeyboardNav({ onActivate, onBack, onForward }: UseKeyboardNavOptions = {}) {
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
          onActivate?.(listItems[selectedListIndex]);
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
  }, [onActivate, onBack, onForward]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
