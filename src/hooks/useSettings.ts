import { useCallback, useEffect, useState } from 'react';
import settingsService from '../services/settings.service';
import { useToast } from './useToast';

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await settingsService.getAll();
    if (res.success && res.data) {
      setSettings(res.data as Record<string, unknown>);
    } else {
      error(res.error || 'Error loading settings');
    }
    setIsLoading(false);
  }, [error]);

  const saveSection = useCallback(async (section: string, value: unknown) => {
    const res = await settingsService.saveSection(section, value);
    if (res.success) {
      setSettings(prev => ({ ...(prev || {}), [section]: value }));
      success('Settings saved');
      return true;
    }
    error(res.error || 'Failed to save settings');
    return false;
  }, [success, error]);

  useEffect(() => { load(); }, [load]);

  return { settings, isLoading, load, saveSection };
}

export default useSettings;
