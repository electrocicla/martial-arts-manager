import { Save, User as UserIcon, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useSettings from '../../hooks/useSettings';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProfileSettings() {
  const { user, refreshAuth } = useAuth();
  const { saveSection } = useSettings();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: ''
  });

  const handleSave = async () => {
    setSaveError(null);
    if (!user) return;

    // Students: persist to D1 via student profile endpoint (real account email)
    if (user.role === 'student') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSaveError('No authentication token found');
        return;
      }

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to save profile' } as { error?: string }));
        setSaveError(data.error || 'Failed to save profile');
        return;
      }

      // Refresh auth context so email/name changes reflect immediately across the app
      await refreshAuth();
      return;
    }

    // Admin/Instructor: keep existing settings behavior (does not impact login)
    await saveSection('profile', form);
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || user.role !== 'student') return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setSaveError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('File too large. Maximum size is 5MB.');
      return;
    }

    setAvatarUploading(true);
    setSaveError(null);

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('studentId', user.id);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/students/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      // Refresh auth context to update header avatar
      await refreshAuth();
      
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">{t('settings.profile.title')}</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
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
                {user?.role === 'student' ? (
                  <>
                    <button 
                      onClick={handleAvatarClick}
                      disabled={avatarUploading}
                      className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {avatarUploading ? t('common.uploading') : t('settings.profile.changePhoto')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </>
                ) : (
                  <span className="text-sm text-slate-500">{t('settings.profile.photoNotAvailable')}</span>
                )}
                <div className="text-xs text-slate-500">{t('settings.profile.photoRequirements')}</div>
              </div>
            </div>
            {saveError && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-2">{saveError}</div>
            )}
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
            <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">
              <Save className="w-4 h-4" />
              {t('settings.profile.save')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}