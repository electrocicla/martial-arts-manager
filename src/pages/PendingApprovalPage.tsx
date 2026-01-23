/**
 * PendingApprovalPage - Shown to users whose accounts are pending approval
 * Mobile + Desktop responsive
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
            <svg
              className="h-12 w-12 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 border border-gray-700">
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            Cuenta Pendiente de Aprobación
          </h1>

          <div className="space-y-4 text-gray-300">
            <p className="text-center">
              Tu cuenta ha sido creada exitosamente, pero necesita ser aprobada por un administrador o instructor antes de que puedas acceder al sistema.
            </p>

            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¿Qué sigue?
              </h2>
              <ul className="text-sm space-y-2 ml-7">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Un administrador revisará tu solicitud pronto</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Recibirás un correo electrónico cuando tu cuenta sea aprobada</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Podrás iniciar sesión una vez aprobada</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
              <h2 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ¿Necesitas ayuda?
              </h2>
              <p className="text-sm text-blue-200">
                Si tienes preguntas o necesitas acelerar el proceso, contacta directamente al administrador del gimnasio.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleBackToLogin}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Volver al Login
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verificar Estado
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
