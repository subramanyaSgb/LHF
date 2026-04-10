import {
  useState,
  useCallback,
  useRef,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TabItem {
  /** Unique key for this tab */
  key: string;
  /** Label displayed in the tab button */
  label: ReactNode;
  /** Tab panel content */
  content: ReactNode;
  /** Disable this tab */
  disabled?: boolean;
  /** Optional icon rendered before the label */
  icon?: ReactNode;
}

interface TabsProps {
  /** Tab definitions */
  items: TabItem[];
  /** Controlled active tab key */
  activeKey?: string;
  /** Default active tab key (uncontrolled) */
  defaultActiveKey?: string;
  /** Callback when the active tab changes */
  onChange?: (key: string) => void;
  /** Size of tab buttons */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch tabs to fill the full width */
  fullWidth?: boolean;
  /** Additional class names for the outer container */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Size mappings                                                      */
/* ------------------------------------------------------------------ */

const tabButtonSizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg min-h-[52px]',
} as const;

/* ------------------------------------------------------------------ */
/*  Tabs component                                                     */
/* ------------------------------------------------------------------ */

/**
 * Tab navigation with large touch targets and bottom-border active state.
 *
 * Implements full ARIA tablist/tab/tabpanel semantics with keyboard
 * arrow-key navigation per WAI-ARIA Tabs pattern.
 */
function Tabs({
  items,
  activeKey: controlledKey,
  defaultActiveKey,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
}: TabsProps) {
  const instanceId = useId();

  const [internalKey, setInternalKey] = useState<string>(
    () => defaultActiveKey ?? items.find((t) => !t.disabled)?.key ?? '',
  );

  const currentKey = controlledKey ?? internalKey;
  const tabListRef = useRef<HTMLDivElement>(null);

  const enabledItems = items.filter((t) => !t.disabled);

  const selectTab = useCallback(
    (key: string) => {
      if (!controlledKey) setInternalKey(key);
      onChange?.(key);
    },
    [controlledKey, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = enabledItems.findIndex((t) => t.key === currentKey);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % enabledItems.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = enabledItems.length - 1;
          break;
        default:
          return;
      }

      const nextKey = enabledItems[nextIndex].key;
      selectTab(nextKey);

      // Focus the tab button
      const btn = tabListRef.current?.querySelector<HTMLButtonElement>(
        `[data-tab-key="${nextKey}"]`,
      );
      btn?.focus();
    },
    [currentKey, enabledItems, selectTab],
  );

  const activeItem = items.find((t) => t.key === currentKey);

  const tabId = (key: string) => `${instanceId}-tab-${key}`;
  const panelId = (key: string) => `${instanceId}-panel-${key}`;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab list */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={cn(
          'flex border-b border-border-default overflow-x-auto',
          fullWidth && '[&>button]:flex-1',
        )}
      >
        {items.map((tab) => {
          const isActive = tab.key === currentKey;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={tabId(tab.key)}
              data-tab-key={tab.key}
              aria-selected={isActive}
              aria-controls={panelId(tab.key)}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => selectTab(tab.key)}
              className={cn(
                'relative inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap',
                'transition-colors duration-150 ease-in-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-inset',
                'cursor-pointer select-none',
                tabButtonSizeStyles[size],
                isActive
                  ? 'text-brand-primary'
                  : 'text-text-muted hover:text-text-primary',
                tab.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>

              {/* Active indicator — bottom accent bar */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-primary rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
      {activeItem && (
        <div
          key={activeItem.key}
          role="tabpanel"
          id={panelId(activeItem.key)}
          aria-labelledby={tabId(activeItem.key)}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}

Tabs.displayName = 'Tabs';

export { Tabs };
export type { TabsProps, TabItem };
