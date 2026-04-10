import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ShieldOff } from 'lucide-react';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  minRole: UserRole;
  children: React.ReactNode;
}

export function RoleGuard({ minRole, children }: RoleGuardProps): React.JSX.Element {
  const { isAuthenticated, hasMinRole, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasMinRole(minRole)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-critical/10 border border-status-critical/30 mb-4">
            <ShieldOff className="w-8 h-8 text-status-critical" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Access Denied
          </h2>
          <p className="text-text-secondary text-lg mb-4">
            Your role (<strong className="text-text-primary">{user?.role ?? 'unknown'}</strong>) does not
            have sufficient permissions to access this page.
          </p>
          <p className="text-text-muted text-sm">
            Minimum required role: <strong className="text-text-secondary">{minRole}</strong>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
