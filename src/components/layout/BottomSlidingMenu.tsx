import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Home,
  Menu,
  Search,
  User,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { navigationItems, quickActions, attendanceHrefForRole } from '../../lib/mobileMenuConfig';

export default function BottomSlidingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const roleLabel = useMemo(() => {
    if (!user?.role) return t('common.account');
    const key = `auth.${user.role}`;
    const translated = t(key);
    return translated === key ? user.role : translated;
  }, [t, user?.role]);

  const attendanceHref = attendanceHrefForRole(user?.role);

  const PEEK_HEIGHT_PX = 72;

  const filteredItems = useMemo(
    () => navigationItems.filter(item => (user?.role ? item.roles.includes(user.role) : false)),
    [user?.role]
  );

  const filteredQuickActions = useMemo(
    () => quickActions.filter(item => (user?.role ? item.roles.includes(user.role) : false)),
    [user?.role]
  );

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return filteredItems;
    return filteredItems.filter(item => {
      const label = t(item.nameKey).toLowerCase();
      return label.includes(query);
    });
  }, [filteredItems, searchQuery, t]);

  const closeMenu = () => {
    setIsOpen(false);
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate('/login');
  };

  // Pointer event handlers for drag/swipe functionality (works for touch + mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    const deltaY = startY - currentY;
    const threshold = 50;

    if (deltaY > threshold && !isOpen) setIsOpen(true);
    if (deltaY < -threshold && isOpen) setIsOpen(false);

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Calculate transform based on drag state
  const getTransform = () => {
    if (!isDragging) return isOpen ? 'translateY(0)' : `translateY(calc(100% - ${PEEK_HEIGHT_PX}px))`;

    const deltaY = startY - currentY;
    const maxDrag = 300; // Maximum drag distance
    const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaY));

    if (isOpen) {
      // When open, dragging down should close
      return `translateY(${Math.max(0, clampedDelta)}px)`;
    } else {
      // When closed, dragging up should open
      return `translateY(calc(100% - ${PEEK_HEIGHT_PX}px + ${Math.max(-maxDrag, clampedDelta)}px))`;
    }
  };

  // Handle navigation and close menu
  const handleNavigate = (href: string) => {
    navigate(href);
    closeMenu();
  };

  // Close menu when clicking outside or on backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeMenu();
    }
  };

  const isActive = (href: string) => location.pathname === href;

  const tabItems = useMemo(() => {
    return [
      { id: 'tab-dashboard', kind: 'link' as const, href: '/dashboard', icon: Home, label: t('nav.dashboard') },
      { id: 'tab-calendar', kind: 'link' as const, href: '/calendar', icon: Calendar, label: t('nav.calendar') },
      { id: 'tab-menu', kind: 'action' as const, icon: Menu, label: t('common.menu') },
      { id: 'tab-attendance', kind: 'link' as const, href: attendanceHref, icon: Clock, label: t('nav.attendance') },
      { id: 'tab-profile', kind: 'link' as const, href: '/profile', icon: User, label: t('nav.profile') }
    ];
  }, [attendanceHref, t]);

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
          }}
        >
          {/* Drag Handle (pointer events only here, so content can scroll) */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
          </div>

          {/* Panel Content */}
          <div className="max-h-[calc(85vh-56px)] overflow-y-auto">
            {/* User Header */}
            <div className="px-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center overflow-hidden ring-1 ring-gray-700">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-12 h-12 object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{user?.name || 'User'}</div>
                    <div className="badge badge-primary badge-sm mt-1">{roleLabel}</div>
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 pb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="px-6 pb-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">{t('common.navigation')}</h2>
              <div className="space-y-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "flex items-center w-full p-3 text-left rounded-lg transition-colors",
                        active ? "bg-gray-800 text-white" : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 mr-3 flex-shrink-0", item.color)} />
                      <span className="text-sm font-medium">{t(item.nameKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 pb-6 border-t border-gray-800/50 pt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">{t('dashboard.quickActions.title')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {filteredQuickActions.map((action) => {
                  const Icon = action.icon;
                  const targetHref = action.getHref ? action.getHref(user?.role) : action.href;
                  if (!targetHref) return null;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleNavigate(targetHref)}
                      className="flex flex-col items-center p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 active:scale-95 transition-all duration-200"
                    >
                      <Icon className={cn('w-6 h-6 mb-2', action.color ?? 'text-blue-500')} />
                      <span className="text-xs font-medium text-gray-300 text-center">{t(action.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account */}
            <div className="px-6 pb-6 border-t border-gray-800/50 pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">{t('common.account')}</h3>
                <LanguageSwitcher />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span>{t('nav.profile')}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 text-left text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tab Bar - Always Visible */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50">
          <div className="grid grid-cols-5 items-center px-2 py-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const active = tab.kind === 'link' ? isActive(tab.href) : isOpen;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.kind === 'action') {
                      setIsOpen(!isOpen);
                      return;
                    }
                    handleNavigate(tab.href);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-xl transition-colors",
                    active ? "text-white bg-gray-800/60" : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                  )}
                  aria-expanded={tab.kind === 'action' ? isOpen : undefined}
                  aria-label={tab.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-1 leading-none line-clamp-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}