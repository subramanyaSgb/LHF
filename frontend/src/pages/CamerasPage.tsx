import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useCameraStore } from '@/stores/cameraStore';
import { useGroupStore } from '@/stores/groupStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRelative } from '@/utils/format';
import { formatTemp, getTempStatusClass } from '@/utils/temperature';
import {
  Camera,
  Search,
  Plus,
  X,
  Eye,
  Pencil,
  Trash2,
  Circle,
  CheckCircle2,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import type { Camera as CameraType, CameraStatus, ThermalPalette } from '@/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<CameraStatus, { label: string; color: string; icon: React.ReactNode }> = {
  online: {
    label: 'Online',
    color: 'text-status-healthy',
    icon: <CheckCircle2 className="w-4 h-4 text-status-healthy" />,
  },
  recording: {
    label: 'Recording',
    color: 'text-status-critical',
    icon: <Circle className="w-4 h-4 text-status-critical fill-status-critical animate-pulse" />,
  },
  offline: {
    label: 'Offline',
    color: 'text-status-offline',
    icon: <WifiOff className="w-4 h-4 text-status-offline" />,
  },
  error: {
    label: 'Error',
    color: 'text-status-critical',
    icon: <AlertCircle className="w-4 h-4 text-status-critical" />,
  },
};

const PALETTE_OPTIONS: ThermalPalette[] = ['iron', 'rainbow', 'grayscale', 'white-hot', 'black-hot'];

