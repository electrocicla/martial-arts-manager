import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, CreditCard, BookOpen,
  Award, BarChart3, Settings, Layers, Clock
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
      {/* Enhanced Mobile Bottom Navigation */}
      <nav className="btm-nav btm-nav-lg md:hidden bg-base-100/95 backdrop-blur-xl border-t border-base-300/50 shadow-2xl shadow-black/20 fixed bottom-0 left-0 right-0 mobile-bottom-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "relative group transition-all duration-300 flex flex-col items-center justify-center py-2 px-1",
                isActive ? "text-primary" : "text-base-content/60 hover:text-base-content/80"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              )}
              
              {/* Icon with enhanced design */}
              <div className={cn(
                "relative p-2.5 rounded-2xl transition-all duration-300 mb-1",
                isActive ? "bg-primary/10 scale-110" : "group-active:scale-95 group-active:bg-base-200/50"
              )}>
                <Icon className="w-6 h-6" />
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-2xl -z-10" />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-semibold transition-all duration-300 text-center leading-tight",
                isActive ? "text-primary" : "text-base-content/70"
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

      {/* Enhanced Floating Action Button for mobile - Fixed positioning */}
      <div className="fixed bottom-28 right-4 md:hidden mobile-fab">
        <div className="dropdown dropdown-top dropdown-end">
          <label 
            tabIndex={0} 
            className="btn btn-circle btn-lg bg-gradient-to-r from-primary to-secondary border-0 shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-primary/25 hover:shadow-2xl"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-4 shadow-2xl bg-base-100/95 backdrop-blur-xl rounded-2xl w-64 mb-4 border border-base-300/50 max-h-80 overflow-y-auto">
            <li className="menu-title pb-3 border-b border-base-300/50 mb-2">
              <span className="text-base-content font-bold text-sm">Quick Actions</span>
            </li>
            <li>
              <Link to="/attendance" className="btn btn-ghost justify-start h-12 rounded-xl hover:bg-primary/10 text-left">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Mark Attendance</span>
                  <span className="text-xs opacity-60">Check students in/out</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/students" className="btn btn-ghost justify-start h-12 rounded-xl hover:bg-secondary/10 text-left">
                <Users className="w-5 h-5 text-secondary flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Add Student</span>
                  <span className="text-xs opacity-60">Register new member</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/classes" className="btn btn-ghost justify-start h-12 rounded-xl hover:bg-accent/10 text-left">
                <Calendar className="w-5 h-5 text-accent flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Schedule Class</span>
                  <span className="text-xs opacity-60">Create new session</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/payments" className="btn btn-ghost justify-start h-12 rounded-xl hover:bg-info/10 text-left">
                <Award className="w-5 h-5 text-info flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Record Payment</span>
                  <span className="text-xs opacity-60">Process transaction</span>
                </div>
              </Link>
            </li>
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
