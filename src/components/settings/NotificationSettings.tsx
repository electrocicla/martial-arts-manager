import useSettings from '../../hooks/useSettings';
import { useState } from 'react';
import { Save } from 'lucide-react';

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    paymentReminders: true,
    classReminders: true,
    promotionAlerts: true,
    systemUpdates: false,
  });
  const { saveSection } = useSettings();
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('08:00');

  const handleSave = async () => {
    await saveSection('notifications', { notifications, schedule: { startTime, endTime } });
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
        <div>
          <button className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm">Save</button>
        </div>
      </header>

      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <label className="inline-flex items-center">
              <input type="checkbox" className="sr-only peer" checked={value} onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })} />
              <div className="w-11 h-6 bg-slate-200 peer-checked:bg-sky-600 rounded-full relative transition-colors"></div>
            </label>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold mb-2">Notification schedule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm text-slate-700 dark:text-slate-300">Quiet hours start</span>
              <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2" />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-slate-700 dark:text-slate-300">Quiet hours end</span>
              <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button className="px-3 py-1 rounded-md border text-sm">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm inline-flex items-center gap-2"><Save className="w-4 h-4" />Save Preferences</button>
        </div>
      </div>
    </section>
  );
}