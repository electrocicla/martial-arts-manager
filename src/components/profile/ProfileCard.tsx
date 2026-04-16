import { useRef } from 'react';
import { User, Activity, Camera, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { useTranslation } from 'react-i18next';

interface ProfileCardProps {
  name?: string;
  avatarUrl?: string;
  joinDate?: string;
  disciplines: Array<{ id: string; discipline: string; belt: string }>;
  avatarUploading: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileCard({
  name,
  avatarUrl,
  joinDate,
  disciplines,
  avatarUploading,
  onAvatarChange,
}: ProfileCardProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (n: string) => {
    return n.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar Section */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-gray-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{name ? getInitials(name) : <User className="w-12 h-12" />}</span>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-lg shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif"
              onChange={onAvatarChange}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
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
                {joinDate ? new Date(joinDate).getFullYear() : 'N/A'}
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
  );
}
