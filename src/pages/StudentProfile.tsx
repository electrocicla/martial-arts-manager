import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Calendar,
  ClipboardCheck,
  Image as ImageIcon,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { apiClient } from '../lib/api-client';
import { prepareAvatarFile } from '../lib/avatarUpload';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import ProfileCard from '../components/profile/ProfileCard';
import ProfileCompletionPanel from '../components/profile/ProfileCompletionPanel';
import type { ProfileCompletionItem } from '../components/profile/ProfileCompletionPanel';
import ProfileQuickLinks from '../components/profile/ProfileQuickLinks';
import TrainingSummaryPanel from '../components/profile/TrainingSummaryPanel';
import type { TrainingDisciplineEntry } from '../components/profile/TrainingSummaryPanel';

const profileSchema = z.object({
  name: z.string().min(2, 'profileV2.validation.nameMin'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const createDisciplineId = (discipline: string, belt: string): string => {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === 'function') {
    return randomUUID.call(globalThis.crypto);
  }
  return `${discipline}-${belt}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toDisciplineEntry = (entry: { discipline: string; belt: string }): TrainingDisciplineEntry => ({
  id: createDisciplineId(entry.discipline, entry.belt),
  discipline: entry.discipline,
  belt: entry.belt,
});

const hasText = (value: string | undefined): boolean => Boolean(value?.trim());

export default function StudentProfile() {
  const { profile, isLoading, error: loadError, refresh } = useProfile();
  const { t } = useTranslation();
  const { user, refreshAuth, accessToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [disciplines, setDisciplines] = useState<TrainingDisciplineEntry[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!profile) return;

    const hasAssignedTraining = profile.discipline && profile.belt && profile.discipline !== 'Not assigned' && profile.belt !== 'Not assigned';
    const initialDisciplines = profile.disciplines && profile.disciplines.length > 0
      ? profile.disciplines
      : (hasAssignedTraining ? [{ discipline: profile.discipline, belt: profile.belt }] : []);

    setDisciplines(initialDisciplines.map(toDisciplineEntry));
    reset({
      name: profile.name,
      phone: profile.phone || '',
      date_of_birth: profile.date_of_birth || '',
      emergency_contact_name: profile.emergency_contact_name || '',
      emergency_contact_phone: profile.emergency_contact_phone || '',
      notes: profile.notes || '',
    });
  }, [profile, reset]);

  const completionItems = useMemo<ProfileCompletionItem[]>(() => {
    const emergencyComplete = hasText(profile?.emergency_contact_name) && hasText(profile?.emergency_contact_phone);
    const trainingComplete = disciplines.some((discipline) => hasText(discipline.discipline) && hasText(discipline.belt));

    return [
      {
        id: 'photo',
        label: t('profileV2.readiness.items.photo.label', 'Profile photo'),
        description: t('profileV2.readiness.items.photo.description', 'Helps instructors identify members quickly.'),
        complete: Boolean(profile?.avatar_url),
        icon: ImageIcon,
      },
      {
        id: 'name',
        label: t('profileV2.readiness.items.name.label', 'Full name'),
        description: t('profileV2.readiness.items.name.description', 'Used across rosters, attendance, and payment records.'),
        complete: hasText(profile?.name),
        icon: User,
      },
      {
        id: 'email',
        label: t('profileV2.readiness.items.email.label', 'Email address'),
        description: t('profileV2.readiness.items.email.description', 'Required for account access and app notifications.'),
        complete: hasText(profile?.email),
        icon: Mail,
      },
      {
        id: 'phone',
        label: t('profileV2.readiness.items.phone.label', 'Phone number'),
        description: t('profileV2.readiness.items.phone.description', 'Useful for class changes and urgent coordination.'),
        complete: hasText(profile?.phone),
        icon: Phone,
      },
      {
        id: 'emergency',
        label: t('profileV2.readiness.items.emergency.label', 'Emergency contact'),
        description: t('profileV2.readiness.items.emergency.description', 'Must be available before higher-risk training sessions.'),
        complete: emergencyComplete,
        icon: Shield,
      },
      {
        id: 'training',
        label: t('profileV2.readiness.items.training.label', 'Training assignment'),
        description: t('profileV2.readiness.items.training.description', 'Discipline and rank are maintained by staff.'),
        complete: trainingComplete,
        icon: ClipboardCheck,
      },
    ];
  }, [disciplines, profile, t]);

  const completionPercentage = useMemo(() => {
    const completedCount = completionItems.filter((item) => item.complete).length;
    return completionItems.length > 0 ? Math.round((completedCount / completionItems.length) * 100) : 0;
  }, [completionItems]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await apiClient.put<{ success: boolean }>('/api/account/profile', data);
      if (!response.success) {
        throw new Error(response.error || t('profileV2.errors.updateFailed', 'Failed to update profile'));
      }

      await refresh();
      refreshAuth().catch((error) => console.warn('Failed to refresh auth after profile update:', error));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const canUploadAvatar = user?.role === 'student' && Boolean(profile);
    if (!file || !profile || !canUploadAvatar) return;

    setSaveError(null);

    const prepared = await prepareAvatarFile(file, {
      invalidType: t('profile.avatarInvalidType', 'Invalid file type. Only JPG, PNG, GIF, WebP, AVIF, and HEIC/HEIF are allowed.'),
      tooLarge: t('profile.avatarTooLarge', 'File too large. Maximum size is 5MB.'),
      conversionFailed: t('profile.avatarConversionFailed', 'Could not process this image. Please try a JPG or PNG.'),
    });

    if (!prepared.ok || !prepared.file) {
      setSaveError(prepared.error || t('profile.avatarUploadError', 'Failed to process the image.'));
      event.target.value = '';
      return;
    }

    if (!accessToken) {
      setSaveError(t('profileV2.errors.noAuthToken', 'No authentication token available'));
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('avatar', prepared.file);
    formData.append('studentId', profile.id);

    setAvatarUploading(true);
    try {
      const response = await fetch('/api/students/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || t('profileV2.errors.avatarUploadFailed', 'Failed to upload avatar'));
      }

      await refresh();
      refreshAuth().catch((error) => console.warn('Failed to refresh auth after avatar upload:', error));
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="font-medium text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md rounded-lg border border-red-500/30 bg-red-900/20 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-error" />
          <h2 className="mb-2 text-xl font-semibold text-error">{t('profile.errorLoadingProfile', 'Error Loading Profile')}</h2>
          <p className="mb-4 text-error/80">{loadError}</p>
          <Button variant="danger" size="md" onClick={() => window.location.reload()}>
            {t('profile.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  const canUploadAvatar = user?.role === 'student' && Boolean(profile);

  return (
    <div className="min-h-screen bg-gray-900 pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
            <User className="h-8 w-8 text-red-400" />
            {t('profile.title', 'My Profile')}
          </h1>
          <p className="text-gray-400">{t('profileV2.subtitle', 'Personal, emergency, and training identity details for your account.')}</p>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <aside className="space-y-6 xl:col-span-4">
            <ProfileCard
              name={profile?.name}
              email={profile?.email}
              avatarUrl={profile?.avatar_url}
              joinDate={profile?.join_date}
              disciplines={disciplines}
              avatarUploading={avatarUploading}
              canUploadAvatar={canUploadAvatar}
              completionPercentage={completionPercentage}
              onAvatarChange={handleAvatarChange}
            />
            <ProfileCompletionPanel items={completionItems} />
            <ProfileQuickLinks role={user?.role} />
          </aside>

          <section className="space-y-6 xl:col-span-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <User className="h-5 w-5" />
                  {t('profileV2.form.personalInformation', 'Personal information')}
                </h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-300">
                        {t('profile.fullName', 'Full name')}
                      </label>
                      <Input
                        id="profile-name"
                        {...register('name')}
                        className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                        placeholder={t('registerPage.fullNamePlaceholder', 'Enter your full name')}
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-400">{t(errors.name.message || 'profileV2.validation.nameMin', 'Name must be at least 2 characters')}</p>}
                    </div>

                    <div>
                      <label htmlFor="profile-email" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Mail className="h-4 w-4" />
                        {t('profile.email', 'Email')}
                      </label>
                      <Input
                        id="profile-email"
                        value={profile?.email || ''}
                        disabled
                        className="cursor-not-allowed bg-gray-700/50 border-gray-600 text-gray-400"
                      />
                      <p className="mt-1 text-xs text-gray-500">{t('profileV2.form.emailSupportNote', 'Email changes require staff support.')}</p>
                    </div>

                    <div>
                      <label htmlFor="profile-phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Phone className="h-4 w-4" />
                        {t('profile.phone', 'Phone')}
                      </label>
                      <Input
                        id="profile-phone"
                        {...register('phone')}
                        className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="profile-date-of-birth" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Calendar className="h-4 w-4" />
                        {t('profile.dob', 'Date of birth')}
                      </label>
                      <Input
                        id="profile-date-of-birth"
                        type="date"
                        {...register('date_of_birth')}
                        className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
                      <Shield className="h-5 w-5 text-yellow-400" />
                      {t('profile.emergencyContact', 'Emergency contact')}
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="emergency-contact-name" className="mb-2 block text-sm font-medium text-gray-300">
                          {t('profile.emergencyName', 'Contact name')}
                        </label>
                        <Input
                          id="emergency-contact-name"
                          {...register('emergency_contact_name')}
                          className="bg-gray-700 border-gray-600 text-white focus:border-primary"
                          placeholder={t('profileV2.form.emergencyNamePlaceholder', 'Emergency contact name')}
                        />
                      </div>
                      <div>
                        <label htmlFor="emergency-contact-phone" className="mb-2 block text-sm font-medium text-gray-300">
                          {t('profile.emergencyPhone', 'Contact phone')}
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

                  <div className="border-t border-gray-700 pt-6">
                    <label htmlFor="profile-notes" className="mb-2 block text-sm font-medium text-gray-300">
                      {t('profileV2.form.trainingNotes', 'Training notes')}
                    </label>
                    <textarea
                      id="profile-notes"
                      {...register('notes')}
                      className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                      placeholder={t('profileV2.form.trainingNotesPlaceholder', 'Allergies, injuries, goals, or other details staff should know.')}
                    />
                  </div>

                  {saveError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4" aria-live="assertive">
                      <p className="text-sm text-red-400">{saveError}</p>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="rounded-lg border border-green-500/30 bg-green-900/20 p-4" aria-live="polite">
                      <p className="text-sm text-green-400">{t('profileV2.form.success', 'Profile updated successfully.')}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-gray-700 pt-6 sm:flex-row">
                    <Button type="submit" disabled={isSaving} fullWidth>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t('common.saving', 'Saving...')}
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          {t('profileV2.form.saveProfile', 'Save profile')}
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => reset()} fullWidth>
                      {t('profile.cancel', 'Cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <TrainingSummaryPanel disciplines={disciplines} />
          </section>
        </div>
      </div>
    </div>
  );
}
