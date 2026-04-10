import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useROIStore, generateMockROIData } from '@/stores/roiStore';
import ROIToolbar from './ROIToolbar';
import ROICanvas from './ROICanvas';
import ROIConfigPanel from './ROIConfigPanel';

interface ROIOverlayProps {
  /** Camera ID to filter ROIs for this feed. */
  cameraId: string;
  className?: string;
}

/**
 * Composite overlay that combines the ROI toolbar, drawing canvas, and
 * configuration panel into a single layer placed on top of a camera feed.
 *
 * Manages mock temperature data generation on a 1-second interval so
 * every ROI for the given camera receives live-updating min/max/avg values.
 */
export default function ROIOverlay({ cameraId, className }: ROIOverlayProps) {
  const selectedRoiId = useROIStore((s) => s.selectedRoiId);
  const rois = useROIStore((s) => s.rois);
  const setROIData = useROIStore((s) => s.setROIData);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cameraROIs = rois.filter((r) => r.cameraId === cameraId);

  // ---- Generate mock temperature data every second ----
  useEffect(() => {
    const tick = () => {
      for (const roi of cameraROIs) {
        setROIData(roi.id, generateMockROIData(roi.id));
      }
    };

    // Initial tick
    tick();

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Re-subscribe when the list of ROI IDs changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraROIs.map((r) => r.id).join(','), setROIData]);

  // Check if the selected ROI belongs to this camera
  const selectedBelongsHere = cameraROIs.some((r) => r.id === selectedRoiId);

  return (
    <div className={cn('absolute inset-0 z-20 pointer-events-none', className)}>
      {/* ---- Toolbar — top-left floating ---- */}
      <div className="absolute top-2 left-2 z-30 pointer-events-auto">
        <ROIToolbar />
      </div>

      {/* ---- Canvas overlay — fills entire feed area ---- */}
      <div className="absolute inset-0 pointer-events-auto">
        <ROICanvas cameraId={cameraId} />
      </div>

      {/* ---- Config panel — right side, only when a ROI on this camera is selected ---- */}
      {selectedBelongsHere && (
        <div className="absolute top-2 right-2 bottom-2 z-30 pointer-events-auto">
          <ROIConfigPanel />
        </div>
      )}
    </div>
  );
}
