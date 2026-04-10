import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { formatTemp, getTempColor } from '@/utils/temperature';
import { generateMockThermalFrame } from '@/utils/mock-data';
import { useAlertStore } from '@/stores/alertStore';
import ThermalCanvas from './ThermalCanvas';
import type { Camera } from '@/types';
import { Thermometer, Circle } from 'lucide-react';

interface CameraCardProps {
  camera: Camera;
  onClick?: (camera: Camera) => void;
  className?: string;
}

export default function CameraCard({ camera, onClick, className }: CameraCardProps) {
  const [thermalMatrix, setThermalMatrix] = useState<number[][]>(() =>
    generateMockThermalFrame(80, 60),
  );
  const [maxTemp, setMaxTemp] = useState(0);
  const [avgTemp, setAvgTemp] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAlertsByCamera = useAlertStore((s) => s.getAlertsByCamera);
  const activeAlerts = getAlertsByCamera(camera.id).filter((a) => a.status === 'active');
  const hasActiveAlert = activeAlerts.length > 0;
  const hasCriticalAlert = activeAlerts.some((a) => a.priority === 'critical');

  // Generate new thermal frame every 500ms
  useEffect(() => {
    if (camera.status === 'offline') return;

    const update = () => {
      const frame = generateMockThermalFrame(80, 60);
      setThermalMatrix(frame);

      // Compute stats
      let sum = 0;
      let max = -Infinity;
      let count = 0;
      for (const row of frame) {
        for (const v of row) {
          sum += v;
          if (v > max) max = v;
          count++;
        }
      }
      setMaxTemp(Math.round(max));
      setAvgTemp(Math.round(sum / count));
    };

    update();
    intervalRef.current = setInterval(update, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [camera.status]);

  const handleClick = useCallback(() => {
    onClick?.(camera);
  }, [camera, onClick]);

  const isOffline = camera.status === 'offline';
  const isRecording = camera.isRecording;

  // Border animation class for active alerts
  const borderClass = hasCriticalAlert
    ? 'border-2 border-status-critical animate-pulse-alert shadow-[var(--shadow-glow-critical)]'
    : hasActiveAlert
      ? 'border-2 border-status-warning shadow-[var(--shadow-glow-warning)]'
      : 'border border-border-default';

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col rounded-[var(--radius-lg)] bg-bg-card overflow-hidden cursor-pointer',
        'transition-all duration-200 hover:bg-bg-card-hover hover:shadow-[var(--shadow-elevated)]',
        borderClass,
        isOffline && 'opacity-60',
        className,
      )}
    >
      {/* ---- Header bar ---- */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary/60">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status dot */}
          <Circle
            size={12}
            className={cn(
              'shrink-0 fill-current',
              isOffline
                ? 'text-status-offline'
                : isRecording
                  ? 'text-status-critical animate-recording'
                  : 'text-status-healthy',
            )}
          />
          <span className="text-lg font-bold text-text-primary truncate">{camera.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Recording badge */}
          {isRecording && (
            <span className="flex items-center gap-1 rounded-full bg-status-critical/20 px-2.5 py-0.5 animate-recording">
              <span className="inline-block h-2 w-2 rounded-full bg-status-critical" />
              <span className="text-xs font-extrabold tracking-wider text-status-critical uppercase">
                REC
              </span>
            </span>
          )}

          {/* Camera body temperature */}
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-semibold',
              camera.bodyTemperature > 60
                ? 'text-status-critical'
                : camera.bodyTemperature > 50
                  ? 'text-status-warning'
                  : 'text-text-secondary',
            )}
          >
            <Thermometer size={13} />
            {camera.bodyTemperature}°
          </span>
        </div>
      </div>

      {/* ---- Thermal feed ---- */}
      <div className="relative aspect-[4/3] w-full bg-black">
        {isOffline ? (
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-2xl font-bold text-status-offline uppercase tracking-widest">
              Offline
            </span>
          </div>
        ) : (
          <ThermalCanvas thermalMatrix={thermalMatrix} />
        )}
      </div>

      {/* ---- Stats footer ---- */}
      <div className="flex items-center justify-around px-3 py-2.5 bg-bg-secondary/40">
        {/* Max temperature */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Max
          </span>
          <span
            className="text-2xl font-extrabold leading-tight"
            style={{ color: isOffline ? 'var(--color-status-offline)' : getTempColor(maxTemp) }}
          >
            {isOffline ? '--' : formatTemp(maxTemp)}
          </span>
        </div>

        {/* Avg temperature */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Avg
          </span>
          <span
            className="text-2xl font-extrabold leading-tight"
            style={{ color: isOffline ? 'var(--color-status-offline)' : getTempColor(avgTemp) }}
          >
            {isOffline ? '--' : formatTemp(avgTemp)}
          </span>
        </div>
      </div>
    </div>
  );
}
