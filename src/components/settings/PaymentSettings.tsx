import { Save, MessageSquare } from 'lucide-react';

export default function PaymentSettings() {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title mb-4">Payment Configuration</h2>

        <div className="space-y-4">
          <div className="alert alert-info">
            <MessageSquare className="w-4 h-4" />
            <span>Configure your payment gateway to accept online payments</span>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Payment Provider</span>
            </label>
            <select className="select select-bordered">
              <option>Stripe</option>
              <option>Square</option>
              <option>PayPal</option>
              <option>Manual Only</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">API Key</span>
              </label>
              <input type="password" className="input input-bordered" placeholder="sk_live_..." />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Webhook Secret</span>
              </label>
              <input type="password" className="input input-bordered" placeholder="whsec_..." />
            </div>
          </div>

          <div className="divider">Payment Options</div>

          <div className="space-y-3">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Accept Credit Cards</span>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Accept Bank Transfers</span>
                <input type="checkbox" className="toggle toggle-primary" />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Accept Cash Payments</span>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Enable Auto-billing</span>
                <input type="checkbox" className="toggle toggle-primary" />
              </label>
            </div>
          </div>

          <div className="divider">Late Payment Settings</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Grace Period (days)</span>
              </label>
              <input type="number" className="input input-bordered" defaultValue="7" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Late Fee (%)</span>
              </label>
              <input type="number" className="input input-bordered" defaultValue="5" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost">Test Connection</button>
            <button className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}