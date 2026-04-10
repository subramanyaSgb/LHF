import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <LayoutDashboard className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-text-primary mb-1">Dashboard</h2>
        <p className="text-text-secondary">Live thermal monitoring overview</p>
      </div>
    </div>
  );
}
