import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useLayoutStore } from '@/stores/layoutStore';
import { cn } from '@/utils/cn';

export function AppLayout(): React.JSX.Element {
  const fullscreenMode = useLayoutStore((s) => s.fullscreenMode);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      {/* Sidebar — hidden in fullscreen */}
      {!fullscreenMode && <Sidebar />}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* TopBar — hidden in fullscreen */}
        {!fullscreenMode && <TopBar />}

        {/* Page content */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            fullscreenMode ? '' : 'p-4'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
