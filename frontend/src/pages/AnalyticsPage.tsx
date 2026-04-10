import { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useGroupStore } from '@/stores/groupStore';
import { mockHeatSummaries, mockCameras } from '@/utils/mock-data';
import {
  BarChart3,
  TrendingUp,
  Flame,
  AlertTriangle,
  Wrench,
  MonitorCheck,
  Download,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TabKey = 'temperature' | 'heat' | 'alerts' | 'ladle' | 'uptime';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { key: 'temperature', label: 'Temperature Timeline', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'heat', label: 'Heat Summary', icon: <Flame className="w-4 h-4" /> },
  { key: 'alerts', label: 'Alert Frequency', icon: <AlertTriangle className="w-4 h-4" /> },
  { key: 'ladle', label: 'Ladle Life', icon: <Wrench className="w-4 h-4" /> },
  { key: 'uptime', label: 'Camera Uptime', icon: <MonitorCheck className="w-4 h-4" /> },
];

const DARK_TOOLTIP = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: '#f1f5f9' },
};

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------
function generateTemperatureTimeline() {
  const data: Array<{
    time: string;
    lhf1Max: number;
    lhf1Avg: number;
    lhf2Max: number;
  }> = [];
  const base = Date.now() - 60 * 60 * 1000;
  for (let i = 0; i < 60; i++) {
    const t = new Date(base + i * 60 * 1000);
    const min = t.getMinutes().toString().padStart(2, '0');
    const hr = t.getHours().toString().padStart(2, '0');
    data.push({
      time: `${hr}:${min}`,
      lhf1Max: 1280 + Math.sin(i / 8) * 60 + (Math.random() - 0.5) * 30,
      lhf1Avg: 1200 + Math.sin(i / 10) * 40 + (Math.random() - 0.5) * 20,
      lhf2Max: 1250 + Math.cos(i / 6) * 50 + (Math.random() - 0.5) * 25,
    });
  }
  return data;
}

function generateAlertFrequency() {
  const data: Array<{
    hour: string;
    critical: number;
    warning: number;
    info: number;
  }> = [];
  for (let h = 0; h < 24; h++) {
    data.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      critical: Math.floor(Math.random() * 3),
      warning: Math.floor(Math.random() * 5),
      info: Math.floor(Math.random() * 4),
    });
  }
  return data;
}

const LADLE_DATA = [
  { id: 'L-087', life: 42, maxLife: 100, hotSpots: 3, maintenanceDue: false },
  { id: 'L-052', life: 78, maxLife: 100, hotSpots: 7, maintenanceDue: true },
  { id: 'L-034', life: 15, maxLife: 100, hotSpots: 0, maintenanceDue: false },
  { id: 'L-011', life: 91, maxLife: 100, hotSpots: 12, maintenanceDue: true },
  { id: 'L-063', life: 55, maxLife: 100, hotSpots: 2, maintenanceDue: false },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function TemperatureTimeline({ data }: { data: ReturnType<typeof generateTemperatureTimeline> }) {
  return (
    <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-5">
      <h3 className="text-base font-semibold text-text-primary mb-4">Temperature Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradLhf1Max" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLhf1Avg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLhf2Max" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={9} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['auto', 'auto']} stroke="#334155" />
          <Tooltip {...DARK_TOOLTIP} />
          <Legend wrapperStyle={{ color: '#f1f5f9', fontSize: 12, paddingTop: 8 }} />
          <Area type="monotone" dataKey="lhf1Max" name="LHF-1 Max" stroke="#ef4444" fill="url(#gradLhf1Max)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="lhf1Avg" name="LHF-1 Avg" stroke="#f59e0b" fill="url(#gradLhf1Avg)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="lhf2Max" name="LHF-2 Max" stroke="#3b82f6" fill="url(#gradLhf2Max)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeatSummaryChart() {
  const data = mockHeatSummaries.map((h) => ({
    heat: h.heatNumber,
    peak: Math.round(h.peakTemp),
    avg: Math.round(h.avgTemp),
  }));

  return (
    <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-5">
      <h3 className="text-base font-semibold text-text-primary mb-4">Peak / Average per Heat</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="heat" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <Tooltip {...DARK_TOOLTIP} />
          <Legend wrapperStyle={{ color: '#f1f5f9', fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="peak" name="Peak Temp" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="avg" name="Avg Temp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AlertFrequencyChart({ data }: { data: ReturnType<typeof generateAlertFrequency> }) {
  return (
    <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-5">
      <h3 className="text-base font-semibold text-text-primary mb-4">Alerts by Hour (Last 24h)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={3} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} stroke="#334155" />
          <Tooltip {...DARK_TOOLTIP} />
          <Legend wrapperStyle={{ color: '#f1f5f9', fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="warning" name="Warning" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="info" name="Info" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LadleLifePanel() {
  return (
    <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-5 space-y-4">
      <h3 className="text-base font-semibold text-text-primary">Ladle Life Tracker</h3>
      <div className="space-y-3">
        {LADLE_DATA.map((ladle) => {
          const pct = (ladle.life / ladle.maxLife) * 100;
          const barColor =
            pct >= 80 ? 'bg-status-critical' : pct >= 60 ? 'bg-status-warning' : 'bg-status-healthy';
          return (
            <div key={ladle.id} className="p-4 bg-bg-secondary rounded-[var(--radius-md)] border border-border-default">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-primary">{ladle.id}</span>
                  {ladle.maintenanceDue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-status-warning-bg text-status-warning rounded-full">
                      <Wrench className="w-3 h-3" />
                      Maintenance Due
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-text-secondary">
                  {ladle.life} / {ladle.maxLife} heats
                </span>
              </div>
              <div className="w-full h-3 bg-bg-input rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                <span>Hot spots: {ladle.hotSpots}</span>
                <span>{Math.round(pct)}% life used</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CameraUptimeChart() {
  const data = mockCameras.map((c) => ({
    name: c.name,
    uptime: c.uptime,
    fill: c.uptime >= 99 ? '#22c55e' : c.uptime >= 95 ? '#f59e0b' : '#ef4444',
  }));

  return (
    <div className="bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-5">
      <h3 className="text-base font-semibold text-text-primary mb-4">Camera Uptime (%)</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 60)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" domain={[80, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#f1f5f9', fontSize: 12 }} stroke="#334155" />
          <Tooltip
            {...DARK_TOOLTIP}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Uptime']}
          />
          <Bar dataKey="uptime" name="Uptime" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-healthy" /> 99%+</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-warning" /> 95-99%</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-critical" /> &lt;95%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AnalyticsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('temperature');
  const groups = useGroupStore((s) => s.groups);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('2026-04-09');
  const [dateTo, setDateTo] = useState('2026-04-10');

  const temperatureData = useMemo(() => generateTemperatureTimeline(), []);
  const alertData = useMemo(() => generateAlertFrequency(), []);

  const renderContent = () => {
    switch (activeTab) {
      case 'temperature':
        return <TemperatureTimeline data={temperatureData} />;
      case 'heat':
        return <HeatSummaryChart />;
      case 'alerts':
        return <AlertFrequencyChart data={alertData} />;
      case 'ladle':
        return <LadleLifePanel />;
      case 'uptime':
        return <CameraUptimeChart />;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-bg-primary min-h-screen space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-primary" />
            Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Temperature trends, baselines, and performance analytics
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-muted" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
          />
          <span className="text-text-muted text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
          />
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2 bg-bg-input border border-border-default rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-border-focus"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-card rounded-[var(--radius-lg)] border border-border-default p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[var(--radius-md)] whitespace-nowrap transition-colors',
              activeTab === tab.key
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
