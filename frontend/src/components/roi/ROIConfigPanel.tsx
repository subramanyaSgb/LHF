import { useCallback } from 'react';
import { Trash2, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatTemp } from '@/utils/temperature';
import { useROIStore } from '@/stores/roiStore';
import { useAlertStore } from '@/stores/alertStore';

// ============================================================
// Preset color options
// ============================================================
const PRESET_COLORS = [
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#ffffff', label: 'White' },
];

const FONT_SIZES = [
  { value: 'small' as const, label: 'S' },
  { value: 'medium' as const, label: 'M' },
  { value: 'large' as const, label: 'L' },
];

interface ROIConfigPanelProps {
  className?: string;
}

/**
 * Configuration sidebar for editing properties of the currently selected ROI.
 *
 * Displays name, color, font size, stat toggles, alert binding, and
 * delete controls. Only rendered when a ROI is selected in the store.
 */
export default function ROIConfigPanel({ className }: ROIConfigPanelProps) {
  const selectedRoiId = useROIStore((s) => s.selectedRoiId);
  const rois = useROIStore((s) => s.rois);
  const roiData = useROIStore((s) => s.roiData);
  const updateROI = useROIStore((s) => s.updateROI);
  const removeROI = useROIStore((s) => s.removeROI);
  const setSelectedROI = useROIStore((s) => s.setSelectedROI);
  const alertRules = useAlertStore((s) => s.rules);

  const roi = rois.find((r) => r.id === selectedRoiId);
  const data = selectedRoiId ? roiData[selectedRoiId] : undefined;

  const handleUpdate = useCallback(
    (updates: Record<string, unknown>) => {
      if (selectedRoiId) {
        updateROI(selectedRoiId, updates);
      }
    },
    [selectedRoiId, updateROI],
  );

  const handleDelete = useCallback(() => {
    if (selectedRoiId) {
      removeROI(selectedRoiId);
    }
  }, [selectedRoiId, removeROI]);

  const handleDone = useCallback(() => {
    setSelectedROI(null);
  }, [setSelectedROI]);

  if (!roi) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-64 rounded-[var(--radius-lg)] bg-bg-card/95 backdrop-blur-sm',
        'border border-border-default p-4 shadow-lg overflow-y-auto max-h-full',
        className,
      )}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary truncate">
          ROI Config
        </h3>
        <span
          className="text-xs font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary"
        >
          {roi.shape}
        </span>
      </div>

      {/* ---- Name ---- */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-secondary">Name</label>
        <input
          type="text"
          value={roi.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className={cn(
            'w-full px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)]',
            'bg-bg-input text-text-primary border border-border-default',
            'focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus',
            'transition-colors duration-150',
          )}
        />
      </div>

      {/* ---- Color picker ---- */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Color</label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => handleUpdate({ color: c.value })}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-all duration-150 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                roi.color === c.value
                  ? 'border-text-primary scale-110 shadow-md'
                  : 'border-transparent hover:border-text-muted hover:scale-105',
              )}
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
              aria-pressed={roi.color === c.value}
            />
          ))}
        </div>
      </div>

      {/* ---- Font size ---- */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">
          Label Size
        </label>
        <div className="flex items-center gap-1">
          {FONT_SIZES.map((fs) => (
            <button
              key={fs.value}
              type="button"
              onClick={() => handleUpdate({ fontSize: fs.value })}
              className={cn(
                'flex-1 py-1.5 text-sm font-bold rounded-[var(--radius-sm)]',
                'transition-all duration-150 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                roi.fontSize === fs.value
                  ? 'bg-brand-primary text-text-primary'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-card-hover hover:text-text-primary',
              )}
              aria-pressed={roi.fontSize === fs.value}
            >
              {fs.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Stat toggles ---- */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">
          Display Stats
        </label>
        {([
          { key: 'showMin', label: 'Show Min' },
          { key: 'showMax', label: 'Show Max' },
          { key: 'showAvg', label: 'Show Avg' },
        ] as const).map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded border',
                'transition-all duration-150',
                roi[key]
                  ? 'bg-brand-primary border-brand-primary'
                  : 'bg-bg-input border-border-default group-hover:border-text-muted',
              )}
              role="checkbox"
              aria-checked={roi[key]}
            >
              {roi[key] && <Check size={13} className="text-text-primary" strokeWidth={3} />}
            </div>
            <input
              type="checkbox"
              checked={roi[key]}
              onChange={(e) => handleUpdate({ [key]: e.target.checked })}
              className="sr-only"
            />
            <span className="text-sm font-medium text-text-primary">
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* ---- Live data preview ---- */}
      {data && (
        <div className="flex flex-col gap-1 p-2.5 rounded-[var(--radius-sm)] bg-bg-tertiary">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Live Data
          </span>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <span className="text-[10px] text-text-muted">Min</span>
              <p className="text-sm font-extrabold text-text-primary">
                {formatTemp(data.minTemp)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-text-muted">Avg</span>
              <p className="text-sm font-extrabold text-text-primary">
                {formatTemp(data.avgTemp)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-text-muted">Max</span>
              <p className="text-sm font-extrabold text-text-primary">
                {formatTemp(data.maxTemp)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Alert binding ---- */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-secondary">
          Alert Rule
        </label>
        <select
          value={roi.alertRuleId ?? ''}
          onChange={(e) =>
            handleUpdate({
              alertRuleId: e.target.value || undefined,
            })
          }
          className={cn(
            'w-full appearance-none px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)]',
            'bg-bg-input text-text-primary border border-border-default',
            'focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus',
            'cursor-pointer transition-colors duration-150',
          )}
        >
          <option value="">None</option>
          {alertRules.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {rule.name}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Actions ---- */}
      <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-border-default">
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2 rounded-[var(--radius-sm)]',
            'bg-status-critical/15 text-status-critical font-semibold text-sm',
            'hover:bg-status-critical/25 transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical',
          )}
        >
          <Trash2 size={15} />
          Delete ROI
        </button>

        <button
          type="button"
          onClick={handleDone}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2 rounded-[var(--radius-sm)]',
            'bg-brand-primary text-text-primary font-semibold text-sm',
            'hover:bg-brand-primary-hover transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          )}
        >
          <Check size={15} />
          Done
        </button>
      </div>
    </div>
  );
}
