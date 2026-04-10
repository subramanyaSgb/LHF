import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/utils/cn';

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-4 py-2.5 text-base rounded-[var(--radius-md)]',
  lg: 'px-5 py-4 text-lg rounded-[var(--radius-lg)] min-h-[56px]',
} as const;

const labelSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

type InputSize = keyof typeof sizeStyles;

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label above the input */
  label?: string;
  /** Validation error message — triggers error styling */
  error?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Size preset — lg is designed for factory-floor readability */
  size?: InputSize;
  /** Icon or element rendered at the start of the input */
  prefixIcon?: ReactNode;
  /** Icon or element rendered at the end of the input */
  suffixIcon?: ReactNode;
  /** Stretch to fill container width */
  fullWidth?: boolean;
  /** Additional class names for the outer wrapper */
  wrapperClassName?: string;
}

/**
 * Text input with label, error state, and icon support.
 *
 * Styled for the high-contrast dark industrial theme with oversized
 * `lg` variant for factory-floor touch screens.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      prefixIcon,
      suffixIcon,
      fullWidth = false,
      wrapperClassName,
      className,
      id: externalId,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'font-medium text-text-primary',
              labelSizeStyles[size],
              disabled && 'opacity-50',
            )}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {prefixIcon && (
            <span
              className={cn(
                'absolute left-3 flex items-center text-text-muted pointer-events-none',
                size === 'lg' && 'left-4',
              )}
              aria-hidden="true"
            >
              {prefixIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              // Base
              'w-full bg-bg-input text-text-primary placeholder-text-muted',
              'border font-medium',
              'transition-colors duration-150 ease-in-out',
              'focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus',
              // Size
              sizeStyles[size],
              // Default border
              error ? 'border-status-critical' : 'border-border-default',
              // Icons padding
              prefixIcon && (size === 'lg' ? 'pl-12' : 'pl-10'),
              suffixIcon && (size === 'lg' ? 'pr-12' : 'pr-10'),
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className,
            )}
            {...props}
          />

          {suffixIcon && (
            <span
              className={cn(
                'absolute right-3 flex items-center text-text-muted pointer-events-none',
                size === 'lg' && 'right-4',
              )}
              aria-hidden="true"
            >
              {suffixIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-status-critical text-sm font-medium">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-text-muted text-sm">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps, InputSize };
