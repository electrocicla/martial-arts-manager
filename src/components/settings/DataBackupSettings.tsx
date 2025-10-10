import { Database, AlertCircle } from 'lucide-react';

export default function DataBackupSettings() {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title mb-4">Data & Backup</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">Automatic Backups</h3>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Enable Automatic Backups</span>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </label>
            </div>
            <div className="form-control mt-3">
              <label className="label">
                <span className="label-text">Backup Frequency</span>
              </label>
              <select className="select select-bordered">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <h3 className="text-lg font-bold mb-3">Manual Backup</h3>
            <p className="text-sm text-base-content/60 mb-3">
              Last backup: January 10, 2025 at 2:30 PM
            </p>
            <div className="flex gap-2">
              <button className="btn btn-outline">
                <Database className="w-4 h-4" />
                Create Backup
              </button>
              <button className="btn btn-outline">
                Download Backup
              </button>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <h3 className="text-lg font-bold mb-3">Data Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="btn btn-outline">
                Export Students (CSV)
              </button>
              <button className="btn btn-outline">
                Export Classes (CSV)
              </button>
              <button className="btn btn-outline">
                Export Payments (CSV)
              </button>
              <button className="btn btn-outline">
                Export All Data (ZIP)
              </button>
            </div>
          </div>

          <div className="divider"></div>

          <div className="alert alert-warning">
            <AlertCircle className="w-4 h-4" />
            <div>
              <h3 className="font-bold">Danger Zone</h3>
              <p className="text-sm">Permanently delete all data. This action cannot be undone.</p>
            </div>
          </div>
          <button className="btn btn-error btn-outline">
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
}