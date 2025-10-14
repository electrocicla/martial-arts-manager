import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, DollarSign, BookOpen, 
  Award, Clock, BarChart3, Settings, Plus, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

// Navigation items configuration - Mobile-first approach
const navigationItems = [
  {
    id: 'dashboard',
    nameKey: 'nav.dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'instructor'],
    color: 'text-blue-500'
  },
  {
    id: 'students',
    nameKey: 'nav.students',
    href: '/students',
    icon: Users,
    roles: ['admin', 'instructor'],
    color: 'text-green-500'
  },
  {
    id: 'classes',
    nameKey: 'nav.classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['admin', 'instructor'],
    color: 'text-purple-500'
  },
  {
    id: 'calendar',
    nameKey: 'nav.calendar',
    href: '/calendar',
    icon: Calendar,
    roles: ['admin', 'instructor'],
    color: 'text-indigo-500'
  },
  {
    id: 'payments',
    nameKey: 'nav.payments',
    href: '/payments',
    icon: DollarSign,
    roles: ['admin'],
    color: 'text-emerald-500'
  },
  {
    id: 'belt-testing',
    nameKey: 'nav.beltTesting',
    href: '/belt-testing',
    icon: Award,
    roles: ['admin', 'instructor'],
    color: 'text-yellow-500'
  },
  {
    id: 'analytics',
    nameKey: 'nav.analytics',
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
    nameKey: 'nav.attendance',
    href: '/attendance',
    icon: Clock,
    descriptionKey: 'dashboard.quickActions.checkInOut',
    color: 'text-blue-500'
  },
  {
    id: 'add-student',
    nameKey: 'dashboard.quickActions.addStudent',
    href: '/students',
    icon: Users,
    descriptionKey: 'dashboard.quickActions.registerMember',
    color: 'text-green-500'
  },
  {
    id: 'schedule-class',
    nameKey: 'dashboard.quickActions.scheduleClass',
    href: '/classes',
    icon: Calendar,
    descriptionKey: 'dashboard.quickActions.addNewSession',
    color: 'text-purple-500'
  },
  {
    id: 'record-payment',
    nameKey: 'dashboard.quickActions.recordPayment',
    href: '/payments',
    icon: DollarSign,
    descriptionKey: 'dashboard.quickActions.processTransaction',
    color: 'text-emerald-500'
  }
];

export default function MobileNav() {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

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
              key={item.id}
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
                {t(item.nameKey)}
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
              <h2 className="text-lg font-semibold text-white">{t('dashboard.quickActions.title')}</h2>
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
                        <p className="text-sm font-medium text-white">{t(action.nameKey)}</p>
                        <p className="text-xs text-gray-400">{t(action.descriptionKey)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Professional & Performance Optimized */}
      <aside className="
        hidden md:flex 
        fixed left-0 top-0 h-screen w-64 
        bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
        border-r border-gray-800/50 
        z-40 flex-col
        shadow-2xl shadow-black/20
        will-change-transform
      ">
        {/* Logo & Brand Section - Enhanced */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-[1.02]">
            <div className="
              relative w-11 h-11 rounded-xl 
              bg-gradient-to-br from-red-600 via-red-700 to-red-900
              flex items-center justify-center
              shadow-lg shadow-red-500/20
              ring-2 ring-red-500/10 ring-offset-2 ring-offset-gray-900
              transition-all duration-300
              group-hover:shadow-red-500/40
              group-hover:ring-red-500/30
            ">
              <Award className="w-6 h-6 text-white drop-shadow-lg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-black text-white tracking-tight leading-tight">
                Dojo Manager
              </h1>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                Training Hub
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items - Optimized with will-change */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <ul className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              if (!user?.role || !item.roles.includes(user.role)) return null;

              return (
                <li key={item.id} className="group">
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 will-change-transform",
                      "relative overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25" 
                        : "text-gray-300 hover:text-white hover:bg-gray-800/60 hover:translate-x-0.5"
                    )}
                  >
                    {/* Active Indicator - Left Border */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                    )}
                    
                    {/* Icon with background glow */}
                    <div className={cn(
                      "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-white/10 shadow-inner" 
                        : "bg-gray-800/40 group-hover:bg-gray-700/60"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5 transition-all duration-200",
                        isActive ? "drop-shadow-lg" : "group-hover:scale-110"
                      )} />
                    </div>
                    
                    {/* Label */}
                    <span className="flex-1 tracking-wide">
                      {t(item.nameKey)}
                    </span>
                    
                    {/* Active Pulse Indicator */}
                    {isActive && (
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings Section - Fixed Bottom with Gradient Fade */}
        <div className="relative mt-auto">
          {/* Fade gradient to indicate scrollable content above */}
          <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
          
          <div className="p-3 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm">
            <ul className="space-y-1.5">
              <li className="group">
                <Link 
                  to="/settings" 
                  className="
                    flex items-center gap-3.5 px-4 py-3 rounded-xl 
                    font-semibold text-sm text-gray-300 
                    hover:text-white hover:bg-gray-800/60
                    transition-all duration-200
                    hover:translate-x-0.5
                  "
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800/40 group-hover:bg-gray-700/60 transition-all duration-200">
                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                  <span className="flex-1 tracking-wide">
                    {t('nav.settings')}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
