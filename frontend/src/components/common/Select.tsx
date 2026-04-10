import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/utils/cn';

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)] pr-8',
  md: 'px-4 py-2.5 text-base rounded-[var(--radius-md)] pr-10',
  lg: 'px-5 py-4 text-lg rounded-[var(--radius-lg)] pr-12 min-h-[56px]',
} as const;

const labelSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

const chevronSizeStyles = {
  sm: 'right-2 w-4 h-4',
  md: 'right-3 w-5 h-5',
  lg: 'right-4 w-6 h-6',
} as const;

type SelectSize = keyof typeof sizeStyles;

interface SelectOption {
  /** Option value */
  value: string;
  /** Display label — falls back to value if omitted */
  label?: string;
  /** Disable this option */
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Visible label above the select */
  label?: string;
  /** Validation error message */
  error?: string;
  /** Helper text shown below the select */
  helperText?: string;
  /** Size preset */
  size?: SelectSize;
  /** Options to render — can also use children for custom <option> elements */
  options?: SelectOption[];
  /** Placeholder text shown as disabled first option */
  placeholder?: string;
  /** Stretch to fill container width */
  fullWidth?: boolean;
  /** Additional class names for the outer wrapper */
  wrapperClassName?: string;
  /** Optional children — rendered inside <select> after placeholder and options */
  children?: ReactNode;
}

/**
 * Dropdown select with label, error state, and dark theme styling.
 *
 * The `lg` size provides an oversized touch target for factory-floor use.
 * Supports both declarative `options` prop and manual `<option>` children.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      options,
      placeholder,
      fullWidth = false,
      wrapperClassName,
      className,
      id: externalId,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = externalId ?? generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'font-medium text-text-primary',
              labelSizeStyles[size],
              disabled && 'opacity-50',
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              // Base
              'w-full appearance-none bg-bg-input text-text-primary',
              'border font-medium',
              'transition-colors duration-150 ease-in-out',
              'focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus',
              'cursor-pointer',
              // Size
              sizeStyles[size],
              // Border
              error ? 'border-status-critical' : 'border-border-default',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label ?? opt.value}
              </option>
            ))}
            {children}
          </select>

          {/* Chevron */}
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-muted',
              chevronSizeStyles[size],
            )}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-full h-full"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
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

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption, SelectSize };
