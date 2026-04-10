import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatTemp } from '@/utils/temperature';
import { useROIStore } from '@/stores/roiStore';
import type { ROI, ROIPoint, ROIShape } from '@/types';

// ============================================================
// Constants
// ============================================================
const HANDLE_RADIUS = 5;
const HIT_TOLERANCE = 10; // px distance for click-to-select
const FONT_SIZES: Record<'small' | 'medium' | 'large', number> = {
  small: 11,
  medium: 14,
  large: 18,
};

// Default ROI colors assigned during creation
const DEFAULT_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#ffffff'];

// ============================================================
// Helpers — coordinate conversion
// ============================================================

/** Convert normalized 0-1 coordinate to canvas pixel coordinate. */
function toCanvas(pt: ROIPoint, w: number, h: number): { x: number; y: number } {
  return { x: pt.x * w, y: pt.y * h };
}

/** Convert canvas pixel coordinate to normalized 0-1 coordinate. */
function toNorm(px: number, py: number, w: number, h: number): ROIPoint {
  return { x: px / w, y: py / h };
}

/** Euclidean distance between two pixel positions. */
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ============================================================
// Drawing state for in-progress shapes
// ============================================================
interface DrawState {
  shape: ROIShape;
  points: ROIPoint[]; // normalized
  currentPoint?: ROIPoint; // normalized — live mouse position during draw
}

// ============================================================
// Component
// ============================================================

interface ROICanvasProps {
  cameraId: string;
  className?: string;
}

/**
 * Transparent canvas overlay for drawing and displaying ROI regions.
 *
 * All ROI coordinates are stored in 0-1 normalized range so they render
 * correctly at any canvas size. The canvas is overlaid on top of the
 * thermal camera feed.
 */
