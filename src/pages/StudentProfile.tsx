import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, AlertCircle, Save, Shield, Activity, Camera, Loader2 } from 'lucide-react';
import { useStudentDashboardData } from '../hooks/useStudentDashboardData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function StudentProfile() {
  const { profile, isLoading, error: loadError, refresh } = useStudentDashboardData();
  const { t } = useTranslation();
  const { user, refreshAuth } = useAuth();
  void user; // Acknowledge unused variable
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      reset({
        name: profile.name,
        phone: profile.phone || '',
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
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

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
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-white">{t('common.loading')}</div>;
  }

  if (loadError) {
    return <div className="p-8 text-center text-red-500">{loadError}</div>;
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-gray-400">Manage your personal information</p>
          </div>
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden border-2 border-transparent group-hover:border-red-400 transition-all">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </div>
        </div>

        {/* Read-only Info Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Martial Arts Info</h2>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-black/40 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 uppercase">Belt Rank</p>
              <p className="text-lg font-bold text-white">{profile?.belt}</p>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 uppercase">Discipline</p>
              <p className="text-lg font-bold text-white">{profile?.discipline}</p>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <p className="text-lg font-bold text-white">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Personal Details</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-400">{saveError}</p>
                </div>
              )}
              
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                  <Save className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-400">Profile updated successfully!</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  {...register('name')}
                  label="Full Name"
                  error={errors.name?.message}
                  disabled={isSaving}
                />
                
                <Input
                  {...register('phone')}
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                  error={errors.phone?.message}
                  disabled={isSaving}
                />

                <Input
                  {...register('date_of_birth')}
                  type="date"
                  label="Date of Birth"
                  error={errors.date_of_birth?.message}
                  disabled={isSaving}
                />
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    {...register('emergency_contact_name')}
                    label="Contact Name"
                    error={errors.emergency_contact_name?.message}
                    disabled={isSaving}
                  />
                  
                  <Input
                    {...register('emergency_contact_phone')}
                    label="Contact Phone"
                    error={errors.emergency_contact_phone?.message}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
