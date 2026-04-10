import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useAlertStore } from '@/stores/alertStore';
import { useGroupStore } from '@/stores/groupStore';
import {
  ShieldAlert,
  Plus,
  X,
  Pencil,
  Trash2,
  Thermometer,
  TrendingUp,
  Snowflake,
  WifiOff,
  Cpu,
  Video,
  HardDrive,
  Unplug,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import type { AlertType, AlertPriority, AlertRule } from '@/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: React.ReactNode }> = {
  temperature_breach: { label: 'Temperature Breach', icon: <Thermometer className="w-4 h-4" /> },
  rapid_spike: { label: 'Rapid Spike', icon: <TrendingUp className="w-4 h-4" /> },
  cold_zone: { label: 'Cold Zone', icon: <Snowflake className="w-4 h-4" /> },
  camera_offline: { label: 'Camera Offline', icon: <WifiOff className="w-4 h-4" /> },
  device_overheat: { label: 'Device Overheat', icon: <Cpu className="w-4 h-4" /> },
  recording_failure: { label: 'Recording Failure', icon: <Video className="w-4 h-4" /> },
  disk_warning: { label: 'Disk Warning', icon: <HardDrive className="w-4 h-4" /> },
  plc_disconnect: { label: 'PLC Disconnect', icon: <Unplug className="w-4 h-4" /> },
};

