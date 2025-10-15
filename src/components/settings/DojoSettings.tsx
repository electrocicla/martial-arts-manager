import { useState } from 'react';
import useSettings from '../../hooks/useSettings';
import { Save } from 'lucide-react';

export default function DojoSettings() {
  const { saveSection } = useSettings();
  const [dojoInfo, setDojoInfo] = useState(() => ({
    name: 'Elite Martial Arts Academy',
    address: '123 Main Street, Springfield',
    phone: '(555) 123-4567',
    email: 'info@elitemartialarts.com',
    website: 'www.elitemartialarts.com',
    timezone: 'America/New_York',
  }));

  const beltRanks = [
    { name: 'White', color: 'badge-ghost', classes: 0 },
    { name: 'Yellow', color: 'badge-warning', classes: 40 },
    { name: 'Orange', color: 'badge-secondary', classes: 80 },
    { name: 'Green', color: 'badge-success', classes: 120 },
    { name: 'Blue', color: 'badge-info', classes: 180 },
    { name: 'Brown', color: 'badge-neutral', classes: 240 },
    { name: 'Black', color: 'badge-neutral', classes: 300 },
  ];

  const classTypes = [
    { name: 'Brazilian Jiu-Jitsu', duration: 90, price: 150 },
    { name: 'Kickboxing', duration: 60, price: 120 },
    { name: 'Muay Thai', duration: 75, price: 140 },
    { name: 'MMA', duration: 90, price: 160 },
    { name: 'Kids Karate', duration: 45, price: 100 },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dojo Information</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">Save</button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dojo name</span>
            <input value={dojoInfo.name} onChange={(e) => setDojoInfo({...dojoInfo, name: e.target.value})} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</span>
            <input value={dojoInfo.phone} onChange={(e) => setDojoInfo({...dojoInfo, phone: e.target.value})} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>
        </div>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</span>
          <input value={dojoInfo.address} onChange={(e) => setDojoInfo({...dojoInfo, address: e.target.value})} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input value={dojoInfo.email} onChange={(e) => setDojoInfo({...dojoInfo, email: e.target.value})} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</span>
            <input value={dojoInfo.website} onChange={(e) => setDojoInfo({...dojoInfo, website: e.target.value})} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Belt rank configuration</h3>
          <div className="space-y-2">
            {beltRanks.map((belt) => (
              <div key={belt.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-0.5 rounded-md text-sm text-slate-700 dark:text-slate-200">{belt.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={belt.classes} className="w-20 rounded-md border px-2 py-1 text-sm" />
                  <button className="text-sm text-sky-600">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Class types</h3>
          <div className="space-y-2">
            {classTypes.map((cls) => (
              <div key={cls.name} className="flex items-center justify-between">
                <div className="text-sm font-medium">{cls.name}</div>
                <div className="text-sm text-slate-600">{cls.duration} min • ${cls.price}</div>
                <div>
                  <button className="text-sm text-sky-600">Edit</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <button className="px-3 py-1 rounded-md border text-sm">Add Class Type</button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button className="px-3 py-1 rounded-md border text-sm">Cancel</button>
          <button className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm" onClick={async () => { await saveSection('dojo', dojoInfo); }}>
            <Save className="w-4 h-4 inline-block mr-1" /> Save Changes
          </button>
        </div>
      </div>
    </section>
  );
}