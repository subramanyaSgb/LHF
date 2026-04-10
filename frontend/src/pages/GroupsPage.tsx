import { useState, useMemo } from 'react';
import { useGroupStore } from '@/stores/groupStore';
import { useCameraStore } from '@/stores/cameraStore';
import {
  Layers,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Camera,
  Grid3X3,
  ToggleLeft,
  ToggleRight,
  Minus,
} from 'lucide-react';
import type { CameraGroup, StitchMapping, StitchPosition } from '@/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ALL_POSITIONS: StitchPosition[] = [
  'top-left', 'top', 'top-right',
  'left', 'center', 'right',
  'bottom-left', 'bottom', 'bottom-right',
];

// ---------------------------------------------------------------------------
// CreateGroupModal
// ---------------------------------------------------------------------------
function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const addGroup = useGroupStore((s) => s.addGroup);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const newGroup: CameraGroup = {
      id: `grp-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      cameraIds: [],
      stitchEnabled: false,
      stitchLayout: { rows: 1, cols: 1 },
      stitchMappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGroup(newGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay">
      <div className="w-full max-w-md bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">Create Group</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LHF-3"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StitchConfigurator
// ---------------------------------------------------------------------------
function StitchConfigurator({ group }: { group: CameraGroup }) {
  const { toggleStitch, updateGroup, updateStitchMappings } = useGroupStore();
  const cameras = useCameraStore((s) => s.cameras);
  const groupCameras = cameras.filter((c) => group.cameraIds.includes(c.id));

  const handleToggle = () => {
    toggleStitch(group.id, !group.stitchEnabled);
  };

  const handleLayoutChange = (field: 'rows' | 'cols', value: number) => {
    updateGroup(group.id, {
      stitchLayout: {
        ...group.stitchLayout,
        [field]: Math.max(1, Math.min(4, value)),
      },
    });
  };

  const handlePositionChange = (cameraId: string, position: StitchPosition) => {
    const existingMappings = group.stitchMappings.filter((m) => m.cameraId !== cameraId);
    const newMappings: StitchMapping[] = [...existingMappings, { cameraId, position }];
    updateStitchMappings(group.id, newMappings);
  };

  const getCurrentPosition = (cameraId: string): StitchPosition | '' => {
    return group.stitchMappings.find((m) => m.cameraId === cameraId)?.position ?? '';
  };

  return (
    <div className="mt-4 p-4 bg-bg-secondary rounded-[var(--radius-md)] border border-border-default">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Stitch Configuration</span>
        </div>
        <button onClick={handleToggle} className="flex items-center gap-1.5 text-sm">
          {group.stitchEnabled ? (
            <>
              <ToggleRight className="w-6 h-6 text-status-healthy" />
              <span className="text-status-healthy font-semibold">Enabled</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-6 h-6 text-text-muted" />
              <span className="text-text-muted font-semibold">Disabled</span>
            </>
          )}
        </button>
      </div>

      {group.stitchEnabled && (
        <div className="space-y-4">
          {/* Layout grid dimensions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Rows:</span>
              <div className="flex items-center border border-border-default rounded-[var(--radius-sm)] overflow-hidden">
                <button
                  onClick={() => handleLayoutChange('rows', group.stitchLayout.rows - 1)}
                  className="px-2 py-1 text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-3 py-1 text-sm font-bold text-text-primary bg-bg-input border-x border-border-default">
                  {group.stitchLayout.rows}
                </span>
                <button
                  onClick={() => handleLayoutChange('rows', group.stitchLayout.rows + 1)}
                  className="px-2 py-1 text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Cols:</span>
              <div className="flex items-center border border-border-default rounded-[var(--radius-sm)] overflow-hidden">
                <button
                  onClick={() => handleLayoutChange('cols', group.stitchLayout.cols - 1)}
                  className="px-2 py-1 text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-3 py-1 text-sm font-bold text-text-primary bg-bg-input border-x border-border-default">
                  {group.stitchLayout.cols}
                </span>
                <button
                  onClick={() => handleLayoutChange('cols', group.stitchLayout.cols + 1)}
                  className="px-2 py-1 text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Position assignments */}
          <div className="space-y-2">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Position Grid</span>
            {groupCameras.map((cam) => (
              <div key={cam.id} className="flex items-center gap-3 py-1">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cam.colorLabel }} />
                  <span className="text-sm text-text-primary font-medium truncate">{cam.name}</span>
                </div>
                <select
                  value={getCurrentPosition(cam.id)}
                  onChange={(e) => handlePositionChange(cam.id, e.target.value as StitchPosition)}
                  className="px-2 py-1.5 bg-bg-input border border-border-default rounded-[var(--radius-sm)] text-xs text-text-primary focus:outline-none focus:border-border-focus capitalize"
                >
                  <option value="">Unassigned</option>
                  {ALL_POSITIONS.map((pos) => (
                    <option key={pos} value={pos} className="capitalize">{pos.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GroupCard
// ---------------------------------------------------------------------------
function GroupCard({ group }: { group: CameraGroup }) {
  const { removeGroup, addCameraToGroup, removeCameraFromGroup } = useGroupStore();
  const cameras = useCameraStore((s) => s.cameras);
  const ungrouped = useMemo(() => cameras.filter((c) => c.groupId === null), [cameras]);

  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const groupCameras = cameras.filter((c) => group.cameraIds.includes(c.id));

  const handleAddCamera = (cameraId: string) => {
    addCameraToGroup(group.id, cameraId);
    // Also update the camera's groupId in the camera store
    useCameraStore.getState().updateCamera(cameraId, { groupId: group.id });
  };

  const handleRemoveCamera = (cameraId: string) => {
    removeCameraFromGroup(group.id, cameraId);
    useCameraStore.getState().updateCamera(cameraId, { groupId: null });
  };

  const handleDelete = () => {
    // Ungroup all cameras first
    group.cameraIds.forEach((camId) => {
      useCameraStore.getState().updateCamera(camId, { groupId: null });
    });
    removeGroup(group.id);
  };

  return (
    <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header (clickable) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg-card-hover transition-colors"
      >
        <div className="flex items-center justify-center w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-[var(--radius-md)]">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text-primary">{group.name}</h3>
            <span className="px-2 py-0.5 text-xs font-medium text-text-secondary bg-bg-secondary rounded-full">
              {group.cameraIds.length} camera{group.cameraIds.length !== 1 ? 's' : ''}
            </span>
            {group.stitchEnabled && (
              <span className="px-2 py-0.5 text-xs font-semibold text-status-healthy bg-status-healthy-bg rounded-full">
                Stitch ON
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-sm text-text-muted mt-0.5 truncate">{group.description}</p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-muted shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border-default pt-4 space-y-4">
          {/* Assigned cameras */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Assigned Cameras</h4>
            {groupCameras.length === 0 ? (
              <p className="text-sm text-text-muted italic py-2">No cameras assigned</p>
            ) : (
              <div className="space-y-1.5">
                {groupCameras.map((cam) => (
                  <div key={cam.id} className="flex items-center justify-between py-2 px-3 bg-bg-secondary rounded-[var(--radius-md)] border border-border-default">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cam.colorLabel }} />
                      <Camera className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-sm font-medium text-text-primary">{cam.name}</span>
                      <span className="text-xs text-text-muted font-mono">{cam.ipAddress}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCamera(cam.id)}
                      className="p-1 text-text-muted hover:text-status-critical rounded transition-colors"
                      title="Remove from group"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add camera from ungrouped */}
          {ungrouped.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Add Camera</h4>
              <div className="flex flex-wrap gap-2">
                {ungrouped.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => handleAddCamera(cam.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-secondary hover:bg-bg-card-hover border border-border-default hover:border-brand-primary rounded-full transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {cam.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stitch configurator */}
          {groupCameras.length > 0 && <StitchConfigurator group={group} />}

          {/* Delete group */}
          <div className="pt-2 border-t border-border-default">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-status-critical">Delete this group?</span>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-semibold bg-status-critical text-white rounded-[var(--radius-sm)] transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-status-critical transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Group
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function GroupsPage(): React.JSX.Element {
  const groups = useGroupStore((s) => s.groups);
  const cameras = useCameraStore((s) => s.cameras);
  const ungrouped = useMemo(() => cameras.filter((c) => c.groupId === null), [cameras]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-primary" />
            Camera Groups
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {groups.length} group{groups.length !== 1 ? 's' : ''} | {ungrouped.length} ungrouped camera{ungrouped.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Ungrouped cameras */}
      {ungrouped.length > 0 && (
        <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-text-muted" />
            Ungrouped Cameras
          </h3>
          <div className="flex flex-wrap gap-2">
            {ungrouped.map((cam) => (
              <span
                key={cam.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary bg-bg-secondary rounded-full border border-border-default"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cam.colorLabel }} />
                {cam.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Group cards */}
      <div className="space-y-3">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Layers className="w-10 h-10 mb-2" />
          <p className="text-sm">No groups configured</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-3 text-sm font-medium text-brand-primary hover:underline"
          >
            Create your first group
          </button>
        </div>
      )}

      {/* Modal */}
      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
