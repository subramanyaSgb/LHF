// ============================================================
// InfraSense Domain Types
// ============================================================

// --- Auth & Users ---
export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// --- Cameras ---
export type CameraStatus = 'online' | 'offline' | 'recording' | 'error';
export type ThermalPalette = 'iron' | 'rainbow' | 'grayscale' | 'white-hot' | 'black-hot';

export interface Camera {
  id: string;
  name: string;
  ipAddress: string;
  serialNumber: string;
  status: CameraStatus;
  bodyTemperature: number;
  resolution: { width: number; height: number };
  frameRate: number;
  emissivity: number;
  palette: ThermalPalette;
  groupId: string | null;
  isRecording: boolean;
  uptime: number;
  lastSeen: string;
  createdAt: string;
  colorLabel: string;
}

export interface CameraFrame {
  cameraId: string;
  timestamp: number;
  imageData: string; // base64 or blob URL
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  width: number;
  height: number;
  thermalMatrix?: number[][]; // raw temperature values per pixel
}

// --- Groups ---
export type StitchPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface StitchMapping {
  cameraId: string;
  position: StitchPosition;
}

export interface CameraGroup {
  id: string;
  name: string;
  description: string;
  cameraIds: string[];
  stitchEnabled: boolean;
  stitchLayout: { rows: number; cols: number };
  stitchMappings: StitchMapping[];
  createdAt: string;
  updatedAt: string;
}

// --- ROI ---
export type ROIShape = 'point' | 'line' | 'box' | 'circle' | 'polygon';

export interface ROIPoint {
  x: number;
  y: number;
}

export interface ROI {
  id: string;
  cameraId: string;
  name: string;
  shape: ROIShape;
  points: ROIPoint[];
  radius?: number; // for circle
  color: string;
  fontSize: 'small' | 'medium' | 'large';
  showMin: boolean;
  showMax: boolean;
  showAvg: boolean;
  alertRuleId?: string;
  createdAt: string;
}

export interface ROIData {
  roiId: string;
  timestamp: string;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
}

// --- Alerts ---
export type AlertType =
  | 'temperature_breach'
  | 'rapid_spike'
  | 'cold_zone'
  | 'camera_offline'
  | 'device_overheat'
  | 'recording_failure'
  | 'disk_warning'
  | 'plc_disconnect';

export type AlertPriority = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  priority: AlertPriority;
  enabled: boolean;
  cameraId?: string;
  groupId?: string;
  roiId?: string;
  thresholdValue?: number;
  thresholdUnit?: string;
  rateOfChange?: number; // degrees per second for rapid spike
  duration?: number; // seconds for camera offline
  recipients: string[];
  smsEnabled: boolean;
  emailEnabled: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  message: string;
  cameraId?: string;
  groupId?: string;
  groupName?: string;
  cameraName?: string;
  roiId?: string;
  roiName?: string;
  value: number;
  threshold: number;
  predictedBreachTime?: string;
  timestamp: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

// --- Recordings ---
export type RecordingStatus = 'recording' | 'completed' | 'failed' | 'processing';

export interface Recording {
  id: string;
  cameraId: string;
  groupId?: string;
  heatNumber: string;
  ladleId: string;
  ladleLife: number;
  status: RecordingStatus;
  startTime: string;
  endTime?: string;
  duration: number;
  peakTemp: number;
  avgTemp: number;
  alertCount: number;
  isFlagged: boolean;
  fileSize: number;
  filePath: string;
  triggerSource: 'plc' | 'manual';
  createdAt: string;
}

export interface RecordingAnnotation {
  id: string;
  recordingId: string;
  timestamp: number; // seconds from recording start
  text: string;
  createdBy: string;
  createdAt: string;
}

// --- Reports ---
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReportStatus = 'generating' | 'completed' | 'failed';

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  filePath: string;
  fileSize: number;
  emailedTo: string[];
}

// --- Analytics ---
export interface TemperatureDataPoint {
  timestamp: string;
  value: number;
  roiId?: string;
  cameraId?: string;
}

export interface HeatSummary {
  heatNumber: string;
  groupName: string;
  startTime: string;
  endTime: string;
  duration: number;
  peakTemp: number;
  avgTemp: number;
  alertCount: number;
  ladleId: string;
  ladleLife: number;
}

export interface ThermalBaseline {
  id: string;
  name: string;
  groupId: string;
  expectedCurve: TemperatureDataPoint[];
  tolerancePercent: number;
  createdAt: string;
}

// --- System ---
export type SystemComponentStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface SystemHealth {
  plc: {
    connected: boolean;
    lastSignal: string;
    latencyMs: number;
  };
  server: {
    cpuTemp: number;
    cpuUsage: number;
    ramUsage: number;
    diskFreeGb: number;
    diskTotalGb: number;
    uptime: number;
  };
  network: {
    bandwidthUsage: number;
    packetLoss: number;
    cameras: Record<string, { latencyMs: number; status: SystemComponentStatus }>;
  };
}

// --- Dashboard Layout ---
export type LayoutMode = 'auto' | 'grid' | 'custom';

export interface LayoutPreset {
  id: string;
  name: string;
  mode: LayoutMode;
  gridCols?: number;
  gridRows?: number;
  items: LayoutItem[];
  createdAt: string;
}

export interface LayoutItem {
  id: string;
  cameraId?: string;
  groupId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Shift Handover ---
export interface ShiftNote {
  id: string;
  shiftDate: string;
  shiftType: 'day' | 'night';
  content: string;
  createdBy: string;
  createdAt: string;
}

// --- Audit Log ---
export interface AuditEntry {
  id: string;
  userId: string;
  username: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

// --- Incident Report ---
export interface IncidentReport {
  id: string;
  alertId: string;
  title: string;
  description: string;
  snapshots: string[];
  roiData: ROIData[];
  recordingId?: string;
  operatorActions: string;
  generatedAt: string;
  generatedBy: string;
}

// --- Ladle ---
export interface Ladle {
  id: string;
  ladleNumber: string;
  lifeCount: number;
  maxLife: number;
  hotSpotHistory: HotSpotEntry[];
  lastUsed: string;
  maintenanceDue: boolean;
}

export interface HotSpotEntry {
  heatNumber: string;
  cameraId: string;
  position: ROIPoint;
  peakTemp: number;
  timestamp: string;
}
