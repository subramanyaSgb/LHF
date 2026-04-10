import { useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Server,
  Thermometer,
  Clock,
  Wifi,
  WifiOff,
  MemoryStick,
  Gauge,
  CircleDot,
} from 'lucide-react';
import { ShiftHandover } from '@/components/system/ShiftHandover';
import { AuditLog } from '@/components/system/AuditLog';
import { cn } from '@/utils/cn';
import { formatDateTime, formatDuration, formatPercentage } from '@/utils/format';
import { formatTemp } from '@/utils/temperature';
import { mockSystemHealth, mockCameras } from '@/utils/mock-data';

type Tab = 'overview' | 'shift' | 'audit';

function StatCard({ icon, label, value, statusClass, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  statusClass?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-bg-secondary rounded-[var(--radius-md)] border border-border-light p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', statusClass ?? 'text-text-primary')}>{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ProgressRow({ label, value, max, unit, showPercent }: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  showPercent?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct > 90 ? 'bg-status-critical' : pct > 70 ? 'bg-status-warning' : 'bg-status-healthy';
  const textColor = pct > 90 ? 'text-status-critical' : pct > 70 ? 'text-status-warning' : 'text-status-healthy';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-md)] hover:bg-bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-32 h-2 rounded-full bg-bg-tertiary overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
        </div>
        <span className={cn('text-sm font-bold tabular-nums w-16 text-right', textColor)}>
          {showPercent ? `${pct.toFixed(1)}%` : `${value}${unit ?? ''}`}
        </span>
      </div>
    </div>
  );
}

