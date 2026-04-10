import type { Report } from '@/types';

// ============================================================
// Professional report generator using multi-page canvas
// Renders a high-quality branded report as downloadable PNG
// ============================================================

const S = 2; // Scale factor for high DPI
const PW = 595 * S; // A4 width
const PH = 842 * S; // A4 height
const M = 48 * S; // Margin
const CW = PW - M * 2; // Content width

// Colors
const C = {
  brand: '#2563eb',
  brandDark: '#1e40af',
  headerBg: '#0f172a',
  white: '#ffffff',
  light: '#f8fafc',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  green: '#16a34a',
  greenBg: '#f0fdf4',
  greenBorder: '#bbf7d0',
  yellow: '#ca8a04',
  yellowBg: '#fefce8',
  yellowBorder: '#fef08a',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  blueBg: '#eff6ff',
  blueBorder: '#bfdbfe',
};

function font(weight: string, size: number): string {
  return `${weight} ${size * S}px Inter, Segoe UI, system-ui, sans-serif`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

function drawStatCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  label: string, value: string, color: string, bgColor: string, borderColor: string,
): number {
  const h = 70 * S;
  roundRect(ctx, x, y, w, h, 8 * S);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1 * S;
  ctx.stroke();

  // Color accent bar
  ctx.fillStyle = color;
  roundRect(ctx, x, y, 5 * S, h, 8 * S);
  ctx.fill();
  ctx.fillRect(x + 4 * S, y, 2 * S, h);

  ctx.fillStyle = C.gray500;
  ctx.font = font('600', 10);
  ctx.fillText(label.toUpperCase(), x + 18 * S, y + 25 * S);

  ctx.fillStyle = color;
  ctx.font = font('bold', 22);
  ctx.fillText(value, x + 18 * S, y + 55 * S);

  return h;
}

function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  label: string, value: number, max: number, color: string, warningThreshold?: number,
): number {
  const h = 38 * S;
  const barH = 10 * S;
  const pct = Math.min(value / max, 1);
  const isWarning = warningThreshold !== undefined && value >= warningThreshold;

  ctx.fillStyle = C.gray700;
  ctx.font = font('600', 10);
  ctx.fillText(label, x, y + 14 * S);

  const valStr = `${value}/${max}`;
  ctx.fillStyle = isWarning ? C.red : C.gray500;
  ctx.font = font('bold', 10);
  const valW = ctx.measureText(valStr).width;
  ctx.fillText(valStr, x + w - valW, y + 14 * S);

  // Track
  roundRect(ctx, x, y + 22 * S, w, barH, 5 * S);
  ctx.fillStyle = C.gray100;
  ctx.fill();

  // Fill
  const barFillColor = isWarning ? C.red : color;
  if (pct > 0) {
    roundRect(ctx, x, y + 22 * S, Math.max(w * pct, 10 * S), barH, 5 * S);
    ctx.fillStyle = barFillColor;
    ctx.fill();
  }

  return h;
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  headers: string[], rows: string[][], colWidths: number[],
): number {
  const rowH = 28 * S;
  const headerH = 30 * S;
  let cy = y;

  // Header
  roundRect(ctx, x, cy, w, headerH, 6 * S);
  ctx.fillStyle = C.gray50;
  ctx.fill();
  ctx.strokeStyle = C.gray200;
  ctx.lineWidth = 1 * S;
  ctx.stroke();

  ctx.fillStyle = C.gray500;
  ctx.font = font('bold', 9);
  let cx = x + 12 * S;
  headers.forEach((h, i) => {
    ctx.fillText(h.toUpperCase(), cx, cy + 19 * S);
    cx += colWidths[i] * S;
  });
  cy += headerH;

  // Rows
  rows.forEach((row, rowIdx) => {
    if (rowIdx % 2 === 0) {
      ctx.fillStyle = C.white;
    } else {
      ctx.fillStyle = '#fafbfc';
    }
    ctx.fillRect(x, cy, w, rowH);

    ctx.strokeStyle = C.gray100;
    ctx.lineWidth = 0.5 * S;
    ctx.beginPath();
    ctx.moveTo(x, cy + rowH);
    ctx.lineTo(x + w, cy + rowH);
    ctx.stroke();

    cx = x + 12 * S;
    row.forEach((cell, i) => {
      ctx.fillStyle = i === 0 ? C.gray900 : C.gray700;
      ctx.font = i === 0 ? font('600', 10) : font('normal', 10);
      ctx.fillText(cell, cx, cy + 18 * S);
      cx += colWidths[i] * S;
    });
    cy += rowH;
  });

  // Bottom border
  ctx.strokeStyle = C.gray200;
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(x, cy);
  ctx.lineTo(x + w, cy);
  ctx.stroke();

  return cy - y;
}

