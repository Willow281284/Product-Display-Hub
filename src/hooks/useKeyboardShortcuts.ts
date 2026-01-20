import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsProps {
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSelectAll,
  onClearSelection,
  onDelete,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + Shift + A: Deselect all
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        onClearSelection?.();
        return;
      }

      // Ctrl/Cmd + A: Select all
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        onSelectAll?.();
        return;
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        event.preventDefault();
        onClearSelection?.();
        return;
      }

      // Delete: Trigger bulk delete (only if there's a selection)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Only trigger if not in an input field
        event.preventDefault();
        onDelete?.();
        return;
      }
    },
    [enabled, onSelectAll, onClearSelection, onDelete]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
