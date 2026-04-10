import { useState, useCallback } from 'react';
import {
  Grid3x3,
  LayoutGrid,
  Columns3,
  Wand2,
  Save,
  Trash2,
  FolderOpen,
  Camera,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCameraStore } from '@/stores/cameraStore';
import { formatDateTime } from '@/utils/format';
import type { LayoutMode } from '@/types';

// ---------------------------------------------------------------------------
//  Layout mode options
// ---------------------------------------------------------------------------

interface ModeOption {
  mode: LayoutMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const modeOptions: ModeOption[] = [
  {
    mode: 'auto',
    label: 'Auto',
    description: 'Automatically arrange cameras based on count',
    icon: <Wand2 className="w-6 h-6" />,
  },
  {
    mode: 'grid',
    label: 'Grid',
    description: 'Fixed rows and columns grid layout',
    icon: <Grid3x3 className="w-6 h-6" />,
  },
  {
    mode: 'custom',
    label: 'Custom',
    description: 'Drag-and-drop free-form placement',
    icon: <Columns3 className="w-6 h-6" />,
  },
];

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

export default function LayoutPage(): React.JSX.Element {
  const {
    currentMode,
    gridCols,
    gridRows,
    presets,
    activePresetId,
    setLayoutMode,
    setGrid,
    savePreset,
    loadPreset,
    deletePreset,
  } = useLayoutStore();

  const { cameras } = useCameraStore();

  const [presetName, setPresetName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Handle preset save
  const handleSavePreset = useCallback(() => {
    if (presetName.trim()) {
      savePreset(presetName.trim());
      setPresetName('');
    }
  }, [presetName, savePreset]);

  // Handle preset delete
  const handleDeletePreset = useCallback(
    (id: string) => {
      deletePreset(id);
      setDeleteConfirmId(null);
    },
    [deletePreset],
  );

  // Grid cell count for preview
  const totalCells = gridCols * gridRows;

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutGrid className="w-7 h-7 text-brand-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Layout Configuration</h1>
      </div>

      {/* Layout Mode Selector */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-5 h-5 text-brand-primary" />
            <span>Layout Mode</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modeOptions.map((opt) => {
            const isActive = currentMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setLayoutMode(opt.mode)}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)] border-2 transition-all duration-200 cursor-pointer',
                  'hover:bg-bg-card-hover',
                  isActive
                    ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'border-border-default bg-bg-card',
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-[var(--radius-md)]',
                    isActive ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-tertiary text-text-muted',
                  )}
                >
                  {opt.icon}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      'text-lg font-bold',
                      isActive ? 'text-brand-primary' : 'text-text-primary',
                    )}
                  >
                    {opt.label}
                  </div>
                  <div className="text-sm text-text-muted mt-1">{opt.description}</div>
                </div>
                {isActive && (
                  <Badge variant="info" size="sm">
                    Active
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Grid Configuration (only shown in grid mode) */}
      {currentMode === 'grid' && (
        <Card
          variant="bordered"
          header={
            <div className="flex items-center gap-3">
              <Grid3x3 className="w-5 h-5 text-brand-primary" />
              <span>Grid Configuration</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Columns */}
              <div>
                <label className="text-base font-medium text-text-primary mb-3 block">
                  Columns: <span className="text-brand-primary font-bold">{gridCols}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGrid(n, gridRows)}
                      className={cn(
                        'w-12 h-12 rounded-[var(--radius-md)] border-2 text-lg font-bold transition-all duration-150 cursor-pointer',
                        n === gridCols
                          ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                          : 'border-border-default bg-bg-card text-text-muted hover:border-text-muted hover:text-text-primary',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div>
                <label className="text-base font-medium text-text-primary mb-3 block">
                  Rows: <span className="text-brand-primary font-bold">{gridRows}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGrid(gridCols, n)}
                      className={cn(
                        'w-12 h-12 rounded-[var(--radius-md)] border-2 text-lg font-bold transition-all duration-150 cursor-pointer',
                        n === gridRows
                          ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                          : 'border-border-default bg-bg-card text-text-muted hover:border-text-muted hover:text-text-primary',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-md)] bg-bg-tertiary border border-border-default">
                <span className="text-sm text-text-muted">
                  Grid: {gridCols} x {gridRows} = {totalCells} cells
                  {cameras.length > totalCells && (
                    <span className="text-status-warning ml-2">
                      ({cameras.length - totalCells} camera{cameras.length - totalCells !== 1 ? 's' : ''} won't fit)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="text-base font-medium text-text-primary mb-3 block">
                Preview
              </label>
              <div
                className="grid gap-2 p-4 rounded-[var(--radius-lg)] bg-bg-primary border border-border-default"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: totalCells }).map((_, i) => {
                  const cam = cameras[i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 p-3 rounded-[var(--radius-md)] border border-dashed min-h-[80px] transition-colors duration-150',
                        cam
                          ? 'border-brand-primary/40 bg-brand-primary/5'
                          : 'border-border-default bg-bg-secondary/50',
                      )}
                    >
                      {cam ? (
                        <>
                          <Camera className="w-5 h-5 text-brand-primary" />
                          <span className="text-xs font-medium text-text-primary text-center leading-tight">
                            {cam.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-text-muted" />
                          <span className="text-xs text-text-muted">Empty</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Custom mode hint */}
      {currentMode === 'custom' && (
        <Card variant="bordered">
          <div className="flex flex-col items-center py-8 text-center">
            <Columns3 className="w-12 h-12 text-text-muted mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Custom Layout Mode</h3>
            <p className="text-text-muted max-w-md">
              In custom mode, you can drag and resize camera panels freely on the dashboard.
              Go to the Live View to start arranging cameras.
            </p>
          </div>
        </Card>
      )}

      {/* Auto mode hint */}
      {currentMode === 'auto' && (
        <Card variant="bordered">
          <div className="flex flex-col items-center py-8 text-center">
            <Wand2 className="w-12 h-12 text-text-muted mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">Automatic Layout</h3>
            <p className="text-text-muted max-w-md">
              The dashboard will automatically determine the best grid arrangement based on
              the number of active cameras. Currently {cameras.filter((c) => c.status !== 'offline').length} camera{cameras.filter((c) => c.status !== 'offline').length !== 1 ? 's' : ''} online.
            </p>
          </div>
        </Card>
      )}

      {/* Preset Management */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-brand-primary" />
            <span>Layout Presets</span>
          </div>
        }
      >
        {/* Save new preset */}
        <div className="flex items-end gap-3 mb-6">
          <Input
            label="Save Current Layout as Preset"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g. Shift A Layout"
            fullWidth
          />
          <Button
            variant="primary"
            iconLeft={<Save className="w-4 h-4" />}
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="shrink-0 mb-0.5"
          >
            Save
          </Button>
        </div>

        {/* Saved presets list */}
        {presets.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted">No saved presets yet. Save your current layout above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-[var(--radius-md)] border transition-colors duration-150',
                  preset.id === activePresetId
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border-default bg-bg-secondary hover:bg-bg-card-hover',
                )}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid
                    className={cn(
                      'w-5 h-5',
                      preset.id === activePresetId ? 'text-brand-primary' : 'text-text-muted',
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{preset.name}</span>
                      {preset.id === activePresetId && (
                        <Badge variant="info" size="sm">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">
                      {preset.mode} mode
                      {preset.gridCols && preset.gridRows
                        ? ` / ${preset.gridCols}x${preset.gridRows} grid`
                        : ''}
                      {' / '}
                      Created {formatDateTime(preset.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<FolderOpen className="w-4 h-4" />}
                    onClick={() => loadPreset(preset.id)}
                    disabled={preset.id === activePresetId}
                  >
                    Load
                  </Button>
                  {deleteConfirmId === preset.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Trash2 className="w-4 h-4 text-status-critical" />}
                      onClick={() => setDeleteConfirmId(preset.id)}
                      aria-label={`Delete preset ${preset.name}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
