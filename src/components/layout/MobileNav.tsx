import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, CreditCard, BookOpen,
  Award, BarChart3, Settings, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'instructor', 'student'],
    gradient: 'from-primary to-secondary',
  },
  {
    name: 'Students',
    href: '/students',
    icon: Users,
    roles: ['admin', 'instructor'],
    gradient: 'from-secondary to-accent',
  },
  {
    name: 'Classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['admin', 'instructor', 'student'],
    gradient: 'from-info to-primary',
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    roles: ['admin'],
    gradient: 'from-success to-info',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    roles: ['admin', 'instructor', 'student'],
    gradient: 'from-warning to-secondary',
  },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

  const allowedItems = navigationItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  // Add More button at the end
  const visibleItems = allowedItems.slice(0, 4);
  const hasMore = allowedItems.length > 4;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="btm-nav btm-nav-lg md:hidden bg-base-200/95 backdrop-blur-2xl border-t border-base-300 shadow-2xl shadow-black/50">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "relative group transition-all duration-300",
                isActive ? "active text-primary" : "text-base-content/70"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse" />
              )}
              
              {/* Icon with glow effect */}
              <div className={cn(
                "relative p-2 rounded-xl transition-all duration-300",
                isActive && "bg-gradient-to-br from-primary/20 to-secondary/20"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive ? "scale-110 drop-shadow-glow" : "group-active:scale-95"
                )} />
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl rounded-full animate-pulse" />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "btm-nav-label text-xs font-bold transition-all duration-300",
                isActive ? "text-primary" : "group-active:text-primary/70"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
        
        {hasMore && (
          <button className="relative group transition-all duration-300 text-base-content/70">
            <div className="p-2 rounded-xl transition-all duration-300 group-active:scale-95">
              <Layers className="w-5 h-5" />
            </div>
            <span className="btm-nav-label text-xs font-bold">More</span>
          </button>
        )}
      </nav>

      {/* Floating Action Button for mobile */}
      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <div className="dropdown dropdown-top dropdown-end">
          <label tabIndex={0} className="btn btn-circle btn-lg btn-primary shadow-2xl hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-2xl bg-base-200 rounded-box w-52 mb-3 border border-base-300">
            <li><a className="font-bold">Mark Attendance</a></li>
            <li><a className="font-bold">Add Student</a></li>
            <li><a className="font-bold">Schedule Class</a></li>
            <li><a className="font-bold">Record Payment</a></li>
          </ul>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-base-200/95 backdrop-blur-xl border-r border-base-300 z-40 flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-base-content">Dojo Manager</h1>
              <p className="text-xs text-primary font-bold">premium edition</p>
            </div>
          </div>

          <ul className="menu menu-lg p-0 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              if (!user?.role || !item.roles.includes(user.role)) return null;

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "rounded-lg font-bold transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg" 
                        : "hover:bg-base-300"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                    {isActive && (
                      <span className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-auto p-6">
          <ul className="menu menu-lg p-0 space-y-2">
            <li>
              <Link to="/belt-testing" className="rounded-lg font-bold hover:bg-base-300">
                <Award className="w-5 h-5" />
                Belt Testing
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="rounded-lg font-bold hover:bg-base-300">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </Link>
            </li>
            <li>
              <Link to="/settings" className="rounded-lg font-bold hover:bg-base-300">
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