const PRIORITY_BADGE: Record<AlertPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-status-critical-bg text-status-critical' },
  warning: { label: 'Warning', color: 'bg-status-warning-bg text-status-warning' },
  info: { label: 'Info', color: 'bg-status-info-bg text-status-info' },
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
// Rule Modal
// ---------------------------------------------------------------------------
function RuleModal({
  rule,
  onClose,
  onSave,
}: {
  rule?: AlertRule;
  onClose: () => void;
  onSave: (data: Partial<AlertRule>) => void;
}) {
  const groups = useGroupStore((s) => s.groups);

  const [name, setName] = useState(rule?.name ?? '');
  const [type, setType] = useState<AlertType>(rule?.type ?? 'temperature_breach');
  const [priority, setPriority] = useState<AlertPriority>(rule?.priority ?? 'warning');
  const [groupId, setGroupId] = useState(rule?.groupId ?? '');
  const [threshold, setThreshold] = useState(String(rule?.thresholdValue ?? ''));
  const [recipients, setRecipients] = useState(rule?.recipients.join(', ') ?? '');
  const [smsEnabled, setSmsEnabled] = useState(rule?.smsEnabled ?? true);
  const [emailEnabled, setEmailEnabled] = useState(rule?.emailEnabled ?? false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = () => {
    onSave({
      name,
      type,
      priority,
      groupId: groupId || undefined,
      thresholdValue: threshold ? Number(threshold) : undefined,
      recipients: recipients
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
      smsEnabled,
      emailEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">
            {rule ? 'Edit Rule' : 'New Alert Rule'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High Temperature Breach"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Alert Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
            >
              {ALL_ALERT_TYPES.map((t) => (
                <option key={t} value={t}>{ALERT_TYPE_CONFIG[t].label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(['info', 'warning', 'critical'] as AlertPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 py-2 text-sm font-semibold rounded-[var(--radius-md)] border transition-colors capitalize',
                    priority === p
                      ? PRIORITY_BADGE[p].color + ' border-transparent'
                      : 'border-border-default text-text-muted hover:text-text-primary hover:bg-bg-card-hover',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Threshold Value</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 1350"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Recipients (comma-separated)</label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="+91-9876543210, admin@jsw.in"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Delivery methods */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Delivery Methods</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-bg-card rounded-[var(--radius-md)] border border-border-default cursor-pointer hover:bg-bg-card-hover transition-colors">
                <input type="checkbox" checked={smsEnabled} onChange={() => setSmsEnabled(!smsEnabled)} className="w-4 h-4 accent-brand-primary" />
                <Phone className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-primary">SMS</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-bg-card rounded-[var(--radius-md)] border border-border-default cursor-pointer hover:bg-bg-card-hover transition-colors">
                <input type="checkbox" checked={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} className="w-4 h-4 accent-brand-primary" />
                <Mail className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-primary">Email</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            {rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AlertsConfigPage(): React.JSX.Element {
  const { rules, updateRule, removeRule, addRule } = useAlertStore();
  const groups = useGroupStore((s) => s.groups);

  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'All';
    return groups.find((g) => g.id === groupId)?.name ?? '—';
  };

  const handleToggle = (rule: AlertRule) => {
    updateRule(rule.id, { enabled: !rule.enabled });
  };

  const handleSaveNew = (data: Partial<AlertRule>) => {
    addRule({
      id: `rule-${Date.now()}`,
      name: data.name ?? '',
      type: data.type ?? 'temperature_breach',
      priority: data.priority ?? 'warning',
      enabled: true,
      groupId: data.groupId,
      thresholdValue: data.thresholdValue,
      recipients: data.recipients ?? [],
      smsEnabled: data.smsEnabled ?? true,
      emailEnabled: data.emailEnabled ?? false,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSaveEdit = (data: Partial<AlertRule>) => {
    if (editingRule) {
      updateRule(editingRule.id, data);
    }
  };

  const handleDelete = (id: string) => {
    removeRule(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-brand-primary" />
            Alert Configuration
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {rules.length} rules configured | {rules.filter((r) => r.enabled).length} active
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map((rule) => {
          const typeCfg = ALERT_TYPE_CONFIG[rule.type];
          const priorityCfg = PRIORITY_BADGE[rule.priority];
          const smsCount = rule.smsEnabled ? rule.recipients.filter((r) => r.startsWith('+')).length : 0;
          const emailCount = rule.emailEnabled ? rule.recipients.filter((r) => r.includes('@')).length : 0;

          return (
            <div
              key={rule.id}
              className={cn(
                'bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-4 transition-all shadow-[var(--shadow-card)]',
                !rule.enabled && 'opacity-50',
              )}
            >
              <div className="flex items-center gap-4">
                {/* Type icon */}
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)]',
                  rule.enabled ? 'bg-brand-primary/10 text-brand-primary' : 'bg-bg-secondary text-text-muted',
                )}>
                  {typeCfg.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-text-primary">{rule.name}</h3>
                    <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', priorityCfg.color)}>
                      {priorityCfg.label}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-semibold rounded-full',
                      rule.enabled ? 'bg-status-healthy-bg text-status-healthy' : 'bg-bg-secondary text-text-muted',
                    )}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                    <span>Type: {typeCfg.label}</span>
                    <span>Group: {getGroupName(rule.groupId)}</span>
                    {rule.thresholdValue !== undefined && (
                      <span>Threshold: {rule.thresholdValue}{rule.thresholdUnit ?? ''}</span>
                    )}
                    {rule.rateOfChange !== undefined && (
                      <span>Rate: {rule.rateOfChange} deg/s</span>
                    )}
                    {rule.duration !== undefined && (
                      <span>Duration: {rule.duration}s</span>
                    )}
                  </div>
                </div>

                {/* Delivery badges */}
                <div className="flex items-center gap-2">
                  {rule.smsEnabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bg-secondary text-text-secondary rounded-[var(--radius-sm)] border border-border-default">
                      <Phone className="w-3 h-3" />
                      SMS {smsCount > 0 && `(${smsCount})`}
                    </span>
                  )}
                  {rule.emailEnabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bg-secondary text-text-secondary rounded-[var(--radius-sm)] border border-border-default">
                      <Mail className="w-3 h-3" />
                      Email {emailCount > 0 && `(${emailCount})`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(rule)}
                    className="p-2 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
                    title={rule.enabled ? 'Disable' : 'Enable'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-status-healthy" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-2 text-text-muted hover:text-brand-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {deleteConfirm === rule.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="px-2 py-1 text-xs font-semibold bg-status-critical text-white rounded-[var(--radius-sm)] transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs font-semibold text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(rule.id)}
                      className="p-2 text-text-muted hover:text-status-critical rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <ShieldAlert className="w-10 h-10 mb-2" />
          <p className="text-sm">No alert rules configured</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="mt-3 text-sm font-medium text-brand-primary hover:underline"
          >
            Create your first rule
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewModal && (
        <RuleModal onClose={() => setShowNewModal(false)} onSave={handleSaveNew} />
      )}
      {editingRule && (
        <RuleModal rule={editingRule} onClose={() => setEditingRule(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
