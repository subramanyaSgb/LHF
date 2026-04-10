import { jsPDF } from 'jspdf';
import type { Report } from '@/types';

// ============================================================
// Professional PDF report generator using jsPDF
// ============================================================

const C = {
  brand: [37, 99, 235] as [number, number, number],
  brandDark: [30, 64, 175] as [number, number, number],
  headerBg: [15, 23, 42] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray50: [249, 250, 251] as [number, number, number],
  gray100: [243, 244, 246] as [number, number, number],
  gray200: [229, 231, 235] as [number, number, number],
  gray400: [156, 163, 175] as [number, number, number],
  gray500: [107, 114, 128] as [number, number, number],
  gray700: [55, 65, 81] as [number, number, number],
  gray900: [17, 24, 39] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  greenLight: [240, 253, 244] as [number, number, number],
  yellow: [202, 138, 4] as [number, number, number],
  yellowLight: [254, 252, 232] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  redLight: [254, 242, 242] as [number, number, number],
  blueLight: [239, 246, 255] as [number, number, number],
};

type RGB = [number, number, number];

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return 15;
  }
  return y;
}

function drawStatCard(
  doc: jsPDF, x: number, y: number, w: number,
  label: string, value: string, color: RGB, bgColor: RGB,
): void {
  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y, w, 22, 2, 2, 'F');
  doc.setFillColor(...color);
  doc.rect(x, y, 1.5, 22, 'F');

  doc.setFontSize(7);
  doc.setTextColor(...C.gray500);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), x + 5, y + 8);

  doc.setFontSize(16);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 5, y + 18);
}

function drawProgressBar(
  doc: jsPDF, x: number, y: number, w: number,
  label: string, value: number, max: number, color: RGB, warnAt?: number,
): number {
  const pct = Math.min(value / max, 1);
  const isWarn = warnAt !== undefined && value >= warnAt;
  const barColor: RGB = isWarn ? C.red : color;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gray700);
  doc.text(label, x, y + 4);

  const valStr = `${value}/${max}`;
  doc.setTextColor(...(isWarn ? C.red : C.gray500));
  doc.setFont('helvetica', 'bold');
  doc.text(valStr, x + w, y + 4, { align: 'right' });

  // Track
  doc.setFillColor(...C.gray100);
  doc.roundedRect(x, y + 6, w, 3, 1.5, 1.5, 'F');

  // Fill
  if (pct > 0) {
    doc.setFillColor(...barColor);
    doc.roundedRect(x, y + 6, Math.max(w * pct, 3), 3, 1.5, 1.5, 'F');
  }

  return 13;
}

function drawTableHeader(doc: jsPDF, x: number, y: number, w: number, headers: string[], colWidths: number[]): number {
  doc.setFillColor(...C.gray50);
  doc.rect(x, y, w, 7, 'F');
  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, 7, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gray500);

  let cx = x + 3;
  headers.forEach((h, i) => {
    doc.text(h.toUpperCase(), cx, y + 4.5);
    cx += colWidths[i];
  });

  return 7;
}

function drawTableRow(doc: jsPDF, x: number, y: number, w: number, row: string[], colWidths: number[], even: boolean): number {
  if (even) {
    doc.setFillColor(252, 252, 253);
    doc.rect(x, y, w, 6.5, 'F');
  }
  doc.setDrawColor(...C.gray100);
  doc.setLineWidth(0.1);
  doc.line(x, y + 6.5, x + w, y + 6.5);

  doc.setFontSize(7.5);

  let cx = x + 3;
  row.forEach((cell, i) => {
    doc.setTextColor(...(i === 0 ? C.gray900 : C.gray700));
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    doc.text(cell, cx, y + 4.5);
    cx += colWidths[i];
  });

  return 6.5;
}

function drawMiniChart(doc: jsPDF, x: number, y: number, w: number, h: number, data: number[], color: RGB, label: string): void {
  // Border
  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');

  // Label
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gray500);
  doc.text(label, x + 3, y + 5);

  // Chart area
  const cx = x + 3;
  const cy = y + 8;
  const cw = w - 6;
  const ch = h - 11;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Grid lines
  doc.setDrawColor(...C.gray100);
  doc.setLineWidth(0.1);
  for (let i = 0; i < 3; i++) {
    const gy = cy + (ch / 2) * i;
    doc.line(cx, gy, cx + cw, gy);
  }

  // Build points
  const points: [number, number][] = data.map((v, i) => [
    cx + (cw / (data.length - 1)) * i,
    cy + ch - ((v - min) / range) * ch,
  ]);

  // Area fill (polygon)
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  const polyPoints: number[][] = [
    [cx, cy + ch],
    ...points,
    [cx + cw, cy + ch],
  ];
  // Use triangle fills to approximate area
  for (let i = 0; i < points.length - 1; i++) {
    doc.triangle(
      points[i][0], points[i][1],
      points[i + 1][0], points[i + 1][1],
      points[i][0], cy + ch,
      'F'
    );
    doc.triangle(
      points[i + 1][0], points[i + 1][1],
      points[i + 1][0], cy + ch,
      points[i][0], cy + ch,
      'F'
    );
  }
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // Line
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
}