function drawSectionHeader(ctx: CanvasRenderingContext2D, y: number, num: number, title: string): number {
  // Blue accent line
  ctx.fillStyle = C.brand;
  ctx.fillRect(M, y, CW, 3 * S);
  y += 12 * S;

  ctx.fillStyle = C.gray900;
  ctx.font = font('bold', 14);
  ctx.fillText(`${num}. ${title}`, M, y + 16 * S);
  return y + 28 * S;
}

function drawMiniChart(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  data: number[], color: string, label: string,
): void {
  // Background
  roundRect(ctx, x, y, w, h, 6 * S);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.strokeStyle = C.gray200;
  ctx.lineWidth = 1 * S;
  ctx.stroke();

  // Label
  ctx.fillStyle = C.gray500;
  ctx.font = font('600', 8);
  ctx.fillText(label, x + 10 * S, y + 16 * S);

  // Chart area
  const chartX = x + 10 * S;
  const chartY = y + 24 * S;
  const chartW = w - 20 * S;
  const chartH = h - 34 * S;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Grid lines
  ctx.strokeStyle = C.gray100;
  ctx.lineWidth = 0.5 * S;
  for (let i = 0; i < 4; i++) {
    const gy = chartY + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(chartX, gy);
    ctx.lineTo(chartX + chartW, gy);
    ctx.stroke();
  }

  // Area fill
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH);
  data.forEach((v, i) => {
    const px = chartX + (chartW / (data.length - 1)) * i;
    const py = chartY + chartH - ((v - min) / range) * chartH;
    ctx.lineTo(px, py);
  });
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.closePath();
  ctx.fillStyle = color + '20';
  ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((v, i) => {
    const px = chartX + (chartW / (data.length - 1)) * i;
    const py = chartY + chartH - ((v - min) / range) * chartH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * S;
  ctx.stroke();
}

export function downloadReportPdf(report: Report): void {
  const canvas = document.createElement('canvas');
  canvas.width = PW;
  canvas.height = PH * 2; // Two pages tall
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ================================================================
  // HEADER
  // ================================================================
  const headerH = 100 * S;
  ctx.fillStyle = C.headerBg;
  ctx.fillRect(0, 0, PW, headerH);

  // Brand gradient accent
  const grad = ctx.createLinearGradient(0, headerH, PW, headerH);
  grad.addColorStop(0, C.brand);
  grad.addColorStop(1, C.brandDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, headerH, PW, 4 * S);

  // Logo text
  ctx.fillStyle = C.white;
  ctx.font = font('bold', 24);
  ctx.fillText('INFRASENSE', M, 40 * S);

  ctx.fillStyle = C.gray400;
  ctx.font = font('normal', 10);
  ctx.fillText('LHF Thermal Monitoring System  |  JSW Vijayanagar SMS', M, 58 * S);

  // Report title
  ctx.fillStyle = '#93c5fd';
  ctx.font = font('bold', 15);
  ctx.fillText(report.title, M, 85 * S);

  // Date on right
  ctx.fillStyle = C.gray400;
  ctx.font = font('normal', 10);
  const dateStr = report.generatedAt.split('T')[0];
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, PW - M - dateW, 40 * S);

  let y = headerH + 20 * S;

  // ================================================================
  // SUMMARY CARDS
  // ================================================================
  const cardW = (CW - 16 * S * 3) / 4;
  const cards = [
    { label: 'Total Heats', value: '3', color: C.brand, bg: C.blueBg, border: C.blueBorder },
    { label: 'Peak Temp', value: '1,385°C', color: C.red, bg: C.redBg, border: C.redBorder },
    { label: 'Alerts', value: '5', color: C.yellow, bg: C.yellowBg, border: C.yellowBorder },
    { label: 'Uptime Avg', value: '96.7%', color: C.green, bg: C.greenBg, border: C.greenBorder },
  ];

  cards.forEach((card, i) => {
    const cx = M + i * (cardW + 16 * S);
    drawStatCard(ctx, cx, y, cardW, card.label, card.value, card.color, card.bg, card.border);
  });
  y += 85 * S;

  // ================================================================
  // SECTION 1: Temperature Summary
  // ================================================================
  y = drawSectionHeader(ctx, y, 1, 'Temperature Summary');

  // Mini charts side by side
  const chartW = (CW - 16 * S) / 2;
  const chartH = 100 * S;
  const tempData1 = Array.from({ length: 24 }, () => 1200 + Math.random() * 180);
  const tempData2 = Array.from({ length: 24 }, () => 1100 + Math.random() * 150);
  drawMiniChart(ctx, M, y, chartW, chartH, tempData1, C.red, 'LHF-1 MAX TEMPERATURE (24H)');
  drawMiniChart(ctx, M + chartW + 16 * S, y, chartW, chartH, tempData2, C.brand, 'LHF-2 MAX TEMPERATURE (24H)');
  y += chartH + 16 * S;

  // Summary table
  y += drawTable(ctx, M, y, CW,
    ['Metric', 'LHF-1', 'LHF-2', 'Overall'],
    [
      ['Peak Temperature', '1,385°C', '1,290°C', '1,385°C'],
      ['Average Temperature', '1,265°C', '1,210°C', '1,238°C'],
      ['Min Temperature', '1,050°C', '980°C', '980°C'],
      ['Above Threshold', '12 events', '2 events', '14 events'],
    ],
    [150, 100, 100, 100],
  );
  y += 24 * S;

  // ================================================================
  // SECTION 2: Alert History
  // ================================================================
  y = drawSectionHeader(ctx, y, 2, 'Alert History');

  // Alert summary cards
  const alertCards = [
    { label: 'Critical', value: '2', color: C.red, bg: C.redBg, border: C.redBorder },
    { label: 'Warning', value: '2', color: C.yellow, bg: C.yellowBg, border: C.yellowBorder },
    { label: 'Info', value: '1', color: C.brand, bg: C.blueBg, border: C.blueBorder },
  ];
  const alertCardW = (CW - 16 * S * 2) / 3;
  alertCards.forEach((card, i) => {
    drawStatCard(ctx, M + i * (alertCardW + 16 * S), y, alertCardW, card.label, card.value, card.color, card.bg, card.border);
  });
  y += 85 * S;

  y += drawTable(ctx, M, y, CW,
    ['Time', 'Type', 'Location', 'Value', 'Status'],
    [
      ['10:25', 'Temp Breach', 'LHF-1 Rim A', '1,385°C', 'Acknowledged'],
      ['10:20', 'Rapid Spike', 'LHF-1 Center', '+65°C/30s', 'Acknowledged'],
      ['09:15', 'Cam Offline', 'LHF-2 South', '75 min', 'Active'],
      ['08:30', 'Temp Breach', 'LHF-1 North', '1,355°C', 'Resolved'],
      ['06:15', 'Disk Warning', 'Server', '18% free', 'Resolved'],
    ],
    [70, 90, 100, 90, 100],
  );
  y += 24 * S;

  // ================================================================
  // SECTION 3: Heat Timeline
  // ================================================================
  y = drawSectionHeader(ctx, y, 3, 'Heat Timeline');
  y += drawTable(ctx, M, y, CW,
    ['Heat No.', 'Group', 'Ladle', 'Duration', 'Peak', 'Alerts', 'Trigger'],
    [
      ['H-4521', 'LHF-1', 'L-087 (#42)', '45 min', '1,385°C', '2', 'PLC Auto'],
      ['H-4520', 'LHF-1', 'L-052 (#78)', '45 min', '1,320°C', '0', 'PLC Auto'],
      ['H-4519', 'LHF-2', 'L-034 (#15)', '42 min', '1,290°C', '1', 'Manual'],
    ],
    [80, 60, 80, 65, 70, 55, 70],
  );
  y += 24 * S;

  // ================================================================
  // SECTION 4: Camera Uptime
  // ================================================================
  y = drawSectionHeader(ctx, y, 4, 'Camera Uptime');

  const cameras = [
    { name: 'LHF-1 North', uptime: 99.8 },
    { name: 'LHF-1 East', uptime: 99.5 },
    { name: 'LHF-1 South', uptime: 98.2 },
    { name: 'LHF-1 West', uptime: 99.9 },
    { name: 'LHF-2 North', uptime: 97.5 },
    { name: 'LHF-2 South', uptime: 85.3 },
  ];
  cameras.forEach((cam) => {
    const barColor = cam.uptime >= 99 ? C.green : cam.uptime >= 95 ? C.yellow : C.red;
    y += drawProgressBar(ctx, M, y, CW, `${cam.name}  —  ${cam.uptime}%`, cam.uptime, 100, barColor, 90) + 4 * S;
  });
  y += 12 * S;

  // ================================================================
  // SECTION 5: Ladle Life
  // ================================================================
  y = drawSectionHeader(ctx, y, 5, 'Ladle Life Status');

  const ladles = [
    { id: 'L-087', life: 42, max: 100 },
    { id: 'L-052', life: 78, max: 100 },
    { id: 'L-034', life: 15, max: 100 },
    { id: 'L-098', life: 91, max: 100 },
  ];
  ladles.forEach((l) => {
    const color = l.life >= 80 ? C.red : l.life >= 60 ? C.yellow : C.green;
    y += drawProgressBar(ctx, M, y, CW, `${l.id}  —  ${l.life}/${l.max} uses`, l.life, l.max, color, 80) + 4 * S;
  });
  y += 12 * S;

  // ================================================================
  // SECTION 6: Operator Notes
  // ================================================================
  y = drawSectionHeader(ctx, y, 6, 'Operator Notes');

  const notes = [
    'Camera 6 went offline at 09:15 — IT team notified for GigE cable inspection.',
    'LHF-1 ran 3 heats successfully. H-4521 flagged for rim temperature breach.',
    'PLC signals working correctly throughout the shift. No manual overrides needed.',
  ];
  notes.forEach((note) => {
    roundRect(ctx, M, y, CW, 26 * S, 4 * S);
    ctx.fillStyle = C.gray50;
    ctx.fill();
    ctx.strokeStyle = C.gray200;
    ctx.lineWidth = 0.5 * S;
    ctx.stroke();

    ctx.fillStyle = C.brand;
    ctx.font = font('normal', 10);
    ctx.fillText('•', M + 10 * S, y + 17 * S);
    ctx.fillStyle = C.gray700;
    ctx.fillText(note, M + 22 * S, y + 17 * S);
    y += 32 * S;
  });
  y += 12 * S;

  // ================================================================
  // FOOTER
  // ================================================================
  const footerY = Math.max(y + 20 * S, PH - 50 * S);
  ctx.fillStyle = C.gray200;
  ctx.fillRect(M, footerY, CW, 1 * S);

  ctx.fillStyle = C.gray400;
  ctx.font = font('normal', 8);
  ctx.fillText('Generated by InfraSense — LHF Thermal Monitoring System — JSW Vijayanagar SMS', M, footerY + 18 * S);

  const pageLabel = 'Page 1 of 1  |  Confidential';
  const pageLabelW = ctx.measureText(pageLabel).width;
  ctx.fillText(pageLabel, PW - M - pageLabelW, footerY + 18 * S);

  // ================================================================
  // DOWNLOAD
  // ================================================================
  // Crop canvas to actual content height
  const croppedH = Math.min(footerY + 30 * S, canvas.height);
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = PW;
  croppedCanvas.height = croppedH;
  const cctx = croppedCanvas.getContext('2d')!;
  cctx.drawImage(canvas, 0, 0);

  croppedCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9-_ ]/g, '')} Report.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
