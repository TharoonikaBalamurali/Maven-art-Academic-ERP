import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id, Nullable } from '@/shared/types';

/**
 * UI state (§27, third category).
 *
 * Only client-owned, non-authoritative view state lives here: chrome, theme,
 * and the "which record am I looking at" selections the specification calls
 * out (§27 — Selected Student, Selected Batch).
 *
 * Server data must NOT be placed in this store; that belongs to React Query.
 * Identity must NOT be placed here; that belongs to the auth store.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  theme: ThemePreference;
  /**
   * Parent portal student switcher (§8). This is a view preference only — the
   * backend still decides whether the parent may read that student's data.
   */
  selectedStudentId: Nullable<Id>;
  selectedBatchId: Nullable<Id>;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setTheme: (theme: ThemePreference) => void;
  selectStudent: (id: Nullable<Id>) => void;
  selectBatch: (id: Nullable<Id>) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      theme: 'system',
      selectedStudentId: null,
      selectedBatchId: null,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setTheme: (theme) => set({ theme }),
      selectStudent: (selectedStudentId) => set({ selectedStudentId }),
      selectBatch: (selectedBatchId) => set({ selectedBatchId }),
    }),
    {
      name: 'maven-erp.ui',
      // Transient chrome state is intentionally not persisted.
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        selectedStudentId: state.selectedStudentId,
      }),
    },
  ),
);
