import { create } from 'zustand';
import type { Alert, AlertRule } from '@/types';
import { mockAlerts, mockAlertRules } from '@/utils/mock-data';

interface AlertStore {
  alerts: Alert[];
  rules: AlertRule[];
  audioMuted: boolean;

  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string, userId: string) => void;
  resolveAlert: (id: string) => void;
  clearResolvedAlerts: () => void;
  getActiveAlerts: () => Alert[];
  getUnacknowledgedAlerts: () => Alert[];
  getAlertsByCamera: (cameraId: string) => Alert[];
  getAlertsByGroup: (groupId: string) => Alert[];

  setRules: (rules: AlertRule[]) => void;
  addRule: (rule: AlertRule) => void;
  updateRule: (id: string, updates: Partial<AlertRule>) => void;
  removeRule: (id: string) => void;

  toggleAudioMute: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: mockAlerts,
  rules: mockAlertRules,
  audioMuted: false,

  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),

  acknowledgeAlert: (id, userId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'acknowledged' as const,
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: userId,
            }
          : a
      ),
    })),

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id
          ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
          : a
      ),
    })),

  clearResolvedAlerts: () =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.status !== 'resolved'),
    })),

  getActiveAlerts: () =>
    get().alerts.filter((a) => a.status === 'active'),

  getUnacknowledgedAlerts: () =>
    get().alerts.filter((a) => a.status === 'active'),

  getAlertsByCamera: (cameraId) =>
    get().alerts.filter((a) => a.cameraId === cameraId),

  getAlertsByGroup: (groupId) =>
    get().alerts.filter((a) => a.groupId === groupId),

  setRules: (rules) => set({ rules }),

  addRule: (rule) =>
    set((state) => ({ rules: [...state.rules, rule] })),

  updateRule: (id, updates) =>
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  removeRule: (id) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== id),
    })),

  toggleAudioMute: () =>
    set((state) => ({ audioMuted: !state.audioMuted })),
}));
