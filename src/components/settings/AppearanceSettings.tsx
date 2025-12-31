import { useState } from 'react';
import { Save, Moon, Sun } from 'lucide-react';
import useSettings from '../../hooks/useSettings';

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
    <section className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Appearance Settings</h2>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm">Reset</button>
          <button className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm inline-flex items-center gap-2 hover:bg-red-700"><Save className="w-4 h-4" />Apply</button>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-2 text-white">Theme</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setTheme('martial')} className={`px-3 py-1.5 rounded-md text-sm ${theme === 'martial' ? 'bg-red-600 text-white' : 'border border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
              <Moon className="w-4 h-4 inline-block mr-2" /> Martial Dark
            </button>
            <button onClick={() => setTheme('light')} className={`px-3 py-1.5 rounded-md text-sm ${theme === 'light' ? 'bg-red-600 text-white' : 'border border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
              <Sun className="w-4 h-4 inline-block mr-2" /> Light
            </button>
            <button onClick={() => setTheme('auto')} className={`px-3 py-1.5 rounded-md text-sm ${theme === 'auto' ? 'bg-red-600 text-white' : 'border border-gray-600 text-gray-300 hover:bg-gray-700'}`}>Auto</button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2 text-white">Primary color</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setPrimaryColor('sky')} className={`w-8 h-8 rounded-full ${primaryColor === 'sky' ? 'ring-2 ring-red-500' : ''} bg-sky-600`} aria-label="sky" />
            <button onClick={() => setPrimaryColor('indigo')} className={`w-8 h-8 rounded-full ${primaryColor === 'indigo' ? 'ring-2 ring-red-500' : ''} bg-indigo-600`} aria-label="indigo" />
            <button onClick={() => setPrimaryColor('emerald')} className={`w-8 h-8 rounded-full ${primaryColor === 'emerald' ? 'ring-2 ring-red-500' : ''} bg-emerald-600`} aria-label="emerald" />
            <button onClick={() => setPrimaryColor('rose')} className={`w-8 h-8 rounded-full ${primaryColor === 'rose' ? 'ring-2 ring-red-500' : ''} bg-rose-600`} aria-label="rose" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2 text-white">Display options</h3>
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
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm inline-flex items-center gap-2 hover:bg-red-700"><Save className="w-4 h-4" />Apply</button>
      </div>
    </section>
  );
}