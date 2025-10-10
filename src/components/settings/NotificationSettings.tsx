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

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title mb-4">Notification Preferences</h2>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={value}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    [key]: e.target.checked
                  })}
                />
              </label>
            </div>
          ))}

          <div className="divider">Notification Schedule</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Quiet Hours Start</span>
              </label>
              <input type="time" className="input input-bordered" defaultValue="22:00" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Quiet Hours End</span>
              </label>
              <input type="time" className="input input-bordered" defaultValue="08:00" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost">Cancel</button>
            <button className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}