import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, Calendar, DollarSign, BookOpen,
  Award, Clock, BarChart3, User, X, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export default function BottomSlidingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Navigation items configuration - Mobile-first approach
  const navigationItems = [
    {
      id: 'dashboard',
      nameKey: 'nav.dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['admin', 'instructor', 'student'],
      color: 'text-blue-500'
    },
    {
      id: 'profile',
      nameKey: 'nav.profile',
      href: '/profile',
      icon: User,
      roles: ['admin', 'instructor', 'student'],
      color: 'text-pink-500'
    },
    {
      id: 'calendar',
      nameKey: 'nav.calendar',
      href: '/calendar',
      icon: Calendar,
      roles: ['admin', 'instructor', 'student'],
      color: 'text-indigo-500'
    },
    {
      id: 'attendance',
      nameKey: 'nav.attendance',
      href: '/attendance',
      icon: Clock,
      roles: ['admin', 'instructor', 'student'],
      color: 'text-blue-500'
    },
    {
      id: 'belt-testing',
      nameKey: 'nav.beltTesting',
      href: '/belt-testing',
      icon: Award,
      roles: ['admin', 'instructor', 'student'],
      color: 'text-yellow-500'
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
      id: 'payments',
      nameKey: 'nav.payments',
      href: '/payments',
      icon: DollarSign,
      roles: ['admin'],
      color: 'text-emerald-500'
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

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  // Touch event handlers for drag/swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    setCurrentY(currentY);

    // Prevent scrolling when dragging the menu
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const deltaY = startY - currentY;
    const threshold = 50; // Minimum distance to trigger open/close

    if (deltaY > threshold && !isOpen) {
      // Swipe up to open
      setIsOpen(true);
    } else if (deltaY < -threshold && isOpen) {
      // Swipe down to close
      setIsOpen(false);
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Calculate transform based on drag state
  const getTransform = () => {
    if (!isDragging) return isOpen ? 'translateY(0)' : 'translateY(calc(100% - 80px))';

    const deltaY = startY - currentY;
    const maxDrag = 300; // Maximum drag distance
    const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaY));

    if (isOpen) {
      // When open, dragging down should close
      return `translateY(${Math.max(0, clampedDelta)}px)`;
    } else {
      // When closed, dragging up should open
      return `translateY(calc(100% - 80px + ${Math.max(-maxDrag, clampedDelta)}px))`;
    }
  };

  // Handle navigation and close menu
  const handleNavigate = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  // Close menu when clicking outside or on backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Bottom Sliding Menu */}
      <div className="md:hidden fixed inset-0 z-50 pointer-events-none">
        {/* Backdrop - only visible when menu is open */}
        <div
          className={cn(
            "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={handleBackdropClick}
        />

        {/* Sliding Menu Panel */}
        <div
          ref={menuRef}
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 shadow-2xl transition-transform duration-300 ease-out pointer-events-auto",
            "max-h-[85vh] overflow-hidden rounded-t-3xl"
          )}
          style={{
            transform: getTransform(),
            touchAction: 'none' // Prevent default touch behaviors
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
          </div>

          {/* Menu Header */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t('common.navigation')}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Items - Horizontal Scroll */}
          <div className="px-6 pb-6">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[80px] p-4 rounded-2xl transition-all duration-200 flex-shrink-0",
                        "hover:bg-gray-800/60 active:scale-95",
                        isActive
                          ? "bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30"
                          : "bg-gray-800/40"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-xl mb-2 transition-all duration-200",
                        isActive
                          ? "bg-red-600/20 shadow-lg shadow-red-500/20"
                          : "bg-gray-700/50"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6 transition-all duration-200",
                          item.color,
                          isActive && "drop-shadow-lg"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-center leading-tight transition-colors",
                        isActive ? "text-white" : "text-gray-300"
                      )}>
                        {t(item.nameKey)}
                      </span>
                      {isActive && (
                        <div className="w-1 h-1 bg-red-500 rounded-full mt-1 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="px-6 pb-6 border-t border-gray-800/50 pt-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">{t('dashboard.quickActions.title')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate('/attendance')}
                className="flex flex-col items-center p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 active:scale-95 transition-all duration-200"
              >
                <Clock className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-xs font-medium text-gray-300 text-center">{t('nav.attendance')}</span>
              </button>

              {user?.role !== 'student' && (
                <button
                  onClick={() => handleNavigate('/classes')}
                  className="flex flex-col items-center p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 active:scale-95 transition-all duration-200"
                >
                  <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
                  <span className="text-xs font-medium text-gray-300 text-center">{t('nav.classes')}</span>
                </button>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => handleNavigate('/payments')}
                  className="flex flex-col items-center p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 active:scale-95 transition-all duration-200"
                >
                  <DollarSign className="w-6 h-6 text-emerald-500 mb-2" />
                  <span className="text-xs font-medium text-gray-300 text-center">{t('nav.payments')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tab Bar - Always Visible */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50">
          <div className="flex items-center justify-center py-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-800/60 active:scale-95 transition-all duration-200"
            >
              <ChevronUp className={cn(
                "w-6 h-6 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
              <span className="text-xs font-medium text-gray-400 mt-1">
                {isOpen ? t('common.close') : t('common.menu')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}