import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useGroupStore } from '@/stores/groupStore';
import { useAuthStore } from '@/stores/authStore';
import { mockReports } from '@/utils/mock-data';
import { formatDateTime, formatFileSize, formatDate } from '@/utils/format';
import {
  FileText,
  Download,
  Plus,
  X,
  Mail,
  Calendar,
  CheckCircle2,
  Loader2,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Send,
  Clock,
  BarChart3,
  AlertTriangle,
  Thermometer,
  Camera as CameraIcon,
  Users,
  MessageSquareText,
  Flame,
} from 'lucide-react';
import { downloadReportPdf } from '@/utils/generate-pdf';
import type { Report, ReportType, ReportStatus } from '@/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TYPE_BADGE: Record<ReportType, { label: string; color: string; icon: React.ReactNode }> = {
  daily: { label: 'Daily', color: 'bg-status-info-bg text-status-info', icon: <Clock className="w-3.5 h-3.5" /> },
  weekly: { label: 'Weekly', color: 'bg-brand-primary/10 text-brand-primary', icon: <Calendar className="w-3.5 h-3.5" /> },
  monthly: { label: 'Monthly', color: 'bg-brand-secondary/10 text-brand-secondary', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  custom: { label: 'Custom', color: 'bg-status-warning-bg text-status-warning', icon: <Filter className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: React.ReactNode }> = {
  completed: {
    label: 'Completed',
    color: 'bg-status-healthy-bg text-status-healthy',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  generating: {
    label: 'Generating',
    color: 'bg-status-info-bg text-status-info',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-status-critical-bg text-status-critical',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const REPORT_SECTIONS = [
  { id: 'temp_summary', label: 'Temperature Summary', icon: <Thermometer className="w-4 h-4" /> },
  { id: 'alert_history', label: 'Alert History', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'heat_timeline', label: 'Heat Timeline', icon: <Flame className="w-4 h-4" /> },
  { id: 'camera_uptime', label: 'Camera Uptime', icon: <CameraIcon className="w-4 h-4" /> },
  { id: 'ladle_life', label: 'Ladle Life Status', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'anomaly', label: 'Anomaly Highlights', icon: <XCircle className="w-4 h-4" /> },
  { id: 'operator_notes', label: 'Operator Notes', icon: <MessageSquareText className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Report Preview Modal
// ---------------------------------------------------------------------------
function ReportPreviewModal({ report, onClose }: { report: Report; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const typeCfg = TYPE_BADGE[report.type];
  const statusCfg = STATUS_CONFIG[report.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
          <h2 className="text-lg font-bold text-text-primary">Report Details</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Title & badges */}
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">{report.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', typeCfg.color)}>
                {typeCfg.icon}
                {typeCfg.label}
              </span>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', statusCfg.color)}>
                {statusCfg.icon}
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-card rounded-[var(--radius-md)] border border-border-default p-4">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Date Range</span>
              <p className="text-sm font-semibold text-text-primary mt-1">
                {formatDate(report.dateFrom)} — {formatDate(report.dateTo)}
              </p>
            </div>
            <div className="bg-bg-card rounded-[var(--radius-md)] border border-border-default p-4">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Generated</span>
              <p className="text-sm font-semibold text-text-primary mt-1">{formatDateTime(report.generatedAt)}</p>
            </div>
            <div className="bg-bg-card rounded-[var(--radius-md)] border border-border-default p-4">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">File Size</span>
              <p className="text-sm font-semibold text-text-primary mt-1">{formatFileSize(report.fileSize)}</p>
            </div>
            <div className="bg-bg-card rounded-[var(--radius-md)] border border-border-default p-4">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Emailed To</span>
              <div className="mt-1">
                {report.emailedTo.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {report.emailedTo.map((email) => (
                      <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary rounded-full border border-border-default">
                        <Mail className="w-3 h-3" />
                        {email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-text-muted">Not emailed</span>
                )}
              </div>
            </div>
          </div>

          {/* Report content preview (placeholder) */}
          <div className="bg-bg-card rounded-[var(--radius-md)] border border-border-default p-5">
            <h4 className="text-sm font-bold text-text-primary mb-3">Report Contents</h4>
            {report.status === 'completed' ? (
              <div className="space-y-3">
                {REPORT_SECTIONS.map((section) => (
                  <div key={section.id} className="flex items-center gap-3 py-2 px-3 bg-bg-secondary rounded-[var(--radius-sm)]">
                    <span className="text-brand-primary">{section.icon}</span>
                    <span className="text-sm text-text-primary">{section.label}</span>
                    <CheckCircle2 className="w-4 h-4 text-status-healthy ml-auto" />
                  </div>
                ))}
              </div>
            ) : report.status === 'generating' ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                <span className="text-sm text-text-secondary">Report is being generated...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 gap-3">
                <XCircle className="w-6 h-6 text-status-critical" />
                <span className="text-sm text-status-critical">Report generation failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
            Close
          </button>
          {report.status === 'completed' && (
            <button
              onClick={() => downloadReportPdf(report)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email Report Modal
// ---------------------------------------------------------------------------
function EmailReportModal({ report, onClose, onSend }: { report: Report; onClose: () => void; onSend: (emails: string[]) => void }) {
  const [emailInput, setEmailInput] = useState(report.emailedTo.join(', '));

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSend = () => {
    const emails = emailInput.split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    onSend(emails);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">Email Report</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            Send <strong className="text-text-primary">{report.title}</strong> to the following email addresses:
          </p>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Recipients (comma separated)</label>
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="admin@jsw.in, manager@jsw.in"
              rows={3}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!emailInput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------
function DeleteConfirmModal({ report, onClose, onConfirm }: { report: Report; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4 p-6">
        <h2 className="text-lg font-bold text-status-critical mb-3">Delete Report</h2>
        <p className="text-sm text-text-secondary mb-6">
          Are you sure you want to delete <strong className="text-text-primary">{report.title}</strong>? This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-status-critical hover:bg-thermal-extreme text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate Report Modal
// ---------------------------------------------------------------------------
function GenerateReportModal({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (report: Report) => void;
}) {
  const groups = useGroupStore((s) => s.groups);
  const [type, setType] = useState<ReportType>('daily');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [checkedSections, setCheckedSections] = useState<Set<string>>(
    new Set(REPORT_SECTIONS.map((s) => s.id))
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Auto-adjust dates based on type
  useEffect(() => {
    const now = new Date();
    if (type === 'daily') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      setDateFrom(yesterday.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else if (type === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setDateFrom(weekAgo.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else if (type === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      setDateFrom(monthAgo.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    }
  }, [type]);

  const toggleSection = (id: string) => {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setCheckedSections(new Set(REPORT_SECTIONS.map((s) => s.id)));
  const deselectAll = () => setCheckedSections(new Set());

  const handleGenerate = () => {
    const groupName = groupFilter === 'all'
      ? 'All Groups'
      : groups.find((g) => g.id === groupFilter)?.name ?? 'Unknown';
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${groupName} (${dateFrom} to ${dateTo})`;
    const emails = emailRecipients.split(',').map((e) => e.trim()).filter(Boolean);

    const newReport: Report = {
      id: `rpt-${Date.now()}`,
      type,
      title,
      status: 'generating',
      dateFrom: `${dateFrom}T00:00:00Z`,
      dateTo: `${dateTo}T23:59:59Z`,
      generatedAt: new Date().toISOString(),
      filePath: `/reports/${type}-${Date.now()}.pdf`,
      fileSize: 0,
      emailedTo: emails,
    };
    onGenerate(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
          <h2 className="text-lg font-bold text-text-primary">Generate Report</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Report Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['daily', 'weekly', 'monthly', 'custom'] as ReportType[]).map((t) => {
                const cfg = TYPE_BADGE[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-3 py-2.5 rounded-[var(--radius-md)] border-2 text-sm font-semibold transition-all cursor-pointer',
                      type === t
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-border-default text-text-muted hover:border-border-focus hover:text-text-primary'
                    )}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
              />
            </div>
          </div>

          {/* Group filter */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Group</label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Email recipients */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Email Recipients (optional)</label>
            <input
              type="text"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="admin@jsw.in, manager@jsw.in"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Sections checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text-primary">Include Sections</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-brand-primary hover:underline">Select All</button>
                <span className="text-text-muted">|</span>
                <button type="button" onClick={deselectAll} className="text-xs text-brand-primary hover:underline">None</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {REPORT_SECTIONS.map((section) => (
                <label
                  key={section.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border cursor-pointer transition-colors',
                    checkedSections.has(section.id)
                      ? 'bg-brand-primary/5 border-brand-primary/30'
                      : 'bg-bg-card border-border-default hover:bg-bg-card-hover'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checkedSections.has(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="w-4 h-4 rounded accent-brand-primary"
                  />
                  <span className={cn('text-sm', checkedSections.has(section.id) ? 'text-text-primary' : 'text-text-muted')}>
                    {section.icon}
                  </span>
                  <span className={cn('text-sm', checkedSections.has(section.id) ? 'text-text-primary font-medium' : 'text-text-muted')}>
                    {section.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-default shrink-0">
          <span className="text-xs text-text-muted">
            {checkedSections.size}/{REPORT_SECTIONS.length} sections selected
          </span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={checkedSections.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ReportsPage(): React.JSX.Element {
  const isAdmin = useAuthStore((s) => s.hasMinRole('admin'));
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ReportType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [emailReport, setEmailReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const generateTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(generateTimerRef.current), []);

  const handleGenerate = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev]);
    // Simulate report completion after 2-4 seconds
    const delay = 2000 + Math.random() * 2000;
    generateTimerRef.current = setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: 'completed' as const,
                fileSize: 512 * 1024 + Math.floor(Math.random() * 2 * 1024 * 1024),
              }
            : r
        )
      );
    }, delay);
  }, []);

  const handleRetry = useCallback((reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'generating' as const } : r
      )
    );
    generateTimerRef.current = setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'completed' as const, fileSize: 512 * 1024 + Math.floor(Math.random() * 2 * 1024 * 1024) }
            : r
        )
      );
    }, 2500);
  }, []);

  const handleDelete = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setDeleteReport(null);
  }, []);

  const handleEmail = useCallback((reportId: string, emails: string[]) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, emailedTo: [...new Set([...r.emailedTo, ...emails])] } : r
      )
    );
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [reports, search, filterType, filterStatus]);

  // Stats
  const totalReports = reports.length;
  const completedCount = reports.filter((r) => r.status === 'completed').length;
  const generatingCount = reports.filter((r) => r.status === 'generating').length;

  return (
    <div className="p-4 md:p-6 min-h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-primary" />
            Reports
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalReports} reports &middot; {completedCount} completed
            {generatingCount > 0 && <> &middot; <span className="text-status-info">{generatingCount} generating</span></>}
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold rounded-[var(--radius-md)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ReportType | 'all')}
          className="px-3 py-2.5 text-sm bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Types</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
          className="px-3 py-2.5 text-sm bg-bg-input border border-border-default rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="generating">Generating</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Reports table */}
      <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                {['Type', 'Title', 'Status', 'Date Range', 'Generated', 'Size', 'Emailed To', 'Actions'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filteredReports.map((report) => {
                const typeCfg = TYPE_BADGE[report.type];
                const statusCfg = STATUS_CONFIG[report.status];
                return (
                  <tr key={report.id} className="hover:bg-bg-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', typeCfg.color)}>
                        {typeCfg.icon}
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-primary max-w-[250px] truncate">
                      {report.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', statusCfg.color)}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        {formatDate(report.dateFrom)} — {formatDate(report.dateTo)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                      {formatDateTime(report.generatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
                      {report.fileSize > 0 ? formatFileSize(report.fileSize) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {report.emailedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {report.emailedTo.slice(0, 2).map((email) => (
                            <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary rounded-full border border-border-default truncate max-w-[120px]">
                              <Mail className="w-3 h-3 shrink-0" />
                              {email}
                            </span>
                          ))}
                          {report.emailedTo.length > 2 && (
                            <span className="text-xs text-text-muted">+{report.emailedTo.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => setPreviewReport(report)}
                          className="p-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-[var(--radius-sm)] transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Download */}
                        <button
                          disabled={report.status !== 'completed'}
                          onClick={() => report.status === 'completed' && downloadReportPdf(report)}}
                          className="p-1.5 text-text-muted hover:text-status-healthy hover:bg-status-healthy-bg disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-sm)] transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {/* Email */}
                        <button
                          disabled={report.status !== 'completed'}
                          onClick={() => report.status === 'completed' && setEmailReport(report)}
                          className="p-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-sm)] transition-colors"
                          title="Email report"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {/* Retry (failed only) */}
                        {report.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(report.id)}
                            className="p-1.5 text-text-muted hover:text-status-warning hover:bg-status-warning-bg rounded-[var(--radius-sm)] transition-colors"
                            title="Retry generation"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {/* Delete (admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteReport(report)}
                            className="p-1.5 text-text-muted hover:text-status-critical hover:bg-status-critical-bg rounded-[var(--radius-sm)] transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-base font-semibold">
              {search || filterType !== 'all' || filterStatus !== 'all'
                ? 'No reports match your filters'
                : 'No reports generated yet'}
            </p>
            <p className="text-sm mt-1">
              {!search && filterType === 'all' && filterStatus === 'all'
                ? 'Click "Generate Report" to create your first report'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showGenerateModal && (
        <GenerateReportModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerate}
        />
      )}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
      {emailReport && (
        <EmailReportModal
          report={emailReport}
          onClose={() => setEmailReport(null)}
          onSend={(emails) => handleEmail(emailReport.id, emails)}
        />
      )}
      {deleteReport && (
        <DeleteConfirmModal
          report={deleteReport}
          onClose={() => setDeleteReport(null)}
          onConfirm={() => handleDelete(deleteReport.id)}
        />
      )}
    </div>
  );
}
