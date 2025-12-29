import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Menu, User, LogOut, 
  Settings, Clock, Users, Calendar, Home, ChevronDown,
  CreditCard, BarChart3, Award
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };



  return (
    <>
      {/* Mobile Header - Static Design */}
      {/* Mobile Header - Optimized Layout */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 md:hidden">
        {/* Left: Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Logo and Title - Clickeable */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <h1 className="text-xl font-bold text-white">{t('common.appName')}</h1>
        </button>

        {/* Right: User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <User className="w-4 h-4 text-gray-300" />
          )}
        </div>
      </header>

      {/* Mobile Slide Menu - Improved */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* User Profile Section - Enhanced */}
          <div className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-b border-base-300">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 h-16 rounded-2xl ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="rounded-2xl" />
                  ) : (
                    <div className="bg-gradient-to-br from-primary to-secondary flex items-center justify-center rounded-2xl">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base-content text-lg truncate">{user?.name || 'User'}</h3>
                <p className="text-base-content/70 text-sm capitalize">{user?.role || 'Member'}</p>
                <div className="badge badge-primary badge-sm mt-1 capitalize">{user?.role || 'Member'}</div>
              </div>
            </div>
          </div>

          {/* Search Bar - Fixed Alignment */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('common.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Menu Items - Fixed Alignment */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">{t('common.navigation')}</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                    className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Home className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                    <span>{t('nav.dashboard')}</span>
                  </button>
                  
                  {user?.role !== 'student' && (
                    <button 
                      onClick={() => { navigate('/students'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Users className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{t('nav.students')}</span>
                    </button>
                  )}

                  {user?.role !== 'student' && (
                    <button 
                      onClick={() => { navigate('/classes'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Calendar className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                      <span>{t('nav.classes')}</span>
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => { navigate('/payments'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span>{t('nav.payments')}</span>
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => { navigate('/analytics'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 text-orange-400 mr-3 flex-shrink-0 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span>{t('nav.analytics')}</span>
                    </button>
                  )}

                  {user?.role !== 'student' && (
                    <button 
                      onClick={() => { navigate('/belt-testing'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <span>{t('nav.beltTesting')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {user?.role !== 'student' && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">{t('dashboard.quickActions.title')}</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => { navigate('/attendance'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Clock className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                      <span>{t('nav.markAttendance')}</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/calendar'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span>{t('nav.calendar')}</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Account */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">{t('common.account')}</h3>
                <div className="space-y-2">
                  {user?.role !== 'student' && (
                    <button 
                      onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                      className="flex items-center w-full p-3 text-left text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <span>{t('nav.settings')}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center w-full p-3 text-left text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>


      {/* Desktop Header */}
      <header className="hidden md:flex h-16 bg-gray-800/95 backdrop-blur-lg border-b border-gray-700/50 items-center px-6 ml-64">
        <div className="flex-1 flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              className="w-96 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* User Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-700/50 p-2 rounded-lg transition-colors focus:outline-none"
            >
              <div className="avatar">
                <div className="w-8 h-8 rounded-full ring-2 ring-gray-700 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="bg-gray-600 flex items-center justify-center w-full h-full">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-200 leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize mt-1">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-gray-700 mb-2">
                    <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  
                  {user?.role === 'student' && (
                    <button
                      onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('nav.profile') || 'My Profile'}
                    </button>
                  )}

                  {user?.role !== 'student' && (
                    <button
                      onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t('nav.settings')}
                    </button>
                  )}

                  <div className="border-t border-gray-700 my-2 pt-2">
                    <button
                      onClick={() => { handleLogout(); setDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('auth.logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
