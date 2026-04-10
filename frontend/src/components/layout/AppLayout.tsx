import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useLayoutStore } from '@/stores/layoutStore';
import { Minimize2 } from 'lucide-react';

export function AppLayout(): React.JSX.Element {
  const fullscreenMode = useLayoutStore((s) => s.fullscreenMode);
  const toggleFullscreen = useLayoutStore((s) => s.toggleFullscreen);

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenMode) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreenMode, toggleFullscreen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      {/* Sidebar — hidden in fullscreen */}
      {!fullscreenMode && <Sidebar />}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* TopBar — hidden in fullscreen */}
        {!fullscreenMode && <TopBar />}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Fullscreen exit button — floating in top-right */}
      {fullscreenMode && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-bg-card/90 backdrop-blur border border-border-default rounded-[var(--radius-md)] text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors shadow-[var(--shadow-elevated)]"
          title="Exit fullscreen (Esc)"
        >
          <Minimize2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Exit Fullscreen</span>
        </button>
      )}
    </div>
  );
}
