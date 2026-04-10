import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { Eye, EyeOff, LogIn, ShieldCheck, Thermometer } from 'lucide-react';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-status-critical/20 text-status-critical border-status-critical/40',
  operator: 'bg-status-warning/20 text-status-warning border-status-warning/40',
  viewer: 'bg-status-info/20 text-status-info border-status-info/40',
};

export function LoginForm(): React.JSX.Element {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuthStore();

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    } catch {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-primary p-4">
      {/* Background gradient accent */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-brand-primary/10 border border-brand-primary/30 mb-4">
            <Thermometer className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-text-primary">
            INFRASENSE
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            LHF Thermal Monitoring
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-card border border-border-default rounded-xl p-8 shadow-[var(--shadow-elevated)]">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={isLoading}
                className={cn(
                  'w-full h-12 px-4 rounded-lg text-lg',
                  'bg-bg-input border border-border-default',
                  'text-text-primary placeholder:text-text-muted',
                  'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-150'
                )}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12 px-4 pr-12 rounded-lg text-lg',
                    'bg-bg-input border border-border-default',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-150'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-status-critical/10 border border-status-critical/30 text-status-critical text-sm">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role indicator (shown after successful login) */}
            {isAuthenticated && user && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border text-sm font-medium',
                  ROLE_COLORS[user.role]
                )}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Signed in as{' '}
                  <strong>{user.displayName}</strong> — {ROLE_LABELS[user.role]}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isAuthenticated}
              className={cn(
                'w-full h-12 flex items-center justify-center gap-2',
                'rounded-lg text-lg font-semibold',
                'bg-brand-primary text-white',
                'hover:bg-brand-primary-hover',
                'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-card',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-150'
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-6">
          JSW Vijayanagar SMS — Ladle Heating Furnace Monitoring
        </p>
      </div>
    </div>
  );
}
