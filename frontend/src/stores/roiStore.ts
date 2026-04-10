import { create } from 'zustand';
import type { ROI, ROIData, ROIShape } from '@/types';
import { mockROIs } from '@/utils/mock-data';

interface ROIStore {
  rois: ROI[];
  roiData: Record<string, ROIData>;
  selectedRoiId: string | null;
  activeTool: ROIShape | null;
  isDrawing: boolean;

  addROI: (roi: ROI) => void;
  updateROI: (id: string, updates: Partial<ROI>) => void;
  removeROI: (id: string) => void;
  setROIData: (roiId: string, data: ROIData) => void;
  setActiveTool: (tool: ROIShape | null) => void;
  setSelectedROI: (id: string | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  getROIsByCamera: (cameraId: string) => ROI[];
}

/**
 * Generates randomized mock temperature data for a single ROI.
 * Base temperatures fluctuate around typical LHF operating range (1100-1400 C).
 */
export function generateMockROIData(roiId: string): ROIData {
  const baseMin = 1050 + Math.random() * 150;
  const baseMax = baseMin + 100 + Math.random() * 200;
  const baseAvg = baseMin + (baseMax - baseMin) * (0.4 + Math.random() * 0.2);

  return {
    roiId,
    timestamp: new Date().toISOString(),
    minTemp: Math.round(baseMin),
    maxTemp: Math.round(baseMax),
    avgTemp: Math.round(baseAvg),
  };
}

export const useROIStore = create<ROIStore>((set, get) => ({
  rois: mockROIs,
  roiData: {},
  selectedRoiId: null,
  activeTool: null,
  isDrawing: false,

  addROI: (roi) =>
    set((state) => ({ rois: [...state.rois, roi] })),

  updateROI: (id, updates) =>
    set((state) => ({
      rois: state.rois.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  removeROI: (id) =>
    set((state) => ({
      rois: state.rois.filter((r) => r.id !== id),
      selectedRoiId: state.selectedRoiId === id ? null : state.selectedRoiId,
      roiData: Object.fromEntries(
        Object.entries(state.roiData).filter(([key]) => key !== id)
      ),
    })),

  setROIData: (roiId, data) =>
    set((state) => ({
      roiData: { ...state.roiData, [roiId]: data },
    })),

  setActiveTool: (tool) =>
    set({ activeTool: tool, selectedRoiId: null }),

  setSelectedROI: (id) =>
    set({ selectedRoiId: id, activeTool: null }),

  setIsDrawing: (drawing) =>
    set({ isDrawing: drawing }),

  getROIsByCamera: (cameraId) =>
    get().rois.filter((r) => r.cameraId === cameraId),
}));
