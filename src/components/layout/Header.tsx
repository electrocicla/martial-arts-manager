import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Menu, X, User, LogOut, 
  Settings, Award, ChevronDown, Clock, Users, Calendar
} from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
      {/* Mobile Header - Fixed Design */}
      <header className="navbar bg-base-100/95 backdrop-blur-lg border-b border-base-300 sticky top-0 mobile-header md:hidden min-h-[4rem]">
        <div className="navbar-start">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-circle hover:bg-base-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        <div className="navbar-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-base-content">Dojo Manager</h1>
            </div>
          </div>
        </div>

        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <label 
              tabIndex={0} 
              className="btn btn-ghost btn-circle hover:bg-base-200 relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <div className="indicator">
                <Bell className="w-6 h-6" />
                <span className="badge badge-xs badge-error indicator-item animate-pulse">3</span>
              </div>
            </label>
            <div className={`dropdown-content menu p-0 shadow-2xl bg-base-100 rounded-2xl w-80 mt-4 border border-base-300 transition-all duration-200 ${notificationsOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              {/* Close button */}
              <div className="flex items-center justify-between p-4 border-b border-base-300">
                <h3 className="font-bold text-lg">Notifications</h3>
                <button 
                  className="btn btn-ghost btn-circle btn-sm"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 border-b border-base-200 last:border-0 hover:bg-base-200 transition-colors ${notif.unread ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.unread ? 'font-semibold text-base-content' : 'text-base-content/80'}`}>
                          {notif.text}
                        </p>
                        <p className="text-xs text-base-content/60 mt-1">{notif.time}</p>
                      </div>
                      {notif.unread && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-base-300">
                <button className="btn btn-primary btn-sm w-full" onClick={() => setNotificationsOpen(false)}>
                  Mark All as Read
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Backdrop */}
      {notificationsOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setNotificationsOpen(false)}
        />
      )}

      {/* Mobile Slide Menu - Improved */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute left-0 top-0 h-full w-80 bg-base-100 shadow-2xl transition-transform duration-300 flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* User Profile Section - Enhanced */}
          <div className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-b border-base-300">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 h-16 rounded-2xl ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="rounded-2xl" />
                  ) : (
                    <div className="bg-gradient-to-br from-primary to-secondary flex items-center justify-center rounded-2xl">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base-content text-lg truncate">{user?.name || 'User'}</h3>
                <p className="text-base-content/70 text-sm capitalize">{user?.role || 'Member'}</p>
                <div className="badge badge-primary badge-sm mt-1">Administrator</div>
              </div>
            </div>
          </div>

          {/* Search Bar - Improved */}
          <div className="p-6 border-b border-base-300">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search students, classes..."
                  className="input input-bordered w-full focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-primary btn-square">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items - Enhanced */}
          <div className="flex-1 overflow-y-auto">
            <ul className="menu p-4 space-y-1">
              <li className="menu-title text-base-content/70 font-bold">
                <span>Quick Actions</span>
              </li>
              <li>
                <button 
                  onClick={() => { navigate('/attendance'); setMobileMenuOpen(false); }}
                  className="btn btn-ghost justify-start w-full h-12 rounded-xl"
                >
                  <Clock className="w-5 h-5 text-primary" />
                  Mark Attendance
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { navigate('/students'); setMobileMenuOpen(false); }}
                  className="btn btn-ghost justify-start w-full h-12 rounded-xl"
                >
                  <Users className="w-5 h-5 text-secondary" />
                  Add Student
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { navigate('/classes'); setMobileMenuOpen(false); }}
                  className="btn btn-ghost justify-start w-full h-12 rounded-xl"
                >
                  <Calendar className="w-5 h-5 text-accent" />
                  Schedule Class
                </button>
              </li>
              
              <div className="divider my-4"></div>
              
              <li className="menu-title text-base-content/70 font-bold">
                <span>Account</span>
              </li>
              <li>
                <button 
                  onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                  className="btn btn-ghost justify-start w-full h-12 rounded-xl"
                >
                  <Settings className="w-5 h-5 text-info" />
                  Settings
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="btn btn-ghost justify-start w-full h-12 rounded-xl text-error hover:bg-error/10"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </li>
            </ul>
          </div>

          {/* Theme Info at Bottom */}
          <div className="p-4 border-t border-base-300">
            <div className="alert alert-info">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-info flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">Dark Mode Active</h3>
                  <div className="text-xs opacity-70">Optimized for your eyes</div>
                </div>
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
