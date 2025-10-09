import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    roles: ['admin', 'instructor', 'student'],
  },
  {
    name: 'Students',
    href: '/students',
    icon: Users,
    roles: ['admin', 'instructor'],
  },
  {
    name: 'Classes',
    href: '/classes',
    icon: BookOpen,
    roles: ['admin', 'instructor'],
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    roles: ['admin'],
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    roles: ['admin', 'instructor', 'student'],
  },
];

export default function MobileNav({ className }: MobileNavProps) {
  const location = useLocation();
  const { user } = useAuth();

  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/20 px-2 py-2 sm:py-3 flex justify-around items-center z-50 md:hidden shadow-2xl",
      className
    )}>
      {allowedItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1 transform hover:scale-105",
              isActive
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 scale-105 shadow-lg"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 drop-shadow-lg" />
            <span className="text-xs font-bold truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}