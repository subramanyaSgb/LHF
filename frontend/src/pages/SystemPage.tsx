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
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { StatusDot } from '@/components/common/StatusDot';
import { Tabs } from '@/components/common/Tabs';
import { Table, type TableColumn } from '@/components/common/Table';
import { ShiftHandover } from '@/components/system/ShiftHandover';
import { AuditLog } from '@/components/system/AuditLog';
import { cn } from '@/utils/cn';
import { formatDateTime, formatDuration, formatPercentage } from '@/utils/format';
import { formatTemp } from '@/utils/temperature';
import { mockSystemHealth, mockCameras } from '@/utils/mock-data';
import type { SystemComponentStatus } from '@/types';

// ---------------------------------------------------------------------------
//  Helper: progress bar component
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  valueLabel?: string;
  colorClass?: string;
  size?: 'sm' | 'md' | 'lg';
}

function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  colorClass,
  size = 'md',
}: ProgressBarProps): React.JSX.Element {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const barColor =
    colorClass ??
    (pct > 90
      ? 'bg-status-critical'
      : pct > 70
        ? 'bg-status-warning'
        : 'bg-status-healthy');

  const heightStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-5',
  } as const;

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
          {valueLabel && (
            <span className="text-sm font-bold text-text-primary">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-bg-tertiary overflow-hidden',
          heightStyles[size],
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Helper: large metric display
// ---------------------------------------------------------------------------

interface MetricProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  statusClass?: string;
}

function Metric({ label, value, icon, statusClass }: MetricProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-muted uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        {icon && <span className={cn('shrink-0', statusClass)}>{icon}</span>}
        <span className={cn('text-2xl font-bold', statusClass ?? 'text-text-primary')}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  CPU temperature gauge bar
// ---------------------------------------------------------------------------

function CpuTempBar({ temp }: { temp: number }): React.JSX.Element {
  const maxTemp = 100;
  const pct = Math.min(100, Math.max(0, (temp / maxTemp) * 100));

  const color =
    temp >= 85
      ? 'text-status-critical'
      : temp >= 70
        ? 'text-status-warning'
        : 'text-status-healthy';

  const barColor =
    temp >= 85
      ? 'bg-status-critical'
      : temp >= 70
        ? 'bg-status-warning'
        : 'bg-status-healthy';

  return (
    <div className="flex items-center gap-4">
      <Thermometer className={cn('w-8 h-8 shrink-0', color)} />
      <div className="flex-1">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-medium text-text-muted">CPU Temperature</span>
          <span className={cn('text-3xl font-bold tabular-nums', color)}>
            {formatTemp(temp)}
          </span>
        </div>
        <div className="w-full h-4 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5 text-xs text-text-muted">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Status map for cameras table
// ---------------------------------------------------------------------------

const statusMap: Record<SystemComponentStatus, { dot: 'healthy' | 'warning' | 'critical' | 'offline'; badge: 'healthy' | 'warning' | 'critical' | 'offline' }> = {
  healthy: { dot: 'healthy', badge: 'healthy' },
  warning: { dot: 'warning', badge: 'warning' },
  critical: { dot: 'critical', badge: 'critical' },
  offline: { dot: 'offline', badge: 'offline' },
};

// ---------------------------------------------------------------------------
//  Camera health row type
// ---------------------------------------------------------------------------

interface CameraHealthRow {
  id: string;
  name: string;
  ip: string;
  status: SystemComponentStatus;
  latencyMs: number;
  bodyTemp: number;
}

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

export default function SystemPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('overview');
  const health = mockSystemHealth;

  // Build camera health rows by merging system health network data with camera details
  const cameraRows: CameraHealthRow[] = mockCameras.map((cam) => {
    const networkInfo = health.network.cameras[cam.id];
    return {
      id: cam.id,
      name: cam.name,
      ip: cam.ipAddress,
      status: networkInfo?.status ?? 'offline',
      latencyMs: networkInfo?.latencyMs ?? 0,
      bodyTemp: cam.bodyTemperature,
    };
  });

  const cameraColumns: TableColumn<CameraHealthRow>[] = [
    {
      key: 'name',
      header: 'Camera',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <StatusDot
            status={statusMap[row.status].dot}
            pulse={row.status === 'healthy'}
            size="sm"
          />
          <div>
            <div className="font-semibold text-text-primary">{row.name}</div>
            <div className="text-sm text-text-muted">{row.ip}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusMap[row.status].badge} size="md">
          {row.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'latencyMs',
      header: 'Latency',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'text-lg font-bold tabular-nums',
            row.status === 'offline'
              ? 'text-text-muted'
              : row.latencyMs > 10
                ? 'text-status-warning'
                : 'text-status-healthy',
          )}
        >
          {row.status === 'offline' ? '--' : `${row.latencyMs} ms`}
        </span>
      ),
    },
    {
      key: 'bodyTemp',
      header: 'Body Temp',
      sortable: true,
      render: (row) => {
        if (row.status === 'offline') {
          return <span className="text-lg font-bold text-text-muted">--</span>;
        }
        const color =
          row.bodyTemp >= 55
            ? 'text-status-critical'
            : row.bodyTemp >= 45
              ? 'text-status-warning'
              : 'text-status-healthy';
        return (
          <span className={cn('text-lg font-bold tabular-nums', color)}>
            {formatTemp(row.bodyTemp)}
          </span>
        );
      },
    },
  ];

  // Compute disk usage
  const diskUsedGb = health.server.diskTotalGb - health.server.diskFreeGb;
  const diskPct = (diskUsedGb / health.server.diskTotalGb) * 100;

  // -----------------------------------------------------------------------
  //  Tab: Overview
  // -----------------------------------------------------------------------
  const overviewTab = (
    <div className="space-y-6">
      {/* Top row: Server + PLC + Network summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Card */}
        <Card
          variant="bordered"
          header={
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-brand-primary" />
              <span>Server</span>
            </div>
          }
        >
          <div className="space-y-5">
            <CpuTempBar temp={health.server.cpuTemp} />

            <ProgressBar
              label="CPU Usage"
              valueLabel={formatPercentage(health.server.cpuUsage)}
              value={health.server.cpuUsage}
              size="md"
            />

            <ProgressBar
              label="RAM Usage"
              valueLabel={formatPercentage(health.server.ramUsage)}
              value={health.server.ramUsage}
              size="md"
            />

            <ProgressBar
              label="Disk Usage"
              valueLabel={`${diskUsedGb} / ${health.server.diskTotalGb} GB`}
              value={diskPct}
              size="md"
            />

            <Metric
              label="Uptime"
              value={formatDuration(health.server.uptime)}
              icon={<Clock className="w-5 h-5" />}
              statusClass="text-status-healthy"
            />
          </div>
        </Card>

        {/* PLC Card */}
        <Card
          variant="bordered"
          header={
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-brand-primary" />
              <span>PLC Connection</span>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center py-4">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mb-4',
                  health.plc.connected
                    ? 'bg-status-healthy/20 ring-4 ring-status-healthy/30'
                    : 'bg-status-critical/20 ring-4 ring-status-critical/30',
                )}
              >
                {health.plc.connected ? (
                  <Wifi className="w-10 h-10 text-status-healthy" />
                ) : (
                  <WifiOff className="w-10 h-10 text-status-critical" />
                )}
              </div>
              <span
                className={cn(
                  'text-2xl font-bold',
                  health.plc.connected ? 'text-status-healthy' : 'text-status-critical',
                )}
              >
                {health.plc.connected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="space-y-4">
              <Metric
                label="Last Signal"
                value={formatDateTime(health.plc.lastSignal)}
                icon={<Clock className="w-5 h-5" />}
              />
              <Metric
                label="Latency"
                value={`${health.plc.latencyMs} ms`}
                statusClass={
                  health.plc.latencyMs > 50
                    ? 'text-status-critical'
                    : health.plc.latencyMs > 20
                      ? 'text-status-warning'
                      : 'text-status-healthy'
                }
              />
            </div>
          </div>
        </Card>

        {/* Network Card */}
        <Card
          variant="bordered"
          header={
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-brand-primary" />
              <span>Network</span>
            </div>
          }
        >
          <div className="space-y-6">
            <ProgressBar
              label="Bandwidth Usage"
              valueLabel={formatPercentage(health.network.bandwidthUsage)}
              value={health.network.bandwidthUsage}
              size="md"
            />

            <Metric
              label="Packet Loss"
              value={formatPercentage(health.network.packetLoss, 2)}
              statusClass={
                health.network.packetLoss > 1
                  ? 'text-status-critical'
                  : health.network.packetLoss > 0.1
                    ? 'text-status-warning'
                    : 'text-status-healthy'
              }
            />

            <div className="pt-2">
              <h4 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
                Camera Connections
              </h4>
              <div className="space-y-2">
                {Object.entries(health.network.cameras).map(([camId, info]) => {
                  const cam = mockCameras.find((c) => c.id === camId);
                  return (
                    <div
                      key={camId}
                      className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] bg-bg-secondary"
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot status={statusMap[info.status].dot} size="sm" />
                        <span className="text-sm font-medium text-text-primary">
                          {cam?.name ?? camId}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-bold tabular-nums',
                          info.status === 'offline'
                            ? 'text-text-muted'
                            : info.latencyMs > 10
                              ? 'text-status-warning'
                              : 'text-status-healthy',
                        )}
                      >
                        {info.status === 'offline' ? 'OFFLINE' : `${info.latencyMs}ms`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Camera Health Table */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-brand-primary" />
            <span>Camera Health</span>
          </div>
        }
        noPadding
      >
        <Table
          columns={cameraColumns}
          data={cameraRows}
          rowKey={(row) => row.id}
          clientSort
          striped
        />
      </Card>
    </div>
  );

  // -----------------------------------------------------------------------
  //  Tab: Shift Handover
  // -----------------------------------------------------------------------
  const shiftTab = <ShiftHandover />;

  // -----------------------------------------------------------------------
  //  Tab: Audit Log
  // -----------------------------------------------------------------------
  const auditTab = <AuditLog />;

  // -----------------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------------
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      <div className="flex items-center gap-3 mb-2">
        <HardDrive className="w-7 h-7 text-brand-primary" />
        <h1 className="text-2xl font-bold text-text-primary">System Status</h1>
      </div>

      <Tabs
        items={[
          { key: 'overview', label: 'Overview', icon: <Server className="w-4 h-4" />, content: overviewTab },
          { key: 'shift', label: 'Shift Handover', icon: <Clock className="w-4 h-4" />, content: shiftTab },
          { key: 'audit', label: 'Audit Log', icon: <Activity className="w-4 h-4" />, content: auditTab },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
        size="lg"
      />
    </div>
  );
}
