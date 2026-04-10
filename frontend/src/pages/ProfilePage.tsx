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
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Toggle } from '@/components/common/Toggle';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

// ---------------------------------------------------------------------------
//  Role display config
// ---------------------------------------------------------------------------

const roleConfig: Record<UserRole, { icon: React.ReactNode; color: string; label: string }> = {
  admin: {
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-purple-500/15 text-purple-400 border-purple-400/30',
    label: 'Administrator',
  },
  operator: {
    icon: <Wrench className="w-5 h-5" />,
    color: 'bg-status-info-bg text-status-info border-status-info/30',
    label: 'Operator',
  },
  viewer: {
    icon: <Eye className="w-5 h-5" />,
    color: 'bg-bg-tertiary text-text-secondary border-border-default',
    label: 'Viewer',
  },
};

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

export default function ProfilePage(): React.JSX.Element {
  const { user, logout } = useAuthStore();

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification prefs
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Display prefs
  const [sidebarDefault, setSidebarDefault] = useState<'expanded' | 'collapsed'>('expanded');

  // Timer refs for cleanup
  const passwordTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => {
    clearTimeout(passwordTimerRef.current);
    clearTimeout(prefsTimerRef.current);
  }, []);

  // Handle password change
  const handlePasswordChange = useCallback(() => {
    setPasswordError('');

    if (!currentPassword.trim()) {
      setPasswordError('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Mock save
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    passwordTimerRef.current = setTimeout(() => setPasswordSaved(false), 3000);
  }, [currentPassword, newPassword, confirmPassword]);

  // Handle notification prefs save
  const handleSavePrefs = useCallback(() => {
    setPrefsSaved(true);
    prefsTimerRef.current = setTimeout(() => setPrefsSaved(false), 3000);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <UserCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-text-primary mb-1">Not Logged In</h2>
          <p className="text-text-secondary">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const role = roleConfig[user.role];

  return (
    <div className="p-6 space-y-6 min-h-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCircle className="w-7 h-7 text-brand-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
      </div>

      {/* User Info Card */}
      <Card variant="bordered">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar placeholder */}
          <div className="shrink-0 w-24 h-24 rounded-full bg-brand-primary/15 flex items-center justify-center">
            <span className="text-4xl font-bold text-brand-primary">
              {user.displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{user.displayName}</h2>
              <p className="text-text-muted text-lg">@{user.username}</p>
            </div>

            <span
              className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold',
                role.color,
              )}
            >
              {role.icon}
              {role.label}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Clock className="w-4 h-4 text-text-muted shrink-0" />
                <span>
                  Last login:{' '}
                  {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <CalendarDays className="w-4 h-4 text-text-muted shrink-0" />
                <span>Created: {formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={user.isActive ? 'healthy' : 'offline'} size="md">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-brand-primary" />
            <span>Change Password</span>
          </div>
        }
      >
        <div className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            fullWidth
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            helperText="Minimum 8 characters"
            fullWidth
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            error={passwordError || undefined}
            fullWidth
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" onClick={handlePasswordChange}>
              Update Password
            </Button>
            {passwordSaved && (
              <span className="flex items-center gap-1.5 text-status-healthy text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Password updated
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-brand-primary" />
            <span>Notification Preferences</span>
          </div>
        }
      >
        <div className="space-y-5">
          <Toggle
            label="SMS Alerts"
            checked={smsAlerts}
            onChange={setSmsAlerts}
            size="md"
          />
          <div className="pl-10 -mt-3">
            <p className="text-sm text-text-muted">
              Receive SMS notifications for critical temperature alerts
            </p>
          </div>

          <Toggle
            label="Email Alerts"
            checked={emailAlerts}
            onChange={setEmailAlerts}
            size="md"
          />
          <div className="pl-10 -mt-3">
            <p className="text-sm text-text-muted">
              Receive email notifications for alerts and daily reports
            </p>
          </div>

          <Toggle
            label="Audio Alerts"
            checked={audioAlerts}
            onChange={setAudioAlerts}
            size="md"
          />
          <div className="pl-10 -mt-3">
            <p className="text-sm text-text-muted">
              Play an audible alarm on the dashboard when a critical alert fires
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" onClick={handleSavePrefs}>
              Save Preferences
            </Button>
            {prefsSaved && (
              <span className="flex items-center gap-1.5 text-status-healthy text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Preferences saved
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Display Preferences */}
      <Card
        variant="bordered"
        header={
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-brand-primary" />
            <span>Display Preferences</span>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-base font-medium text-text-primary mb-3 block">Theme</label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border-2 border-brand-primary bg-brand-primary/10">
                <div className="w-5 h-5 rounded-full bg-bg-primary border border-border-default" />
                <span className="text-sm font-semibold text-brand-primary">Dark</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border-2 border-border-default opacity-50 cursor-not-allowed">
                <div className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300" />
                <span className="text-sm font-semibold text-text-muted">Light (Coming Soon)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-base font-medium text-text-primary mb-3 block">
              Sidebar Default State
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSidebarDefault('expanded')}
                className={cn(
                  'px-5 py-2.5 rounded-[var(--radius-md)] border-2 text-sm font-semibold transition-all cursor-pointer',
                  sidebarDefault === 'expanded'
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-border-default text-text-muted hover:text-text-primary',
                )}
              >
                Expanded
              </button>
              <button
                type="button"
                onClick={() => setSidebarDefault('collapsed')}
                className={cn(
                  'px-5 py-2.5 rounded-[var(--radius-md)] border-2 text-sm font-semibold transition-all cursor-pointer',
                  sidebarDefault === 'collapsed'
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-border-default text-text-muted hover:text-text-primary',
                )}
              >
                Collapsed
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <div className="pt-2 pb-8">
        <Button
          variant="danger"
          size="lg"
          iconLeft={<LogOut className="w-5 h-5" />}
          onClick={logout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
