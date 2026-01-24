/**
 * PendingApprovalPage - Shown to users whose accounts are pending approval
 * Mobile + Desktop responsive
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Clock, Info, Mail, RefreshCw } from 'lucide-react';

export default function PendingApprovalPage() {
  const navigate = useNavigate();

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
            Account pending approval
          </h1>

          <div className="space-y-4 text-gray-300">
            <p className="text-center">
              Your account has been created successfully, but it must be approved by an administrator or instructor before you can access the system.
            </p>

            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                What is next
              </h2>
              <ul className="text-sm space-y-2 ml-7">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>An administrator will review your request soon</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You will receive an email when your account is approved</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You can sign in once your account is approved</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
              <h2 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Need help
              </h2>
              <p className="text-sm text-blue-200">
                If you have questions or need to speed up the process, contact the gym administrator directly.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleBackToLogin}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to login
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Check status
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Hamarr Martial Arts Manager © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
