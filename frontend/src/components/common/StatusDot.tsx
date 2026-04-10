import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const statusColorStyles = {
  healthy: 'bg-status-healthy',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
  info: 'bg-status-info',
  offline: 'bg-status-offline',
} as const;

const pulseRingStyles = {
  healthy: 'bg-status-healthy/40',
  warning: 'bg-status-warning/40',
  critical: 'bg-status-critical/40',
  info: 'bg-status-info/40',
  offline: 'bg-status-offline/40',
} as const;

const dotSizeStyles = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
} as const;

const pulseSizeStyles = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
} as const;

const labelSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

type StatusDotStatus = keyof typeof statusColorStyles;
type StatusDotSize = keyof typeof dotSizeStyles;

interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  /** Status color */
  status?: StatusDotStatus;
  /** Size of the dot */
  size?: StatusDotSize;
  /** Enable pulsing ring animation */
  pulse?: boolean;
  /** Optional label text rendered beside the dot */
  label?: string;
}

/**
 * Colored dot indicator for connection state, camera health, etc.
 *
 * Optional pulsing ring draws attention to live / active states.
 * The label is positioned to the right of the dot for inline use.
 */
const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ status = 'offline', size = 'md', pulse = false, label, className, ...props }, ref) => {
    const srLabel =
      label ?? `Status: ${status}`;

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
        role="status"
        aria-label={srLabel}
        {...props}
      >
        <span className="relative inline-flex shrink-0">
          {pulse && (
            <span
              className={cn(
                'absolute inset-0 rounded-full animate-ping',
                pulseSizeStyles[size],
                pulseRingStyles[status],
              )}
              aria-hidden="true"
            />
          )}
          <span
            className={cn('relative rounded-full', dotSizeStyles[size], statusColorStyles[status])}
            aria-hidden="true"
          />
        </span>

        {label && (
          <span className={cn('text-text-primary font-medium', labelSizeStyles[size])}>
            {label}
          </span>
        )}
      </span>
    );
  },
);

StatusDot.displayName = 'StatusDot';

export { StatusDot };
export type { StatusDotProps, StatusDotStatus, StatusDotSize };
