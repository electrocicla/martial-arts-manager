import { Monitor, Moon, Save, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../context/useTheme';
import useSettings from '../../hooks/useSettings';
import type { ThemeMode } from '../../context/themeContext.shared';
import { Button } from '../ui/Button';
import SettingsToggle from './SettingsToggle';

type DensityMode = 'comfortable' | 'compact';

interface AppearancePreferences {
  density: DensityMode;
  highContrast: boolean;
  reduceMotion: boolean;
}

const DEFAULT_APPEARANCE: AppearancePreferences = {
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
};

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string; icon: LucideIcon }> = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDensity(value: unknown): DensityMode | undefined {
  return value === 'comfortable' || value === 'compact' ? value : undefined;
}

function parseAppearance(value: unknown): AppearancePreferences {
  if (!isRecord(value)) return DEFAULT_APPEARANCE;

  return {
    density: parseDensity(value.density) ?? DEFAULT_APPEARANCE.density,
    highContrast: typeof value.highContrast === 'boolean' ? value.highContrast : DEFAULT_APPEARANCE.highContrast,
    reduceMotion: typeof value.reduceMotion === 'boolean' ? value.reduceMotion : DEFAULT_APPEARANCE.reduceMotion,
  };
}

function applyAppearance(preferences: AppearancePreferences): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.density = preferences.density;
  document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'normal';
  document.documentElement.dataset.motion = preferences.reduceMotion ? 'reduced' : 'normal';
}

export default function AppearanceSettings() {
  const { mode, setMode } = useTheme();
  const { settings, saveSection } = useSettings();
  const [appearance, setAppearance] = useState<AppearancePreferences>(DEFAULT_APPEARANCE);

  useEffect(() => {
    const parsed = parseAppearance(settings?.appearance);
    setAppearance(parsed);
    applyAppearance(parsed);
  }, [settings]);

  const updateAppearance = (next: AppearancePreferences) => {
    setAppearance(next);
    applyAppearance(next);
  };

  const handleSave = async () => {
    await saveSection('appearance', { ...appearance, theme: mode });
  };

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-sm sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Appearance</h2>
          <p className="text-sm text-gray-400">Adjust theme, density, contrast, and motion preferences.</p>
        </div>
        <Button type="button" variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          Save appearance
        </Button>
      </header>

      <div>
        <div className="mb-3 text-sm font-semibold text-white">Theme</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-red-500 bg-red-600/20 text-red-200'
                    : 'border-gray-700 bg-gray-900/40 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                }`}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <SettingsToggle
          id="settings-density"
          label="Compact density"
          description="Tighten vertical spacing for dense operational screens."
          checked={appearance.density === 'compact'}
          onChange={(checked) => updateAppearance({ ...appearance, density: checked ? 'compact' : 'comfortable' })}
        />
        <SettingsToggle
          id="settings-high-contrast"
          label="High contrast"
          description="Increase contrast for text, borders, and interactive states."
          checked={appearance.highContrast}
          onChange={(checked) => updateAppearance({ ...appearance, highContrast: checked })}
        />
        <SettingsToggle
          id="settings-reduce-motion"
          label="Reduce motion"
          description="Minimize animations and transitions across the app shell."
          checked={appearance.reduceMotion}
          onChange={(checked) => updateAppearance({ ...appearance, reduceMotion: checked })}
        />
      </div>
    </section>
  );
}