export default function ROICanvas({ cameraId, className }: ROICanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Store selectors
  const rois = useROIStore((s) => s.rois);
  const roiData = useROIStore((s) => s.roiData);
  const selectedRoiId = useROIStore((s) => s.selectedRoiId);
  const activeTool = useROIStore((s) => s.activeTool);
  const setSelectedROI = useROIStore((s) => s.setSelectedROI);
  const addROI = useROIStore((s) => s.addROI);
  const setIsDrawing = useROIStore((s) => s.setIsDrawing);

  const cameraROIs = rois.filter((r) => r.cameraId === cameraId);

  // Local drawing state
  const [drawState, setDrawState] = useState<DrawState | null>(null);

  // ---- Sizing — match container ----
  const syncSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }, []);

  // ---- Build a finished ROI from draw state ----
  const finalizeROI = useCallback(
    (ds: DrawState) => {
      const id = `roi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const shapeNames: Record<ROIShape, string> = {
        point: 'Point',
        line: 'Line',
        box: 'Box',
        circle: 'Circle',
        polygon: 'Polygon',
      };
      const count = cameraROIs.length + 1;

      const roi: ROI = {
        id,
        cameraId,
        name: `${shapeNames[ds.shape]} ${count}`,
        shape: ds.shape,
        points: ds.points,
        color: DEFAULT_COLORS[cameraROIs.length % DEFAULT_COLORS.length],
        fontSize: 'medium',
        showMin: false,
        showMax: true,
        showAvg: true,
        createdAt: new Date().toISOString(),
      };

      // Compute radius for circles (stored in normalized units relative to width)
      if (ds.shape === 'circle' && ds.points.length === 2) {
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          const w = canvas.width / dpr;
          const h = canvas.height / dpr;
          const c = toCanvas(ds.points[0], w, h);
          const e = toCanvas(ds.points[1], w, h);
          roi.radius = dist(c, e) / w; // normalized to width
          roi.points = [ds.points[0]]; // only store center
        }
      }

      addROI(roi);
      setSelectedROI(id);
    },
    [addROI, cameraId, cameraROIs.length, setSelectedROI],
  );

  // ============================================================
  // Render loop
  // ============================================================
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    syncSize();

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // ---- Draw existing ROIs ----
    for (const roi of cameraROIs) {
      drawROI(ctx, roi, w, h, roi.id === selectedRoiId, roiData[roi.id]);
    }

    // ---- Draw in-progress shape ----
    if (drawState) {
      drawInProgress(ctx, drawState, w, h);
    }

  }, [cameraROIs, drawState, roiData, selectedRoiId, syncSize]);

  useEffect(() => {
    const frame = () => {
      render();
      if (drawState) {
        animRef.current = requestAnimationFrame(frame);
      }
    };
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [render, drawState]);

  // ---- Resize observer ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => syncSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [syncSize]);

  // ============================================================
  // Mouse event handlers
  // ============================================================

  /** Get normalized coordinates from a mouse event. */
  const getNormCoords = (e: React.MouseEvent): ROIPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return toNorm(px, py, rect.width, rect.height);
  };

  /** Hit-test: find the ROI under the cursor (pixel coords). */
  const hitTest = (px: number, py: number, w: number, h: number): ROI | null => {
    // Iterate in reverse so topmost drawn ROI is picked first
    for (let i = cameraROIs.length - 1; i >= 0; i--) {
      const roi = cameraROIs[i];
      if (isInsideROI(roi, px, py, w, h)) return roi;
    }
    return null;
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // left click only
      const norm = getNormCoords(e);
      if (!norm) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // ---- No active tool → select mode ----
      if (!activeTool) {
        const hit = hitTest(px, py, rect.width, rect.height);
        setSelectedROI(hit ? hit.id : null);
        return;
      }

      // ---- Drawing mode ----
      if (!drawState) {
        // Start a new shape
        setIsDrawing(true);

        if (activeTool === 'point') {
          // Point completes immediately
          const roi: ROI = {
            id: `roi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            cameraId,
            name: `Point ${cameraROIs.length + 1}`,
            shape: 'point',
            points: [norm],
            color: DEFAULT_COLORS[cameraROIs.length % DEFAULT_COLORS.length],
            fontSize: 'medium',
            showMin: false,
            showMax: true,
            showAvg: true,
            createdAt: new Date().toISOString(),
          };
          addROI(roi);
          setSelectedROI(roi.id);
          setIsDrawing(false);
          return;
        }

        if (activeTool === 'polygon') {
          setDrawState({ shape: 'polygon', points: [norm], currentPoint: norm });
          return;
        }

        // line, box, circle — start with first click
        setDrawState({ shape: activeTool, points: [norm], currentPoint: norm });
        return;
      }

      // ---- Continuing an in-progress shape ----
      if (drawState.shape === 'polygon') {
        // Add vertex
        setDrawState((prev) =>
          prev ? { ...prev, points: [...prev.points, norm] } : null,
        );
        return;
      }

      if (drawState.shape === 'line' || drawState.shape === 'circle') {
        // Second click finishes
        const finished: DrawState = { ...drawState, points: [...drawState.points, norm] };
        finalizeROI(finished);
        setDrawState(null);
        setIsDrawing(false);
        return;
      }
    },
    [
      activeTool,
      drawState,
      cameraId,
      cameraROIs.length,
      addROI,
      setSelectedROI,
      setIsDrawing,
      finalizeROI,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawState) return;
      const norm = getNormCoords(e);
      if (!norm) return;

      // For box — update second corner live
      if (drawState.shape === 'box') {
        setDrawState((prev) =>
          prev ? { ...prev, currentPoint: norm } : null,
        );
        return;
      }

      setDrawState((prev) =>
        prev ? { ...prev, currentPoint: norm } : null,
      );
    },
    [drawState],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drawState || drawState.shape !== 'box') return;
      const norm = getNormCoords(e);
      if (!norm) return;

      // Box finishes on mouse up (click-drag)
      const p0 = drawState.points[0];
      // Only finalize if the box has some size
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pxDist = dist(
        toCanvas(p0, rect.width, rect.height),
        toCanvas(norm, rect.width, rect.height),
      );
      if (pxDist < 5) return; // too small, ignore

      const finished: DrawState = { ...drawState, points: [p0, norm] };
      finalizeROI(finished);
      setDrawState(null);
      setIsDrawing(false);
    },
    [drawState, finalizeROI, setIsDrawing],
  );

  const handleDoubleClick = useCallback(
    (_e: React.MouseEvent) => {
      if (!drawState || drawState.shape !== 'polygon') return;
      if (drawState.points.length < 3) return; // need at least 3 vertices

      finalizeROI(drawState);
      setDrawState(null);
      setIsDrawing(false);
    },
    [drawState, finalizeROI, setIsDrawing],
  );

  // Cancel drawing with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawState) {
        setDrawState(null);
        setIsDrawing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawState, setIsDrawing]);

  // ---- Cursor style ----
  const cursorClass = activeTool ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 z-10', className)}
    >
      <canvas
        ref={canvasRef}
        className={cn('absolute inset-0 w-full h-full', cursorClass)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}

