import { create } from 'zustand';
import type { Recording, RecordingAnnotation } from '@/types';
import { mockRecordings } from '@/utils/mock-data';

interface RecordingStore {
  recordings: Recording[];
  annotations: Record<string, RecordingAnnotation[]>;
  selectedRecordingId: string | null;
  comparisonRecordingId: string | null;

  setRecordings: (recordings: Recording[]) => void;
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  toggleFlag: (id: string) => void;
  deleteRecording: (id: string) => void;

  setSelectedRecording: (id: string | null) => void;
  setComparisonRecording: (id: string | null) => void;

  addAnnotation: (recordingId: string, annotation: RecordingAnnotation) => void;
  getAnnotations: (recordingId: string) => RecordingAnnotation[];

  getRecordingsByGroup: (groupId: string) => Recording[];
  getRecordingsByHeat: (heatNumber: string) => Recording[];
  getFlaggedRecordings: () => Recording[];
}

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  recordings: mockRecordings,
  annotations: {},
  selectedRecordingId: null,
  comparisonRecordingId: null,

  setRecordings: (recordings) => set({ recordings }),

  addRecording: (recording) =>
    set((state) => ({ recordings: [recording, ...state.recordings] })),

  updateRecording: (id, updates) =>
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  toggleFlag: (id) =>
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, isFlagged: !r.isFlagged } : r
      ),
    })),

  deleteRecording: (id) =>
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
    })),

  setSelectedRecording: (id) => set({ selectedRecordingId: id }),
  setComparisonRecording: (id) => set({ comparisonRecordingId: id }),

  addAnnotation: (recordingId, annotation) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        [recordingId]: [
          ...(state.annotations[recordingId] || []),
          annotation,
        ],
      },
    })),

  getAnnotations: (recordingId) => get().annotations[recordingId] || [],

  getRecordingsByGroup: (groupId) =>
    get().recordings.filter((r) => r.groupId === groupId),

  getRecordingsByHeat: (heatNumber) =>
    get().recordings.filter((r) => r.heatNumber === heatNumber),

  getFlaggedRecordings: () =>
    get().recordings.filter((r) => r.isFlagged),
}));
