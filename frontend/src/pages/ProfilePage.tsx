import { useState, useCallback, useRef, useEffect } from 'react';
import {
  UserCircle,
  Shield,
  Eye,
  Wrench,
  Mail,
  Clock,
  CalendarDays,
  Lock,
  Bell,
  Monitor,
  LogOut,
  CheckCircle,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLayoutStore } from '@/stores/layoutStore';
import type { UserRole } from '@/types';

const roleConfig: Record<UserRole, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  admin: {
    icon: <Shield className="w-4 h-4" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15 border-purple-400/30',
    label: 'Administrator',
  },
  operator: {
    icon: <Wrench className="w-4 h-4" />,
    color: 'text-status-info',
    bgColor: 'bg-status-info-bg border-status-info/30',
    label: 'Operator',
  },
  viewer: {
    icon: <Eye className="w-4 h-4" />,
    color: 'text-text-secondary',
    bgColor: 'bg-bg-tertiary border-border-default',
    label: 'Viewer',
  },
};

export default function ProfilePage(): React.JSX.Element {
  const { user, logout } = useAuthStore();
  const themeStore = useThemeStore();
  const currentTheme = useThemeStore((s) => s.theme);
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const passwordTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => {
    clearTimeout(passwordTimerRef.current);
    clearTimeout(prefsTimerRef.current);
  }, []);

  const handlePasswordChange = useCallback(() => {
    setPasswordError('');
    if (!currentPassword.trim()) { setPasswordError('Current password is required'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    passwordTimerRef.current = setTimeout(() => setPasswordSaved(false), 3000);
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSavePrefs = useCallback(() => {
    setPrefsSaved(true);
    prefsTimerRef.current = setTimeout(() => setPrefsSaved(false), 3000);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <UserCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">Please log in to view your profile.</p>
      </div>
    );
  }

  const role = roleConfig[user.role];

  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ============================================================
            PROFILE HEADER CARD
        ============================================================ */}
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)]">
          {/* Gradient banner */}
          <div className="h-28 bg-gradient-to-r from-brand-primary/80 via-brand-secondary/60 to-brand-primary/40" />

          {/* Avatar + Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-bg-card border-4 border-bg-card shadow-[var(--shadow-elevated)] flex items-center justify-center">
                <span className="text-3xl font-black text-brand-primary">
                  {user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>

              {/* Name + Role */}
              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-bold text-text-primary">{user.displayName}</h1>
                <p className="text-text-muted text-sm">@{user.username}</p>
              </div>

              {/* Role Badge + Logout */}
              <div className="flex items-center gap-3 pb-1">
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold', role.bgColor, role.color)}>
                  {role.icon}
                  {role.label}
                </span>
                <button
                  onClick={() => { logout(); window.location.href = '/login'; }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-status-critical bg-status-critical-bg border border-status-critical/20 hover:bg-status-critical/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { icon: <Mail className="w-4 h-4" />, label: 'Email', value: user.email },
                { icon: <Clock className="w-4 h-4" />, label: 'Last Login', value: user.lastLogin ? formatDateTime(user.lastLogin) : 'Never' },
                { icon: <CalendarDays className="w-4 h-4" />, label: 'Account Created', value: formatDateTime(user.createdAt) },
                { icon: <Shield className="w-4 h-4" />, label: 'Status', value: user.isActive ? 'Active' : 'Inactive' },
              ].map((item) => (
                <div key={item.label} className="bg-bg-secondary rounded-[var(--radius-md)] border border-border-light p-3">
                  <div className="flex items-center gap-1.5 text-text-muted mb-1">
                    {item.icon}
                    <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column layout for settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ============================================================
              CHANGE PASSWORD
          ============================================================ */}
          <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary/50">
              <Lock className="w-5 h-5 text-brand-primary" />
              <h2 className="text-base font-bold text-text-primary">Change Password</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-status-critical font-medium">{passwordError}</p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handlePasswordChange}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
                >
                  Update Password
                </button>
                {passwordSaved && (
                  <span className="flex items-center gap-1.5 text-status-healthy text-sm font-medium animate-slide-in">
                    <CheckCircle className="w-4 h-4" />
                    Updated
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================
              NOTIFICATION PREFERENCES
          ============================================================ */}
          <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary/50">
              <Bell className="w-5 h-5 text-brand-primary" />
              <h2 className="text-base font-bold text-text-primary">Notifications</h2>
            </div>
            <div className="p-5 space-y-1">
              {[
                { label: 'SMS Alerts', desc: 'Critical temperature alerts via SMS', icon: <MessageSquare className="w-4 h-4" />, checked: smsAlerts, onChange: setSmsAlerts },
                { label: 'Email Alerts', desc: 'Alert notifications and daily reports', icon: <Mail className="w-4 h-4" />, checked: emailAlerts, onChange: setEmailAlerts },
                { label: 'Audio Alerts', desc: 'Audible alarm on critical dashboard alerts', icon: audioAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />, checked: audioAlerts, onChange: setAudioAlerts },
              ].map((pref) => (
                <label
                  key={pref.label}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-[var(--radius-md)] hover:bg-bg-secondary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">{pref.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{pref.label}</p>
                      <p className="text-xs text-text-muted">{pref.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pref.checked}
                    onClick={() => pref.onChange(!pref.checked)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors shrink-0',
                      pref.checked ? 'bg-brand-primary' : 'bg-border-default'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      pref.checked ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </label>
              ))}
              <div className="flex items-center gap-3 pt-3 px-4">
                <button
                  onClick={handleSavePrefs}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors"
                >
                  Save Preferences
                </button>
                {prefsSaved && (
                  <span className="flex items-center gap-1.5 text-status-healthy text-sm font-medium animate-slide-in">
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            DISPLAY PREFERENCES — Full width
        ============================================================ */}
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary/50">
            <Monitor className="w-5 h-5 text-brand-primary" />
            <h2 className="text-base font-bold text-text-primary">Display</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => themeStore.setTheme('dark')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all',
                      currentTheme === 'dark'
                        ? 'border-brand-primary bg-brand-primary/10 shadow-[var(--shadow-glow-healthy)]'
                        : 'border-border-default hover:border-border-focus'
                    )}
                  >
                    <Moon className={cn('w-6 h-6', currentTheme === 'dark' ? 'text-brand-primary' : 'text-text-muted')} />
                    <span className={cn('text-sm font-bold', currentTheme === 'dark' ? 'text-brand-primary' : 'text-text-muted')}>Dark</span>
                    <span className="text-[10px] text-text-muted">Optimized for factory floor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => themeStore.setTheme('light')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all',
                      currentTheme === 'light'
                        ? 'border-brand-primary bg-brand-primary/10 shadow-[var(--shadow-glow-healthy)]'
                        : 'border-border-default hover:border-border-focus'
                    )}
                  >
                    <Sun className={cn('w-6 h-6', currentTheme === 'light' ? 'text-brand-primary' : 'text-text-muted')} />
                    <span className={cn('text-sm font-bold', currentTheme === 'light' ? 'text-brand-primary' : 'text-text-muted')}>Light</span>
                    <span className="text-[10px] text-text-muted">Standard office display</span>
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Sidebar</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { if (sidebarCollapsed) toggleSidebar(); }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all',
                      !sidebarCollapsed
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-border-default hover:border-border-focus'
                    )}
                  >
                    <PanelLeft className={cn('w-6 h-6', !sidebarCollapsed ? 'text-brand-primary' : 'text-text-muted')} />
                    <span className={cn('text-sm font-bold', !sidebarCollapsed ? 'text-brand-primary' : 'text-text-muted')}>Expanded</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!sidebarCollapsed) toggleSidebar(); }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all',
                      sidebarCollapsed
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-border-default hover:border-border-focus'
                    )}
                  >
                    <PanelLeftClose className={cn('w-6 h-6', sidebarCollapsed ? 'text-brand-primary' : 'text-text-muted')} />
                    <span className={cn('text-sm font-bold', sidebarCollapsed ? 'text-brand-primary' : 'text-text-muted')}>Collapsed</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