export default function SystemPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const health = mockSystemHealth;

  const diskUsedGb = health.server.diskTotalGb - health.server.diskFreeGb;
  const diskPct = (diskUsedGb / health.server.diskTotalGb) * 100;

  const onlineCams = Object.values(health.network.cameras).filter((c) => c.status !== 'offline').length;
  const totalCams = Object.keys(health.network.cameras).length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Server className="w-4 h-4" /> },
    { key: 'shift', label: 'Shift Handover', icon: <Clock className="w-4 h-4" /> },
    { key: 'audit', label: 'Audit Log', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <HardDrive className="w-7 h-7 text-brand-primary" />
            <h1 className="text-2xl font-bold text-text-primary">System Status</h1>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-bg-secondary rounded-[var(--radius-md)] p-0.5 border border-border-default">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-bold transition-colors',
                  activeTab === tab.key
                    ? 'bg-brand-primary text-white'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
            OVERVIEW TAB
        ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Summary Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Thermometer className="w-4 h-4" />}
                label="CPU Temp"
                value={formatTemp(health.server.cpuTemp)}
                statusClass={health.server.cpuTemp >= 80 ? 'text-status-critical' : health.server.cpuTemp >= 65 ? 'text-status-warning' : 'text-status-healthy'}
              />
              <StatCard
                icon={<Wifi className="w-4 h-4" />}
                label="PLC"
                value={health.plc.connected ? 'CONNECTED' : 'OFFLINE'}
                statusClass={health.plc.connected ? 'text-status-healthy' : 'text-status-critical'}
                subtitle={`Latency: ${health.plc.latencyMs}ms`}
              />
              <StatCard
                icon={<Cpu className="w-4 h-4" />}
                label="Cameras"
                value={`${onlineCams}/${totalCams}`}
                statusClass={onlineCams === totalCams ? 'text-status-healthy' : 'text-status-warning'}
                subtitle={`${totalCams - onlineCams} offline`}
              />
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Uptime"
                value={formatDuration(health.server.uptime)}
                subtitle="Server running"
              />
            </div>

            {/* Two column: Server + PLC/Network */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Server Resources */}
              <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary/50">
                  <Server className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-base font-bold text-text-primary">Server Resources</h2>
                </div>
                <div className="p-2 space-y-0.5">
                  <ProgressRow label="CPU Usage" value={health.server.cpuUsage} max={100} showPercent />
                  <ProgressRow label="RAM Usage" value={health.server.ramUsage} max={100} showPercent />
                  <ProgressRow label="Disk Used" value={Math.round(diskPct)} max={100} showPercent />

                  {/* Disk detail */}
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{diskUsedGb.toFixed(0)} GB used</span>
                      <span>{health.server.diskFreeGb} GB free / {health.server.diskTotalGb} GB total</span>
                    </div>
                  </div>

                  {/* CPU Temperature gauge */}
                  <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-md)] hover:bg-bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Thermometer className={cn('w-4 h-4', health.server.cpuTemp >= 80 ? 'text-status-critical' : health.server.cpuTemp >= 65 ? 'text-status-warning' : 'text-status-healthy')} />
                      <span className="text-sm font-semibold text-text-primary">CPU Temperature</span>
                    </div>
                    <span className={cn(
                      'text-lg font-bold tabular-nums',
                      health.server.cpuTemp >= 80 ? 'text-status-critical' : health.server.cpuTemp >= 65 ? 'text-status-warning' : 'text-status-healthy'
                    )}>
                      {formatTemp(health.server.cpuTemp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PLC + Network */}
              <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary/50">
                  <Network className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-base font-bold text-text-primary">PLC & Network</h2>
                </div>
                <div className="p-2 space-y-0.5">
                  {/* PLC Status */}
                  <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-[var(--radius-md)] hover:bg-bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {health.plc.connected ? <Wifi className="w-4 h-4 text-status-healthy" /> : <WifiOff className="w-4 h-4 text-status-critical" />}
                      <div>
                        <p className="text-sm font-semibold text-text-primary">PLC Connection</p>
                        <p className="text-xs text-text-muted">Last signal: {formatDateTime(health.plc.lastSignal)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'text-sm font-bold',
                        health.plc.connected ? 'text-status-healthy' : 'text-status-critical'
                      )}>
                        {health.plc.connected ? 'Online' : 'Offline'}
                      </span>
                      <p className="text-xs text-text-muted">{health.plc.latencyMs}ms latency</p>
                    </div>
                  </div>

                  {/* Network stats */}
                  <ProgressRow label="Bandwidth" value={health.network.bandwidthUsage} max={100} showPercent />

                  <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-md)]">
                    <div className="flex items-center gap-3">
                      <CircleDot className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-semibold text-text-primary">Packet Loss</span>
                    </div>
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      health.network.packetLoss > 1 ? 'text-status-critical' : health.network.packetLoss > 0.1 ? 'text-status-warning' : 'text-status-healthy'
                    )}>
                      {formatPercentage(health.network.packetLoss, 2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Health — Full Width */}
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary/50">
                <Cpu className="w-5 h-5 text-brand-primary" />
                <h2 className="text-base font-bold text-text-primary">Camera Health</h2>
                <span className="text-xs text-text-muted ml-auto">{onlineCams}/{totalCams} online</span>
              </div>
              <div className="p-2 space-y-0.5">
                {mockCameras.map((cam) => {
                  const networkInfo = health.network.cameras[cam.id];
                  const isOffline = !networkInfo || networkInfo.status === 'offline';
                  const statusColor = isOffline ? 'text-status-offline' : networkInfo.status === 'warning' ? 'text-status-warning' : 'text-status-healthy';
                  const tempColor = cam.bodyTemperature >= 55 ? 'text-status-critical' : cam.bodyTemperature >= 45 ? 'text-status-warning' : 'text-status-healthy';

                  return (
                    <div key={cam.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-md)] hover:bg-bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', isOffline ? 'bg-status-offline' : networkInfo.status === 'warning' ? 'bg-status-warning' : 'bg-status-healthy')} />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{cam.name}</p>
                          <p className="text-xs text-text-muted font-mono">{cam.ipAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Status */}
                        <div className="text-right w-20">
                          <span className={cn('text-xs font-bold uppercase', statusColor)}>
                            {isOffline ? 'Offline' : networkInfo.status}
                          </span>
                        </div>
                        {/* Latency */}
                        <div className="text-right w-16">
                          <span className={cn('text-sm font-bold tabular-nums', isOffline ? 'text-text-muted' : networkInfo.latencyMs > 10 ? 'text-status-warning' : 'text-status-healthy')}>
                            {isOffline ? '—' : `${networkInfo.latencyMs}ms`}
                          </span>
                        </div>
                        {/* Body temp */}
                        <div className="text-right w-16">
                          <span className={cn('text-sm font-bold tabular-nums', isOffline ? 'text-text-muted' : tempColor)}>
                            {isOffline ? '—' : formatTemp(cam.bodyTemperature)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            SHIFT HANDOVER TAB
        ============================================================ */}
        {activeTab === 'shift' && <ShiftHandover />}

        {/* ============================================================
            AUDIT LOG TAB
        ============================================================ */}
        {activeTab === 'audit' && <AuditLog />}
      </div>
    </div>
  );
}
