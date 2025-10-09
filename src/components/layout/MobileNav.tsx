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
      "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex justify-around items-center z-50 md:hidden",
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
              "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
              isActive
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}