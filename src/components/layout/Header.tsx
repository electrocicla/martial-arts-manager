import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-3 sm:px-4 py-3 sm:py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden text-white hover:bg-white/10 p-2"
          leftIcon={<Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
        >
          <span className="sr-only sm:not-sr-only text-xs">Menu</span>
        </Button>

        {/* Logo/Title */}
        <div className="flex-1 md:flex-none md:mx-auto">
          <Link to="/" className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            HAMMAR Manager
          </Link>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Avatar
              fallback={user?.name?.charAt(0).toUpperCase()}
              size="sm"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name}
            </span>
          </div>

          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <User className="w-4 h-4" />
            </Button>

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role}
                  </p>
                </div>

                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}