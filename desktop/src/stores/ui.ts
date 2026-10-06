import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface UiState {
  toasts: Toast[];
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  notify: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
  toggleSidebar: () => void;
  setPaletteOpen: (open: boolean) => void;
}

let nextToastId = 1;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  sidebarCollapsed: false,
  paletteOpen: false,

  notify: (message, kind = 'info') => {
    const id = nextToastId++;
    set((state) => ({ toasts: [...state.toasts, { id, kind, message }] }));
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 4200);
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
}));

export const toast = {
  success: (message: string) => useUiStore.getState().notify(message, 'success'),
  error: (message: string) => useUiStore.getState().notify(message, 'error'),
  info: (message: string) => useUiStore.getState().notify(message, 'info'),
};
