import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Maximize,
  Minimize,
  BellOff,
  Bell,
  Flame,
  Camera,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useAlertStore } from '@/stores/alertStore';
import { useThemeStore } from '@/stores/themeStore';
import { useCameraStore } from '@/stores/cameraStore';
import { useAuthStore } from '@/stores/authStore';
import { useRecordingStore } from '@/stores/recordingStore';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/cameras': 'Camera Management',
  '/groups': 'Camera Groups',
  '/layout': 'Layout Configuration',
  '/alerts/config': 'Alert Configuration',
  '/alerts/history': 'Alert History',
  '/recordings': 'Recordings',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/system': 'System Status',
  '/users': 'User Management',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: 'bg-status-critical/15 text-status-critical',
  operator: 'bg-status-warning/15 text-status-warning',
  viewer: 'bg-status-info/15 text-status-info',
};

export function TopBar(): React.JSX.Element {
  const location = useLocation();
  const { toggleSidebar, fullscreenMode, toggleFullscreen } = useLayoutStore();
  const { audioMuted, toggleAudioMute } = useAlertStore();
  const { theme, toggleTheme } = useThemeStore();
  const alerts = useAlertStore((s) => s.alerts);
  const cameras = useCameraStore((s) => s.cameras);
  const { user } = useAuthStore();
  const { recordings } = useRecordingStore();

  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'InfraSense';
  const unacknowledgedAlerts = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const onlineCameras = useMemo(() => cameras.filter((c) => c.status !== 'offline'), [cameras]);
  const offlineCameras = useMemo(() => cameras.filter((c) => c.status === 'offline'), [cameras]);
  const activeHeats = useMemo(() => recordings.filter((r) => r.status === 'recording'), [recordings]);

  return (
    <header className="h-14 bg-bg-secondary border-b border-border-default flex items-center justify-between px-4 shrink-0">
      {/* Left: Menu toggle + Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary truncate">
          {pageTitle}
        </h2>
      </div>

      {/* Right: Status chips + controls + user */}
      <div className="flex items-center gap-2">
        {/* Status chips */}
        <div className="hidden md:flex items-center gap-2 mr-2">
          {/* Active Heats */}
          <StatusChip
            icon={<Flame className="w-3.5 h-3.5" />}
            label={`${activeHeats.length} Heat${activeHeats.length !== 1 ? 's' : ''}`}
            variant={activeHeats.length > 0 ? 'warning' : 'muted'}
          />

          {/* Cameras Online */}
          <StatusChip
            icon={<Camera className="w-3.5 h-3.5" />}
            label={`${onlineCameras.length}/${onlineCameras.length + offlineCameras.length}`}
            variant={offlineCameras.length > 0 ? 'warning' : 'healthy'}
          />

          {/* Unacknowledged Alerts */}
          <StatusChip
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label={`${unacknowledgedAlerts.length}`}
            variant={
              unacknowledgedAlerts.some((a) => a.priority === 'critical')
                ? 'critical'
                : unacknowledgedAlerts.length > 0
                  ? 'warning'
                  : 'healthy'
            }
          />
        </div>

        {/* Alert mute toggle */}
        <button
          onClick={toggleAudioMute}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
            audioMuted
              ? 'text-status-warning hover:bg-status-warning/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          )}
          title={audioMuted ? 'Unmute alerts' : 'Mute alerts'}
          aria-label={audioMuted ? 'Unmute alerts' : 'Mute alerts'}
        >
          {audioMuted ? (
            <BellOff className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          title={fullscreenMode ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={fullscreenMode ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {fullscreenMode ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-border-default mx-1" />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-primary">
                {user.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-medium text-text-primary leading-tight truncate max-w-[120px]">
                {user.displayName}
              </p>
              <span
                className={cn(
                  'inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0 rounded',
                  ROLE_BADGE_COLORS[user.role]
                )}
              >
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// --- Status Chip sub-component ---

type ChipVariant = 'healthy' | 'warning' | 'critical' | 'muted';

interface StatusChipProps {
  icon: React.ReactNode;
  label: string;
  variant: ChipVariant;
}

const CHIP_STYLES: Record<ChipVariant, string> = {
  healthy: 'bg-status-healthy-bg text-status-healthy',
  warning: 'bg-status-warning-bg text-status-warning',
  critical: 'bg-status-critical-bg text-status-critical animate-pulse-alert',
  muted: 'bg-bg-tertiary text-text-muted',
};

function StatusChip({ icon, label, variant }: StatusChipProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        CHIP_STYLES[variant]
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
