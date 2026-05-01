import { useEffect, useState } from 'react';
import { X, Clock, MapPin, User } from 'lucide-react';
import type { Class as ClassType } from '../../types';
import { classService } from '../../services/class.service';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Modal } from '../ui/Modal';

type CommentRecord = { id: string; comment: string; author_id: string; created_at: string };
type RecurrencePattern = { frequency?: string; days?: number[]; endDate?: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cls: ClassType | null;
}

export default function ClassDetailsModal({ isOpen, onClose, cls }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [newComment, setNewComment] = useState('');
  const { isAuthenticated, refreshAuth, user } = useAuth();
  const canManageComments = user?.role === 'admin' || user?.role === 'instructor';

  useEffect(() => {
    if (!isOpen || !cls || !canManageComments) {
      setComments([]);
      return;
    }

    (async () => {
      const res = await classService.getComments(cls.id);
      if (res.success && res.data) setComments(res.data as CommentRecord[]);
    })();
  }, [isOpen, cls, canManageComments]);

  const handleAdd = async () => {
    if (!cls || !newComment.trim() || !canManageComments) return;

    // Require authentication
    if (!isAuthenticated) {
      toast.error(t('classDetails.loginRequired') || 'Please log in to add comments');
      // Optionally redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      let res = await classService.addComment(cls.id, newComment.trim());
      // If auth error, try refresh once and retry
      if (!res.success && res.error && (res.error.includes('401') || /authorization/i.test(res.error))) {
        const refreshed = await refreshAuth();
        if (refreshed) {
          res = await classService.addComment(cls.id, newComment.trim());
        }
      }

      if (res.success && res.data) {
        setComments(prev => [res.data as CommentRecord, ...prev]);
        setNewComment('');
      } else {
        // Show server error
        const msg = res.error || t('classDetails.addFailed') || 'Failed to add comment';
        toast.error(msg);
      }
    } catch (error) {
      console.error('[Add Comment Error]', error);
      toast.error(t('classDetails.addFailed') || 'Failed to add comment');
    }
  };

  if (!isOpen || !cls) return null;

  // parse recurrence pattern if present and format it into human-friendly text
  let recurrence: string | null = null;
  try {
    if (cls.recurrence_pattern) {
      const parsed = JSON.parse(cls.recurrence_pattern) as RecurrencePattern;

      const locale = i18n?.language || navigator.language || 'en-US';

      function weekdayName(dayNum: number) {
        // Use a fixed week where Sunday is day 0 (2022-01-02 is a Sunday)
        const base = new Date(Date.UTC(2022, 0, 2)); // Sunday
        const d = new Date(base.getTime() + dayNum * 24 * 60 * 60 * 1000);
        return d.toLocaleDateString(locale, { weekday: 'short' });
      }

      if (parsed.frequency === 'weekly' && Array.isArray(parsed.days) && parsed.days.length > 0) {
        const dayNames = parsed.days.map(d => weekdayName(d));
        const until = parsed.endDate ? ` — ${new Date(parsed.endDate).toLocaleDateString(locale)}` : '';
        recurrence = `${t('classForm.recurrence') || 'Recurrencia'}: ${dayNames.join(', ')}${until}`;
      } else {
        recurrence = typeof cls.recurrence_pattern === 'string' ? cls.recurrence_pattern : null;
      }
    }
  } catch {
    recurrence = typeof cls.recurrence_pattern === 'string' ? cls.recurrence_pattern : null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">{cls.name}</h3>
            <p className="text-sm text-gray-400">{cls.discipline}</p>
          </div>
          <IconButton onClick={onClose} variant="ghost" size="sm" shape="circle" aria-label="Close">
            <X className="w-4 h-4"/>
          </IconButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300"><Clock className="w-4 h-4 text-blue-400"/> {cls.date} {cls.time}</div>
            <div className="flex items-center gap-2 text-sm text-gray-300"><MapPin className="w-4 h-4 text-green-400"/> {cls.location}</div>
            <div className="flex items-center gap-2 text-sm text-gray-300"><User className="w-4 h-4 text-purple-400"/> {cls.instructor}</div>
          </div>
          <div className="text-sm text-gray-300">
            <div className="font-semibold text-gray-400 mb-1">{t('classForm.description') || 'Descripción'}</div>
            <div className="text-sm text-gray-200 whitespace-pre-wrap">{cls.description || t('classForm.noDescription') || 'Sin descripción'}</div>
          </div>
        </div>

        {recurrence && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/40 text-sm text-gray-300">
            <div className="font-semibold text-gray-400">{t('classForm.recurrence') || 'Recurrencia'}</div>
            <div className="text-sm">{recurrence}</div>
          </div>
        )}

        {canManageComments && (
          <div className="mb-4">
            <h4 className="font-semibold text-white mb-2">{t('classDetails.comments') || 'Comentarios'}</h4>
            <div className="space-y-2 mb-3">
              <textarea placeholder={t('classDetails.commentPlaceholder') || ''} value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="textarea textarea-bordered w-full bg-gray-800 border-gray-700 text-white" rows={3} />
              <div className="flex justify-end gap-2">
                <Button variant="primary" size="sm" onClick={handleAdd}>{t('classDetails.addComment') || 'Agregar'}</Button>
              </div>
            </div>

            <div className="space-y-2">
              {comments.length === 0 && <div className="text-sm text-gray-400">{t('classDetails.noComments') || 'No hay comentarios'}</div>}
              {comments.map(c => (
                <div key={c.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/40">
                  <div className="text-sm text-gray-200 whitespace-pre-wrap">{c.comment}</div>
                  <div className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
