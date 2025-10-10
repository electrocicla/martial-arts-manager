import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  greeting: string;
}

export default function DashboardHeader({ greeting }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-base-200/50 to-base-300/30 px-4 sm:px-6 pt-4 pb-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-primary/10 rounded-full filter blur-2xl" />
      <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-secondary/10 rounded-full filter blur-2xl" />

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-base-content leading-tight">
            {greeting}, <span className="text-primary font-black">Sensei {user?.name?.split(' ')[0] || 'Master'}!</span>
          </h1>
          <p className="text-base-content/70 text-sm sm:text-base">
            Here's what's happening at your dojo today
          </p>
        </div>
      </div>
    </div>
  );
}