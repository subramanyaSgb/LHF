import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutMode, LayoutPreset, LayoutItem } from '@/types';

interface LayoutStore {
  currentMode: LayoutMode;
  gridCols: number;
  gridRows: number;
  items: LayoutItem[];
  presets: LayoutPreset[];
  activePresetId: string | null;
  sidebarCollapsed: boolean;
  fullscreenMode: boolean;

  setLayoutMode: (mode: LayoutMode) => void;
  setGrid: (cols: number, rows: number) => void;
  setItems: (items: LayoutItem[]) => void;
  updateItem: (id: string, updates: Partial<LayoutItem>) => void;

  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;

  toggleSidebar: () => void;
  toggleFullscreen: () => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      currentMode: 'auto',
      gridCols: 2,
      gridRows: 2,
      items: [],
      presets: [],
      activePresetId: null,
      sidebarCollapsed: false,
      fullscreenMode: false,

      setLayoutMode: (mode) => set({ currentMode: mode }),

      setGrid: (cols, rows) => set({ gridCols: cols, gridRows: rows }),

      setItems: (items) => set({ items }),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      savePreset: (name) => {
        const state = get();
        const preset: LayoutPreset = {
          id: `preset-${Date.now()}`,
          name,
          mode: state.currentMode,
          gridCols: state.gridCols,
          gridRows: state.gridRows,
          items: state.items,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ presets: [...s.presets, preset] }));
      },

      loadPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (preset) {
          set({
            currentMode: preset.mode,
            gridCols: preset.gridCols,
            gridRows: preset.gridRows,
            items: preset.items,
            activePresetId: id,
          });
        }
      },

      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          activePresetId:
            state.activePresetId === id ? null : state.activePresetId,
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      toggleFullscreen: () =>
        set((state) => ({ fullscreenMode: !state.fullscreenMode })),
    }),
    {
      name: 'infrasense-layout',
    }
  )
);
