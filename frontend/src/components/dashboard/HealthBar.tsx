import { cn } from '@/utils/cn';
import { useCameraStore } from '@/stores/cameraStore';
import { mockSystemHealth } from '@/utils/mock-data';
import type { SystemComponentStatus } from '@/types';
import {
  Thermometer,
  HardDrive,
  Cpu,
  Wifi,
  Radio,
  Circle,
} from 'lucide-react';

function statusDotColor(status: SystemComponentStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-status-healthy';
    case 'warning':
      return 'text-status-warning';
    case 'critical':
      return 'text-status-critical';
    case 'offline':
      return 'text-status-offline';
  }
}

function bodyTempColor(temp: number): string {
  if (temp > 60) return 'text-status-critical';
  if (temp > 50) return 'text-status-warning';
  return 'text-status-healthy';
}

function handleDeviceClick(label: string) {
  // eslint-disable-next-line no-console
  console.log(`[HealthBar] Device clicked: ${label}`);
}

interface HealthBarProps {
  className?: string;
}

export default function HealthBar({ className }: HealthBarProps) {
  const cameras = useCameraStore((s) => s.cameras);
  const health = mockSystemHealth;

  const diskUsedPct = Math.round(
    ((health.server.diskTotalGb - health.server.diskFreeGb) / health.server.diskTotalGb) * 100,
  );

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-4 py-2 bg-bg-secondary border-t border-border-default',
        'overflow-x-auto scrollbar-thin',
        className,
      )}
    >
      {/* ---- Per-camera health ---- */}
      {cameras.map((cam) => {
        const netStatus = health.network.cameras[cam.id];
        const connStatus: SystemComponentStatus = netStatus?.status ?? 'offline';
        return (
          <button
            key={cam.id}
            type="button"
            onClick={() => handleDeviceClick(cam.name)}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1',
              'bg-bg-card hover:bg-bg-card-hover transition-colors cursor-pointer shrink-0',
              'border border-border-default',
            )}
          >
            <Circle size={8} className={cn('fill-current', statusDotColor(connStatus))} />
            <span className="text-xs font-bold text-text-primary truncate max-w-[7rem]">
              {cam.name}
            </span>
            <span className={cn('flex items-center gap-0.5 text-xs font-semibold', bodyTempColor(cam.bodyTemperature))}>
              <Thermometer size={11} />
              {cam.bodyTemperature}°
            </span>
          </button>
        );
      })}

      {/* ---- Divider ---- */}
      <div className="w-px h-6 bg-border-default shrink-0 mx-1" />

      {/* ---- PLC status ---- */}
      <button
        type="button"
        onClick={() => handleDeviceClick('PLC')}
        className={cn(
          'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1',
          'bg-bg-card hover:bg-bg-card-hover transition-colors cursor-pointer shrink-0',
          'border border-border-default',
        )}
      >
        <Radio
          size={13}
          className={health.plc.connected ? 'text-status-healthy' : 'text-status-critical'}
        />
        <span className="text-xs font-bold text-text-primary">PLC</span>
        <span
          className={cn(
            'text-xs font-semibold',
            health.plc.connected ? 'text-status-healthy' : 'text-status-critical',
          )}
        >
          {health.plc.connected ? `${health.plc.latencyMs}ms` : 'DOWN'}
        </span>
      </button>

      {/* ---- Divider ---- */}
      <div className="w-px h-6 bg-border-default shrink-0 mx-1" />

      {/* ---- Server CPU ---- */}
      <button
        type="button"
        onClick={() => handleDeviceClick('Server CPU')}
        className={cn(
          'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1',
          'bg-bg-card hover:bg-bg-card-hover transition-colors cursor-pointer shrink-0',
          'border border-border-default',
        )}
      >
        <Cpu size={13} className={bodyTempColor(health.server.cpuTemp)} />
        <span className="text-xs font-bold text-text-primary">CPU</span>
        <span className={cn('text-xs font-semibold', bodyTempColor(health.server.cpuTemp))}>
          {health.server.cpuTemp}°C
        </span>
        <span className="text-xs text-text-muted">{health.server.cpuUsage}%</span>
      </button>

      {/* ---- Disk ---- */}
      <button
        type="button"
        onClick={() => handleDeviceClick('Server Disk')}
        className={cn(
          'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1',
          'bg-bg-card hover:bg-bg-card-hover transition-colors cursor-pointer shrink-0',
          'border border-border-default',
        )}
      >
        <HardDrive
          size={13}
          className={diskUsedPct > 90 ? 'text-status-critical' : diskUsedPct > 75 ? 'text-status-warning' : 'text-status-healthy'}
        />
        <span className="text-xs font-bold text-text-primary">Disk</span>
        <span
          className={cn(
            'text-xs font-semibold',
            diskUsedPct > 90 ? 'text-status-critical' : diskUsedPct > 75 ? 'text-status-warning' : 'text-status-healthy',
          )}
        >
          {health.server.diskFreeGb} GB free
        </span>
      </button>

      {/* ---- Network ---- */}
      <button
        type="button"
        onClick={() => handleDeviceClick('Network')}
        className={cn(
          'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1',
          'bg-bg-card hover:bg-bg-card-hover transition-colors cursor-pointer shrink-0',
          'border border-border-default',
        )}
      >
        <Wifi
          size={13}
          className={
            health.network.bandwidthUsage > 90
              ? 'text-status-critical'
              : health.network.bandwidthUsage > 70
                ? 'text-status-warning'
                : 'text-status-healthy'
          }
        />
        <span className="text-xs font-bold text-text-primary">Net</span>
        <span className="text-xs font-semibold text-text-secondary">
          {health.network.bandwidthUsage}%
        </span>
      </button>
    </div>
  );
}
