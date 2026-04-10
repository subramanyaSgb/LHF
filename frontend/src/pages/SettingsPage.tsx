import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Settings,
  Globe,
  Trash2,
  Bell,
  Cpu,
  Film,
  Save,
  CheckCircle,
  Send,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Toggle } from '@/components/common/Toggle';
import { Button } from '@/components/common/Button';

// ---------------------------------------------------------------------------
//  Section wrapper
// ---------------------------------------------------------------------------

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onSave: () => void;
  saving?: boolean;
  saved?: boolean;
}

function SettingsSection({
  title,
  description,
  icon,
  children,
  onSave,
  saving = false,
  saved = false,
}: SettingsSectionProps): React.JSX.Element {
  return (
    <Card variant="bordered">
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0 p-2.5 rounded-[var(--radius-md)] bg-brand-primary/10 text-brand-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <p className="text-sm text-text-muted mt-0.5">{description}</p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-default">
        {saved && (
          <span className="flex items-center gap-1.5 text-status-healthy text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Saved
          </span>
        )}
        <Button
          variant="primary"
          iconLeft={<Save className="w-4 h-4" />}
          onClick={onSave}
          loading={saving}
        >
          Save Changes
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

export default function SettingsPage(): React.JSX.Element {
  // General settings
  const [systemName, setSystemName] = useState('InfraSense LHF Monitor');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Retention policy
  const [cleanRetentionDays, setCleanRetentionDays] = useState('7');
  const [flaggedRetentionDays, setFlaggedRetentionDays] = useState('90');
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);

  // Notifications
  const [smsGatewayUrl, setSmsGatewayUrl] = useState('https://sms.gateway.jsw.in/api/send');
  const [smtpServer, setSmtpServer] = useState('smtp.jsw.in');
  const [smtpPort, setSmtpPort] = useState('587');
  const [fromEmail, setFromEmail] = useState('infrasense@jsw.in');

  // PLC Configuration
  const [plcIp, setPlcIp] = useState('192.168.1.10');
  const [plcPort, setPlcPort] = useState('502');
  const [plcPollInterval, setPlcPollInterval] = useState('1000');
  const [plcTimeout, setPlcTimeout] = useState('5000');

  // Recording
  const [defaultFrameRate, setDefaultFrameRate] = useState('25');
  const [storagePath, setStoragePath] = useState('/data/recordings');
  const [maxFileSize, setMaxFileSize] = useState('4096');

  // Save states
  const [savedSections, setSavedSections] = useState<Record<string, boolean>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const handleSave = useCallback((section: string) => {
    // Simulate save
    setSavedSections((prev) => ({ ...prev, [section]: true }));
    saveTimerRef.current = setTimeout(() => {
      setSavedSections((prev) => ({ ...prev, [section]: false }));
    }, 2000);
  }, []);

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-brand-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* General */}
      <SettingsSection
        title="General"
        description="Basic system identification and locale"
        icon={<Globe className="w-5 h-5" />}
        onSave={() => handleSave('general')}
        saved={savedSections['general']}
      >
        <Input
          label="System Name"
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
          helperText="Displayed in the header and reports"
          fullWidth
        />
        <Select
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          options={[
            { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
            { value: 'UTC', label: 'UTC' },
            { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
            { value: 'America/New_York', label: 'America/New_York (EST, UTC-5)' },
          ]}
          fullWidth
        />
      </SettingsSection>

      {/* Retention Policy */}
      <SettingsSection
        title="Retention Policy"
        description="Control how long recordings are kept before automatic cleanup"
        icon={<Trash2 className="w-5 h-5" />}
        onSave={() => handleSave('retention')}
        saved={savedSections['retention']}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Clean Heat Retention (days)"
            type="number"
            value={cleanRetentionDays}
            onChange={(e) => setCleanRetentionDays(e.target.value)}
            helperText="Heats with no alerts are deleted after this period"
            fullWidth
          />
          <Input
            label="Flagged Heat Retention (days)"
            type="number"
            value={flaggedRetentionDays}
            onChange={(e) => setFlaggedRetentionDays(e.target.value)}
            helperText="Heats with alerts are retained longer"
            fullWidth
          />
        </div>
        <Toggle
          label="Auto-delete expired recordings"
          checked={autoDeleteEnabled}
          onChange={setAutoDeleteEnabled}
          size="md"
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        description="SMS and email gateway configuration for alerts and reports"
        icon={<Bell className="w-5 h-5" />}
        onSave={() => handleSave('notifications')}
        saved={savedSections['notifications']}
      >
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-text-primary">SMS Gateway</h3>
          <div className="flex items-end gap-3">
            <Input
              label="Gateway URL"
              value={smsGatewayUrl}
              onChange={(e) => setSmsGatewayUrl(e.target.value)}
              placeholder="https://sms.provider.com/api"
              fullWidth
            />
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Send className="w-4 h-4" />}
              className="shrink-0 mb-0.5"
            >
              Test SMS
            </Button>
          </div>
        </div>

        <div className="border-t border-border-default pt-4 space-y-4">
          <h3 className="text-base font-semibold text-text-primary">Email (SMTP)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="SMTP Server"
              value={smtpServer}
              onChange={(e) => setSmtpServer(e.target.value)}
              placeholder="smtp.example.com"
              fullWidth
            />
            <Input
              label="SMTP Port"
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              fullWidth
            />
          </div>
          <div className="flex items-end gap-3">
            <Input
              label="From Email"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="alerts@example.com"
              fullWidth
            />
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Send className="w-4 h-4" />}
              className="shrink-0 mb-0.5"
            >
              Test Email
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* PLC Configuration */}
      <SettingsSection
        title="PLC Configuration"
        description="Connection parameters for the process start/stop PLC"
        icon={<Cpu className="w-5 h-5" />}
        onSave={() => handleSave('plc')}
        saved={savedSections['plc']}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="PLC IP Address"
            value={plcIp}
            onChange={(e) => setPlcIp(e.target.value)}
            placeholder="192.168.1.10"
            fullWidth
          />
          <Input
            label="Port"
            type="number"
            value={plcPort}
            onChange={(e) => setPlcPort(e.target.value)}
            placeholder="502"
            fullWidth
          />
          <Input
            label="Poll Interval (ms)"
            type="number"
            value={plcPollInterval}
            onChange={(e) => setPlcPollInterval(e.target.value)}
            helperText="How often to check PLC for signals"
            fullWidth
          />
          <Input
            label="Connection Timeout (ms)"
            type="number"
            value={plcTimeout}
            onChange={(e) => setPlcTimeout(e.target.value)}
            helperText="Mark PLC as disconnected after this timeout"
            fullWidth
          />
        </div>
      </SettingsSection>

      {/* Recording */}
      <SettingsSection
        title="Recording"
        description="Default recording parameters for thermal cameras"
        icon={<Film className="w-5 h-5" />}
        onSave={() => handleSave('recording')}
        saved={savedSections['recording']}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input
            label="Default Frame Rate (fps)"
            type="number"
            value={defaultFrameRate}
            onChange={(e) => setDefaultFrameRate(e.target.value)}
            helperText="Frames per second"
            fullWidth
          />
          <Input
            label="Storage Path"
            value={storagePath}
            onChange={(e) => setStoragePath(e.target.value)}
            helperText="Base directory for recordings"
            fullWidth
          />
          <Input
            label="Max File Size (MB)"
            type="number"
            value={maxFileSize}
            onChange={(e) => setMaxFileSize(e.target.value)}
            helperText="Split recordings at this size"
            fullWidth
          />
        </div>
      </SettingsSection>
    </div>
  );
}
