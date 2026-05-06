import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Home,
  Settings,
  Users,
  User
} from 'lucide-react';

export type Role = 'admin' | 'instructor' | 'student';

// Each role gets a distinct attendance URL to avoid dual-active button issues
export const attendanceHrefForRole = (role?: Role): string => {
  if (role === 'student') return '/my-attendance';
  return '/attendance';
};

export interface NavigationItem {
  id: string;
  nameKey: string;
  icon: LucideIcon;
  color: string;
  roles: Role[];
  href: string;
  getHref?: (role?: Role) => string;
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    nameKey: 'nav.dashboard',
    href: '/dashboard',
    icon: Home,
    color: 'text-blue-500',
    roles: ['admin', 'instructor', 'student']
  },
  {
    id: 'profile',
    nameKey: 'nav.profile',
    href: '/profile',
    icon: User,
    color: 'text-pink-500',
    roles: ['admin', 'instructor', 'student']
  },
  {
    id: 'calendar',
    nameKey: 'nav.calendar',
    href: '/calendar',
    icon: Calendar,
    color: 'text-indigo-500',
    roles: ['admin', 'instructor', 'student']
  },
  {
    id: 'attendance',
    nameKey: 'nav.attendance',
    href: '/attendance',
    getHref: attendanceHrefForRole,
    icon: Clock,
    color: 'text-blue-500',
    roles: ['admin', 'instructor', 'student']
  },
  {
    id: 'belt-testing',
    nameKey: 'nav.beltTesting',
    href: '/belt-testing',
    icon: Award,
    color: 'text-yellow-500',
    roles: ['admin', 'instructor', 'student']
  },
  {
    id: 'students',
    nameKey: 'nav.students',
    href: '/students',
    icon: Users,
    color: 'text-green-500',
    roles: ['admin', 'instructor']
  },
  {
    id: 'classes',
    nameKey: 'nav.classes',
    href: '/classes',
    icon: BookOpen,
    color: 'text-purple-500',
    roles: ['admin', 'instructor']
  },
  {
    id: 'my-classes',
    nameKey: 'nav.myClasses',
    href: '/my-classes',
    icon: GraduationCap,
    color: 'text-indigo-400',
    roles: ['student']
  },
  {
    id: 'payments',
    nameKey: 'nav.payments',
    href: '/payments',
    icon: DollarSign,
    color: 'text-emerald-500',
    roles: ['admin']
  },
  {
    id: 'my-payments',
    nameKey: 'nav.myPayments',
    href: '/my-payments',
    icon: DollarSign,
    color: 'text-emerald-400',
    roles: ['student']
  },
  {
    id: 'analytics',
    nameKey: 'nav.analytics',
    href: '/analytics',
    icon: BarChart3,
    color: 'text-orange-500',
    roles: ['admin']
  },
  {
    id: 'settings',
    nameKey: 'nav.settings',
    href: '/settings',
    icon: Settings,
    color: 'text-slate-400',
    roles: ['admin']
  }
];

export interface QuickAction {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  roles: Role[];
  href?: string;
  getHref?: (role?: Role) => string;
  color?: string;
}

export const quickActions: QuickAction[] = [
  {
    id: 'quick-attendance',
    labelKey: 'nav.markAttendance',
    icon: Clock,
    roles: ['admin', 'instructor'],
    href: '/attendance',
    color: 'text-blue-500'
  },
  {
    id: 'quick-my-classes',
    labelKey: 'nav.myClasses',
    icon: GraduationCap,
    roles: ['student'],
    href: '/my-classes',
    color: 'text-indigo-400'
  },
  {
    id: 'quick-calendar',
    labelKey: 'nav.calendar',
    icon: Calendar,
    roles: ['admin', 'instructor'],
    href: '/calendar',
    color: 'text-indigo-500'
  },
  {
    id: 'quick-classes',
    labelKey: 'nav.classes',
    icon: BookOpen,
    roles: ['admin', 'instructor'],
    href: '/classes',
    color: 'text-purple-500'
  },
  {
    id: 'quick-payments',
    labelKey: 'nav.payments',
    icon: DollarSign,
    roles: ['admin'],
    href: '/payments',
    color: 'text-emerald-500'
  }
];
