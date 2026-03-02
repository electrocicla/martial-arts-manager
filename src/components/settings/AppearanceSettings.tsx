import { useState } from 'react';
import { Save, Moon, Sun } from 'lucide-react';
import useSettings from '../../hooks/useSettings';
import { Button } from '../ui/Button';

export default function AppearanceSettings() {
  const { saveSection } = useSettings();
  const [theme, setTheme] = useState('martial');
  const [primaryColor, setPrimaryColor] = useState('sky');
  const [compactMode, setCompactMode] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  const handleSave = async () => {
    await saveSection('appearance', { theme, primaryColor, compactMode, showAnimations, highContrast });
  };

  return (
    <section className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-sm p-4 sm:p-6">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Appearance Settings</h2>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => { setTheme('martial'); setPrimaryColor('sky'); }}>
            Reset
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>
            Apply
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 text-white">Theme</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={theme === 'martial' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Moon className="w-4 h-4" />}
              onClick={() => setTheme('martial')}
            >
              Martial Dark
            </Button>
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Sun className="w-4 h-4" />}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={theme === 'auto' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTheme('auto')}
            >
              Auto
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-white">Primary color</h3>
          <div className="flex gap-3 flex-wrap">
            {([
              { key: 'sky',     bg: 'bg-sky-600'     },
              { key: 'indigo',  bg: 'bg-indigo-600'  },
              { key: 'emerald', bg: 'bg-emerald-600' },
              { key: 'rose',    bg: 'bg-rose-600'    },
            ] as const).map(({ key, bg }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPrimaryColor(key)}
                aria-label={key}
                className={`w-9 h-9 rounded-full transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${bg} ${primaryColor === key ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-white">Display options</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Compact mode</span>
              <input checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-red-600" aria-hidden />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Show animations</span>
              <input checked={showAnimations} onChange={(e) => setShowAnimations(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-red-600" aria-hidden />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-300">High contrast</span>
              <input checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-red-600" aria-hidden />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>
          Apply Changes
        </Button>
      </div>
    </section>
  );
}