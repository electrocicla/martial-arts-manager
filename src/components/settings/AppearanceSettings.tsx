import { useState } from 'react';
import { Save, Moon, Sun } from 'lucide-react';

export default function AppearanceSettings() {
  const [theme, setTheme] = useState('martial');

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title mb-4">Appearance Settings</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">Theme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                className={`btn ${theme === 'martial' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTheme('martial')}
              >
                <Moon className="w-4 h-4" />
                Martial Dark
              </button>
              <button
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTheme('light')}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                className={`btn ${theme === 'auto' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTheme('auto')}
              >
                Auto
              </button>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <h3 className="text-lg font-bold mb-3">Primary Color</h3>
            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-circle btn-primary"></button>
              <button className="btn btn-circle btn-secondary"></button>
              <button className="btn btn-circle btn-accent"></button>
              <button className="btn btn-circle btn-info"></button>
              <button className="btn btn-circle btn-success"></button>
              <button className="btn btn-circle btn-warning"></button>
              <button className="btn btn-circle btn-error"></button>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <h3 className="text-lg font-bold mb-3">Display Options</h3>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Compact Mode</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Show Animations</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">High Contrast</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost">Reset to Default</button>
            <button className="btn btn-primary">
              <Save className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}