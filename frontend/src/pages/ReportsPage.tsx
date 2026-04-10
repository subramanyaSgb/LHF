import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useGroupStore } from '@/stores/groupStore';
import { mockReports } from '@/utils/mock-data';
import { formatDateTime, formatFileSize } from '@/utils/format';
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
} from 'lucide-react';
import type { Report, ReportType, ReportStatus } from '@/types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TYPE_BADGE: Record<ReportType, { label: string; color: string }> = {
  daily: { label: 'Daily', color: 'bg-status-info-bg text-status-info' },
  weekly: { label: 'Weekly', color: 'bg-brand-primary/10 text-brand-primary' },
  monthly: { label: 'Monthly', color: 'bg-brand-secondary/10 text-brand-secondary' },
  custom: { label: 'Custom', color: 'bg-status-warning-bg text-status-warning' },
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
  'Temperature Summary',
  'Alert History',
  'Heat Timeline',
  'Camera Uptime',
  'Ladle Life Status',
  'Anomaly Highlights',
  'Operator Notes',
];

// ---------------------------------------------------------------------------
// GenerateModal
// ---------------------------------------------------------------------------
function GenerateReportModal({ onClose }: { onClose: () => void }) {
  const groups = useGroupStore((s) => s.groups);
  const [type, setType] = useState<ReportType>('daily');
  const [dateFrom, setDateFrom] = useState('2026-04-09');
  const [dateTo, setDateTo] = useState('2026-04-10');
  const [groupFilter, setGroupFilter] = useState('all');
  const [checkedSections, setCheckedSections] = useState<Set<string>>(new Set(REPORT_SECTIONS));

  const toggleSection = (s: string) => {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay">
      <div className="w-full max-w-lg bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default shadow-[var(--shadow-elevated)] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">Generate Report</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Report Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
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

          {/* Sections checklist */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Include Sections</label>
            <div className="space-y-2">
              {REPORT_SECTIONS.map((section) => (
                <label
                  key={section}
                  className="flex items-center gap-3 px-3 py-2 bg-bg-card rounded-[var(--radius-md)] border border-border-default cursor-pointer hover:bg-bg-card-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedSections.has(section)}
                    onChange={() => toggleSection(section)}
                    className="w-4 h-4 rounded accent-brand-primary"
                  />
                  <span className="text-sm text-text-primary">{section}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-[var(--radius-md)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ReportsPage(): React.JSX.Element {
  const [showModal, setShowModal] = useState(false);
  const [reports] = useState<Report[]>(mockReports);

  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-primary" />
            Reports
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Generate and download daily, weekly, and custom reports
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
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
              {reports.map((report) => {
                const typeCfg = TYPE_BADGE[report.type];
                const statusCfg = STATUS_CONFIG[report.status];
                return (
                  <tr key={report.id} className="hover:bg-bg-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn('inline-block px-2.5 py-1 text-xs font-semibold rounded-full', typeCfg.color)}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">
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
                        {formatDateTime(report.dateFrom).split(',')[0]} — {formatDateTime(report.dateTo).split(',')[0]}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                      {formatDateTime(report.generatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
                      {formatFileSize(report.fileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {report.emailedTo.map((email) => (
                          <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary rounded-full border border-border-default">
                            <Mail className="w-3 h-3" />
                            {email}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={report.status !== 'completed'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:text-white bg-brand-primary/10 hover:bg-brand-primary disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <FileText className="w-10 h-10 mb-2" />
            <p className="text-sm">No reports generated yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <GenerateReportModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
