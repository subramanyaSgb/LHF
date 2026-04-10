import { useState, useMemo } from 'react';
import {
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Table, type TableColumn } from '@/components/common/Table';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { mockAuditLog } from '@/utils/mock-data';
import type { AuditEntry } from '@/types';

// ---------------------------------------------------------------------------
//  Action color mapping
// ---------------------------------------------------------------------------

function getActionVariant(action: string): BadgeVariant {
  const lower = action.toLowerCase();
  if (lower.includes('delete') || lower.includes('remove')) return 'critical';
  if (lower.includes('update') || lower.includes('change') || lower.includes('edit')) return 'warning';
  if (lower.includes('add') || lower.includes('create')) return 'healthy';
  if (lower.includes('acknowledge')) return 'info';
  if (lower.includes('login') || lower.includes('logout')) return 'default';
  return 'info';
}

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

function AuditLog(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return mockAuditLog;

    const query = searchQuery.toLowerCase();
    return mockAuditLog.filter(
      (entry) =>
        entry.username.toLowerCase().includes(query) ||
        entry.action.toLowerCase().includes(query) ||
        entry.target.toLowerCase().includes(query) ||
        entry.details.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageEntries = filteredEntries.slice(startIdx, startIdx + PAGE_SIZE);

  // Table columns
  const columns: TableColumn<AuditEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      width: '200px',
      render: (row) => (
        <span className="text-sm text-text-secondary tabular-nums">
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'User',
      sortable: true,
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-primary">
              {row.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-text-primary">{row.username}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      width: '220px',
      render: (row) => (
        <Badge variant={getActionVariant(row.action)} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      sortable: true,
      render: (row) => (
        <span className="text-text-primary font-medium">{row.target}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => (
        <span className="text-sm text-text-muted">{row.details}</span>
      ),
      cellClassName: 'max-w-[300px] truncate',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search and header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-primary" />
          <span className="text-lg font-semibold text-text-primary">
            Audit Trail
          </span>
          <Badge variant="default" size="sm">
            {filteredEntries.length} entries
          </Badge>
        </div>
        <div className="w-full max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by user, action, target..."
            prefixIcon={<Search className="w-4 h-4" />}
            size="sm"
            fullWidth
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={pageEntries}
        rowKey={(row) => row.id}
        clientSort
        striped
        emptyContent={
          searchQuery.trim()
            ? `No audit entries matching "${searchQuery}"`
            : 'No audit entries recorded'
        }
      />

      {/* Pagination */}
      {filteredEntries.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-text-muted">
            Showing {startIdx + 1}--{Math.min(startIdx + PAGE_SIZE, filteredEntries.length)} of{' '}
            {filteredEntries.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<ChevronLeft className="w-4 h-4" />}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              Prev
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-8 h-8 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors cursor-pointer',
                      page === safePage
                        ? 'bg-brand-primary text-text-primary'
                        : 'text-text-muted hover:bg-bg-tertiary hover:text-text-primary',
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconRight={<ChevronRight className="w-4 h-4" />}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

AuditLog.displayName = 'AuditLog';

export { AuditLog };