// ============================================================
// Drawing helpers
// ============================================================

/** Check if a pixel coordinate is inside a ROI shape. */
function isInsideROI(roi: ROI, px: number, py: number, w: number, h: number): boolean {
  const tolerance = HIT_TOLERANCE;

  switch (roi.shape) {
    case 'point': {
      const c = toCanvas(roi.points[0], w, h);
      return dist(c, { x: px, y: py }) < tolerance + 8;
    }
    case 'line': {
      if (roi.points.length < 2) return false;
      const a = toCanvas(roi.points[0], w, h);
      const b = toCanvas(roi.points[1], w, h);
      return distToSegment({ x: px, y: py }, a, b) < tolerance;
    }
    case 'box': {
      if (roi.points.length < 2) return false;
      const tl = toCanvas(roi.points[0], w, h);
      const br = toCanvas(roi.points[1], w, h);
      const minX = Math.min(tl.x, br.x) - tolerance;
      const maxX = Math.max(tl.x, br.x) + tolerance;
      const minY = Math.min(tl.y, br.y) - tolerance;
      const maxY = Math.max(tl.y, br.y) + tolerance;
      return px >= minX && px <= maxX && py >= minY && py <= maxY;
    }
    case 'circle': {
      const center = toCanvas(roi.points[0], w, h);
      const r = (roi.radius ?? 0) * w;
      return dist(center, { x: px, y: py }) < r + tolerance;
    }
    case 'polygon': {
      if (roi.points.length < 3) return false;
      const canvasPts = roi.points.map((p) => toCanvas(p, w, h));
      return pointInPolygon({ x: px, y: py }, canvasPts);
    }
    default:
      return false;
  }
}

