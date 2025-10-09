import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Menu, X, User, LogOut, 
  Settings, Award, ChevronDown
} from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, text: 'New student enrollment', time: '5m ago', unread: true },
    { id: 2, text: 'Payment received', time: '1h ago', unread: true },
    { id: 3, text: 'Class reminder', time: '2h ago', unread: false },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="navbar bg-base-200/95 backdrop-blur-xl border-b border-base-300 sticky top-0 z-30 md:hidden">
        <div className="navbar-start">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-circle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="navbar-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-base-content">Dojo Manager</h1>
            </div>
          </div>
        </div>

        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <div className="indicator">
                <Bell className="w-5 h-5" />
                <span className="badge badge-xs badge-primary indicator-item animate-pulse">3</span>
              </div>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-2xl bg-base-200 rounded-box w-72 mt-3 border border-base-300">
              <li className="menu-title">
                <span>Notifications</span>
              </li>
              {notifications.map((notif) => (
                <li key={notif.id}>
                  <a className={notif.unread ? 'font-bold' : ''}>
                    <div className="flex-1">
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs opacity-60">{notif.time}</p>
                    </div>
                    {notif.unread && <span className="badge badge-primary badge-xs"></span>}
                  </a>
                </li>
              ))}
              <li className="mt-2">
                <a className="btn btn-sm btn-primary btn-block">View All</a>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile Slide Menu */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute left-0 top-0 h-full w-72 bg-base-200 shadow-2xl transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* User Profile Section */}
          <div className="p-6 bg-gradient-to-br from-primary to-secondary">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 rounded-full ring ring-white/20 ring-offset-base-100 ring-offset-2">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} />
                  ) : (
                    <div className="bg-base-300 flex items-center justify-center">
                      <User className="w-8 h-8 text-base-content" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{user?.name || 'User'}</h3>
                <p className="text-white/70 text-sm">{user?.role || 'Member'}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search..."
                  className="input input-bordered input-sm w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-sm btn-square">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <ul className="menu p-4 pt-0">
            <li className="menu-title">
              <span>Quick Actions</span>
            </li>
            <li><a onClick={() => { navigate('/attendance'); setMobileMenuOpen(false); }}>Mark Attendance</a></li>
            <li><a onClick={() => { navigate('/students'); setMobileMenuOpen(false); }}>Add Student</a></li>
            <li><a onClick={() => { navigate('/classes'); setMobileMenuOpen(false); }}>Schedule Class</a></li>
            
            <li className="menu-title mt-4">
              <span>Account</span>
            </li>
            <li><a onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}>
              <Settings className="w-4 h-4" /> Settings
            </a></li>
            <li><a onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </a></li>
          </ul>

          {/* Theme Switcher */}
          <div className="p-4 mt-auto">
            <div className="alert alert-info">
              <Award className="w-4 h-4" />
              <div>
                <h3 className="font-bold text-xs">Premium Edition</h3>
                <div className="text-xs">All features unlocked</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden md:flex h-16 bg-base-200/95 backdrop-blur-xl border-b border-base-300 sticky top-0 z-30 items-center px-6 ml-64">
        <div className="flex-1 flex items-center gap-4">
          {/* Search */}
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search students, classes..."
                className="input input-bordered input-sm w-96"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-sm btn-square">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <div className="indicator">
                <Bell className="w-5 h-5" />
                <span className="badge badge-xs badge-primary indicator-item">3</span>
              </div>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-2xl bg-base-200 rounded-box w-80 mt-3 border border-base-300">
              <li className="menu-title">
                <span>Notifications</span>
              </li>
              {notifications.map((notif) => (
                <li key={notif.id}>
                  <a className={notif.unread ? 'font-bold' : ''}>
                    <div className="flex-1">
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs opacity-60">{notif.time}</p>
                    </div>
                    {notif.unread && <span className="badge badge-primary badge-xs"></span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost flex items-center gap-2">
              <div className="avatar">
                <div className="w-8 rounded-full">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} />
                  ) : (
                    <div className="bg-base-300 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
              <span className="font-bold">{user?.name || 'User'}</span>
              <ChevronDown className="w-4 h-4" />
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-2xl bg-base-200 rounded-box w-52 mt-3 border border-base-300">
              <li className="menu-title">
                <span>{user?.email}</span>
              </li>
              <li><a onClick={() => navigate('/profile')}>
                <User className="w-4 h-4" /> Profile
              </a></li>
              <li><a onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4" /> Settings
              </a></li>
              <div className="divider my-1"></div>
              <li><a onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> Logout
              </a></li>
            </ul>
          </div>
        </div>
      </header>
    </>
  );
}
