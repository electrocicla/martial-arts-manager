import { AlertTriangle } from 'lucide-react';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isProcessing?: boolean;
  requireTyping?: string[]; // accepted words: e.g. ['delete','borrar']
}

export default function ConfirmModal({ isOpen, title = 'Confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, isProcessing = false, requireTyping }: Props) {
  const [typed, setTyped] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        {/* Actions - if requireTyping is provided show input and require typed confirmation */}
        {Array.isArray(requireTyping) && requireTyping.length > 0 ? (
          <div className="space-y-3">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTyping.length > 1 ? `Escribe '${requireTyping[0]}' o '${requireTyping[1]}'` : `Escribe '${requireTyping[0]}'`}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 transition-all duration-200"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                disabled={isProcessing}
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => void onConfirm()}
                disabled={isProcessing || !requireTyping.map(s => s.toLowerCase()).includes(typed.trim().toLowerCase())}
                className="flex-1 px-6 py-3 text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg focus:ring-2 focus:ring-red-500 transition-all duration-200 font-medium"
              >
                {isProcessing ? 'Procesando...' : confirmLabel}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              disabled={isProcessing}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => void onConfirm()}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg focus:ring-2 focus:ring-red-500 transition-all duration-200 font-medium"
            >
              {isProcessing ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
