import { useEffect } from 'react';

export interface ShortcutHandlers {
  onPalette: () => void;
  onToggleSidebar: () => void;
  onNavigate: (path: string) => void;
}

const NAV_KEYS: Record<string, string> = {
  '1': '/',
  '2': '/products',
  '3': '/customers',
  '4': '/profile',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useShortcuts({ onPalette, onToggleSidebar, onNavigate }: ShortcutHandlers): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();

      if (key === 'k') {
        event.preventDefault();
        onPalette();
        return;
      }
      if (key === 'b') {
        event.preventDefault();
        onToggleSidebar();
        return;
      }
      if (isTypingTarget(event.target)) return;

      const path = NAV_KEYS[event.key];
      if (path) {
        event.preventDefault();
        onNavigate(path);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPalette, onToggleSidebar, onNavigate]);
}