export function downloadReportPdf(report: Report): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = 210; // A4 width mm
  const m = 15; // margin
  const cw = pw - m * 2; // content width

  // ================================================================
  // HEADER
  // ================================================================
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pw, 32, 'F');
  doc.setFillColor(...C.brand);
  doc.rect(0, 32, pw, 1.2, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INFRASENSE', m, 13);

  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray400);
  doc.setFont('helvetica', 'normal');
  doc.text('LHF Thermal Monitoring System  |  JSW Vijayanagar SMS', m, 19);

  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.setFont('helvetica', 'bold');
  doc.text(report.title, m, 28);

  // Date on right
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray400);
  doc.setFont('helvetica', 'normal');
  const dateStr = report.generatedAt.split('T')[0];
  doc.text(dateStr, pw - m, 13, { align: 'right' });

  let y = 38;

  // ================================================================
  // SUMMARY CARDS
  // ================================================================
  const cardW = (cw - 6 * 3) / 4;
  const cardData = [
    { label: 'Total Heats', value: '3', color: C.brand, bg: C.blueLight },
    { label: 'Peak Temp', value: '1,385°C', color: C.red, bg: C.redLight },
    { label: 'Alerts', value: '5', color: C.yellow, bg: C.yellowLight },
    { label: 'Uptime Avg', value: '96.7%', color: C.green, bg: C.greenLight },
  ];
  cardData.forEach((card, i) => {
    drawStatCard(doc, m + i * (cardW + 6), y, cardW, card.label, card.value, card.color, card.bg);
  });
  y += 28;

  // ================================================================
  // SECTION 1: Temperature Summary
  // ================================================================
  doc.setFillColor(...C.brand);
  doc.rect(m, y, cw, 0.8, 'F');
  y += 3;
  doc.setFontSize(11);
  doc.setTextColor(...C.gray900);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Temperature Summary', m, y + 5);
  y += 9;

  // Mini charts
  const chartW = (cw - 6) / 2;
  const tempData1 = Array.from({ length: 20 }, () => 1200 + Math.random() * 180);
  const tempData2 = Array.from({ length: 20 }, () => 1100 + Math.random() * 150);
  drawMiniChart(doc, m, y, chartW, 28, tempData1, C.red, 'LHF-1 MAX TEMP (24H)');
  drawMiniChart(doc, m + chartW + 6, y, chartW, 28, tempData2, C.brand, 'LHF-2 MAX TEMP (24H)');
  y += 32;

  // Table
  y += drawTableHeader(doc, m, y, cw, ['Metric', 'LHF-1', 'LHF-2', 'Overall'], [55, 35, 35, 35]);
  [
    ['Peak Temperature', '1,385°C', '1,290°C', '1,385°C'],
    ['Average Temperature', '1,265°C', '1,210°C', '1,238°C'],
    ['Min Temperature', '1,050°C', '980°C', '980°C'],
    ['Above Threshold', '12 events', '2 events', '14 events'],
  ].forEach((row, i) => {
    y += drawTableRow(doc, m, y, cw, row, [55, 35, 35, 35], i % 2 === 0);
  });
  y += 8;

  // ================================================================
  // SECTION 2: Alert History
  // ================================================================
  y = checkPage(doc, y, 60);
  doc.setFillColor(...C.brand);
  doc.rect(m, y, cw, 0.8, 'F');
  y += 3;
  doc.setFontSize(11);
  doc.setTextColor(...C.gray900);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Alert History', m, y + 5);
  y += 9;

  const alertCardW = (cw - 12) / 3;
  [
    { label: 'Critical', value: '2', color: C.red, bg: C.redLight },
    { label: 'Warning', value: '2', color: C.yellow, bg: C.yellowLight },
    { label: 'Info', value: '1', color: C.brand, bg: C.blueLight },
  ].forEach((card, i) => {
    drawStatCard(doc, m + i * (alertCardW + 6), y, alertCardW, card.label, card.value, card.color, card.bg);
  });
  y += 28;

  y += drawTableHeader(doc, m, y, cw, ['Time', 'Type', 'Location', 'Value', 'Status'], [25, 30, 40, 35, 30]);
  [
    ['10:25', 'Temp Breach', 'LHF-1 Rim A', '1,385°C', 'Acknowledged'],
    ['10:20', 'Rapid Spike', 'LHF-1 Center', '+65°C/30s', 'Acknowledged'],
    ['09:15', 'Cam Offline', 'LHF-2 South', '75 min', 'Active'],
    ['08:30', 'Temp Breach', 'LHF-1 North', '1,355°C', 'Resolved'],
    ['06:15', 'Disk Warning', 'Server', '18% free', 'Resolved'],
  ].forEach((row, i) => {
    y += drawTableRow(doc, m, y, cw, row, [25, 30, 40, 35, 30], i % 2 === 0);
  });
  y += 8;

  // ================================================================
  // SECTION 3: Heat Timeline
  // ================================================================
  y = checkPage(doc, y, 45);
  doc.setFillColor(...C.brand);
  doc.rect(m, y, cw, 0.8, 'F');
  y += 3;
  doc.setFontSize(11);
  doc.setTextColor(...C.gray900);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Heat Timeline', m, y + 5);
  y += 9;

  y += drawTableHeader(doc, m, y, cw, ['Heat No.', 'Group', 'Ladle', 'Duration', 'Peak', 'Alerts', 'Trigger'], [28, 22, 28, 22, 24, 20, 24]);
  [
    ['H-4521', 'LHF-1', 'L-087 (#42)', '45 min', '1,385°C', '2', 'PLC Auto'],
    ['H-4520', 'LHF-1', 'L-052 (#78)', '45 min', '1,320°C', '0', 'PLC Auto'],
    ['H-4519', 'LHF-2', 'L-034 (#15)', '42 min', '1,290°C', '1', 'Manual'],
  ].forEach((row, i) => {
    y += drawTableRow(doc, m, y, cw, row, [28, 22, 28, 22, 24, 20, 24], i % 2 === 0);
  });
  y += 8;

  // ================================================================
  // SECTION 4: Camera Uptime
  // ================================================================
  y = checkPage(doc, y, 50);
  doc.setFillColor(...C.brand);
  doc.rect(m, y, cw, 0.8, 'F');
  y += 3;
  doc.setFontSize(11);
  doc.setTextColor(...C.gray900);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Camera Uptime', m, y + 5);
  y += 9;

  [
    { name: 'LHF-1 North', uptime: 99.8 },
    { name: 'LHF-1 East', uptime: 99.5 },
    { name: 'LHF-1 South', uptime: 98.2 },
    { name: 'LHF-1 West', uptime: 99.9 },
    { name: 'LHF-2 North', uptime: 97.5 },
    { name: 'LHF-2 South', uptime: 85.3 },
  ].forEach((cam) => {
    y = checkPage(doc, y, 14);
    const barColor: RGB = cam.uptime >= 99 ? C.green : cam.uptime >= 95 ? C.yellow : C.red;
    y += drawProgressBar(doc, m, y, cw, `${cam.name}  —  ${cam.uptime}%`, cam.uptime, 100, barColor, 90);
  });
  y += 6;

  // ================================================================
  // SECTION 5: Ladle Life
  // ================================================================
  y = checkPage(doc, y, 45);
  doc.setFillColor(...C.brand);
  doc.rect(m, y, cw, 0.8, 'F');
  y += 3;
  doc.setFontSize(11);
  doc.setTextColor(...C.gray900);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Ladle Life Status', m, y + 5);
  y += 9;

  [
    { id: 'L-087', life: 42, max: 100 },
    { id: 'L-052', life: 78, max: 100 },
    { id: 'L-034', life: 15, max: 100 },
    { id: 'L-098', life: 91, max: 100 },
  ].forEach((l) => {
    y = checkPage(doc, y, 14);
    const color: RGB = l.life >= 80 ? C.red : l.life >= 60 ? C.yellow : C.green;
    y += drawProgressBar(doc, m, y, cw, `${l.id}  —  ${l.life}/${l.max} uses`, l.life, l.max, color, 80);
  });
  y += 6;

  // ================================================================
  // SECTION 6: Operator Notes
  // ================================================================
  y = checkPage(doc, y, 40);
  doc.setFillColor(...C.brand);
  doc.rect(m, y, cw, 0.8, 'F');
  y += 3;
  doc.setFontSize(11);
  doc.setTextColor(...C.gray900);
  doc.setFont('helvetica', 'bold');
  doc.text('6. Operator Notes', m, y + 5);
  y += 9;

  const notes = [
    'Camera 6 went offline at 09:15 — IT team notified for GigE cable inspection.',
    'LHF-1 ran 3 heats successfully. H-4521 flagged for rim temperature breach.',
    'PLC signals working correctly throughout the shift. No manual overrides needed.',
  ];
  notes.forEach((note) => {
    y = checkPage(doc, y, 10);
    doc.setFillColor(...C.gray50);
    doc.roundedRect(m, y, cw, 7, 1, 1, 'F');

    doc.setFontSize(7.5);
    doc.setTextColor(...C.brand);
    doc.setFont('helvetica', 'bold');
    doc.text('•', m + 3, y + 4.8);
    doc.setTextColor(...C.gray700);
    doc.setFont('helvetica', 'normal');
    doc.text(note, m + 7, y + 4.8);
    y += 9;
  });
  y += 6;

  // ================================================================
  // FOOTER (on every page)
  // ================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.gray200);
    doc.setLineWidth(0.2);
    doc.line(m, 285, pw - m, 285);

    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray400);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by InfraSense — LHF Thermal Monitoring System — JSW Vijayanagar SMS', m, 290);
    doc.text(`Page ${p} of ${totalPages}  |  Confidential`, pw - m, 290, { align: 'right' });
  }

  // ================================================================
  // DOWNLOAD
  // ================================================================
  const filename = `${report.title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.pdf`;
  doc.save(filename);
}
