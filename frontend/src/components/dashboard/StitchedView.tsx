import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useCameraStore } from '@/stores/cameraStore';
import { useAlertStore } from '@/stores/alertStore';
import CameraCard from './CameraCard';
import type { Camera, CameraGroup, StitchPosition } from '@/types';
import { Activity, AlertTriangle } from 'lucide-react';

interface StitchedViewProps {
  group: CameraGroup;
  onCameraClick?: (camera: Camera) => void;
  className?: string;
}

/** Maps stitch positions to CSS grid placement. */
function positionToGridArea(pos: StitchPosition, rows: number, cols: number): string {
  const map: Record<StitchPosition, string> = {
    'top-left': '1 / 1 / 2 / 2',
    'top-right': `1 / ${cols} / 2 / ${cols + 1}`,
    'bottom-left': `${rows} / 1 / ${rows + 1} / 2`,
    'bottom-right': `${rows} / ${cols} / ${rows + 1} / ${cols + 1}`,
    top: `1 / 1 / 2 / ${cols + 1}`,
    bottom: `${rows} / 1 / ${rows + 1} / ${cols + 1}`,
    left: `1 / 1 / ${rows + 1} / 2`,
    right: `1 / ${cols} / ${rows + 1} / ${cols + 1}`,
    center: `1 / 1 / ${rows + 1} / ${cols + 1}`,
  };
  return map[pos] ?? '1 / 1 / 2 / 2';
}

export default function StitchedView({ group, onCameraClick, className }: StitchedViewProps) {
  const getCameraById = useCameraStore((s) => s.getCameraById);
  const getAlertsByGroup = useAlertStore((s) => s.getAlertsByGroup);

  const cameras = useMemo(
    () => group.cameraIds.map((id) => getCameraById(id)).filter(Boolean) as Camera[],
    [group.cameraIds, getCameraById],
  );

  const groupAlerts = getAlertsByGroup(group.id).filter((a) => a.status === 'active');
  const hasCritical = groupAlerts.some((a) => a.priority === 'critical');

  const onlineCount = cameras.filter((c) => c.status !== 'offline').length;
  const totalCount = cameras.length;

  // Combined max / avg across all cameras that are online
  const combinedStats = useMemo(() => {
    let maxTemp = 0;
    let sumAvg = 0;
    let onlineCams = 0;
    for (const cam of cameras) {
      if (cam.status === 'offline') continue;
      // Use body temperature as a proxy for now; in production this would come from frames
      const baseTemp = 1200 + Math.random() * 150;
      if (baseTemp > maxTemp) maxTemp = baseTemp;
      sumAvg += baseTemp;
      onlineCams++;
    }
    return {
      maxTemp: onlineCams > 0 ? Math.round(maxTemp) : 0,
      avgTemp: onlineCams > 0 ? Math.round(sumAvg / onlineCams) : 0,
    };
  }, [cameras]);

  const { rows, cols } = group.stitchLayout;

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-bg-card border overflow-hidden',
        hasCritical
          ? 'border-2 border-status-critical animate-pulse-alert shadow-[var(--shadow-glow-critical)]'
          : groupAlerts.length > 0
            ? 'border-2 border-status-warning shadow-[var(--shadow-glow-warning)]'
            : 'border-border-default',
        className,
      )}
    >
      {/* ---- Group header ---- */}
      <div className="flex items-center justify-between px-5 py-3 bg-bg-secondary/60 border-b border-border-default">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-text-primary tracking-wide">
            {group.name}
          </h2>

          {/* Alert indicator */}
          {groupAlerts.length > 0 && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                hasCritical
                  ? 'bg-status-critical/20 text-status-critical'
                  : 'bg-status-warning/20 text-status-warning',
              )}
            >
              <AlertTriangle size={13} />
              {groupAlerts.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold text-text-secondary">
          {/* Online status */}
          <span className="flex items-center gap-1.5">
            <Activity size={14} className="text-status-healthy" />
            {onlineCount}/{totalCount} online
          </span>

          {/* Combined temperatures */}
          <span className="text-text-muted">
            Max{' '}
            <span className="text-text-primary font-extrabold">
              {combinedStats.maxTemp > 0 ? `${combinedStats.maxTemp}°C` : '--'}
            </span>
          </span>
          <span className="text-text-muted">
            Avg{' '}
            <span className="text-text-primary font-extrabold">
              {combinedStats.avgTemp > 0 ? `${combinedStats.avgTemp}°C` : '--'}
            </span>
          </span>
        </div>
      </div>

      {/* ---- Stitched grid ---- */}
      <div
        className="p-2 gap-2"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {group.stitchMappings.map((mapping) => {
          const camera = cameras.find((c) => c.id === mapping.cameraId);
          if (!camera) return null;

          return (
            <div
              key={mapping.cameraId}
              style={{
                gridArea: positionToGridArea(mapping.position, rows, cols),
              }}
            >
              <CameraCard camera={camera} onClick={onCameraClick} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
