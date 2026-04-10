import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useRecordingStore } from '@/stores/recordingStore';
import { useGroupStore } from '@/stores/groupStore';
import { useCameraStore } from '@/stores/cameraStore';
import { formatDateTime, formatDuration, formatFileSize } from '@/utils/format';
import { formatTemp } from '@/utils/temperature';
import {
  Video,
  Search,
  Flag,
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquarePlus,
  AlertTriangle,
  Clock,
  Thermometer,
  HardDrive,
  Circle,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from 'lucide-react';
import type { Recording, RecordingAnnotation, RecordingStatus } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<RecordingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  recording: {
    label: 'Recording',
    color: 'bg-status-critical-bg text-status-critical',
    icon: <Circle className="w-3 h-3 animate-pulse fill-current" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-status-healthy-bg text-status-healthy',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-status-critical-bg text-status-critical',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  processing: {
    label: 'Processing',
    color: 'bg-status-info-bg text-status-info',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
};

const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8];

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: RecordingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide', cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Thermal placeholder (canvas-based gradient)
// ---------------------------------------------------------------------------
function ThermalPlaceholder({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const t = 1 - dist / maxDist + (Math.random() - 0.5) * 0.08;
        const clamped = Math.max(0, Math.min(1, t));

        let r: number, g: number, b: number;
        if (clamped < 0.25) {
          r = 0; g = 0; b = Math.round(clamped * 4 * 150);
        } else if (clamped < 0.5) {
          const s = (clamped - 0.25) * 4;
          r = Math.round(s * 200); g = 0; b = 150;
        } else if (clamped < 0.75) {
          const s = (clamped - 0.5) * 4;
          r = 220; g = Math.round(s * 160); b = Math.round((1 - s) * 150);
        } else {
          const s = (clamped - 0.75) * 4;
          r = 255; g = Math.round(160 + s * 95); b = Math.round(s * 100);
        }

        const idx = (y * w + x) * 4;
        imgData.data[idx] = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={384}
      height={240}
      className={cn('w-full h-full object-cover', className)}
    />
  );
}

// ---------------------------------------------------------------------------
// PlayerView
// ---------------------------------------------------------------------------
function PlayerView({
  recording,
  onBack,
}: {
  recording: Recording;
  onBack: () => void;
}) {
  const { addAnnotation, toggleFlag, getAnnotations } = useRecordingStore();
  const groups = useGroupStore((s) => s.groups);
  const cameras = useCameraStore((s) => s.cameras);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [annotationText, setAnnotationText] = useState('');
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const group = groups.find((g) => g.id === recording.groupId);
  const camera = cameras.find((c) => c.id === recording.cameraId);
  const recordingAnnotations = getAnnotations(recording.id);

  // Playback timer
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + speed;
          if (next >= recording.duration) {
            setPlaying(false);
            return recording.duration;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, recording.duration]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
  };

  const handleFrameStep = (dir: 1 | -1) => {
    setPlaying(false);
    setCurrentTime((prev) => Math.max(0, Math.min(recording.duration, prev + dir)));
  };

  const handleAddAnnotation = () => {
    if (!annotationText.trim()) return;
    const annotation: RecordingAnnotation = {
      id: `ann-${Date.now()}`,
      recordingId: recording.id,
      timestamp: currentTime,
      text: annotationText.trim(),
      createdBy: 'operator1',
      createdAt: new Date().toISOString(),
    };
    addAnnotation(recording.id, annotation);
    setAnnotationText('');
    setShowAnnotationInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-card hover:bg-bg-card-hover rounded-[var(--radius-md)] border border-border-default transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">
            Heat {recording.heatNumber} — {group?.name ?? 'Ungrouped'}
          </h2>
          <p className="text-sm text-text-secondary">
            {camera?.name} | Ladle {recording.ladleId} | Started {formatDateTime(recording.startTime)}
          </p>
        </div>
        <StatusBadge status={recording.status} />
        <button
          onClick={() => toggleFlag(recording.id)}
          className={cn(
            'p-2 rounded-[var(--radius-md)] border transition-colors',
            recording.isFlagged
              ? 'bg-status-warning-bg border-status-warning text-status-warning'
              : 'bg-bg-card border-border-default text-text-muted hover:text-status-warning hover:border-status-warning',
          )}
          title={recording.isFlagged ? 'Unflag recording' : 'Flag recording'}
        >
          <Flag className="w-5 h-5" fill={recording.isFlagged ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Video area */}
      <div className="bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default overflow-hidden">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <ThermalPlaceholder />
          {/* Overlay info */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-xs font-mono text-white/80 bg-black/60 px-2 py-1 rounded">
              {formatDuration(currentTime)} / {formatDuration(recording.duration)}
            </span>
            <span className="text-xs font-mono text-white/80 bg-black/60 px-2 py-1 rounded">
              {speed}x
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-xs font-mono text-status-critical bg-black/60 px-2 py-1 rounded">
              Peak: {formatTemp(recording.peakTemp)}
            </span>
          </div>
          {/* Play overlay when paused */}
          {!playing && (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-brand-primary/80 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* Timeline scrubber */}
        <div className="px-4 py-2 bg-bg-card border-t border-border-default">
          <div className="relative h-6 flex items-center">
            {/* Alert markers */}
            {recording.alertCount > 0 && (
              <>
                <div
                  className="absolute top-0 w-1.5 h-full bg-status-critical rounded-full z-10"
                  style={{ left: '35%' }}
                  title="Alert at 35%"
                />
                {recording.alertCount > 1 && (
                  <div
                    className="absolute top-0 w-1.5 h-full bg-status-warning rounded-full z-10"
                    style={{ left: '62%' }}
                    title="Alert at 62%"
                  />
                )}
              </>
            )}
            {/* Annotation markers */}
            {recordingAnnotations.map((ann) => {
              const pct = recording.duration > 0 ? (ann.timestamp / recording.duration) * 100 : 0;
              return (
                <div
                  key={ann.id}
                  className="absolute top-0 w-1.5 h-full bg-brand-primary rounded-full z-10 cursor-pointer"
                  style={{ left: `${pct}%` }}
                  title={`${formatDuration(ann.timestamp)}: ${ann.text}`}
                  onClick={() => setCurrentTime(ann.timestamp)}
                />
              );
            })}
            <input
              type="range"
              min={0}
              max={recording.duration}
              value={currentTime}
              onChange={handleScrub}
              className="w-full h-2 appearance-none bg-border-default rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:cursor-grab"
            />
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-card border-t border-border-default">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleFrameStep(-1)}
              className="p-2 text-text-secondary hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
              title="Previous frame"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
              className="p-2 text-text-secondary hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
              title="Skip back 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              className="p-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full transition-colors mx-1"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={() => setCurrentTime(Math.min(recording.duration, currentTime + 10))}
              className="p-2 text-text-secondary hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
              title="Skip forward 10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleFrameStep(1)}
              className="p-2 text-text-secondary hover:text-text-primary rounded-[var(--radius-sm)] hover:bg-bg-card-hover transition-colors"
              title="Next frame"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1">
            {PLAYBACK_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors',
                  speed === s
                    ? 'bg-brand-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover',
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnnotationInput(!showAnnotationInput)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] border transition-colors',
                showAnnotationInput
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                  : 'bg-bg-card border-border-default text-text-secondary hover:text-text-primary',
              )}
            >
              <MessageSquarePlus className="w-4 h-4" />
              Annotate
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-card hover:bg-bg-card-hover border border-border-default rounded-[var(--radius-md)] transition-colors">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Annotation input */}
      {showAnnotationInput && (
        <div className="flex items-center gap-3 p-4 bg-bg-card rounded-[var(--radius-lg)] border border-border-default">
          <span className="text-xs font-mono text-text-muted whitespace-nowrap">
            @ {formatDuration(currentTime)}
          </span>
          <input
            type="text"
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAnnotation()}
            placeholder="Add a note at this timestamp..."
            className="flex-1 px-3 py-2 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
          />
          <button
            onClick={handleAddAnnotation}
            disabled={!annotationText.trim()}
            className="p-2 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white rounded-[var(--radius-md)] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Annotations list */}
      {recordingAnnotations.length > 0 && (
        <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default overflow-hidden">
          <div className="px-4 py-3 border-b border-border-default">
            <h3 className="text-sm font-semibold text-text-primary">
              Annotations ({recordingAnnotations.length})
            </h3>
          </div>
          <div className="divide-y divide-border-default max-h-60 overflow-y-auto">
            {recordingAnnotations.map((ann) => (
              <button
                key={ann.id}
                onClick={() => setCurrentTime(ann.timestamp)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bg-card-hover transition-colors"
              >
                <span className="text-xs font-mono text-brand-primary whitespace-nowrap mt-0.5">
                  {formatDuration(ann.timestamp)}
                </span>
                <span className="text-sm text-text-primary">{ann.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Thermometer className="w-5 h-5 text-status-critical" />, label: 'Peak Temp', value: formatTemp(recording.peakTemp) },
          { icon: <Clock className="w-5 h-5 text-status-info" />, label: 'Duration', value: formatDuration(recording.duration) },
          { icon: <AlertTriangle className="w-5 h-5 text-status-warning" />, label: 'Alerts', value: String(recording.alertCount) },
          { icon: <HardDrive className="w-5 h-5 text-text-muted" />, label: 'File Size', value: formatFileSize(recording.fileSize) },
        ].map((card) => (
          <div key={card.label} className="flex items-center gap-3 p-4 bg-bg-card rounded-[var(--radius-lg)] border border-border-default">
            {card.icon}
            <div>
              <p className="text-xs text-text-muted">{card.label}</p>
              <p className="text-lg font-bold text-text-primary">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecordingsPage (main)
// ---------------------------------------------------------------------------
export default function RecordingsPage(): React.JSX.Element {
  const { recordings, toggleFlag, setSelectedRecording, selectedRecordingId } = useRecordingStore();
  const groups = useGroupStore((s) => s.groups);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [flagFilter, setFlagFilter] = useState<'all' | 'flagged' | 'unflagged'>('all');

  // Find the selected recording for the player
  const selectedRecording = useMemo(
    () => recordings.find((r) => r.id === selectedRecordingId) ?? null,
    [recordings, selectedRecordingId],
  );

  // Filtered recordings
  const filtered = useMemo(() => {
    let result = recordings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.heatNumber.toLowerCase().includes(q) ||
          r.ladleId.toLowerCase().includes(q),
      );
    }
    if (groupFilter !== 'all') {
      result = result.filter((r) => r.groupId === groupFilter);
    }
    if (flagFilter === 'flagged') {
      result = result.filter((r) => r.isFlagged);
    } else if (flagFilter === 'unflagged') {
      result = result.filter((r) => !r.isFlagged);
    }
    return result;
  }, [recordings, search, groupFilter, flagFilter]);

  const getGroupName = useCallback(
    (groupId?: string) => {
      if (!groupId) return '—';
      return groups.find((g) => g.id === groupId)?.name ?? '—';
    },
    [groups],
  );

  // Player view
  if (selectedRecording) {
    return (
      <div className="p-4 md:p-6 bg-bg-primary min-h-screen">
        <PlayerView
          recording={selectedRecording}
          onBack={() => setSelectedRecording(null)}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Video className="w-7 h-7 text-brand-primary" />
            Recordings
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {recordings.length} total recordings | {recordings.filter((r) => r.isFlagged).length} flagged
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search heat number or ladle ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-focus"
          />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={flagFilter}
          onChange={(e) => setFlagFilter(e.target.value as typeof flagFilter)}
          className="px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Flags</option>
          <option value="flagged">Flagged Only</option>
          <option value="unflagged">Unflagged</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default overflow-hidden shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                {['Status', 'Heat No.', 'Group', 'Ladle', 'Peak Temp', 'Duration', 'Alerts', 'Size', 'Started', 'Flag'].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filtered.map((rec) => (
                <tr
                  key={rec.id}
                  onClick={() => setSelectedRecording(rec.id)}
                  className="hover:bg-bg-card-hover cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-text-primary whitespace-nowrap">
                    {rec.heatNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium text-brand-primary bg-brand-primary/10 rounded-[var(--radius-sm)]">
                      {getGroupName(rec.groupId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{rec.ladleId}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-sm font-bold',
                      rec.peakTemp >= 1350 ? 'text-status-critical' : rec.peakTemp >= 1300 ? 'text-status-warning' : 'text-status-healthy',
                    )}>
                      {formatTemp(rec.peakTemp)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                    {formatDuration(rec.duration)}
                  </td>
                  <td className="px-4 py-3">
                    {rec.alertCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-status-warning">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {rec.alertCount}
                      </span>
                    ) : (
                      <span className="text-sm text-text-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
                    {formatFileSize(rec.fileSize)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                    {formatDateTime(rec.startTime)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFlag(rec.id);
                      }}
                      className={cn(
                        'p-1.5 rounded-[var(--radius-sm)] transition-colors',
                        rec.isFlagged
                          ? 'text-status-warning hover:text-status-warning/80'
                          : 'text-text-muted hover:text-status-warning',
                      )}
                      title={rec.isFlagged ? 'Unflag' : 'Flag'}
                    >
                      <Flag className="w-4 h-4" fill={rec.isFlagged ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <Video className="w-10 h-10 mb-2" />
            <p className="text-sm">No recordings match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
