import { CalendarDays, ClipboardCheck, CreditCard, GraduationCap, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/Card';
import type { Role } from '../../lib/mobileMenuConfig';

interface QuickLinkDefinition {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

const QUICK_LINKS: QuickLinkDefinition[] = [
  { id: 'my-classes', label: 'My classes', href: '/my-classes', icon: GraduationCap, roles: ['student'] },
  { id: 'my-attendance', label: 'My attendance', href: '/my-attendance', icon: ClipboardCheck, roles: ['student'] },
  { id: 'my-payments', label: 'My payments', href: '/my-payments', icon: CreditCard, roles: ['student'] },
  { id: 'calendar', label: 'Calendar', href: '/calendar', icon: CalendarDays, roles: ['admin', 'instructor'] },
  { id: 'attendance', label: 'Attendance', href: '/attendance', icon: ClipboardCheck, roles: ['admin', 'instructor'] },
  { id: 'students', label: 'Students', href: '/students', icon: Users, roles: ['admin', 'instructor'] },
];

interface ProfileQuickLinksProps {
  role?: Role;
}

export default function ProfileQuickLinks({ role }: ProfileQuickLinksProps) {
  const links = QUICK_LINKS.filter((link) => (role ? link.roles.includes(role) : false));

  if (links.length === 0) return null;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <h2 className="text-lg font-semibold text-white">Useful shortcuts</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.id}
                to={link.href}
                className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-3 text-sm font-medium text-gray-200 transition-colors hover:border-red-500/50 hover:bg-gray-800"
              >
                <Icon className="h-4 w-4 text-red-400" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}