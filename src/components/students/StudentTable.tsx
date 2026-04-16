import { Eye, Edit, Phone, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBeltColor } from '../../lib/studentUtils';
import { Button } from '../ui/Button';
import type { Student } from '../../types/index';

interface StudentTableProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

export default function StudentTable({ students, onViewStudent, onEditStudent }: StudentTableProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-red-900/30 to-purple-900/30 border-b border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.student')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.belt')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.discipline')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.contact')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.joined')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.status')}
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('students.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {students.map((student: Student, index: number) => (
              <tr
                key={student.id}
                className={`hover:bg-gray-700/30 transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-gray-700">
                        {student.avatar_url ? (
                          <img
                            src={student.avatar_url}
                            alt={student.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          student.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                        student.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white truncate">
                        {student.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {student.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold shadow-lg ${getBeltColor(student.belt)}`}>
                    {student.belt || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300 font-medium">
                    {student.discipline || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {student.email || 'N/A'}
                  </div>
                  {student.phone && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {student.phone}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    {new Date(student.join_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                    student.is_active
                      ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/50'
                      : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/50'
                  }`}>
                    {student.is_active ? t('students.filters.active') : t('students.filters.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      size="xs"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => onViewStudent(student)}
                    >
                      <span className="hidden sm:inline">{t('common.details')}</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                      onClick={() => onEditStudent(student)}
                    >
                      <span className="hidden sm:inline">{t('common.edit')}</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
