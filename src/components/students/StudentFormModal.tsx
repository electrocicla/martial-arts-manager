import { useState } from 'react';
import type { Student, StudentFormData, Discipline } from '../../types/index';
import { UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import { useClassMetadata } from '../../hooks/useClassMetadata';
import { useTranslation } from 'react-i18next';
import { BELT_RANKINGS } from '../../lib/constants';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<Student | null>;
}

export default function StudentFormModal({ isOpen, onClose, onSubmit }: StudentFormModalProps) {
  const { t } = useTranslation();
  const { disciplines } = useClassMetadata();
  
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    belt: 'White',
    discipline: disciplines[0] || 'Brazilian Jiu-Jitsu',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  // Date of birth selectors state
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const belts = BELT_RANKINGS[newStudent.discipline as Discipline] || [];

  // Generate arrays for date selectors
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: '01', label: t('months.january') || 'January' },
    { value: '02', label: t('months.february') || 'February' },
    { value: '03', label: t('months.march') || 'March' },
    { value: '04', label: t('months.april') || 'April' },
    { value: '05', label: t('months.may') || 'May' },
    { value: '06', label: t('months.june') || 'June' },
    { value: '07', label: t('months.july') || 'July' },
    { value: '08', label: t('months.august') || 'August' },
    { value: '09', label: t('months.september') || 'September' },
    { value: '10', label: t('months.october') || 'October' },
    { value: '11', label: t('months.november') || 'November' },
    { value: '12', label: t('months.december') || 'December' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Update date_of_birth when day, month, or year changes
  const handleDateChange = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const formattedDate = `${year}-${month}-${day.padStart(2, '0')}`;
      setNewStudent({ ...newStudent, date_of_birth: formattedDate });
    } else {
      setNewStudent({ ...newStudent, date_of_birth: '' });
    }
  };

  const handleSubmit = async () => {
    if (!newStudent.name || !newStudent.email) {
      alert(t('studentForm.requiredField'));
      return;
    }

    const studentData: StudentFormData = {
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone || undefined,
      belt: newStudent.belt,
      discipline: newStudent.discipline as Discipline,
      dateOfBirth: newStudent.date_of_birth || undefined,
      emergencyContactName: newStudent.emergency_contact_name || undefined,
      emergencyContactPhone: newStudent.emergency_contact_phone || undefined,
      notes: newStudent.notes || undefined,
    };

    const result = await onSubmit(studentData);
    if (result) {
      onClose();
      // Reset form
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        belt: 'White',
        discipline: disciplines[0] || 'Brazilian Jiu-Jitsu',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
      });
      // Reset date selectors
      setBirthDay('');
      setBirthMonth('');
      setBirthYear('');
    } else {
      alert(t('studentForm.addFailed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('studentForm.title')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('studentForm.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                {t('studentForm.personalInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('studentForm.fullNamePlaceholder')}
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.emailAddress')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('studentForm.emailPlaceholder')}
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.phoneNumber')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('studentForm.phonePlaceholder')}
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.dateOfBirth')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day Selector */}
                    <div className="relative">
                      <select
                        className="w-full px-3 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                        value={birthDay}
                        onChange={(e) => {
                          setBirthDay(e.target.value);
                          handleDateChange(e.target.value, birthMonth, birthYear);
                        }}
                      >
                        <option value="">{t('studentForm.day') || 'Day'}</option>
                        {days.map(day => (
                          <option key={day} value={day.toString().padStart(2, '0')}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Month Selector */}
                    <div className="relative">
                      <select
                        className="w-full px-3 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                        value={birthMonth}
                        onChange={(e) => {
                          setBirthMonth(e.target.value);
                          handleDateChange(birthDay, e.target.value, birthYear);
                        }}
                      >
                        <option value="">{t('studentForm.month') || 'Month'}</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Year Selector */}
                    <div className="relative">
                      <select
                        className="w-full px-3 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                        value={birthYear}
                        onChange={(e) => {
                          setBirthYear(e.target.value);
                          handleDateChange(birthDay, birthMonth, e.target.value);
                        }}
                      >
                        <option value="">{t('studentForm.year') || 'Year'}</option>
                        {years.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                  {newStudent.date_of_birth && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('studentForm.selectedDate') || 'Selected date'}: {new Date(newStudent.date_of_birth).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Martial Arts Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                {t('studentForm.martialArtsInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.beltRank')}
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={newStudent.belt}
                    onChange={(e) => setNewStudent({...newStudent, belt: e.target.value})}
                  >
                    {belts.map(belt => (
                      <option key={belt} value={belt} className="bg-white dark:bg-gray-700">
                        {t(`studentForm.belts.${belt.toLowerCase().replace(/\//g, '').replace(/\s/g, '')}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.discipline')}
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={newStudent.discipline}
                    onChange={(e) => {
                      const newDiscipline = e.target.value as Discipline;
                      const newBelts = BELT_RANKINGS[newDiscipline] || [];
                      setNewStudent({
                        ...newStudent, 
                        discipline: newDiscipline,
                        belt: newBelts[0] || 'White'
                      });
                    }}
                  >
                    {disciplines.map(disc => (
                      <option key={disc} value={disc} className="bg-white dark:bg-gray-700">
                        {disc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-red-500 rounded-full mr-3"></div>
                {t('studentForm.emergencyContact')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.contactName')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('studentForm.contactNamePlaceholder')}
                    value={newStudent.emergency_contact_name}
                    onChange={(e) => setNewStudent({...newStudent, emergency_contact_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('studentForm.contactPhone')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('studentForm.contactPhonePlaceholder')}
                      value={newStudent.emergency_contact_phone}
                      onChange={(e) => setNewStudent({...newStudent, emergency_contact_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
                {t('studentForm.additionalInfo')}
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('studentForm.notes')}
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                  placeholder={t('studentForm.notesPlaceholder')}
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 rounded-b-2xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium flex items-center space-x-2"
              onClick={handleSubmit}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('studentForm.addStudent')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}