import { Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettings() {
  const { user } = useAuth();

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title mb-4">Profile Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="avatar placeholder">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 ring ring-red-500/50 ring-offset-base-100 ring-offset-2">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user?.name ? getInitials(user.name) : <UserIcon className="w-12 h-12" />}
                  </span>
                )}
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
                defaultValue={user?.name || ''}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                defaultValue={user?.email || ''}
                placeholder="your.email@example.com"
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
              <select className="select select-bordered" disabled defaultValue={user?.role || 'admin'}>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="student">Student</option>
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
  );
}