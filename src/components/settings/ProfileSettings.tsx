import { Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useSettings from '../../hooks/useSettings';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProfileSettings() {
  const { user } = useAuth();
  const { saveSection } = useSettings();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: ''
  });

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">{t('settings.profile.title')}</h2>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400">
            <Save className="w-4 h-4" />
            {t('common.save')}
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex-none w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-2xl font-bold">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name ? getInitials(user.name) : <UserIcon className="w-8 h-8" />}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-slate-700 dark:text-slate-300">{t('settings.profile.updatePhoto')}</div>
              <div className="flex items-center gap-3">
                <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('settings.profile.changePhoto')}</button>
                <div className="text-xs text-slate-500">{t('settings.profile.photoRequirements')}</div>
              </div>
            </div>
          </div>
        </div>

        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.profile.fullName')}</span>
            <input value={form.name} onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 bg-transparent text-sm focus:ring-2 focus:ring-sky-300" placeholder="Enter your full name" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.profile.email')}</span>
            <input value={form.email} onChange={(e) => setForm(prev => ({...prev, email: e.target.value}))} type="email" className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300" placeholder="your.email@example.com" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.profile.phone')}</span>
            <input value={form.phone} onChange={(e) => setForm(prev => ({...prev, phone: e.target.value}))} type="tel" className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300" placeholder="(555) 123-4567" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.profile.role')}</span>
            <select disabled defaultValue={user?.role || 'admin'} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-transparent">
              <option value="admin">{t('auth.roles.admin')}</option>
              <option value="instructor">{t('auth.roles.instructor')}</option>
              <option value="student">{t('auth.roles.student')}</option>
            </select>
          </label>

          <label className="flex flex-col sm:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.profile.bio')}</span>
            <textarea value={form.bio} onChange={(e) => setForm(prev => ({...prev, bio: e.target.value}))} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm min-h-[96px]" placeholder="Tell us about yourself..."></textarea>
          </label>

          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="button" className="px-3 py-1 rounded-md text-sm border">{t('settings.profile.cancel')}</button>
            <button type="button" onClick={async () => { await saveSection('profile', form); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">
              <Save className="w-4 h-4" />
              {t('settings.profile.save')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}