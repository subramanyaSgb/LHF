export function formatTemp(celsius: number, decimals = 0): string {
  return `${celsius.toFixed(decimals)}\u00B0C`;
}

export function getTempColor(temp: number, min = 800, max = 1500): string {
  const ratio = Math.max(0, Math.min(1, (temp - min) / (max - min)));
  if (ratio < 0.25) return 'var(--color-thermal-cold)';
  if (ratio < 0.5) return 'var(--color-thermal-cool)';
  if (ratio < 0.75) return 'var(--color-thermal-warm)';
  if (ratio < 0.9) return 'var(--color-thermal-hot)';
  return 'var(--color-thermal-extreme)';
}

export function getTempStatusClass(temp: number, threshold: number): string {
  const ratio = temp / threshold;
  if (ratio < 0.8) return 'text-status-healthy';
  if (ratio < 0.95) return 'text-status-warning';
  return 'text-status-critical';
}

export function tempToIronPalette(normalizedValue: number): string {
  const colors = [
    [0, 0, 0],       // black
    [36, 0, 90],      // deep purple
    [100, 0, 150],    // purple
    [180, 0, 100],    // dark red
    [220, 50, 0],     // red
    [255, 130, 0],    // orange
    [255, 200, 0],    // yellow
    [255, 255, 100],  // light yellow
    [255, 255, 255],  // white
  ];
  const t = Math.max(0, Math.min(1, normalizedValue));
  const idx = t * (colors.length - 1);
  const low = Math.floor(idx);
  const high = Math.min(low + 1, colors.length - 1);
  const frac = idx - low;
  const r = Math.round(colors[low][0] + (colors[high][0] - colors[low][0]) * frac);
  const g = Math.round(colors[low][1] + (colors[high][1] - colors[low][1]) * frac);
  const b = Math.round(colors[low][2] + (colors[high][2] - colors[low][2]) * frac);
  return `rgb(${r},${g},${b})`;
}
