import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Loader2 } from 'lucide-react';

// --- Lazy-loaded pages ---
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CamerasPage = lazy(() => import('@/pages/CamerasPage'));
const GroupsPage = lazy(() => import('@/pages/GroupsPage'));
const LayoutPage = lazy(() => import('@/pages/LayoutPage'));
const AlertsConfigPage = lazy(() => import('@/pages/AlertsConfigPage'));
const AlertsHistoryPage = lazy(() => import('@/pages/AlertsHistoryPage'));
const RecordingsPage = lazy(() => import('@/pages/RecordingsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SystemPage = lazy(() => import('@/pages/SystemPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function PageLoader(): React.JSX.Element {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );
}

export default function App(): React.JSX.Element {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes inside AppLayout */}
        <Route element={<RoleGuard minRole="viewer"><AppLayout /></RoleGuard>}>
          {/* Monitoring — viewer+ */}
          <Route
            index
            element={
              <RoleGuard minRole="viewer">
                <DashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="recordings"
            element={
              <RoleGuard minRole="viewer">
                <RecordingsPage />
              </RoleGuard>
            }
          />
          <Route
            path="analytics"
            element={
              <RoleGuard minRole="viewer">
                <AnalyticsPage />
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard minRole="viewer">
                <ReportsPage />
              </RoleGuard>
            }
          />
          <Route
            path="alerts/history"
            element={
              <RoleGuard minRole="viewer">
                <AlertsHistoryPage />
              </RoleGuard>
            }
          />

          {/* Configuration — operator+ */}
          <Route
            path="cameras"
            element={
              <RoleGuard minRole="operator">
                <CamerasPage />
              </RoleGuard>
            }
          />
          <Route
            path="groups"
            element={
              <RoleGuard minRole="operator">
                <GroupsPage />
              </RoleGuard>
            }
          />
          <Route
            path="layout"
            element={
              <RoleGuard minRole="operator">
                <LayoutPage />
              </RoleGuard>
            }
          />
          <Route
            path="alerts/config"
            element={
              <RoleGuard minRole="operator">
                <AlertsConfigPage />
              </RoleGuard>
            }
          />

          {/* Admin only */}
          <Route
            path="users"
            element={
              <RoleGuard minRole="admin">
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="settings"
            element={
              <RoleGuard minRole="admin">
                <SettingsPage />
              </RoleGuard>
            }
          />

          {/* System — viewer+ */}
          <Route
            path="system"
            element={
              <RoleGuard minRole="viewer">
                <SystemPage />
              </RoleGuard>
            }
          />
          <Route
            path="profile"
            element={
              <RoleGuard minRole="viewer">
                <ProfilePage />
              </RoleGuard>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
