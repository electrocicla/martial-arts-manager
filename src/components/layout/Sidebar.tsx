import { Link, useLocation } from 'react-router-dom';
import { Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { navigationItems } from '../../lib/mobileMenuConfig';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
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
              {t('common.appName')}
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
            const targetHref = item.getHref ? item.getHref(user?.role) : item.href;
            const isActive = location.pathname === targetHref;

            if (!user?.role || !item.roles.includes(user.role)) return null;

            return (
              <li key={item.id} className="group">
                <Link
                  to={targetHref}
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

      {/* Footer Section - Quick Actions */}
      <div className="p-3 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="text-xs text-gray-400 text-center">
          {t('common.appName')} v1.0
        </div>
      </div>
    </aside>
  );
}