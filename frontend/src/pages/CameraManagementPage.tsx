import { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Wifi, WifiOff, Video, Eye } from 'lucide-react';
import { useCameraStore } from '@/stores/cameraStore';
import { useGroupStore } from '@/stores/groupStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { formatTemp } from '@/utils/temperature';
import { formatRelative } from '@/utils/format';
import type { Camera, ThermalPalette } from '@/types';

const paletteOptions: { value: ThermalPalette; label: string }[] = [
  { value: 'iron', label: 'Iron' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'white-hot', label: 'White Hot' },
  { value: 'black-hot', label: 'Black Hot' },
];

function AddCameraModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (camera: Camera) => void;
}) {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [emissivity, setEmissivity] = useState('0.95');
  const [frameRate, setFrameRate] = useState('25');
  const [palette, setPalette] = useState<ThermalPalette>('iron');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const camera: Camera = {
      id: `cam-${Date.now()}`,
      name,
      ipAddress: ip,
      serialNumber: `TIM8-${Date.now().toString().slice(-4)}`,
      status: 'online',
      bodyTemperature: 35,
      resolution: { width: 764, height: 480 },
      frameRate: parseInt(frameRate),
      emissivity: parseFloat(emissivity),
      palette,
      groupId: null,
      isRecording: false,
      uptime: 100,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      colorLabel: '#3b82f6',
    };
    onAdd(camera);
    setName('');
    setIp('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] w-full max-w-lg shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-2xl font-bold text-text-primary">Add Camera</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-2xl leading-none p-1"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-lg font-semibold text-text-secondary mb-2">
              Camera Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., LHF-1 North"
              required
              className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-text-secondary mb-2">
              IP Address
            </label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g., 192.168.1.101"
              required
              pattern="^(\d{1,3}\.){3}\d{1,3}$"
              className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-semibold text-text-secondary mb-2">
                Emissivity
              </label>
              <input
                type="number"
                value={emissivity}
                onChange={(e) => setEmissivity(e.target.value)}
                min="0.1"
                max="1.0"
                step="0.01"
                className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:border-border-focus"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-text-secondary mb-2">
                Frame Rate
              </label>
              <input
                type="number"
                value={frameRate}
                onChange={(e) => setFrameRate(e.target.value)}
                min="1"
                max="60"
                className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:border-border-focus"
              />
            </div>
          </div>
          <div>
            <label className="block text-lg font-semibold text-text-secondary mb-2">
              Color Palette
            </label>
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value as ThermalPalette)}
              className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:border-border-focus"
            >
              {paletteOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-lg font-semibold bg-bg-tertiary text-text-secondary border border-border-default rounded-[var(--radius-md)] hover:bg-bg-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-lg font-bold bg-brand-primary text-white rounded-[var(--radius-md)] hover:bg-brand-primary-hover transition-colors"
            >
              Add Camera
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  isOpen,
  cameraName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  cameraName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-elevated)] p-6">
        <h2 className="text-2xl font-bold text-status-critical mb-4">Remove Camera</h2>
        <p className="text-lg text-text-secondary mb-6">
          Are you sure you want to remove <strong className="text-text-primary">{cameraName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-lg font-semibold bg-bg-tertiary text-text-secondary border border-border-default rounded-[var(--radius-md)] hover:bg-bg-card-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-lg font-bold bg-status-critical text-white rounded-[var(--radius-md)] hover:bg-thermal-extreme transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CameraManagementPage() {
  const { cameras, addCamera, removeCamera } = useCameraStore();
  const { groups } = useGroupStore();
  const { hasMinRole } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null);

  const isAdmin = hasMinRole('admin');

  const filteredCameras = cameras.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ipAddress.includes(searchQuery) ||
      c.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupName = (groupId: string | null): string => {
    if (!groupId) return 'Ungrouped';
    return groups.find((g) => g.id === groupId)?.name || 'Unknown';
  };

  const getStatusIcon = (status: Camera['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-5 h-5 text-status-healthy" />;
      case 'recording':
        return <Video className="w-5 h-5 text-status-critical animate-pulse-alert" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-status-offline" />;
      case 'error':
        return <WifiOff className="w-5 h-5 text-status-critical" />;
    }
  };

  const getStatusLabel = (status: Camera['status']): string => {
    switch (status) {
      case 'online': return 'Online';
      case 'recording': return 'Recording';
      case 'offline': return 'Offline';
      case 'error': return 'Error';
    }
  };

  const getBodyTempClass = (temp: number): string => {
    if (temp === 0) return 'text-status-offline';
    if (temp < 50) return 'text-status-healthy';
    if (temp < 60) return 'text-status-warning';
    return 'text-status-critical';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Camera Management</h1>
          <p className="text-lg text-text-secondary mt-1">
            {cameras.length} camera{cameras.length !== 1 ? 's' : ''} configured &middot;{' '}
            {cameras.filter((c) => c.status !== 'offline').length} online
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 text-lg font-bold bg-brand-primary text-white rounded-[var(--radius-md)] hover:bg-brand-primary-hover transition-colors"
          >
            <Plus className="w-6 h-6" />
            Add Camera
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, IP, or serial number..."
          className="w-full pl-12 pr-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
        />
      </div>

      {/* Camera Table */}
      <div className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left px-6 py-4 text-lg font-semibold text-text-secondary">Status</th>
                <th className="text-left px-6 py-4 text-lg font-semibold text-text-secondary">Name</th>
                <th className="text-left px-6 py-4 text-lg font-semibold text-text-secondary">IP Address</th>
                <th className="text-left px-6 py-4 text-lg font-semibold text-text-secondary">Serial</th>
                <th className="text-left px-6 py-4 text-lg font-semibold text-text-secondary">Group</th>
                <th className="text-right px-6 py-4 text-lg font-semibold text-text-secondary">Body Temp</th>
                <th className="text-right px-6 py-4 text-lg font-semibold text-text-secondary">Uptime</th>
                <th className="text-left px-6 py-4 text-lg font-semibold text-text-secondary">Last Seen</th>
                {isAdmin && (
                  <th className="text-center px-6 py-4 text-lg font-semibold text-text-secondary">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredCameras.map((camera, idx) => (
                <tr
                  key={camera.id}
                  className={cn(
                    'border-b border-border-light hover:bg-bg-card-hover transition-colors',
                    idx % 2 === 0 && 'bg-bg-tertiary/30'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(camera.status)}
                      <span
                        className={cn(
                          'text-base font-semibold',
                          camera.status === 'online' && 'text-status-healthy',
                          camera.status === 'recording' && 'text-status-critical',
                          camera.status === 'offline' && 'text-status-offline',
                          camera.status === 'error' && 'text-status-critical'
                        )}
                      >
                        {getStatusLabel(camera.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: camera.colorLabel }}
                      />
                      <span className="text-lg font-bold text-text-primary">{camera.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary font-mono">
                    {camera.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary font-mono">
                    {camera.serialNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-3 py-1 text-base rounded-full font-semibold',
                        camera.groupId
                          ? 'bg-brand-primary/20 text-brand-primary'
                          : 'bg-bg-tertiary text-text-muted'
                      )}
                    >
                      {getGroupName(camera.groupId)}
                    </span>
                  </td>
                  <td className={cn('px-6 py-4 text-right text-lg font-bold', getBodyTempClass(camera.bodyTemperature))}>
                    {camera.status !== 'offline' ? formatTemp(camera.bodyTemperature) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-base text-text-secondary">
                    {camera.uptime.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary">
                    {formatRelative(camera.lastSeen)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-[var(--radius-sm)] transition-colors"
                          title="View feed"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 text-text-muted hover:text-status-warning hover:bg-status-warning-bg rounded-[var(--radius-sm)] transition-colors"
                          title="Edit camera"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(camera)}
                          className="p-2 text-text-muted hover:text-status-critical hover:bg-status-critical-bg rounded-[var(--radius-sm)] transition-colors"
                          title="Remove camera"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredCameras.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-12 text-center text-xl text-text-muted">
                    {searchQuery ? 'No cameras match your search.' : 'No cameras configured yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddCameraModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCamera}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        cameraName={deleteTarget?.name || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            removeCamera(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
