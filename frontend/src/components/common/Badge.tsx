import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const variantStyles = {
  healthy: 'bg-status-healthy-bg text-status-healthy border-status-healthy/30',
  warning: 'bg-status-warning-bg text-status-warning border-status-warning/30',
  critical: 'bg-status-critical-bg text-status-critical border-status-critical/30',
  info: 'bg-status-info-bg text-status-info border-status-info/30',
  offline: 'bg-bg-tertiary text-status-offline border-status-offline/30',
  default: 'bg-bg-tertiary text-text-secondary border-border-default',
} as const;

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
} as const;

type BadgeVariant = keyof typeof variantStyles;
type BadgeSize = keyof typeof sizeStyles;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Status variant that controls color */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Enable pulsing animation for active alerts */
  pulse?: boolean;
}

/**
 * Status badge for alerts, priorities, and state indicators.
 *
 * Colors map directly to the operational status palette so
 * operators can identify severity at a glance from across the floor.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', pulse = false, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold rounded-full border whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          pulse && 'animate-[pulse-alert_1s_ease-in-out_infinite]',
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
