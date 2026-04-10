import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { useAlertStore } from '@/stores/alertStore';
import { formatRelative } from '@/utils/format';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  CheckCircle2,
} from 'lucide-react';

const AUTO_HIDE_MS = 30_000;

interface AlertBannerProps {
  className?: string;
}

export default function AlertBanner({ className }: AlertBannerProps) {
  const getUnacknowledgedAlerts = useAlertStore((s) => s.getUnacknowledgedAlerts);
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert);

  const unacknowledged = getUnacknowledgedAlerts();
  const latestAlert = unacknowledged.length > 0 ? unacknowledged[0] : null;

  const [dismissed, setDismissed] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Show banner when a new unacknowledged alert appears
  useEffect(() => {
    if (latestAlert && latestAlert.id !== dismissed) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [latestAlert, dismissed]);

  // Auto-hide after 30 seconds
  useEffect(() => {
    if (!visible || !latestAlert) return;

    const timer = setTimeout(() => {
      setVisible(false);
    }, AUTO_HIDE_MS);

    return () => clearTimeout(timer);
  }, [visible, latestAlert]);

  const handleAcknowledge = useCallback(() => {
    if (!latestAlert) return;
    acknowledgeAlert(latestAlert.id, 'current-user');
    setVisible(false);
  }, [latestAlert, acknowledgeAlert]);

  const handleDismiss = useCallback(() => {
    if (latestAlert) {
      setDismissed(latestAlert.id);
    }
    setVisible(false);
  }, [latestAlert]);

  if (!visible || !latestAlert) return null;

  const isCritical = latestAlert.priority === 'critical';
  const isWarning = latestAlert.priority === 'warning';

  const PriorityIcon = isCritical
    ? AlertOctagon
    : isWarning
      ? AlertTriangle
      : Info;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 animate-slide-in',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-5xl mt-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-elevated)]',
          'flex items-center gap-4 px-5 py-3',
          'border-l-4',
          isCritical && 'bg-status-critical/10 border-status-critical',
          isWarning && 'bg-status-warning/10 border-status-warning',
          !isCritical && !isWarning && 'bg-status-info/10 border-status-info',
        )}
      >
        {/* Priority icon */}
        <PriorityIcon
          size={28}
          className={cn(
            'shrink-0',
            isCritical && 'text-status-critical',
            isWarning && 'text-status-warning',
            !isCritical && !isWarning && 'text-status-info',
          )}
        />

        {/* Message body */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-text-primary leading-tight truncate">
            {latestAlert.message}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {latestAlert.cameraName && (
              <span className="font-semibold">{latestAlert.cameraName}</span>
            )}
            {latestAlert.cameraName && ' \u00B7 '}
            {formatRelative(latestAlert.timestamp)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAcknowledge}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2',
              'text-sm font-extrabold uppercase tracking-wide transition-colors cursor-pointer',
              isCritical
                ? 'bg-status-critical text-white hover:bg-status-critical/80'
                : isWarning
                  ? 'bg-status-warning text-bg-primary hover:bg-status-warning/80'
                  : 'bg-status-info text-white hover:bg-status-info/80',
            )}
          >
            <CheckCircle2 size={16} />
            ACK
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
