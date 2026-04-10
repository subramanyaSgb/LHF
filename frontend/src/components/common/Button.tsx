import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

const variantStyles = {
  primary:
    'bg-brand-primary text-text-primary hover:bg-brand-primary-hover focus-visible:ring-brand-primary active:brightness-90',
  secondary:
    'bg-bg-tertiary text-text-primary border border-border-default hover:bg-bg-card-hover focus-visible:ring-border-default active:brightness-90',
  danger:
    'bg-status-critical text-text-primary hover:brightness-110 focus-visible:ring-status-critical active:brightness-90',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary focus-visible:ring-border-default',
  outline:
    'bg-transparent text-brand-primary border border-brand-primary hover:bg-brand-primary hover:text-text-primary focus-visible:ring-brand-primary',
} as const;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-[var(--radius-sm)]',
  md: 'px-5 py-2.5 text-base gap-2 rounded-[var(--radius-md)]',
  lg: 'px-8 py-4 text-lg gap-3 rounded-[var(--radius-lg)] min-h-[56px]',
} as const;

const iconOnlySizeStyles = {
  sm: 'p-1.5',
  md: 'p-2.5',
  lg: 'p-4',
} as const;

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size preset — lg is designed for factory-floor touch targets */
  size?: ButtonSize;
  /** Show a loading spinner and disable interaction */
  loading?: boolean;
  /** Icon element rendered before the label */
  iconLeft?: ReactNode;
  /** Icon element rendered after the label */
  iconRight?: ReactNode;
  /** Stretch to fill container width */
  fullWidth?: boolean;
}

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const spinnerSizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

/**
 * Primary action button with high-contrast industrial styling.
 *
 * The `lg` size provides an oversized touch target suitable for
 * factory-floor touch screens and glanceability from 3+ meters.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const isIconOnly = !children && (iconLeft || iconRight);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'cursor-pointer select-none',
          // Variant
          variantStyles[variant],
          // Size
          isIconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],
          // Modifiers
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className,
        )}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Spinner className={spinnerSizeStyles[size]} />
        ) : (
          iconLeft && <span className="shrink-0">{iconLeft}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
