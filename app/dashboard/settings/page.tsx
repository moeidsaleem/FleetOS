"use client"

import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../components/auth/require-auth';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, RefreshCw } from 'lucide-react'

const TEMPLATE_TYPES = ['whatsapp', 'telegram', 'email', 'voice'] as const;

type TemplateType = typeof TEMPLATE_TYPES[number];

type NotificationTemplates = {
  [key in TemplateType]?: string;
};

function NotificationTemplatesSection() {
  const [templates, setTemplates] = useState<NotificationTemplates>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings?key=notificationTemplates')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setTemplates(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (type: TemplateType, value: string) => {
    setTemplates(t => ({ ...t, [type]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings?key=notificationTemplates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templates),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast({ title: 'Templates saved', variant: 'default' });
    } else {
      toast({ title: 'Failed to save', description: data.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notification Templates</h2>
      <p className="text-muted-foreground mb-4">Customize the message templates for each alert channel.</p>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        {TEMPLATE_TYPES.map(type => (
          <div key={type} className="space-y-1">
            <label className="block font-medium capitalize" htmlFor={`template-${type}`}>{type} Template</label>
            <Input
              id={`template-${type}`}
              value={templates[type] || ''}
              onChange={e => handleChange(type, e.target.value)}
              placeholder={`Enter ${type} message template...`}
              disabled={loading}
            />
          </div>
        ))}
        <Button type="submit" disabled={saving || loading} className="mt-4">
          {saving ? 'Saving...' : 'Save Templates'}
        </Button>
      </form>
    </div>
  );
}

function OrganizationSection() {
  const [org, setOrg] = useState({ organizationName: '', contactEmail: '', logoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings?key=organization')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setOrg(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrg(o => ({ ...o, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings?key=organization', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(org),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast({ title: 'Organization info saved', variant: 'default' });
    } else {
      toast({ title: 'Failed to save', description: data.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Organization Info</h2>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block font-medium mb-1" htmlFor="organizationName">Organization Name</label>
          <Input
            id="organizationName"
            name="organizationName"
            value={org.organizationName || ''}
            onChange={handleChange}
            placeholder="Enter organization name"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="contactEmail">Contact Email</label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={org.contactEmail || ''}
            onChange={handleChange}
            placeholder="Enter contact email"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="logoUrl">Logo URL</label>
          <Input
            id="logoUrl"
            name="logoUrl"
            value={org.logoUrl || ''}
            onChange={handleChange}
            placeholder="Enter logo image URL"
            disabled={loading}
          />
          {org.logoUrl && (
            <img src={org.logoUrl} alt="Logo preview" className="mt-2 h-16" style={{ maxWidth: 120, objectFit: 'contain' }} />
          )}
        </div>
        <Button type="submit" disabled={saving || loading} className="mt-4">
          {saving ? 'Saving...' : 'Save Organization Info'}
        </Button>
      </form>
    </div>
  );
}

function AlertConfigSection() {
  const [config, setConfig] = useState({
    alertThreshold: 0.6,
    scoringWeights: {
      acceptanceRate: 0.3,
      cancellationRate: 0.2,
      completionRate: 0.15,
      feedbackScore: 0.15,
      tripVolumeIndex: 0.1,
      idleRatio: 0.1,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings?key=alertConfig')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setConfig(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name in config.scoringWeights) {
      setConfig(c => ({ ...c, scoringWeights: { ...c.scoringWeights, [name]: parseFloat(value) } }));
    } else {
      setConfig(c => ({ ...c, [name]: parseFloat(value) }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings?key=alertConfig', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast({ title: 'Alert config saved', variant: 'default' });
    } else {
      toast({ title: 'Failed to save', description: data.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Alert & Scoring Config</h2>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block font-medium mb-1" htmlFor="alertThreshold">Alert Threshold</label>
          <Input
            id="alertThreshold"
            name="alertThreshold"
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={config.alertThreshold}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="text-xs text-muted-foreground">Drivers with a score below this value will be alerted.</span>
        </div>
        <div>
          <label className="block font-medium mb-1">Scoring Weights</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(config.scoringWeights).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm mb-1 capitalize" htmlFor={key}>{key.replace(/([A-Z])/g, ' $1')}</label>
                <Input
                  id={key}
                  name={key}
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={value}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Adjust the weight for each metric (total should be 1.0).</span>
        </div>
        <Button type="submit" disabled={saving || loading} className="mt-4">
          {saving ? 'Saving...' : 'Save Alert Config'}
        </Button>
      </form>
    </div>
  );
}

function ApiKeysSection() {
  const [keys, setKeys] = useState({
    uberClientId: '',
    uberClientSecret: '',
    whatsappToken: '',
    telegramToken: '',
    elevenlabsApiKey: '',
    twilioSid: '',
    twilioToken: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState<{ [k: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings?key=apiKeys')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setKeys(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys(k => ({ ...k, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings?key=apiKeys', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast({ title: 'API keys saved', variant: 'default' });
    } else {
      toast({ title: 'Failed to save', description: data.error, variant: 'destructive' });
    }
  };

  const toggleShow = (key: string) => setShow(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">API Keys & Integrations</h2>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block font-medium mb-1" htmlFor="uberClientId">Uber Client ID</label>
          <Input
            id="uberClientId"
            name="uberClientId"
            value={keys.uberClientId || ''}
            onChange={handleChange}
            placeholder="Enter Uber Client ID"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="uberClientSecret">Uber Client Secret</label>
          <div className="flex gap-2 items-center">
            <Input
              id="uberClientSecret"
              name="uberClientSecret"
              type={show.uberClientSecret ? 'text' : 'password'}
              value={keys.uberClientSecret || ''}
              onChange={handleChange}
              placeholder="Enter Uber Client Secret"
              disabled={loading}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => toggleShow('uberClientSecret')}>
              {show.uberClientSecret ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="whatsappToken">WhatsApp Token</label>
          <div className="flex gap-2 items-center">
            <Input
              id="whatsappToken"
              name="whatsappToken"
              type={show.whatsappToken ? 'text' : 'password'}
              value={keys.whatsappToken || ''}
              onChange={handleChange}
              placeholder="Enter WhatsApp Token"
              disabled={loading}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => toggleShow('whatsappToken')}>
              {show.whatsappToken ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="telegramToken">Telegram Token</label>
          <div className="flex gap-2 items-center">
            <Input
              id="telegramToken"
              name="telegramToken"
              type={show.telegramToken ? 'text' : 'password'}
              value={keys.telegramToken || ''}
              onChange={handleChange}
              placeholder="Enter Telegram Token"
              disabled={loading}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => toggleShow('telegramToken')}>
              {show.telegramToken ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="elevenlabsApiKey">ElevenLabs API Key</label>
          <div className="flex gap-2 items-center">
            <Input
              id="elevenlabsApiKey"
              name="elevenlabsApiKey"
              type={show.elevenlabsApiKey ? 'text' : 'password'}
              value={keys.elevenlabsApiKey || ''}
              onChange={handleChange}
              placeholder="Enter ElevenLabs API Key"
              disabled={loading}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => toggleShow('elevenlabsApiKey')}>
              {show.elevenlabsApiKey ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="twilioSid">Twilio SID</label>
          <Input
            id="twilioSid"
            name="twilioSid"
            value={keys.twilioSid || ''}
            onChange={handleChange}
            placeholder="Enter Twilio SID"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="twilioToken">Twilio Token</label>
          <div className="flex gap-2 items-center">
            <Input
              id="twilioToken"
              name="twilioToken"
              type={show.twilioToken ? 'text' : 'password'}
              value={keys.twilioToken || ''}
              onChange={handleChange}
              placeholder="Enter Twilio Token"
              disabled={loading}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => toggleShow('twilioToken')}>
              {show.twilioToken ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <Button type="submit" disabled={saving || loading} className="mt-4">
          {saving ? 'Saving...' : 'Save API Keys'}
        </Button>
      </form>
    </div>
  );
}

function SecuritySection() {
  const [security, setSecurity] = useState({
    enable2FA: false,
    sessionTimeout: 30,
    allowedIPs: '',
    passwordMinLength: 8,
    requireSpecialChars: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings?key=security')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setSecurity(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setSecurity(s => ({
      ...s,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings?key=security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(security),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast({ title: 'Security settings saved', variant: 'default' });
    } else {
      toast({ title: 'Failed to save', description: data.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Security Settings</h2>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div className="flex items-center gap-2">
          <input
            id="enable2FA"
            name="enable2FA"
            type="checkbox"
            checked={!!security.enable2FA}
            onChange={handleChange}
            disabled={loading}
            className="h-4 w-4"
          />
          <label htmlFor="enable2FA" className="font-medium">Enable Two-Factor Authentication (2FA)</label>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="sessionTimeout">Session Timeout (minutes)</label>
          <Input
            id="sessionTimeout"
            name="sessionTimeout"
            type="number"
            min={1}
            value={security.sessionTimeout}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="allowedIPs">Allowed IPs (comma-separated)</label>
          <Input
            id="allowedIPs"
            name="allowedIPs"
            value={security.allowedIPs || ''}
            onChange={handleChange}
            placeholder="e.g. 192.168.1.1, 10.0.0.2"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="passwordMinLength">Password Minimum Length</label>
          <Input
            id="passwordMinLength"
            name="passwordMinLength"
            type="number"
            min={6}
            value={security.passwordMinLength}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="requireSpecialChars"
            name="requireSpecialChars"
            type="checkbox"
            checked={!!security.requireSpecialChars}
            onChange={handleChange}
            disabled={loading}
            className="h-4 w-4"
          />
          <label htmlFor="requireSpecialChars" className="font-medium">Require Special Characters in Passwords</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="maintenanceMode"
            name="maintenanceMode"
            type="checkbox"
            checked={!!security.maintenanceMode}
            onChange={handleChange}
            disabled={loading}
            className="h-4 w-4"
          />
          <label htmlFor="maintenanceMode" className="font-medium">Enable Maintenance Mode</label>
        </div>
        <Button type="submit" disabled={saving || loading} className="mt-4">
          {saving ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </form>
    </div>
  );
}

function BrandingSection() {
  const [branding, setBranding] = useState({
    primaryColor: '#2563eb',
    accentColor: '#f59e42',
    logoUrl: '',
    faviconUrl: '',
    theme: 'auto',
    customCss: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings?key=branding')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setBranding(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBranding(b => ({ ...b, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings?key=branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast({ title: 'Branding settings saved', variant: 'default' });
    } else {
      toast({ title: 'Failed to save', description: data.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Branding & Appearance</h2>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block font-medium mb-1" htmlFor="primaryColor">Primary Color</label>
          <Input
            id="primaryColor"
            name="primaryColor"
            type="color"
            value={branding.primaryColor}
            onChange={handleChange}
            disabled={loading}
            className="w-16 h-10 p-0 border-none bg-transparent"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="accentColor">Accent Color</label>
          <Input
            id="accentColor"
            name="accentColor"
            type="color"
            value={branding.accentColor}
            onChange={handleChange}
            disabled={loading}
            className="w-16 h-10 p-0 border-none bg-transparent"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="logoUrl">Logo URL</label>
          <Input
            id="logoUrl"
            name="logoUrl"
            value={branding.logoUrl || ''}
            onChange={handleChange}
            placeholder="Enter logo image URL"
            disabled={loading}
          />
          {branding.logoUrl && (
            <img src={branding.logoUrl} alt="Logo preview" className="mt-2 h-16" style={{ maxWidth: 120, objectFit: 'contain' }} />
          )}
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="faviconUrl">Favicon URL</label>
          <Input
            id="faviconUrl"
            name="faviconUrl"
            value={branding.faviconUrl || ''}
            onChange={handleChange}
            placeholder="Enter favicon image URL"
            disabled={loading}
          />
          {branding.faviconUrl && (
            <img src={branding.faviconUrl} alt="Favicon preview" className="mt-2 h-10" style={{ maxWidth: 40, objectFit: 'contain' }} />
          )}
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="theme">Theme</label>
          <select
            id="theme"
            name="theme"
            value={branding.theme}
            onChange={handleChange}
            disabled={loading}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="customCss">Custom CSS (optional)</label>
          <textarea
            id="customCss"
            name="customCss"
            value={branding.customCss || ''}
            onChange={handleChange}
            placeholder="Paste custom CSS here..."
            rows={4}
            className="w-full border rounded-lg px-3 py-2 font-mono"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={saving || loading} className="mt-4">
          {saving ? 'Saving...' : 'Save Branding'}
        </Button>
      </form>
    </div>
  );
}

function UberSyncSection() {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [syncHistory, setSyncHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const { toast } = useToast()

  // You may want to move this to env or a secure config
  const CRON_SECRET = process.env.NEXT_PUBLIC_CRON_SECRET || ''

  const fetchStatus = async () => {
    setLoading(true)
    const res = await fetch('/api/settings?key=uberSyncStatus')
    const data = await res.json()
    setSyncStatus(data.data)
    setLoading(false)
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    const res = await fetch('/api/settings?key=uberSyncHistory')
    const data = await res.json()
    setSyncHistory(Array.isArray(data.data) ? data.data : [])
    setHistoryLoading(false)
  }

  useEffect(() => { fetchStatus(); fetchHistory() }, [])

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/cron/uber-sync?token=${CRON_SECRET}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Uber sync started', variant: 'default' })
        fetchStatus()
        fetchHistory()
      } else {
        toast({ title: 'Sync failed', description: data.error, variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Sync error', description: String(e), variant: 'destructive' })
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">Uber Sync Status {loading && <RefreshCw className="animate-spin h-5 w-5" />}</h2>
      {syncStatus ? (
        <div className="space-y-2">
          <div>Status: <span className={`font-semibold ${syncStatus.status === 'SUCCESS' ? 'text-green-600' : syncStatus.status === 'FAILURE' ? 'text-red-600' : 'text-yellow-600'}`}>{syncStatus.status}</span></div>
          <div>Last Run: {syncStatus.finishedAt ? new Date(syncStatus.finishedAt).toLocaleString() : 'N/A'}</div>
          <div>Processed: {syncStatus.driversProcessed} | Created: {syncStatus.driversCreated} | Updated: {syncStatus.driversUpdated}</div>
          {syncStatus.errorMessage && (
            <div className="flex items-center gap-2 text-red-600"><AlertCircle className="h-4 w-4" /> {syncStatus.errorMessage}</div>
          )}
        </div>
      ) : (
        <div>No sync log found.</div>
      )}
      <Button onClick={handleSyncNow} disabled={syncing || loading} className="mt-2">
        {syncing ? 'Syncing...' : 'Sync Now'}
      </Button>
      <Button variant="outline" onClick={() => { fetchStatus(); fetchHistory() }} disabled={loading || historyLoading} className="ml-2">
        Refresh Status & History
      </Button>
      {/* Sync History Table */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">Sync History {historyLoading && <RefreshCw className="animate-spin h-4 w-4" />}</h3>
        {syncHistory.length === 0 && !historyLoading ? (
          <div className="text-muted-foreground">No sync history found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Started</th>
                  <th className="px-3 py-2 text-left">Finished</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Processed</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Updated</th>
                  <th className="px-3 py-2 text-left">By</th>
                  <th className="px-3 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {syncHistory.map((log, i) => (
                  <tr key={log.id || i} className="border-b last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{log.startedAt ? new Date(log.startedAt).toLocaleString() : ''}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{log.finishedAt ? new Date(log.finishedAt).toLocaleString() : ''}</td>
                    <td className="px-3 py-2 font-semibold">
                      <span className={
                        log.status === 'SUCCESS' ? 'text-green-600' :
                        log.status === 'FAILURE' ? 'text-red-600' :
                        'text-yellow-600'
                      }>{log.status}</span>
                    </td>
                    <td className="px-3 py-2">{log.type}</td>
                    <td className="px-3 py-2">{log.driversProcessed}</td>
                    <td className="px-3 py-2">{log.driversCreated}</td>
                    <td className="px-3 py-2">{log.driversUpdated}</td>
                    <td className="px-3 py-2">{log.createdBy || 'system'}</td>
                    <td className="px-3 py-2 text-red-600 max-w-xs truncate" title={log.errorMessage || ''}>{log.errorMessage ? log.errorMessage.slice(0, 60) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState('organization');
  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="alertConfig">Alert Config</TabsTrigger>
              <TabsTrigger value="apiKeys">API Keys</TabsTrigger>
              <TabsTrigger value="notificationTemplates">Notification Templates</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="uberSync">Uber Sync</TabsTrigger>
            </TabsList>
            <TabsContent value="organization">
              <OrganizationSection />
            </TabsContent>
            <TabsContent value="alertConfig">
              <AlertConfigSection />
            </TabsContent>
            <TabsContent value="apiKeys">
              <ApiKeysSection />
            </TabsContent>
            <TabsContent value="notificationTemplates">
              <NotificationTemplatesSection />
            </TabsContent>
            <TabsContent value="security">
              <SecuritySection />
            </TabsContent>
            <TabsContent value="branding">
              <BrandingSection />
            </TabsContent>
            <TabsContent value="uberSync">
              <UberSyncSection />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
} 