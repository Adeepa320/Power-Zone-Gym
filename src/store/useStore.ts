import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  /** Mobile sidebar drawer open state. */
  sidebarOpen: boolean;
  /** Desktop sidebar collapsed to icons. */
  sidebarCollapsed: boolean;
  /** Draft of the multi-step registration form (survives accidental reloads). */
  registerStep: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleCollapsed: () => void;
  setRegisterStep: (step: number) => void;
}

export const useStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      registerStep: 0,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRegisterStep: (step) => set({ registerStep: step }),
    }),
    {
      name: 'pzg-ui',
      // Only persist the desktop preference.
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
