import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, DollarSign, BookOpen, 
  Award, Clock, BarChart3, Settings, Plus, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

// Navigation items configuration - Mobile-first approach
const navigationItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'instructor'],
    color: 'text-blue-500'
  },
  {
    id: 'students',
    name: 'Students',
    href: '/students',
    icon: Users,
    roles: ['admin', 'instructor'],
    color: 'text-green-500'
  },
  {
    id: 'classes',
    name: 'Classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['admin', 'instructor'],
    color: 'text-purple-500'
  },
  {
    id: 'payments',
    name: 'Payments',
    href: '/payments',
    icon: DollarSign,
    roles: ['admin'],
    color: 'text-emerald-500'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin'],
    color: 'text-orange-500'
  }
];

// Quick action items for mobile modal
const quickActions = [
  {
    id: 'attendance',
    name: 'Mark Attendance',
    href: '/attendance',
    icon: Clock,
    description: 'Check students in/out',
    color: 'text-blue-500'
  },
  {
    id: 'add-student',
    name: 'Add Student',
    href: '/students',
    icon: Users,
    description: 'Register new member',
    color: 'text-green-500'
  },
  {
    id: 'schedule-class',
    name: 'Schedule Class',
    href: '/classes',
    icon: Calendar,
    description: 'Create new session',
    color: 'text-purple-500'
  },
  {
    id: 'record-payment',
    name: 'Record Payment',
    href: '/payments',
    icon: DollarSign,
    description: 'Process transaction',
    color: 'text-emerald-500'
  }
];

export default function MobileNav() {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Filter items based on user role
  const allowedItems = navigationItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  // Take only first 4 items for bottom nav (mobile-first design)
  const visibleItems = allowedItems.slice(0, 4);

  return (
    <>
      {/* Enhanced Mobile Bottom Navigation */}
      <nav className="btm-nav btm-nav-lg md:hidden bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 shadow-2xl shadow-black/40 fixed bottom-0 left-0 right-0 mobile-bottom-nav">
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
        
        {/* Quick Actions Button */}
        <button
          onClick={() => setIsQuickActionsOpen(true)}
          className="relative group transition-all duration-300 text-base-content/70 flex flex-col items-center justify-center py-2 px-1"
        >
          <div className="p-2 rounded-xl transition-all duration-300 group-active:scale-95">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">Actions</span>
        </button>
      </nav>

      {/* Quick Actions Modal - Modern Tailwind Modal Pattern */}
      {isQuickActionsOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsQuickActionsOpen(false)}
          />
          
          {/* Modal content */}
          <div className="fixed inset-x-4 bottom-20 top-auto rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-800 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <button
                onClick={() => setIsQuickActionsOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Quick actions list */}
            <div className="p-4">
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.id}
                      to={action.href}
                      onClick={() => setIsQuickActionsOpen(false)}
                      className="flex items-center rounded-xl p-3 transition-colors hover:bg-gray-800/50 active:bg-gray-700/50"
                    >
                      <div className="mr-3 rounded-lg bg-gray-800/50 p-2.5">
                        <Icon className={cn("h-5 w-5", action.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{action.name}</p>
                        <p className="text-xs text-gray-400">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
