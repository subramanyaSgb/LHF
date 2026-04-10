import { useState, useCallback } from 'react';
import {
  Clock,
  Sun,
  Moon,
  Send,
  User,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { mockShiftNotes } from '@/utils/mock-data';
import { useAuthStore } from '@/stores/authStore';
import type { ShiftNote } from '@/types';

// ---------------------------------------------------------------------------
//  Shift type badge
// ---------------------------------------------------------------------------

function ShiftBadge({ type }: { type: 'day' | 'night' }): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border',
        type === 'day'
          ? 'bg-status-warning-bg text-status-warning border-status-warning/30'
          : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30',
      )}
    >
      {type === 'day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      {type === 'day' ? 'Day Shift' : 'Night Shift'}
    </span>
  );
}

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

function ShiftHandover(): React.JSX.Element {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<ShiftNote[]>(mockShiftNotes);
  const [newContent, setNewContent] = useState('');
  const [newShiftType, setNewShiftType] = useState<'day' | 'night'>('day');
  const [submitting, setSubmitting] = useState(false);

  const latestNote = notes.length > 0 ? notes[0] : null;
  const historyNotes = notes.slice(1);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!newContent.trim()) return;

    setSubmitting(true);

    // Simulate network delay
    setTimeout(() => {
      const note: ShiftNote = {
        id: `sn${Date.now()}`,
        shiftDate: new Date().toISOString().split('T')[0],
        shiftType: newShiftType,
        content: newContent.trim(),
        createdBy: user?.username ?? 'unknown',
        createdAt: new Date().toISOString(),
      };

      setNotes((prev) => [note, ...prev]);
      setNewContent('');
      setSubmitting(false);
    }, 500);
  }, [newContent, newShiftType, user]);

  return (
    <div className="space-y-6">
      {/* Latest Shift Note */}
      {latestNote ? (
        <Card
          variant="bordered"
          header={
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-primary" />
                <span>Latest Handover Note</span>
              </div>
              <ShiftBadge type={latestNote.shiftType} />
            </div>
          }
        >
          <div className="space-y-4">
            {/* Meta row */}
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {latestNote.createdBy}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDateTime(latestNote.createdAt)}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 rounded-[var(--radius-md)] bg-bg-secondary border border-border-default">
              <p className="text-text-primary text-base leading-relaxed whitespace-pre-wrap">
                {latestNote.content}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card variant="bordered">
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted">No shift handover notes yet.</p>
          </div>
        </Card>
      )}

      {/* Write New Note */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-brand-primary" />
            <span>Write Handover Note</span>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Shift Type"
            value={newShiftType}
            onChange={(e) => setNewShiftType(e.target.value as 'day' | 'night')}
            options={[
              { value: 'day', label: 'Day Shift (06:00 - 18:00)' },
              { value: 'night', label: 'Night Shift (18:00 - 06:00)' },
            ]}
            fullWidth
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-text-primary text-base">
              Handover Notes
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Summarize key events, camera issues, alerts, PLC status, ongoing heats, and anything the next shift should know..."
              rows={6}
              className={cn(
                'w-full bg-bg-input text-text-primary placeholder-text-muted',
                'border border-border-default rounded-[var(--radius-md)]',
                'px-4 py-2.5 text-base font-medium',
                'transition-colors duration-150 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus',
                'resize-y min-h-[120px]',
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              iconLeft={<Send className="w-4 h-4" />}
              onClick={handleSubmit}
              disabled={!newContent.trim()}
              loading={submitting}
            >
              Submit Handover
            </Button>
          </div>
        </div>
      </Card>

      {/* History */}
      {historyNotes.length > 0 && (
        <Card
          variant="bordered"
          header={
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-primary" />
              <span>Previous Notes</span>
              <Badge variant="default" size="sm">
                {historyNotes.length}
              </Badge>
            </div>
          }
        >
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {historyNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-[var(--radius-md)] bg-bg-secondary border border-border-default"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <ShiftBadge type={note.shiftType} />
                    <span className="text-sm text-text-muted">{note.shiftDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {note.createdBy}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(note.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

ShiftHandover.displayName = 'ShiftHandover';

export { ShiftHandover };
