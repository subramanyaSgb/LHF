import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  BarChart3,
  FileText,
  Bell,
  Camera,
  Layers,
  Grid3x3,
  ShieldAlert,
  Users,
  Settings,
  Activity,
  UserCircle,
  LogOut,
  Thermometer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  minRole: UserRole;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'MONITORING',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, minRole: 'viewer' },
      { label: 'Recordings', path: '/recordings', icon: <Video className="w-5 h-5" />, minRole: 'viewer' },
      { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" />, minRole: 'viewer' },
      { label: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" />, minRole: 'viewer' },
      { label: 'Alert History', path: '/alerts/history', icon: <Bell className="w-5 h-5" />, minRole: 'viewer' },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { label: 'Cameras', path: '/cameras', icon: <Camera className="w-5 h-5" />, minRole: 'operator' },
      { label: 'Groups', path: '/groups', icon: <Layers className="w-5 h-5" />, minRole: 'operator' },
      { label: 'Layout', path: '/layout', icon: <Grid3x3 className="w-5 h-5" />, minRole: 'operator' },
      { label: 'Alerts Config', path: '/alerts/config', icon: <ShieldAlert className="w-5 h-5" />, minRole: 'operator' },
      { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" />, minRole: 'admin' },
      { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, minRole: 'admin' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'System Status', path: '/system', icon: <Activity className="w-5 h-5" />, minRole: 'viewer' },
      { label: 'Profile', path: '/profile', icon: <UserCircle className="w-5 h-5" />, minRole: 'viewer' },
    ],
  },
];

export function Sidebar(): React.JSX.Element {
  const hasMinRole = useAuthStore((s) => s.hasMinRole);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const navigate = useNavigate();

  // Auto-collapse sidebar on screens narrower than 1024px
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches && !useLayoutStore.getState().sidebarCollapsed) {
        toggleSidebar();
      }
    };
    // Check on mount
    handleChange(mql);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout(): void {
    logout();
    navigate('/login');
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-bg-secondary border-r border-border-default',
        'transition-[width] duration-200 ease-in-out shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Branding */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-border-default shrink-0',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4 gap-3'
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-primary/10 shrink-0">
          <Thermometer className="w-5 h-5 text-brand-primary" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-wider text-text-primary leading-tight truncate">
              INFRASENSE
            </h1>
            <p className="text-[10px] text-text-muted leading-tight truncate">
              LHF Monitoring
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            hasMinRole(item.minRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-4 mb-1 text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && (
                <div className="mx-auto w-6 border-t border-border-default mb-2" />
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 h-10 text-sm font-medium rounded-md mx-2 transition-colors duration-100',
                          sidebarCollapsed
                            ? 'justify-center px-0'
                            : 'px-3',
                          isActive
                            ? 'bg-brand-primary/10 text-brand-primary border-l-[3px] border-brand-primary'
                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-[3px] border-transparent'
                        )
                      }
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-default shrink-0">
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center w-full h-10 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors',
            sidebarCollapsed ? 'justify-center' : 'px-4 gap-3'
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>

        {/* User info + Logout */}
        {user && (
          <div
            className={cn(
              'border-t border-border-default',
              sidebarCollapsed ? 'py-2' : 'p-3'
            )}
          >
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 mb-2 min-w-0">
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
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-text-muted capitalize truncate">
                    {user.role}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-2 text-sm text-text-muted hover:text-status-critical transition-colors',
                sidebarCollapsed ? 'justify-center w-full py-1' : 'px-1'
              )}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="text-xs">Sign Out</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
