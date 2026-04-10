import { useCallback } from 'react';
import {
  MousePointer2,
  Crosshair,
  Minus,
  Square,
  Circle,
  Pentagon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useROIStore } from '@/stores/roiStore';
import type { ROIShape } from '@/types';

interface ToolDef {
  shape: ROIShape | null;
  icon: React.ReactNode;
  label: string;
}

const TOOLS: ToolDef[] = [
  { shape: null, icon: <MousePointer2 size={18} />, label: 'Select' },
  { shape: 'point', icon: <Crosshair size={18} />, label: 'Point' },
  { shape: 'line', icon: <Minus size={18} />, label: 'Line' },
  { shape: 'box', icon: <Square size={18} />, label: 'Box' },
  { shape: 'circle', icon: <Circle size={18} />, label: 'Circle' },
  { shape: 'polygon', icon: <Pentagon size={18} />, label: 'Polygon' },
];

interface ROIToolbarProps {
  className?: string;
}

/**
 * Floating toolbar for selecting ROI drawing tools.
 *
 * Renders horizontally with tool buttons that toggle the active drawing
 * shape in the ROI store. The cursor/select tool exits drawing mode.
 */
export default function ROIToolbar({ className }: ROIToolbarProps) {
  const activeTool = useROIStore((s) => s.activeTool);
  const setActiveTool = useROIStore((s) => s.setActiveTool);

  const handleToolClick = useCallback(
    (shape: ROIShape | null) => {
      setActiveTool(shape);
    },
    [setActiveTool],
  );

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-[var(--radius-md)] bg-bg-card/90 backdrop-blur-sm',
        'border border-border-default p-1 shadow-lg',
        className,
      )}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.shape;

        return (
          <div key={tool.label} className="relative group">
            <button
              type="button"
              onClick={() => handleToolClick(tool.shape)}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)]',
                'transition-all duration-150 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                isActive
                  ? 'bg-brand-primary text-text-primary shadow-md'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              )}
              aria-label={tool.label}
              aria-pressed={isActive}
            >
              {tool.icon}
            </button>

            {/* Tooltip */}
            <div
              className={cn(
                'absolute left-1/2 -translate-x-1/2 bottom-full mb-2',
                'px-2 py-1 rounded-[var(--radius-sm)] bg-bg-primary border border-border-default',
                'text-xs font-semibold text-text-primary whitespace-nowrap',
                'opacity-0 pointer-events-none group-hover:opacity-100',
                'transition-opacity duration-150 shadow-md z-50',
              )}
            >
              {tool.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
