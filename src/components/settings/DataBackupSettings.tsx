import { Database, AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import useSettings from '../../hooks/useSettings';
import { Button } from '../ui/Button';

export default function DataBackupSettings() {
  const { settings, saveSection, isLoading } = useSettings();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  // Load initial values from settings when available
  useEffect(() => {
    if (!settings) return;
    const maybe = (settings.backup ?? settings.data_backup) as unknown;
    // Type guard for the backup payload stored in DB
    type BackupSettings = {
      enabled?: boolean;
      frequency?: 'daily' | 'weekly' | 'monthly' | string;
      lastBackup?: string;
    };

    const isBackupSettings = (v: unknown): v is BackupSettings => {
      return typeof v === 'object' && v !== null;
    };

    if (!isBackupSettings(maybe)) return;
    const backup = maybe;
    if (typeof backup.enabled === 'boolean') setEnabled(backup.enabled);
    if (typeof backup.frequency === 'string') setFrequency(backup.frequency as 'daily' | 'weekly' | 'monthly');
    if (typeof backup.lastBackup === 'string') setLastBackup(backup.lastBackup);
  }, [settings]);

  const handleSave = useCallback(async () => {
    const payload = { enabled, frequency, lastBackup };
    await saveSection('backup', payload);
  }, [enabled, frequency, lastBackup, saveSection]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data & Backup</h2>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isLoading} isLoading={isLoading}>Save</Button>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-2">Automatic backups</h3>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">Enable automatic backups</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-sky-600" aria-hidden />
            </label>
          </div>

          <label className="flex flex-col mt-3">
            <span className="text-sm text-slate-700 dark:text-slate-300">Backup frequency</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Manual backup</h3>
          <p className="text-sm text-slate-500 mb-3">Last backup: {lastBackup ?? 'Never'}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" leftIcon={<Database className="w-4 h-4" />}>Create backup</Button>
            <Button variant="outline" size="sm">Download backup</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Data export</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="secondary" size="sm">Export students (CSV)</Button>
            <Button variant="secondary" size="sm">Export classes (CSV)</Button>
            <Button variant="secondary" size="sm">Export payments (CSV)</Button>
            <Button variant="secondary" size="sm">Export all data (ZIP)</Button>
          </div>
        </div>

        <div className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <h4 className="font-semibold">Danger zone</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">Permanently delete all data. This action cannot be undone.</p>
            </div>
          </div>
          <div className="mt-3">
            <Button variant="danger" size="sm">Delete all data</Button>
          </div>
        </div>
      </div>
    </section>
  );
}