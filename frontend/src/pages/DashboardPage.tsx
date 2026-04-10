import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { useCameraStore } from '@/stores/cameraStore';
import { useGroupStore } from '@/stores/groupStore';
import { useLayoutStore } from '@/stores/layoutStore';
import CameraCard from '@/components/dashboard/CameraCard';
import StitchedView from '@/components/dashboard/StitchedView';
import HealthBar from '@/components/dashboard/HealthBar';
import AlertBanner from '@/components/dashboard/AlertBanner';
import EmptyState from '@/components/dashboard/EmptyState';
import LayoutControls from '@/components/dashboard/LayoutControls';
import DraggableGrid from '@/components/dashboard/DraggableGrid';
import type { Camera } from '@/types';

/** Minimum card width in pixels for auto-fit column calculation. */
const MIN_CARD_WIDTH = 420;

export default function DashboardPage() {
  const cameras = useCameraStore((s) => s.cameras);
  const setSelectedCamera = useCameraStore((s) => s.setSelectedCamera);
  const groups = useGroupStore((s) => s.groups);
  const currentMode = useLayoutStore((s) => s.currentMode);
  const gridCols = useLayoutStore((s) => s.gridCols);

  const gridRef = useRef<HTMLDivElement>(null);
  const [autoColumns, setAutoColumns] = useState(2);

  // ---- Auto-fit: compute columns from container width ----
  useEffect(() => {
    if (currentMode !== 'auto') return;

    const el = gridRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const cols = Math.max(1, Math.floor(width / MIN_CARD_WIDTH));
        setAutoColumns(cols);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [currentMode]);

  const effectiveCols = currentMode === 'grid' ? gridCols : autoColumns;

  // ---- Separate grouped (stitch-enabled) vs ungrouped cameras ----
  const { stitchedGroups, ungroupedCameras } = useMemo(() => {
    const groupedCameraIds = new Set<string>();
    const stitched = groups.filter((g) => {
      if (g.stitchEnabled && g.cameraIds.length > 0) {
        g.cameraIds.forEach((id) => groupedCameraIds.add(id));
        return true;
      }
      return false;
    });

    // Cameras not in any stitch-enabled group
    const ungrouped = cameras.filter((c) => !groupedCameraIds.has(c.id));

    return { stitchedGroups: stitched, ungroupedCameras: ungrouped };
  }, [cameras, groups]);

  const handleCameraClick = useCallback(
    (camera: Camera) => {
      setSelectedCamera(camera.id);
    },
    [setSelectedCamera],
  );

  const isEmpty = cameras.length === 0;

  return (
    <div className="flex flex-col w-full h-full min-h-screen bg-bg-primary">
      {/* ---- Alert overlay ---- */}
      <AlertBanner />

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* ---- Layout controls toolbar ---- */}
          <div className="px-4 pt-4 pb-2">
            <LayoutControls />
          </div>

          {/* ---- Main camera grid ---- */}
          <div
            ref={gridRef}
            className={cn('flex-1 px-4 pb-20 overflow-y-auto')}
          >
            {/* Stitched group views */}
            {stitchedGroups.length > 0 && (
              <div className="mb-4 space-y-4">
                {stitchedGroups.map((group) => (
                  <StitchedView
                    key={group.id}
                    group={group}
                    onCameraClick={handleCameraClick}
                  />
                ))}
              </div>
            )}

            {/* Ungrouped / individual camera cards */}
            {ungroupedCameras.length > 0 && currentMode === 'custom' ? (
              <DraggableGrid
                cameras={ungroupedCameras}
                gridCols={effectiveCols}
                onCameraClick={handleCameraClick}
              />
            ) : ungroupedCameras.length > 0 ? (
              <div
                className="gap-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`,
                }}
              >
                {ungroupedCameras.map((camera) => (
                  <CameraCard
                    key={camera.id}
                    camera={camera}
                    onClick={handleCameraClick}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ---- Health bar (fixed bottom) ---- */}
      {!isEmpty && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <HealthBar />
        </div>
      )}
    </div>
  );
}
