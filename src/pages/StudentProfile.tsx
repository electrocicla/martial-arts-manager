import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, AlertCircle, Save, Shield, Activity, Camera, Loader2, Mail, Phone, Calendar } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

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

export default function StudentProfile() {
  const { profile, isLoading, error: loadError, refresh } = useProfile();
  const { t } = useTranslation();
  const { user, refreshAuth } = useAuth();
  void user; // Acknowledge unused variable
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [disciplines, setDisciplines] = useState<{ discipline: string; belt: string }[]>([{ discipline: '', belt: '' }]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const initialDisciplines = profile.disciplines ? profile.disciplines : (profile.discipline && profile.belt ? [{ discipline: profile.discipline, belt: profile.belt }] : [{ discipline: '', belt: '' }]);
      setDisciplines(initialDisciplines);
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
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, disciplines }),
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
    setDisciplines([...disciplines, { discipline: '', belt: '' }]);
  };

  const removeDiscipline = (index: number) => {
    if (disciplines.length > 1) {
      setDisciplines(disciplines.filter((_, i) => i !== index));
    }
  };

  const updateDiscipline = (index: number, field: 'discipline' | 'belt', value: string) => {
    const newDisciplines = [...disciplines];
    newDisciplines[index][field] = value;
    setDisciplines(newDisciplines);
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
            <h2 className="card-title text-error justify-center mb-2">Error Loading Profile</h2>
            <p className="text-error/80 mb-4">{loadError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-error"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('profile.title', 'My Profile')}</h1>
          <p className="text-gray-400">{t('profile.subtitle', 'Manage your personal information and preferences')}</p>
        </div>

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
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {/* Profile Info */}
                  <h2 className="text-2xl font-bold text-white mb-1">{profile?.name}</h2>
                  <div className="text-gray-400 mb-4">
                    {disciplines.length > 0 ? disciplines.map((d, i) => (
                      <div key={i}>{d.discipline} - {d.belt}</div>
                    )) : 'No disciplines set'}
                  </div>

                  {/* Quick Stats */}
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-300">Member since</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {profile?.join_date ? new Date(profile.join_date).getFullYear() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-300">Status</span>
                      </div>
                      <span className="text-sm font-medium text-green-400">Active</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('profile.fullName', 'Full Name')}
                      </label>
                      <Input
                        {...register('name')}
                        className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t('profile.email', 'Email')}
                      </label>
                      <Input
                        value={profile?.email || ''}
                        disabled
                        className="bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {t('profile.phone', 'Phone')}
                      </label>
                      <Input
                        {...register('phone')}
                        className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('profile.disciplines', 'Disciplines')}
                      </label>
                      <div className="space-y-3">
                        {disciplines.map((disc, index) => (
                          <div key={index} className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                {t('profile.discipline', 'Discipline')}
                              </label>
                              <select
                                value={disc.discipline}
                                onChange={(e) => updateDiscipline(index, 'discipline', e.target.value)}
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
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                {t('profile.belt', 'Belt/Rank')}
                              </label>
                              <select
                                value={disc.belt}
                                onChange={(e) => updateDiscipline(index, 'belt', e.target.value)}
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
                                onClick={() => removeDiscipline(index)}
                                className="btn btn-sm btn-error"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addDiscipline}
                          className="btn btn-sm btn-primary"
                        >
                          Add Discipline
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('profile.emergencyName', 'Contact Name')}
                        </label>
                        <Input
                          {...register('emergency_contact_name')}
                          className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('profile.emergencyPhone', 'Contact Phone')}
                        </label>
                        <Input
                          {...register('emergency_contact_phone')}
                          className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="border-t border-gray-700 pt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('profile.notes', 'Additional Notes')}
                    </label>
                    <textarea
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
                      <p className="text-green-400 text-sm">Profile updated successfully!</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-primary hover:bg-primary-focus text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('common.saving', 'Saving...')}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t('profile.saveChanges', 'Save Changes')}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => reset()}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {t('profile.cancel', 'Cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
