import { create } from 'zustand';
import type { CameraGroup, StitchMapping } from '@/types';
import { mockGroups } from '@/utils/mock-data';

interface GroupStore {
  groups: CameraGroup[];
  selectedGroupId: string | null;

  setGroups: (groups: CameraGroup[]) => void;
  addGroup: (group: CameraGroup) => void;
  updateGroup: (id: string, updates: Partial<CameraGroup>) => void;
  removeGroup: (id: string) => void;
  setSelectedGroup: (id: string | null) => void;
  getGroupById: (id: string) => CameraGroup | undefined;
  addCameraToGroup: (groupId: string, cameraId: string) => void;
  removeCameraFromGroup: (groupId: string, cameraId: string) => void;
  updateStitchMappings: (groupId: string, mappings: StitchMapping[]) => void;
  toggleStitch: (groupId: string, enabled: boolean) => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: mockGroups,
  selectedGroupId: null,

  setGroups: (groups) => set({ groups }),

  addGroup: (group) =>
    set((state) => ({ groups: [...state.groups, group] })),

  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
    })),

  setSelectedGroup: (id) => set({ selectedGroupId: id }),

  getGroupById: (id) => get().groups.find((g) => g.id === id),

  addCameraToGroup: (groupId, cameraId) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, cameraIds: [...g.cameraIds, cameraId] }
          : g
      ),
    })),

  removeCameraFromGroup: (groupId, cameraId) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              cameraIds: g.cameraIds.filter((id) => id !== cameraId),
              stitchMappings: g.stitchMappings.filter(
                (m) => m.cameraId !== cameraId
              ),
            }
          : g
      ),
    })),

  updateStitchMappings: (groupId, mappings) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, stitchMappings: mappings } : g
      ),
    })),

  toggleStitch: (groupId, enabled) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, stitchEnabled: enabled } : g
      ),
    })),
}));
