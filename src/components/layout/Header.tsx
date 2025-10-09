import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Menu, X, User, LogOut, 
  Settings, Award, Clock, Users, Calendar
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



  return (
    <>
      {/* Mobile Header - Static Design */}
      <header className="navbar bg-base-100 border-b border-base-300 mobile-header md:hidden min-h-[4rem]">
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
          {/* Simple notification icon - no dropdown */}
          <button className="btn btn-ghost btn-circle hover:bg-base-200 relative">
            <div className="indicator">
              <Bell className="w-6 h-6" />
              <span className="badge badge-xs badge-error indicator-item animate-pulse hidden">3</span>
            </div>
          </button>
        </div>
      </header>



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
                <div className="badge badge-primary badge-sm mt-1 capitalize">{user?.role || 'Member'}</div>
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
      <header className="hidden md:flex h-16 bg-base-200 border-b border-base-300 items-center px-6 ml-64">
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
          {/* Simple notification icon - no dropdown */}
          <button className="btn btn-ghost btn-circle">
            <div className="indicator">
              <Bell className="w-5 h-5" />
              <span className="badge badge-xs badge-primary indicator-item hidden">3</span>
            </div>
          </button>

          {/* Simple User Info - No Dropdown */}
          <div className="flex items-center gap-2">
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
            <span className="font-bold hidden sm:inline">{user?.name || 'User'}</span>
          </div>
        </div>
      </header>
    </>
  );
}
