import { useState } from 'react';
import { Save } from 'lucide-react';

export default function DojoSettings() {
  const [dojoInfo, setDojoInfo] = useState({
    name: 'Elite Martial Arts Academy',
    address: '123 Main Street, Springfield',
    phone: '(555) 123-4567',
    email: 'info@elitemartialarts.com',
    website: 'www.elitemartialarts.com',
    timezone: 'America/New_York',
  });

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
  );
}