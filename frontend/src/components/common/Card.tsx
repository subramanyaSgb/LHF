import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

const variantStyles = {
  default: 'bg-bg-card shadow-[var(--shadow-card)]',
  elevated: 'bg-bg-card shadow-[var(--shadow-elevated)]',
  bordered: 'bg-bg-card border border-border-default',
} as const;

type CardVariant = keyof typeof variantStyles;

type AlertFlash = 'critical' | 'warning' | null;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant;
  /** Optional header content rendered inside a top section */
  header?: ReactNode;
  /** Optional footer content rendered inside a bottom section */
  footer?: ReactNode;
  /** Enable hover brightness lift */
  hover?: boolean;
  /** Animated alert flash border for active alerts */
  alertFlash?: AlertFlash;
  /** Remove default padding (useful for embedding full-bleed content) */
  noPadding?: boolean;
}

/**
 * Container card with optional header/footer and alert flash border.
 *
 * The `alertFlash` prop triggers a pulsing colored border to draw
 * operator attention to cameras or processes with active alerts.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      header,
      footer,
      hover = false,
      alertFlash = null,
      noPadding = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-lg)] transition-all duration-200',
          variantStyles[variant],
          hover && 'hover:bg-bg-card-hover cursor-pointer',
          alertFlash === 'critical' &&
            'ring-2 ring-status-critical/60 animate-[pulse-alert_1s_ease-in-out_infinite] shadow-[var(--shadow-glow-critical)]',
          alertFlash === 'warning' &&
            'ring-2 ring-status-warning/60 animate-[pulse-alert_1s_ease-in-out_infinite] shadow-[var(--shadow-glow-warning)]',
          className,
        )}
        {...props}
      >
        {header && (
          <div
            className={cn(
              'border-b border-border-default px-6 py-4 font-semibold text-lg text-text-primary',
              noPadding && 'px-0',
            )}
          >
            {header}
          </div>
        )}

        <div className={cn(!noPadding && 'p-6')}>{children}</div>

        {footer && (
          <div
            className={cn(
              'border-t border-border-default px-6 py-4',
              noPadding && 'px-0',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    );
  },
);

Card.displayName = 'Card';

export { Card };
export type { CardProps, CardVariant, AlertFlash };
