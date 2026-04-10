import { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useAlertStore } from '@/stores/alertStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, formatRelative } from '@/utils/format';
import {
  Bell,
  Search,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Eye,
  Clock,
  Thermometer,
  TrendingUp,
  Snowflake,
  WifiOff,
  Cpu,
  Video,
  HardDrive,
  Unplug,
} from 'lucide-react';
import type { AlertType, AlertPriority, AlertStatus, Alert } from '@/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: React.ReactNode }> = {
  temperature_breach: { label: 'Temp Breach', icon: <Thermometer className="w-4 h-4" /> },
  rapid_spike: { label: 'Rapid Spike', icon: <TrendingUp className="w-4 h-4" /> },
  cold_zone: { label: 'Cold Zone', icon: <Snowflake className="w-4 h-4" /> },
  camera_offline: { label: 'Camera Offline', icon: <WifiOff className="w-4 h-4" /> },
  device_overheat: { label: 'Device Overheat', icon: <Cpu className="w-4 h-4" /> },
  recording_failure: { label: 'Recording Fail', icon: <Video className="w-4 h-4" /> },
  disk_warning: { label: 'Disk Warning', icon: <HardDrive className="w-4 h-4" /> },
  plc_disconnect: { label: 'PLC Disconnect', icon: <Unplug className="w-4 h-4" /> },
};

const PRIORITY_CONFIG: Record<AlertPriority, { label: string; icon: React.ReactNode; color: string; borderColor: string }> = {
  critical: {
    label: 'Critical',
    icon: <AlertOctagon className="w-5 h-5" />,
    color: 'bg-status-critical-bg text-status-critical',
    borderColor: 'border-status-critical',
  },
  warning: {
    label: 'Warning',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'bg-status-warning-bg text-status-warning',
    borderColor: 'border-status-warning',
  },
  info: {
    label: 'Info',
    icon: <Info className="w-5 h-5" />,
    color: 'bg-status-info-bg text-status-info',
    borderColor: 'border-status-info',
  },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: 'Active',
    color: 'bg-status-critical-bg text-status-critical',
    icon: <Bell className="w-3.5 h-3.5" />,
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'bg-status-warning-bg text-status-warning',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-status-healthy-bg text-status-healthy',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

const ALL_ALERT_TYPES: AlertType[] = [
  'temperature_breach',
  'rapid_spike',
  'cold_zone',
  'camera_offline',
  'device_overheat',
  'recording_failure',
  'disk_warning',
  'plc_disconnect',
];

// ---------------------------------------------------------------------------
// AlertCard
// ---------------------------------------------------------------------------
function AlertCard({
  alert,
  onAcknowledge,
  canAcknowledge,
}: {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  canAcknowledge: boolean;
}) {
  const priorityCfg = PRIORITY_CONFIG[alert.priority];
  const statusCfg = STATUS_CONFIG[alert.status];
  const typeCfg = ALERT_TYPE_CONFIG[alert.type];

  const isActiveCritical = alert.status === 'active' && alert.priority === 'critical';
  const isActiveWarning = alert.status === 'active' && alert.priority === 'warning';

  return (
    <div
      className={cn(
        'bg-bg-card rounded-[var(--radius-lg)] border-l-4 border border-border-default p-4 transition-all',
        isActiveCritical && 'border-l-status-critical shadow-[var(--shadow-glow-critical)]',
        isActiveWarning && 'border-l-status-warning shadow-[var(--shadow-glow-warning)]',
        !isActiveCritical && !isActiveWarning && `border-l-4 ${priorityCfg.borderColor}`,
        alert.status === 'resolved' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Priority icon */}
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full shrink-0 mt-0.5',
          priorityCfg.color,
        )}>
          {priorityCfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full', statusCfg.color)}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full', priorityCfg.color)}>
              {priorityCfg.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary rounded-full border border-border-default">
              {typeCfg.icon}
              {typeCfg.label}
            </span>
            {alert.groupName && (
              <span className="px-2 py-0.5 text-xs font-medium text-brand-primary bg-brand-primary/10 rounded-full">
                {alert.groupName}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-text-primary mb-1">
            {alert.message}
          </p>

          <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(alert.timestamp)}
              <span className="text-text-muted">({formatRelative(alert.timestamp)})</span>
            </span>
            {alert.cameraName && (
              <span>Camera: {alert.cameraName}</span>
            )}
            {alert.roiName && (
              <span>ROI: {alert.roiName}</span>
            )}
          </div>

          {/* Value vs threshold */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary rounded-[var(--radius-sm)] border border-border-default">
              <span className="text-xs text-text-muted">Value:</span>
              <span className={cn(
                'text-sm font-bold',
                alert.value > alert.threshold ? 'text-status-critical' : 'text-status-healthy',
              )}>
                {alert.value}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary rounded-[var(--radius-sm)] border border-border-default">
              <span className="text-xs text-text-muted">Threshold:</span>
              <span className="text-sm font-bold text-text-primary">{alert.threshold}</span>
            </div>
          </div>

          {/* Acknowledged info */}
          {alert.acknowledgedAt && (
            <p className="text-xs text-text-muted mt-2">
              Acknowledged by <span className="font-medium text-text-secondary">{alert.acknowledgedBy}</span> at {formatDateTime(alert.acknowledgedAt)}
            </p>
          )}
        </div>

        {/* Actions */}
        {alert.status === 'active' && canAcknowledge && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-status-warning-bg text-status-warning hover:bg-status-warning hover:text-white rounded-[var(--radius-md)] border border-status-warning/30 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AlertsHistoryPage(): React.JSX.Element {
  const { alerts, acknowledgeAlert } = useAlertStore();
  const { hasMinRole, user } = useAuthStore();
  const canAcknowledge = hasMinRole('operator');

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AlertPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AlertType>('all');

  const filtered = useMemo(() => {
    let result = [...alerts];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.message.toLowerCase().includes(q) ||
          (a.groupName?.toLowerCase().includes(q) ?? false) ||
          (a.cameraName?.toLowerCase().includes(q) ?? false),
      );
    }
    if (priorityFilter !== 'all') {
      result = result.filter((a) => a.priority === priorityFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.type === typeFilter);
    }

    // Sort: active first, then by timestamp desc
    result.sort((a, b) => {
      const statusOrder: Record<AlertStatus, number> = { active: 0, acknowledged: 1, resolved: 2 };
      const diff = statusOrder[a.status] - statusOrder[b.status];
      if (diff !== 0) return diff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return result;
  }, [alerts, search, priorityFilter, statusFilter, typeFilter]);

  const handleAcknowledge = (id: string) => {
    if (user) {
      acknowledgeAlert(id, user.id);
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.priority === 'critical' && a.status === 'active').length;

  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="w-7 h-7 text-brand-primary" />
            Alert History
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {alerts.length} total | {activeCount} active
            {criticalCount > 0 && (
              <span className="ml-2 text-status-critical font-semibold">
                {criticalCount} critical
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
          className="px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Types</option>
          {ALL_ALERT_TYPES.map((t) => (
            <option key={t} value={t}>{ALERT_TYPE_CONFIG[t].label}</option>
          ))}
        </select>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
            canAcknowledge={canAcknowledge}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Bell className="w-10 h-10 mb-2" />
          <p className="text-sm">No alerts match your filters</p>
        </div>
      )}
    </div>
  );
}
