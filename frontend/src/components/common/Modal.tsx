import {
  forwardRef,
  useEffect,
  useRef,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { cn } from '@/utils/cn';

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
} as const;

type ModalSize = keyof typeof sizeStyles;

interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Whether the modal is visible */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Modal title rendered in the header */
  title?: ReactNode;
  /** Content rendered in the sticky footer area */
  footer?: ReactNode;
  /** Size preset */
  size?: ModalSize;
  /** Allow closing by clicking the backdrop */
  closeOnBackdropClick?: boolean;
  /** Allow closing with the Escape key */
  closeOnEscape?: boolean;
  /** Hide the header close button */
  hideCloseButton?: boolean;
}

/**
 * Overlay modal with focus trap, Escape-to-close, and backdrop click support.
 *
 * Uses the high-contrast dark theme and slides in from top with the
 * `animate-slide-in` animation defined in the design tokens.
 */
const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      footer,
      size = 'md',
      closeOnBackdropClick = true,
      closeOnEscape = true,
      hideCloseButton = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Focus trap — cycle Tab through focusable elements inside the modal
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          e.stopPropagation();
          onClose();
          return;
        }

        if (e.key !== 'Tab') return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      },
      [closeOnEscape, onClose],
    );

    // Manage focus and body scroll lock
    useEffect(() => {
      if (open) {
        previousFocusRef.current = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        // Auto-focus the first focusable element in the dialog
        requestAnimationFrame(() => {
          const dialog = dialogRef.current;
          if (!dialog) return;
          const firstFocusable = dialog.querySelector<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
          firstFocusable?.focus();
        });
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousFocusRef.current?.focus();
      };
    }, [open, handleKeyDown]);

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay"
        onClick={handleBackdropClick}
        aria-hidden="true"
      >
        <div
          ref={(node) => {
            (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          className={cn(
            'relative flex flex-col w-full bg-bg-secondary rounded-[var(--radius-xl)]',
            'border border-border-default shadow-[var(--shadow-elevated)]',
            'animate-[slide-in-top_0.3s_ease-out]',
            'max-h-[90vh]',
            sizeStyles[size],
            className,
          )}
          {...props}
        >
          {/* Header */}
          {(title || !hideCloseButton) && (
            <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-border-default">
              {title && (
                <h2 className="text-xl font-bold text-text-primary truncate pr-4">{title}</h2>
              )}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'shrink-0 p-2 rounded-[var(--radius-md)] text-text-muted',
                    'hover:text-text-primary hover:bg-bg-tertiary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                    'transition-colors duration-150 cursor-pointer',
                    !title && 'ml-auto',
                  )}
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  },
);

Modal.displayName = 'Modal';

export { Modal };
export type { ModalProps, ModalSize };
