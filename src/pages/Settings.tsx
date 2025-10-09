import { useState } from 'react';
import { 
  Settings as SettingsIcon, User, Bell, Shield, 
  Palette, Database, CreditCard,
  Mail, MessageSquare, Save,
  Moon, Sun, Building, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    paymentReminders: true,
    classReminders: true,
    promotionAlerts: true,
    systemUpdates: false,
  });

  const [dojoInfo, setDojoInfo] = useState({
    name: 'Elite Martial Arts Academy',
    address: '123 Main Street, Springfield',
    phone: '(555) 123-4567',
    email: 'info@elitemartialarts.com',
    website: 'www.elitemartialarts.com',
    timezone: 'America/New_York',
  });

  const [theme, setTheme] = useState('martial');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'dojo', label: 'Dojo Info', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email/SMS', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Backup', icon: Database },
  ];

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
    <div className="min-h-screen bg-gray-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                Settings
              </h1>
              <p className="text-sm text-base-content/70">
                Manage your dojo configuration and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <ul className="menu bg-base-200 rounded-lg p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <a
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h2 className="card-title mb-4">Profile Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="avatar">
                        <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" alt="Profile" />
                        </div>
                      </div>
                      <div>
                        <button className="btn btn-primary btn-sm">Change Photo</button>
                        <p className="text-xs text-base-content/60 mt-2">JPG, PNG up to 5MB</p>
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Full Name</span>
                        </label>
                        <input 
                          type="text" 
                          className="input input-bordered" 
                          defaultValue={user?.name || 'Sensei Yamamoto'}
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email</span>
                        </label>
                        <input 
                          type="email" 
                          className="input input-bordered" 
                          defaultValue={user?.email || 'sensei@dojo.com'}
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Phone</span>
                        </label>
                        <input 
                          type="tel" 
                          className="input input-bordered" 
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Role</span>
                        </label>
                        <select className="select select-bordered">
                          <option>Admin</option>
                          <option>Instructor</option>
                          <option>Staff</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bio</span>
                      </label>
                      <textarea 
                        className="textarea textarea-bordered h-24" 
                        placeholder="Tell us about yourself..."
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost">Cancel</button>
                      <button className="btn btn-primary">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dojo Information */}
            {activeTab === 'dojo' && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h2 className="card-title mb-4">Dojo Information</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Dojo Name</span>
                        </label>
                        <input 
                          type="text" 
                          className="input input-bordered" 
                          value={dojoInfo.name}
                          onChange={(e) => setDojoInfo({...dojoInfo, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Phone</span>
                        </label>
                        <input 
                          type="tel" 
                          className="input input-bordered" 
                          value={dojoInfo.phone}
                          onChange={(e) => setDojoInfo({...dojoInfo, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Address</span>
                      </label>
                      <input 
                        type="text" 
                        className="input input-bordered" 
                        value={dojoInfo.address}
                        onChange={(e) => setDojoInfo({...dojoInfo, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email</span>
                        </label>
                        <input 
                          type="email" 
                          className="input input-bordered" 
                          value={dojoInfo.email}
                          onChange={(e) => setDojoInfo({...dojoInfo, email: e.target.value})}
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Website</span>
                        </label>
                        <input 
                          type="url" 
                          className="input input-bordered" 
                          value={dojoInfo.website}
                          onChange={(e) => setDojoInfo({...dojoInfo, website: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="divider">Belt Rank Configuration</div>

                    <div className="overflow-x-auto">
                      <table className="table table-compact">
                        <thead>
                          <tr>
                            <th>Belt</th>
                            <th>Required Classes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {beltRanks.map((belt) => (
                            <tr key={belt.name}>
                              <td>
                                <div className={`badge ${belt.color}`}>{belt.name}</div>
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="input input-bordered input-sm w-20" 
                                  defaultValue={belt.classes}
                                />
                              </td>
                              <td>
                                <button className="btn btn-ghost btn-xs">Edit</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="divider">Class Types</div>

                    <div className="overflow-x-auto">
                      <table className="table table-compact">
                        <thead>
                          <tr>
                            <th>Class Type</th>
                            <th>Duration</th>
                            <th>Monthly Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classTypes.map((cls) => (
                            <tr key={cls.name}>
                              <td className="font-medium">{cls.name}</td>
                              <td>{cls.duration} min</td>
                              <td>${cls.price}</td>
                              <td>
                                <button className="btn btn-ghost btn-xs">Edit</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button className="btn btn-outline btn-sm">
                      Add Class Type
                    </button>

                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost">Cancel</button>
                      <button className="btn btn-primary">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
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
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
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
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
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
            )}

            {/* Data & Backup */}
            {activeTab === 'data' && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
