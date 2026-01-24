import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, AlertCircle, Save, Shield, Activity, Camera, Loader2, Mail, Phone, Calendar, Bell, Palette, Settings as SettingsIcon } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { NotificationSettings } from '../components/settings';
import { AppearanceSettings } from '../components/settings';
import { prepareAvatarFile } from '../lib/avatarUpload';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  disciplines: z.array(z.object({
    discipline: z.string(),
    belt: z.string()
  })).min(1, 'At least one discipline is required'),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type DisciplineEntry = {
  id: string;
  discipline: string;
  belt: string;
};

const createDisciplineId = (): string => {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto);
  }
  return `discipline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toDisciplineEntry = (entry: { discipline: string; belt: string }): DisciplineEntry => ({
  id: createDisciplineId(),
  discipline: entry.discipline,
  belt: entry.belt,
});

export default function StudentProfile() {
  const { profile, isLoading, error: loadError, refresh } = useProfile();
  const { t } = useTranslation();
  const { user, refreshAuth } = useAuth();
  void user; // Acknowledge unused variable
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [disciplines, setDisciplines] = useState<DisciplineEntry[]>([toDisciplineEntry({ discipline: '', belt: '' })]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: t('profile.tabs.personal', 'Personal Info'), icon: User },
    { id: 'notifications', label: t('profile.tabs.notifications', 'Notifications'), icon: Bell },
    { id: 'appearance', label: t('profile.tabs.appearance', 'Appearance'), icon: Palette },
  ];

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      const initialDisciplines = profile.disciplines
        ? profile.disciplines
        : (profile.discipline && profile.belt ? [{ discipline: profile.discipline, belt: profile.belt }] : [{ discipline: '', belt: '' }]);
      setDisciplines(initialDisciplines.map(toDisciplineEntry));
      reset({
        name: profile.name,
        phone: profile.phone || '',
        disciplines: initialDisciplines,
        date_of_birth: profile.date_of_birth || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        notes: profile.notes || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('accessToken');
      const cleanedDisciplines = disciplines.map(({ discipline, belt }) => ({ discipline, belt }));
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, disciplines: cleanedDisciplines }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await refresh();
      await refreshAuth();

      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setSaveError(null);

    const prepared = await prepareAvatarFile(file, {
      invalidType: t('profile.avatarInvalidType', 'Invalid file type. Only JPG, PNG, GIF, WebP, AVIF, and HEIC/HEIF are allowed.'),
      tooLarge: t('profile.avatarTooLarge', 'File too large. Maximum size is 5MB.'),
      conversionFailed: t('profile.avatarConversionFailed', 'Could not process this image. Please try a JPG or PNG.')
    });

    if (!prepared.ok || !prepared.file) {
      setSaveError(prepared.error || t('profile.avatarUploadError', 'Failed to process the image.'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setAvatarUploading(true);

    const formData = new FormData();
    formData.append('avatar', prepared.file);
    formData.append('studentId', profile.id);

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

      // Refresh dashboard data (profile)
      await refresh();
      
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

  const addDiscipline = () => {
    setDisciplines((prev) => [...prev, toDisciplineEntry({ discipline: '', belt: '' })]);
  };

  const removeDiscipline = (id: string) => {
    if (disciplines.length > 1) {
      setDisciplines((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const updateDiscipline = (id: string, field: 'discipline' | 'belt', value: string) => {
    setDisciplines((prev) => prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-white font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="card bg-red-900/20 border border-red-500/30 max-w-md">
          <div className="card-body text-center">
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h2 className="card-title text-error justify-center mb-2">{t('profile.errorLoadingProfile', 'Error Loading Profile')}</h2>
            <p className="text-error/80 mb-4">{loadError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-error"
            >
              {t('profile.retry', 'Retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-red-400" />
            {t('profile.title', 'My Profile & Settings')}
          </h1>
          <p className="text-gray-400">{t('profile.subtitle', 'Manage your personal information and preferences')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2">
              <ul className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        {/* Avatar Section */}
                        <div className="relative mb-6">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-gray-700">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <span>{profile?.name ? getInitials(profile.name) : <User className="w-12 h-12" />}</span>
                            )}
                            {avatarUploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                <Loader2 className="w-8 h-8 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={handleAvatarClick}
                            disabled={avatarUploading}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-focus transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </div>

                        {/* Profile Info */}
                        <h2 className="text-2xl font-bold text-white mb-1">{profile?.name}</h2>
                        <div className="text-gray-400 mb-4">
                          {disciplines.length > 0 ? disciplines.map((d) => (
                            <div key={d.id}>{d.discipline} - {d.belt}</div>
                          )) : t('profile.noDisciplinesSet', 'No disciplines set')}
                        </div>

                        {/* Quick Stats */}
                        <div className="w-full space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-blue-400" />
                              <span className="text-sm text-gray-300">{t('profile.memberSince', 'Member since')}</span>
                            </div>
                            <span className="text-sm font-medium text-white">
                              {profile?.join_date ? new Date(profile.join_date).getFullYear() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Activity className="w-5 h-5 text-green-400" />
                              <span className="text-sm text-gray-300">{t('profile.status', 'Status')}</span>
                            </div>
                            <span className="text-sm font-medium text-green-400">{t('profile.active', 'Active')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {t('profile.personalInfo', 'Personal Information')}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-300 mb-2">
                              {t('profile.fullName', 'Full Name')}
                            </label>
                            <Input
                              id="profile-name"
                              {...register('name')}
                              className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                              placeholder="Enter your full name"
                            />
                            {errors.name && (
                              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="profile-email" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                              <Mail className="w-4 h-4" />
                              {t('profile.email', 'Email')}
                            </label>
                            <Input
                              id="profile-email"
                              value={profile?.email || ''}
                              disabled
                              className="bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                          </div>

                          <div>
                            <label htmlFor="profile-phone" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                              <Phone className="w-4 h-4" />
                              {t('profile.phone', 'Phone')}
                            </label>
                            <Input
                              id="profile-phone"
                              {...register('phone')}
                              className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                              placeholder="(555) 123-4567"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <div className="block text-sm font-medium text-gray-300 mb-2">
                              {t('profile.disciplines', 'Disciplines')}
                            </div>
                            <div className="space-y-3">
                              {disciplines.map((disc) => (
                                <div key={disc.id} className="flex gap-3 items-end">
                                  <div className="flex-1">
                                    <label htmlFor={`discipline-${disc.id}`} className="block text-xs font-medium text-gray-400 mb-1">
                                      {t('profile.discipline', 'Discipline')}
                                    </label>
                                    <select
                                      id={`discipline-${disc.id}`}
                                      value={disc.discipline}
                                      onChange={(e) => updateDiscipline(disc.id, 'discipline', e.target.value)}
                                      className="select select-bordered bg-gray-700 border-gray-600 text-white focus:border-primary w-full"
                                    >
                                      <option value="">{t('common.select', 'Select')}</option>
                                      <option value="BJJ">BJJ</option>
                                      <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                                      <option value="Karate">Karate</option>
                                      <option value="Muay Thai">Muay Thai</option>
                                      <option value="Boxing">Boxing</option>
                                      <option value="Fitness">Fitness</option>
                                      <option value="Musculación">Musculación</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div className="flex-1">
                                    <label htmlFor={`belt-${disc.id}`} className="block text-xs font-medium text-gray-400 mb-1">
                                      {t('profile.belt', 'Belt/Rank')}
                                    </label>
                                    <select
                                      id={`belt-${disc.id}`}
                                      value={disc.belt}
                                      onChange={(e) => updateDiscipline(disc.id, 'belt', e.target.value)}
                                      className="select select-bordered bg-gray-700 border-gray-600 text-white focus:border-primary w-full"
                                    >
                                      <option value="">{t('common.select', 'Select')}</option>
                                      {disc.discipline === 'BJJ' || disc.discipline === 'Jiu-Jitsu' ? (
                                        <>
                                          <option value="white">{t('belts.white')}</option>
                                          <option value="blue">{t('belts.blue')}</option>
                                          <option value="purple">{t('belts.purple')}</option>
                                          <option value="brown">{t('belts.brown')}</option>
                                          <option value="black">{t('belts.black')}</option>
                                        </>
                                      ) : disc.discipline === 'Musculación' || disc.discipline === 'Fitness' ? (
                                        <>
                                          <option value="beginner">{t('studentForm.belts.beginner')}</option>
                                          <option value="intermediate">{t('studentForm.belts.intermediate')}</option>
                                          <option value="advanced">{t('studentForm.belts.advanced')}</option>
                                          <option value="expert">{t('studentForm.belts.expert')}</option>
                                        </>
                                      ) : (
                                        <option value="other">Other</option>
                                      )}
                                    </select>
                                  </div>
                                  {disciplines.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDiscipline(disc.id)}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                                    >
                                      {t('profile.remove', 'Remove')}
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={addDiscipline}
                                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-focus hover:to-secondary-focus text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2"
                              >
                                <span>+</span>
                                {t('profile.addDiscipline', 'Add Discipline')}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="border-t border-gray-700 pt-6">
                          <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-yellow-400" />
                            {t('profile.emergencyContact', 'Emergency Contact')}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label htmlFor="emergency-contact-name" className="block text-sm font-medium text-gray-300 mb-2">
                                {t('profile.emergencyName', 'Contact Name')}
                              </label>
                              <Input
                                id="emergency-contact-name"
                                {...register('emergency_contact_name')}
                                className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                                placeholder="Emergency contact name"
                              />
                            </div>
                            <div>
                              <label htmlFor="emergency-contact-phone" className="block text-sm font-medium text-gray-300 mb-2">
                                {t('profile.emergencyPhone', 'Contact Phone')}
                              </label>
                              <Input
                                id="emergency-contact-phone"
                                {...register('emergency_contact_phone')}
                                className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="border-t border-gray-700 pt-6">
                          <label htmlFor="profile-notes" className="block text-sm font-medium text-gray-300 mb-2">
                            {t('profile.notes', 'Additional Notes')}
                          </label>
                          <textarea
                            id="profile-notes"
                            {...register('notes')}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            rows={4}
                            placeholder="Any additional information..."
                          />
                        </div>

                        {/* Error/Success Messages */}
                        {saveError && (
                          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{saveError}</p>
                          </div>
                        )}

                        {saveSuccess && (
                          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                            <p className="text-green-400 text-sm">{t('profile.updatedSuccessfully', 'Profile updated successfully!')}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary-focus hover:to-secondary-focus text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('common.saving', 'Saving...')}
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                {t('profile.saveChanges', 'Save Changes')}
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => reset()}
                            className="flex-1 border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {t('profile.cancel', 'Cancel')}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && <NotificationSettings />}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && <AppearanceSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
