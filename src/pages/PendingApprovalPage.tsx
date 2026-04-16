/**
 * PendingApprovalPage - Shown to users whose accounts are pending approval
 * Mobile + Desktop responsive
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, Info, Mail, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Clear any stored tokens since user is not approved
    localStorage.removeItem('accessToken');
  }, []);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-yellow-900 p-4">
            <Clock className="h-12 w-12 text-yellow-400" />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 border border-gray-700">
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            {t('pendingApproval.title')}
          </h1>

          <div className="space-y-4 text-gray-300">
            <p className="text-center">
              {t('pendingApproval.description')}
            </p>

            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                {t('pendingApproval.whatIsNext')}
              </h2>
              <ul className="text-sm space-y-2 ml-7">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{t('pendingApproval.adminWillReview')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{t('pendingApproval.emailNotification')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{t('pendingApproval.canSignIn')}</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
              <h2 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('pendingApproval.needHelp')}
              </h2>
              <p className="text-sm text-blue-200">
                {t('pendingApproval.contactAdmin')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBackToLogin}
            >
              {t('pendingApproval.backToLogin')}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<RefreshCw className="h-5 w-5" />}
              onClick={() => window.location.reload()}
            >
              {t('pendingApproval.checkStatus')}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {t('pendingApproval.footer')} © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
