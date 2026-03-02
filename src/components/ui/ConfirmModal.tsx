import { AlertTriangle } from 'lucide-react';

import { useState } from 'react';
import { Button } from './Button';

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

  const typingMatch = Array.isArray(requireTyping) && requireTyping.length > 0
    ? requireTyping.map(s => s.toLowerCase()).includes(typed.trim().toLowerCase())
    : true;

  const actionRow = (
    <div className="flex gap-3 mt-6">
      <Button
        variant="secondary"
        size="md"
        fullWidth
        onClick={onCancel}
        disabled={isProcessing}
        type="button"
      >
        {cancelLabel}
      </Button>
      <Button
        variant="danger"
        size="md"
        fullWidth
        onClick={() => void onConfirm()}
        disabled={isProcessing || !typingMatch}
        isLoading={isProcessing}
        type="button"
      >
        {!isProcessing && confirmLabel}
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-gray-900 border border-gray-700/70 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-900/30 border border-red-700/30 rounded-full">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h3 className="text-xl font-bold text-center text-white mb-2">{title}</h3>
        <p className="text-center text-gray-400 text-sm leading-relaxed">{message}</p>

        {Array.isArray(requireTyping) && requireTyping.length > 0 ? (
          <div className="space-y-4 mt-4">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={
                requireTyping.length > 1
                  ? `Type '${requireTyping[0]}' or '${requireTyping[1]}'`
                  : `Type '${requireTyping[0]}' to confirm`
              }
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
            {actionRow}
          </div>
        ) : (
          actionRow
        )}
      </div>
    </div>
  );
}

