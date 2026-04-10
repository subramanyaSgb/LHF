import {
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ */
/*  Sort types                                                         */
/* ------------------------------------------------------------------ */

type SortDirection = 'asc' | 'desc';

interface SortState<K extends string = string> {
  column: K;
  direction: SortDirection;
}

/* ------------------------------------------------------------------ */
/*  Column definition                                                  */
/* ------------------------------------------------------------------ */

interface TableColumn<T> {
  /** Unique key identifying the column — used for sorting and as React key */
  key: string;
  /** Header label */
  header: ReactNode;
  /** Render the cell content for a given row */
  render: (row: T, rowIndex: number) => ReactNode;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Custom comparator for sorting (receives two row objects). Falls back to key-based comparison. */
  compare?: (a: T, b: T) => number;
  /** Extra classes applied to <th> */
  headerClassName?: string;
  /** Extra classes applied to every <td> in this column */
  cellClassName?: string;
  /** Column width hint (Tailwind or CSS) */
  width?: string;
}

/* ------------------------------------------------------------------ */
/*  Table props                                                        */
/* ------------------------------------------------------------------ */

interface TableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Row data */
  data: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T, index: number) => string | number;
  /** Click handler for an entire row */
  onRowClick?: (row: T, index: number) => void;
  /** Controlled sort state */
  sort?: SortState;
  /** Callback when a sortable column header is clicked */
  onSortChange?: (sort: SortState) => void;
  /** Enable client-side sorting (when `onSortChange` is not provided) */
  clientSort?: boolean;
  /** Enable striped rows */
  striped?: boolean;
  /** Content shown when data is empty */
  emptyContent?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Sort indicator                                                     */
/* ------------------------------------------------------------------ */

const SortIndicator = ({ direction, active }: { direction?: SortDirection; active: boolean }) => (
  <span
    className={cn(
      'inline-flex flex-col ml-1.5 leading-none',
      !active && 'opacity-30',
    )}
    aria-hidden="true"
  >
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      className={cn(
        'transition-colors',
        active && direction === 'asc' ? 'text-brand-primary' : 'text-text-muted',
      )}
    >
      <path d="M5 0L10 6H0L5 0Z" fill="currentColor" />
    </svg>
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      className={cn(
        'transition-colors mt-0.5',
        active && direction === 'desc' ? 'text-brand-primary' : 'text-text-muted',
      )}
    >
      <path d="M5 6L0 0H10L5 6Z" fill="currentColor" />
    </svg>
  </span>
);

/* ------------------------------------------------------------------ */
/*  Sort header button                                                 */
/* ------------------------------------------------------------------ */

interface SortHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable: boolean;
  active: boolean;
  direction?: SortDirection;
  onToggle: () => void;
  width?: string;
}

const SortHeader = ({
  sortable,
  active,
  direction,
  onToggle,
  width,
  className,
  children,
  ...thProps
}: SortHeaderProps) => (
  <th
    className={cn(
      'px-4 py-3 text-left text-base font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap',
      'bg-bg-secondary',
      sortable && 'cursor-pointer select-none hover:text-text-primary',
      className,
    )}
    style={width ? { width } : undefined}
    onClick={sortable ? onToggle : undefined}
    aria-sort={
      !sortable
        ? undefined
        : active
          ? direction === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
    }
    {...thProps}
  >
    <span className="inline-flex items-center">
      {children}
      {sortable && <SortIndicator active={active} direction={direction} />}
    </span>
  </th>
);

/* ------------------------------------------------------------------ */
/*  Table component                                                    */
/* ------------------------------------------------------------------ */

/**
 * Data table with sortable columns, striped rows, and row click handler.
 *
 * Uses oversized text and generous padding for factory-floor readability.
 * Wraps in a horizontally scrollable container for responsive behavior.
 */
function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  sort: controlledSort,
  onSortChange,
  clientSort = false,
  striped = true,
  emptyContent,
  className,
  ...props
}: TableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(null);

  const activeSort = controlledSort ?? internalSort;
  const isControlled = !!onSortChange;

  const handleSortToggle = useCallback(
    (columnKey: string) => {
      const next: SortState =
        activeSort?.column === columnKey && activeSort.direction === 'asc'
          ? { column: columnKey, direction: 'desc' }
          : { column: columnKey, direction: 'asc' };

      if (isControlled) {
        onSortChange?.(next);
      } else {
        setInternalSort(next);
      }
    },
    [activeSort, isControlled, onSortChange],
  );

  // Client-side sorting
  const sortedData = useMemo(() => {
    if (!clientSort || !activeSort) return data;

    const col = columns.find((c) => c.key === activeSort.column);
    if (!col) return data;

    const sorted = [...data].sort((a, b) => {
      if (col.compare) return col.compare(a, b);

      const aVal = (a as Record<string, unknown>)[col.key];
      const bVal = (b as Record<string, unknown>)[col.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
      return String(aVal).localeCompare(String(bVal));
    });

    return activeSort.direction === 'desc' ? sorted.reverse() : sorted;
  }, [data, activeSort, clientSort, columns]);

  const displayData = clientSort ? sortedData : data;

  return (
    <div
      className={cn('w-full overflow-x-auto rounded-[var(--radius-lg)] border border-border-default', className)}
      {...props}
    >
      <table className="w-full border-collapse text-base">
        <thead>
          <tr>
            {columns.map((col) => (
              <SortHeader
                key={col.key}
                sortable={!!col.sortable}
                active={activeSort?.column === col.key}
                direction={activeSort?.column === col.key ? activeSort.direction : undefined}
                onToggle={() => handleSortToggle(col.key)}
                width={col.width}
                className={col.headerClassName}
              >
                {col.header}
              </SortHeader>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-muted text-lg"
              >
                {emptyContent ?? 'No data available'}
              </td>
            </tr>
          ) : (
            displayData.map((row, rowIndex) => (
              <tr
                key={rowKey(row, rowIndex)}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                className={cn(
                  'border-t border-border-default transition-colors duration-100',
                  striped && rowIndex % 2 === 1 && 'bg-bg-secondary/50',
                  onRowClick &&
                    'cursor-pointer hover:bg-bg-card-hover focus-visible:bg-bg-card-hover',
                )}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row, rowIndex);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-text-primary whitespace-nowrap',
                      col.cellClassName,
                    )}
                  >
                    {col.render(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';

export { Table };
export type { TableProps, TableColumn, SortState, SortDirection };
