import { forwardRef, useId, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Whether the toggle is on */
  checked?: boolean;
  /** Callback when the toggle state changes */
  onChange?: (checked: boolean) => void;
  /** Label text rendered beside the toggle */
  label?: string;
  /** Place the label before or after the toggle */
  labelPosition?: 'left' | 'right';
  /** Disable interaction */
  disabled?: boolean;
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
}

const trackSizeStyles = {
  sm: 'h-5 w-9',
  md: 'h-7 w-12',
  lg: 'h-9 w-16',
} as const;

const thumbSizeStyles = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
} as const;

const thumbTranslate = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-7',
} as const;

const labelSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

/**
 * Toggle switch for binary on/off states.
 *
 * Provides an oversized `lg` touch target for factory-floor use
 * and proper ARIA switch semantics for accessibility.
 */
const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked = false,
      onChange,
      label,
      labelPosition = 'right',
      disabled = false,
      size = 'md',
      className,
      id: externalId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const toggleId = externalId ?? generatedId;

    const handleClick = () => {
      if (!disabled) {
        onChange?.(!checked);
      }
    };

    const track = (
      <button
        ref={ref}
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : 'Toggle'}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'cursor-pointer',
          trackSizeStyles[size],
          checked ? 'bg-brand-primary' : 'bg-bg-tertiary border border-border-default',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block rounded-full bg-text-primary shadow-sm',
            'transform transition-transform duration-200 ease-in-out',
            thumbSizeStyles[size],
            checked ? thumbTranslate[size] : 'translate-x-0.5',
          )}
        />
      </button>
    );

    if (!label) {
      return <div className={className}>{track}</div>;
    }

    return (
      <div className={cn('inline-flex items-center gap-3', disabled && 'opacity-50', className)}>
        {labelPosition === 'left' && (
          <label
            htmlFor={toggleId}
            className={cn('font-medium text-text-primary cursor-pointer', labelSizeStyles[size], disabled && 'cursor-not-allowed')}
          >
            {label}
          </label>
        )}
        {track}
        {labelPosition === 'right' && (
          <label
            htmlFor={toggleId}
            className={cn('font-medium text-text-primary cursor-pointer', labelSizeStyles[size], disabled && 'cursor-not-allowed')}
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

Toggle.displayName = 'Toggle';

export { Toggle };
export type { ToggleProps };