/** Distance from a point to a line segment. */
function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Point-in-polygon test (ray casting). */
function pointInPolygon(
  p: { x: number; y: number },
  poly: { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Draw a completed ROI. */
function drawROI(
  ctx: CanvasRenderingContext2D,
  roi: ROI,
  w: number,
  h: number,
  isSelected: boolean,
  data?: { minTemp: number; maxTemp: number; avgTemp: number },
): void {
  const color = roi.color;
  const lineWidth = isSelected ? 2.5 : 1.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = color + '18'; // very low alpha fill
  ctx.lineJoin = 'round';

  switch (roi.shape) {
    case 'point': {
      const c = toCanvas(roi.points[0], w, h);
      // Crosshair
      const arm = 10;
      ctx.beginPath();
      ctx.moveTo(c.x - arm, c.y);
      ctx.lineTo(c.x + arm, c.y);
      ctx.moveTo(c.x, c.y - arm);
      ctx.lineTo(c.x, c.y + arm);
      ctx.stroke();
      // Dot
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = color + '18';
      break;
    }
    case 'line': {
      if (roi.points.length < 2) return;
      const a = toCanvas(roi.points[0], w, h);
      const b = toCanvas(roi.points[1], w, h);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      // Endpoints
      for (const pt of [a, b]) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.fillStyle = color + '18';
      break;
    }
    case 'box': {
      if (roi.points.length < 2) return;
      const tl = toCanvas(roi.points[0], w, h);
      const br = toCanvas(roi.points[1], w, h);
      const rx = Math.min(tl.x, br.x);
      const ry = Math.min(tl.y, br.y);
      const rw = Math.abs(br.x - tl.x);
      const rh = Math.abs(br.y - tl.y);
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'circle': {
      const center = toCanvas(roi.points[0], w, h);
      const r = (roi.radius ?? 0) * w;
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'polygon': {
      if (roi.points.length < 3) return;
      const pts = roi.points.map((p) => toCanvas(p, w, h));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
  }

  // ---- Selection handles ----
  if (isSelected) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const drawHandle = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    for (const pt of roi.points) {
      const cp = toCanvas(pt, w, h);
      drawHandle(cp.x, cp.y);
    }
  }

  // ---- Labels ----
  const labelPos = getLabelPosition(roi, w, h);
  drawLabel(ctx, roi, labelPos, data);
}

/** Determine where to position the label for a ROI shape. */
function getLabelPosition(
  roi: ROI,
  w: number,
  h: number,
): { x: number; y: number } {
  switch (roi.shape) {
    case 'point': {
      const c = toCanvas(roi.points[0], w, h);
      return { x: c.x + 14, y: c.y - 8 };
    }
    case 'line': {
      if (roi.points.length < 2) return { x: 0, y: 0 };
      const a = toCanvas(roi.points[0], w, h);
      const b = toCanvas(roi.points[1], w, h);
      return { x: (a.x + b.x) / 2 + 8, y: (a.y + b.y) / 2 - 10 };
    }
    case 'box': {
      if (roi.points.length < 2) return { x: 0, y: 0 };
      const tl = toCanvas(roi.points[0], w, h);
      const br = toCanvas(roi.points[1], w, h);
      return { x: Math.min(tl.x, br.x), y: Math.min(tl.y, br.y) - 6 };
    }
    case 'circle': {
      const center = toCanvas(roi.points[0], w, h);
      const r = (roi.radius ?? 0) * w;
      return { x: center.x + r * 0.7 + 6, y: center.y - r * 0.7 - 6 };
    }
    case 'polygon': {
      if (roi.points.length === 0) return { x: 0, y: 0 };
      const pts = roi.points.map((p) => toCanvas(p, w, h));
      const minY = Math.min(...pts.map((p) => p.y));
      const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      return { x: avgX, y: minY - 6 };
    }
    default:
      return { x: 0, y: 0 };
  }
}

/** Draw the ROI name and temperature labels. */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  roi: ROI,
  pos: { x: number; y: number },
  data?: { minTemp: number; maxTemp: number; avgTemp: number },
): void {
  const fontSize = FONT_SIZES[roi.fontSize];

  // Build label lines
  const lines: string[] = [roi.name];

  if (data) {
    const parts: string[] = [];
    if (roi.showMax) parts.push(`Max: ${formatTemp(data.maxTemp)}`);
    if (roi.showAvg) parts.push(`Avg: ${formatTemp(data.avgTemp)}`);
    if (roi.showMin) parts.push(`Min: ${formatTemp(data.minTemp)}`);
    if (parts.length > 0) lines.push(parts.join('  '));
  }

  ctx.font = `bold ${fontSize}px 'Inter', 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'bottom';

  // Measure for background
  const lineHeight = fontSize + 3;
  const textWidths = lines.map((l) => ctx.measureText(l).width);
  const maxWidth = Math.max(...textWidths);
  const totalHeight = lineHeight * lines.length;
  const padX = 5;
  const padY = 3;

  // Background box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  roundRect(
    ctx,
    pos.x - padX,
    pos.y - totalHeight - padY,
    maxWidth + padX * 2,
    totalHeight + padY * 2,
    3,
  );
  ctx.fill();

  // Text
  ctx.fillStyle = roi.color;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], pos.x, pos.y - (lines.length - 1 - i) * lineHeight);
  }
}

/** Draw in-progress (not yet finalized) shape outlines. */
function drawInProgress(
  ctx: CanvasRenderingContext2D,
  ds: DrawState,
  w: number,
  h: number,
): void {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';

  const cp = ds.currentPoint;

  switch (ds.shape) {
    case 'line': {
      if (ds.points.length < 1 || !cp) break;
      const a = toCanvas(ds.points[0], w, h);
      const b = toCanvas(cp, w, h);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      break;
    }
    case 'box': {
      if (ds.points.length < 1 || !cp) break;
      const tl = toCanvas(ds.points[0], w, h);
      const br = toCanvas(cp, w, h);
      const rx = Math.min(tl.x, br.x);
      const ry = Math.min(tl.y, br.y);
      const rw = Math.abs(br.x - tl.x);
      const rh = Math.abs(br.y - tl.y);
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'circle': {
      if (ds.points.length < 1 || !cp) break;
      const center = toCanvas(ds.points[0], w, h);
      const edge = toCanvas(cp, w, h);
      const r = dist(center, edge);
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'polygon': {
      if (ds.points.length === 0) break;
      const pts = ds.points.map((p) => toCanvas(p, w, h));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      if (cp) {
        const m = toCanvas(cp, w, h);
        ctx.lineTo(m.x, m.y);
      }
      if (ds.points.length >= 3) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Vertex dots
      ctx.setLineDash([]);
      for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      break;
    }
  }

  ctx.setLineDash([]);
}

/** Draw a rounded rectangle path (utility). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
