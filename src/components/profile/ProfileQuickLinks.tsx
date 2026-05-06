import { CalendarDays, ClipboardCheck, CreditCard, GraduationCap, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '../ui/Card';
import type { Role } from '../../lib/mobileMenuConfig';

interface QuickLinkDefinition {
  id: string;
  labelKey: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

const QUICK_LINKS: QuickLinkDefinition[] = [
  { id: 'my-classes', labelKey: 'profileV2.shortcuts.links.myClasses', href: '/my-classes', icon: GraduationCap, roles: ['student'] },
  { id: 'my-attendance', labelKey: 'profileV2.shortcuts.links.myAttendance', href: '/my-attendance', icon: ClipboardCheck, roles: ['student'] },
  { id: 'my-payments', labelKey: 'profileV2.shortcuts.links.myPayments', href: '/my-payments', icon: CreditCard, roles: ['student'] },
  { id: 'calendar', labelKey: 'profileV2.shortcuts.links.calendar', href: '/calendar', icon: CalendarDays, roles: ['admin', 'instructor'] },
  { id: 'attendance', labelKey: 'profileV2.shortcuts.links.attendance', href: '/attendance', icon: ClipboardCheck, roles: ['admin', 'instructor'] },
  { id: 'students', labelKey: 'profileV2.shortcuts.links.students', href: '/students', icon: Users, roles: ['admin', 'instructor'] },
];

interface ProfileQuickLinksProps {
  role?: Role;
}

export default function ProfileQuickLinks({ role }: ProfileQuickLinksProps) {
  const { t } = useTranslation();
  const links = QUICK_LINKS.filter((link) => (role ? link.roles.includes(role) : false));

  if (links.length === 0) return null;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <h2 className="text-lg font-semibold text-white">{t('profileV2.shortcuts.title', 'Useful shortcuts')}</h2>
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
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}