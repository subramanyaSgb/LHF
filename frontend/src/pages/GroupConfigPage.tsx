import { useState } from 'react';
import { Plus, Layers, Trash2, Edit2, Link, Unlink, Grid3x3 } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useCameraStore } from '@/stores/cameraStore';
import { cn } from '@/utils/cn';
import type { CameraGroup, StitchMapping, StitchPosition } from '@/types';

const positionLabels: Record<StitchPosition, string> = {
  'top-left': 'Top Left',
  'top-right': 'Top Right',
  'bottom-left': 'Bottom Left',
  'bottom-right': 'Bottom Right',
  'left': 'Left',
  'right': 'Right',
  'top': 'Top',
  'bottom': 'Bottom',
  'center': 'Center',
};

function CreateGroupModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: CameraGroup) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const group: CameraGroup = {
      id: `grp-${Date.now()}`,
      name,
      description,
      cameraIds: [],
      stitchEnabled: false,
      stitchLayout: { rows: 1, cols: 1 },
      stitchMappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onCreate(group);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] w-full max-w-lg shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-2xl font-bold text-text-primary">Create Group</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl p-1">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-lg font-semibold text-text-secondary mb-2">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., LHF-1"
              required
              className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-text-secondary mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Ladle Heating Furnace 1 — Full coverage"
              rows={3}
              className="w-full px-4 py-3 text-lg bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus resize-none"
            />
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
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StitchConfigurator({
  group,
  cameras,
}: {
  group: CameraGroup;
  cameras: { id: string; name: string }[];
}) {
  const { updateStitchMappings, toggleStitch, updateGroup } = useGroupStore();
  const [rows, setRows] = useState(group.stitchLayout.rows);
  const [cols, setCols] = useState(group.stitchLayout.cols);

  const positions: StitchPosition[][] = [
    ['top-left', 'top-right'],
    ['bottom-left', 'bottom-right'],
  ];

  const handlePositionChange = (position: StitchPosition, cameraId: string) => {
    const existing = group.stitchMappings.filter((m) => m.position !== position);
    const newMappings: StitchMapping[] = cameraId
      ? [...existing, { cameraId, position }]
      : existing;
    updateStitchMappings(group.id, newMappings);
  };

  const getCameraAtPosition = (position: StitchPosition): string => {
    return group.stitchMappings.find((m) => m.position === position)?.cameraId || '';
  };

  return (
    <div className="bg-bg-tertiary border border-border-default rounded-[var(--radius-md)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-brand-primary" />
          Stitch Configuration
        </h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-base text-text-secondary">Enable Stitching</span>
          <button
            onClick={() => toggleStitch(group.id, !group.stitchEnabled)}
            className={cn(
              'relative w-14 h-7 rounded-full transition-colors',
              group.stitchEnabled ? 'bg-brand-primary' : 'bg-border-default'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform',
                group.stitchEnabled ? 'translate-x-7' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>
      </div>

      {group.stitchEnabled && (
        <>
          <div className="flex gap-4">
            <div>
              <label className="block text-base text-text-secondary mb-1">Rows</label>
              <select
                value={rows}
                onChange={(e) => {
                  const r = parseInt(e.target.value);
                  setRows(r);
                  updateGroup(group.id, { stitchLayout: { rows: r, cols } });
                }}
                className="px-3 py-2 bg-bg-input border border-border-default rounded-[var(--radius-sm)] text-text-primary"
              >
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base text-text-secondary mb-1">Columns</label>
              <select
                value={cols}
                onChange={(e) => {
                  const c = parseInt(e.target.value);
                  setCols(c);
                  updateGroup(group.id, { stitchLayout: { rows, cols: c } });
                }}
                className="px-3 py-2 bg-bg-input border border-border-default rounded-[var(--radius-sm)] text-text-primary"
              >
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="grid gap-3 max-w-md"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
          >
            {positions.slice(0, rows).flatMap((row) =>
              row.slice(0, cols).map((position) => (
                <div
                  key={position}
                  className="bg-bg-card border-2 border-dashed border-border-default rounded-[var(--radius-md)] p-4 min-h-[100px] flex flex-col items-center justify-center"
                >
                  <span className="text-xs text-text-muted mb-2 uppercase tracking-wider">
                    {positionLabels[position]}
                  </span>
                  <select
                    value={getCameraAtPosition(position)}
                    onChange={(e) => handlePositionChange(position, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-bg-input border border-border-default rounded text-text-primary"
                  >
                    <option value="">— Select Camera —</option>
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function GroupConfigPage() {
  const { groups, addGroup, removeGroup, addCameraToGroup, removeCameraFromGroup } = useGroupStore();
  const { cameras, updateCamera } = useCameraStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const ungroupedCameras = cameras.filter((c) => c.groupId === null);

  const handleAssignCamera = (groupId: string, cameraId: string) => {
    addCameraToGroup(groupId, cameraId);
    updateCamera(cameraId, { groupId });
  };

  const handleUnassignCamera = (groupId: string, cameraId: string) => {
    removeCameraFromGroup(groupId, cameraId);
    updateCamera(cameraId, { groupId: null });
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      group.cameraIds.forEach((camId) => {
        updateCamera(camId, { groupId: null });
      });
      removeGroup(groupId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Group Configuration</h1>
          <p className="text-lg text-text-secondary mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''} &middot;{' '}
            {ungroupedCameras.length} ungrouped camera{ungroupedCameras.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 text-lg font-bold bg-brand-primary text-white rounded-[var(--radius-md)] hover:bg-brand-primary-hover transition-colors"
        >
          <Plus className="w-6 h-6" />
          Create Group
        </button>
      </div>

      {/* Ungrouped Cameras */}
      {ungroupedCameras.length > 0 && (
        <div className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] p-5">
          <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Unlink className="w-5 h-5 text-text-muted" />
            Ungrouped Cameras
          </h3>
          <div className="flex flex-wrap gap-3">
            {ungroupedCameras.map((cam) => (
              <div
                key={cam.id}
                className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-default rounded-[var(--radius-md)]"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cam.colorLabel }} />
                <span className="text-base font-semibold text-text-primary">{cam.name}</span>
                <span className="text-sm text-text-muted">({cam.ipAddress})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group) => {
          const groupCameras = cameras.filter((c) => group.cameraIds.includes(c.id));
          const isExpanded = expandedGroupId === group.id;

          return (
            <div
              key={group.id}
              className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] overflow-hidden"
            >
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-bg-card-hover transition-colors"
                onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/20 rounded-[var(--radius-md)] flex items-center justify-center">
                    <Layers className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{group.name}</h3>
                    <p className="text-base text-text-secondary">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base text-text-secondary">
                    {group.cameraIds.length} camera{group.cameraIds.length !== 1 ? 's' : ''}
                  </span>
                  {group.stitchEnabled && (
                    <span className="px-3 py-1 text-sm font-semibold bg-brand-primary/20 text-brand-primary rounded-full">
                      Stitched
                    </span>
                  )}
                  <span className="text-text-muted text-xl">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border-default p-5 space-y-5">
                  {/* Assigned Cameras */}
                  <div>
                    <h4 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                      <Link className="w-4 h-4 text-brand-primary" />
                      Assigned Cameras
                    </h4>
                    {groupCameras.length > 0 ? (
                      <div className="space-y-2">
                        {groupCameras.map((cam) => (
                          <div
                            key={cam.id}
                            className="flex items-center justify-between px-4 py-3 bg-bg-tertiary rounded-[var(--radius-md)]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cam.colorLabel }} />
                              <span className="text-base font-semibold text-text-primary">{cam.name}</span>
                              <span className="text-sm text-text-muted font-mono">{cam.ipAddress}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignCamera(group.id, cam.id);
                              }}
                              className="px-3 py-1.5 text-sm font-semibold text-status-critical bg-status-critical-bg rounded-[var(--radius-sm)] hover:bg-status-critical/20 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-text-muted py-4 text-center bg-bg-tertiary rounded-[var(--radius-md)]">
                        No cameras assigned to this group yet.
                      </p>
                    )}
                  </div>

                  {/* Add Camera to Group */}
                  {ungroupedCameras.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-text-primary mb-3">Add Camera</h4>
                      <div className="flex flex-wrap gap-2">
                        {ungroupedCameras.map((cam) => (
                          <button
                            key={cam.id}
                            onClick={() => handleAssignCamera(group.id, cam.id)}
                            className="flex items-center gap-2 px-4 py-2 text-base bg-bg-tertiary border border-dashed border-border-default rounded-[var(--radius-md)] hover:border-brand-primary hover:bg-brand-primary/5 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-brand-primary" />
                            <span className="text-text-primary">{cam.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stitch Configuration */}
                  {groupCameras.length > 1 && (
                    <StitchConfigurator
                      group={group}
                      cameras={groupCameras.map((c) => ({ id: c.id, name: c.name }))}
                    />
                  )}

                  {/* Group Actions */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-border-default">
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-status-critical bg-status-critical-bg rounded-[var(--radius-md)] hover:bg-status-critical/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Group
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="bg-bg-card border border-border-default rounded-[var(--radius-lg)] p-12 text-center">
            <Layers className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-text-primary mb-2">No Groups Created</h3>
            <p className="text-lg text-text-secondary mb-6">
              Create groups to organize cameras by monitoring area (e.g., LHF-1, LHF-2)
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 text-lg font-bold bg-brand-primary text-white rounded-[var(--radius-md)] hover:bg-brand-primary-hover transition-colors"
            >
              Create First Group
            </button>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={addGroup}
      />
    </div>
  );
}
