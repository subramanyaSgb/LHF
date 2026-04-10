import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatTemp } from '@/utils/temperature';

// ============================================================
// Iron palette LUT — precomputed for rendering performance.
// Maps normalized 0..1 values to [R, G, B] triplets.
// ============================================================
const IRON_LUT: [number, number, number][] = (() => {
  const anchors: [number, number, number][] = [
    [0, 0, 0],
    [36, 0, 90],
    [100, 0, 150],
    [180, 0, 100],
    [220, 50, 0],
    [255, 130, 0],
    [255, 200, 0],
    [255, 255, 100],
    [255, 255, 255],
  ];
  const size = 256;
  const lut: [number, number, number][] = new Array(size);
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const idx = t * (anchors.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, anchors.length - 1);
    const frac = idx - lo;
    lut[i] = [
      Math.round(anchors[lo][0] + (anchors[hi][0] - anchors[lo][0]) * frac),
      Math.round(anchors[lo][1] + (anchors[hi][1] - anchors[lo][1]) * frac),
      Math.round(anchors[lo][2] + (anchors[hi][2] - anchors[lo][2]) * frac),
    ];
  }
  return lut;
})();

interface ThermalCanvasProps {
  /** 2D array of temperature values (rows x cols) */
  thermalMatrix?: number[][];
  /** Base64 image data as fallback */
  imageData?: string;
  /** Min temperature for normalization (default: auto from data) */
  minTemp?: number;
  /** Max temperature for normalization (default: auto from data) */
  maxTemp?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function ThermalCanvas({
  thermalMatrix,
  imageData,
  minTemp,
  maxTemp,
  className,
}: ThermalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const imageDataCacheRef = useRef<ImageData | null>(null);

  const [cursorInfo, setCursorInfo] = useState<{
    x: number;
    y: number;
    temp: number;
    visible: boolean;
  }>({ x: 0, y: 0, temp: 0, visible: false });

  // ---- Render thermal matrix onto canvas ----
  const renderMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !thermalMatrix || thermalMatrix.length === 0) return;

    const rows = thermalMatrix.length;
    const cols = thermalMatrix[0].length;

    // Resize internal canvas to match data dimensions
    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols;
      canvas.height = rows;
      imageDataCacheRef.current = null;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Calculate min/max from data if not provided
    let lo = minTemp ?? Infinity;
    let hi = maxTemp ?? -Infinity;
    if (minTemp === undefined || maxTemp === undefined) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = thermalMatrix[r][c];
          if (minTemp === undefined && v < lo) lo = v;
          if (maxTemp === undefined && v > hi) hi = v;
        }
      }
    }
    const range = hi - lo || 1;

    // Reuse or create ImageData buffer
    let imgData = imageDataCacheRef.current;
    if (!imgData || imgData.width !== cols || imgData.height !== rows) {
      imgData = ctx.createImageData(cols, rows);
      imageDataCacheRef.current = imgData;
    }
    const buf = imgData.data;

    // Fill pixel buffer using precomputed LUT
    for (let r = 0; r < rows; r++) {
      const row = thermalMatrix[r];
      for (let c = 0; c < cols; c++) {
        const norm = Math.max(0, Math.min(1, (row[c] - lo) / range));
        const lutIdx = Math.round(norm * 255);
        const color = IRON_LUT[lutIdx];
        const pixIdx = (r * cols + c) * 4;
        buf[pixIdx] = color[0];
        buf[pixIdx + 1] = color[1];
        buf[pixIdx + 2] = color[2];
        buf[pixIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [thermalMatrix, minTemp, maxTemp]);

  // ---- Render base64 image fallback ----
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
  }, [imageData]);

  // ---- Main render loop ----
  useEffect(() => {
    const render = () => {
      if (thermalMatrix) {
        renderMatrix();
      } else if (imageData) {
        renderImage();
      }
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [thermalMatrix, imageData, renderMatrix, renderImage]);

  // ---- Cursor tracking ----
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!thermalMatrix || thermalMatrix.length === 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const dataX = Math.floor((e.clientX - rect.left) * scaleX);
      const dataY = Math.floor((e.clientY - rect.top) * scaleY);

      if (
        dataY >= 0 &&
        dataY < thermalMatrix.length &&
        dataX >= 0 &&
        dataX < thermalMatrix[0].length
      ) {
        setCursorInfo({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          temp: thermalMatrix[dataY][dataX],
          visible: true,
        });
      }
    },
    [thermalMatrix],
  );

  const handleMouseLeave = useCallback(() => {
    setCursorInfo((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full h-full overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Cursor temperature tooltip */}
      {cursorInfo.visible && (
        <div
          className="pointer-events-none absolute z-20 rounded-md bg-black/80 px-2 py-1 text-sm font-bold text-text-primary whitespace-nowrap"
          style={{
            left: cursorInfo.x + 14,
            top: cursorInfo.y - 10,
          }}
        >
          {formatTemp(cursorInfo.temp)}
        </div>
      )}
    </div>
  );
}