// ---------------------------------------------------------------------------
// AddCameraModal
// ---------------------------------------------------------------------------
function AddCameraModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (camera: CameraType) => void;
}) {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [emissivity, setEmissivity] = useState('0.95');
  const [frameRate, setFrameRate] = useState('25');
  const [palette, setPalette] = useState<ThermalPalette>('iron');
  const [ipError, setIpError] = useState('');

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

  const validateIp = (value: string) => {
    if (!value) {
      setIpError('');
      return;
    }
    if (!ipPattern.test(value)) {
      setIpError('Invalid IP format (e.g. 192.168.1.100)');
    } else {
      const parts = value.split('.').map(Number);
      if (parts.some((p) => p > 255)) {
        setIpError('Each octet must be 0-255');
      } else {
        setIpError('');
      }
    }
  };

  const isValid = name.trim() && ip.trim() && !ipError && ipPattern.test(ip);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = () => {
    if (!isValid) return;
    const newCamera: CameraType = {
      id: `cam-${Date.now()}`,
      name: name.trim(),
      ipAddress: ip.trim(),
      serialNumber: `TIM8-${String(Date.now()).slice(-3)}`,
      status: 'offline',
      bodyTemperature: 0,
      resolution: { width: 764, height: 480 },
      frameRate: Number(frameRate),
      emissivity: Number(emissivity),
      palette,
      groupId: null,
      isRecording: false,
      uptime: 0,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      colorLabel: '#3b82f6',
    };
    onSave(newCamera);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">Add Camera</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Camera Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LHF-3 North"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* IP */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">IP Address</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => {
                setIp(e.target.value);
                validateIp(e.target.value);
              }}
              placeholder="192.168.1.100"
              className={cn(
                'w-full px-3 py-2.5 bg-bg-input border rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none',
                ipError ? 'border-status-critical focus:border-status-critical' : 'border-border-default focus:border-border-focus',
              )}
            />
            {ipError && <p className="text-xs text-status-critical mt-1">{ipError}</p>}
          </div>

          {/* Emissivity & Frame Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Emissivity</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="1.0"
                value={emissivity}
                onChange={(e) => setEmissivity(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Frame Rate (fps)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={frameRate}
                onChange={(e) => setFrameRate(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
              />
            </div>
          </div>

          {/* Palette */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Thermal Palette</label>
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value as ThermalPalette)}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus capitalize"
            >
              {PALETTE_OPTIONS.map((p) => (
                <option key={p} value={p} className="capitalize">{p.replace('-', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Camera
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmModal
// ---------------------------------------------------------------------------
function DeleteConfirmModal({
  camera,
  onClose,
  onConfirm,
}: {
  camera: CameraType;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4 p-6 text-center">
        <div className="w-12 h-12 bg-status-critical-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-status-critical" />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Remove Camera?</h3>
        <p className="text-sm text-text-secondary mb-6">
          Are you sure you want to remove <span className="font-semibold text-text-primary">{camera.name}</span> ({camera.ipAddress})? This action cannot be undone.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-card border border-border-default rounded-[var(--radius-md)] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-status-critical hover:bg-status-critical/80 rounded-[var(--radius-md)] transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CamerasPage(): React.JSX.Element {
  const { cameras, addCamera, removeCamera } = useCameraStore();
  const groups = useGroupStore((s) => s.groups);
  const isAdmin = useAuthStore((s) => s.hasMinRole('admin'));

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CameraType | null>(null);

  const onlineCount = cameras.filter((c) => c.status !== 'offline').length;

  const filtered = useMemo(() => {
    if (!search) return cameras;
    const q = search.toLowerCase();
    return cameras.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ipAddress.includes(q) ||
        c.serialNumber.toLowerCase().includes(q),
    );
  }, [cameras, search]);

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return '—';
    return groups.find((g) => g.id === groupId)?.name ?? '—';
  };

  const handleDelete = () => {
    if (deleteTarget) {
      removeCamera(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Camera className="w-7 h-7 text-brand-primary" />
            Camera Management
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {cameras.length} total cameras | {onlineCount} online
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Camera
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-bg-card rounded-[var(--radius-lg)] border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{cameras.length}</p>
        </div>
        <div className="p-4 bg-bg-card rounded-[var(--radius-lg)] border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wider">Online</p>
          <p className="text-2xl font-bold text-status-healthy mt-1">{onlineCount}</p>
        </div>
        <div className="p-4 bg-bg-card rounded-[var(--radius-lg)] border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wider">Recording</p>
          <p className="text-2xl font-bold text-status-critical mt-1">
            {cameras.filter((c) => c.status === 'recording').length}
          </p>
        </div>
        <div className="p-4 bg-bg-card rounded-[var(--radius-lg)] border border-border-default">
          <p className="text-xs text-text-muted uppercase tracking-wider">Offline</p>
          <p className="text-2xl font-bold text-status-offline mt-1">
            {cameras.filter((c) => c.status === 'offline').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, IP, or serial number..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
        />
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                {['Status', 'Name', 'IP Address', 'Serial', 'Group', 'Body Temp', 'Uptime', 'Last Seen', 'Actions'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filtered.map((cam) => {
                const statusCfg = STATUS_CONFIG[cam.status];
                return (
                  <tr key={cam.id} className="hover:bg-bg-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {statusCfg.icon}
                        <span className={cn('text-xs font-semibold', statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cam.colorLabel }}
                        />
                        <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                          {cam.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary font-mono">{cam.ipAddress}</td>
                    <td className="px-4 py-3 text-sm text-text-muted font-mono">{cam.serialNumber}</td>
                    <td className="px-4 py-3">
                      {cam.groupId ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium text-brand-primary bg-brand-primary/10 rounded-[var(--radius-sm)]">
                          {getGroupName(cam.groupId)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Ungrouped</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cam.status !== 'offline' ? (
                        <span className={cn('text-sm font-bold', getTempStatusClass(cam.bodyTemperature, 60))}>
                          {formatTemp(cam.bodyTemperature)}
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-bg-input rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              cam.uptime >= 99 ? 'bg-status-healthy' : cam.uptime >= 95 ? 'bg-status-warning' : 'bg-status-critical',
                            )}
                            style={{ width: `${cam.uptime}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary font-semibold">
                          {cam.uptime.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatRelative(cam.lastSeen)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 text-text-muted hover:text-brand-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
                          title="View feed"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-text-muted hover:text-brand-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(cam)}
                            className="p-1.5 text-text-muted hover:text-status-critical rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <Camera className="w-10 h-10 mb-2" />
            <p className="text-sm">No cameras match your search</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCameraModal onClose={() => setShowAddModal(false)} onSave={addCamera} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          camera={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
