import { create } from 'zustand';
import type { Camera, CameraFrame } from '@/types';
import { mockCameras } from '@/utils/mock-data';

interface CameraStore {
  cameras: Camera[];
  frames: Record<string, CameraFrame>;
  selectedCameraId: string | null;

  setCameras: (cameras: Camera[]) => void;
  addCamera: (camera: Camera) => void;
  updateCamera: (id: string, updates: Partial<Camera>) => void;
  removeCamera: (id: string) => void;
  setFrame: (cameraId: string, frame: CameraFrame) => void;
  setSelectedCamera: (id: string | null) => void;
  getCameraById: (id: string) => Camera | undefined;
  getCamerasByGroup: (groupId: string) => Camera[];
  getUngroupedCameras: () => Camera[];
  getOnlineCameras: () => Camera[];
  getOfflineCameras: () => Camera[];
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  cameras: mockCameras,
  frames: {},
  selectedCameraId: null,

  setCameras: (cameras) => set({ cameras }),

  addCamera: (camera) =>
    set((state) => ({ cameras: [...state.cameras, camera] })),

  updateCamera: (id, updates) =>
    set((state) => ({
      cameras: state.cameras.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeCamera: (id) =>
    set((state) => ({
      cameras: state.cameras.filter((c) => c.id !== id),
    })),

  setFrame: (cameraId, frame) =>
    set((state) => ({
      frames: { ...state.frames, [cameraId]: frame },
    })),

  setSelectedCamera: (id) => set({ selectedCameraId: id }),

  getCameraById: (id) => get().cameras.find((c) => c.id === id),

  getCamerasByGroup: (groupId) =>
    get().cameras.filter((c) => c.groupId === groupId),

  getUngroupedCameras: () =>
    get().cameras.filter((c) => c.groupId === null),

  getOnlineCameras: () =>
    get().cameras.filter((c) => c.status !== 'offline'),

  getOfflineCameras: () =>
    get().cameras.filter((c) => c.status === 'offline'),
}));
