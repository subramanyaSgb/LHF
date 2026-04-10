import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useLayoutStore } from '@/stores/layoutStore';
import type { LayoutMode } from '@/types';
import {
  LayoutGrid,
  Maximize,
  Grid3X3,
  Save,
  FolderOpen,
  Trash2,
} from 'lucide-react';

const LAYOUT_MODES: { value: LayoutMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'auto', label: 'Auto', icon: Maximize },
  { value: 'grid', label: 'Grid', icon: Grid3X3 },
  { value: 'custom', label: 'Custom', icon: LayoutGrid },
];

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];

interface LayoutControlsProps {
  className?: string;
}

export default function LayoutControls({ className }: LayoutControlsProps) {
  const currentMode = useLayoutStore((s) => s.currentMode);
  const gridCols = useLayoutStore((s) => s.gridCols);
  const gridRows = useLayoutStore((s) => s.gridRows);
  const presets = useLayoutStore((s) => s.presets);
  const setLayoutMode = useLayoutStore((s) => s.setLayoutMode);
  const setGrid = useLayoutStore((s) => s.setGrid);
  const savePreset = useLayoutStore((s) => s.savePreset);
  const loadPreset = useLayoutStore((s) => s.loadPreset);
  const deletePreset = useLayoutStore((s) => s.deletePreset);

  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    const name = presetName.trim() || `Preset ${presets.length + 1}`;
    savePreset(name);
    setPresetName('');
    setShowPresets(false);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default',
        className,
      )}
    >
      {/* ---- Mode toggle ---- */}
      <div className="flex items-center gap-1 bg-bg-card rounded-[var(--radius-md)] p-0.5">
        {LAYOUT_MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setLayoutMode(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer',
              currentMode === value
                ? 'bg-brand-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ---- Grid column selector (grid mode only) ---- */}
      {currentMode === 'grid' && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Cols
          </span>
          <select
            value={gridCols}
            onChange={(e) => setGrid(Number(e.target.value), gridRows)}
            className={cn(
              'rounded-[var(--radius-sm)] bg-bg-card border border-border-default',
              'text-sm font-bold text-text-primary px-2 py-1',
              'focus:outline-none focus:border-border-focus cursor-pointer',
            )}
          >
            {COLUMN_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ---- Spacer ---- */}
      <div className="flex-1" />

      {/* ---- Preset controls ---- */}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)]',
            'text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer',
          )}
          title="Save current layout"
        >
          <Save size={14} />
          Save
        </button>

        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-sm)]',
            'text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer',
          )}
          title="Load preset"
        >
          <FolderOpen size={14} />
          Load
        </button>

        {/* Preset dropdown */}
        {showPresets && (
          <div className="absolute right-0 top-full mt-1 z-30 w-56 rounded-[var(--radius-md)] bg-bg-card border border-border-default shadow-[var(--shadow-elevated)] overflow-hidden">
            {presets.length === 0 ? (
              <p className="px-3 py-4 text-xs text-text-muted text-center">
                No saved presets
              </p>
            ) : (
              <ul>
                {presets.map((preset) => (
                  <li
                    key={preset.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-bg-card-hover transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadPreset(preset.id);
                        setShowPresets(false);
                      }}
                      className="text-sm font-semibold text-text-primary truncate flex-1 text-left cursor-pointer"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePreset(preset.id)}
                      className="p-1 text-text-muted hover:text-status-critical transition-colors cursor-pointer"
                      aria-label={`Delete preset ${preset.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Inline save with name */}
            <div className="flex items-center gap-1 border-t border-border-default px-2 py-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 bg-bg-input text-sm text-text-primary rounded-[var(--radius-sm)] px-2 py-1 border border-border-default focus:outline-none focus:border-border-focus"
              />
              <button
                type="button"
                onClick={handleSave}
                className="px-2 py-1 rounded-[var(--radius-sm)] bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
