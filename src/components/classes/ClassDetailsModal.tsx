import { useEffect, useState } from 'react';
import { X, Clock, MapPin, User } from 'lucide-react';
import type { Class as ClassType } from '../../types';
import { classService } from '../../services/class.service';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cls: ClassType | null;
}

export default function ClassDetailsModal({ isOpen, onClose, cls }: Props) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Array<{id:string;comment:string;author_id:string;created_at:string}>>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!isOpen || !cls) return;
    (async () => {
      const res = await classService.getComments(cls.id);
      if (res.success && res.data) setComments(res.data as any);
    })();
  }, [isOpen, cls]);

  const handleAdd = async () => {
    if (!cls || !newComment.trim()) return;
    const res = await classService.addComment(cls.id, newComment.trim());
    if (res.success && res.data) {
      setComments(prev => [res.data as any, ...prev]);
      setNewComment('');
    } else {
      alert('Failed to add comment');
    }
  };

  if (!isOpen || !cls) return null;

  // parse recurrence pattern if present
  let recurrence: string | null = null;
  try {
    if (cls.recurrence_pattern) {
      const parsed = JSON.parse(cls.recurrence_pattern);
      recurrence = `${parsed.frequency} ${parsed.days ? `days:${parsed.days.join(',')}` : ''} ${parsed.endDate ? `until ${parsed.endDate}` : ''}`;
    }
  } catch (e) {
    recurrence = cls.recurrence_pattern as string | null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">{cls.name}</h3>
            <p className="text-sm text-gray-400">{cls.discipline}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X className="w-4 h-4"/></button>
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

        <div className="mb-4">
          <h4 className="font-semibold text-white mb-2">Comentarios</h4>
          <div className="space-y-2 mb-3">
            <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="textarea textarea-bordered w-full bg-gray-800 border-gray-700 text-white" rows={3} />
            <div className="flex justify-end gap-2">
              <button onClick={handleAdd} className="btn btn-primary">Agregar</button>
            </div>
          </div>

          <div className="space-y-2">
            {comments.length === 0 && <div className="text-sm text-gray-400">No hay comentarios</div>}
            {comments.map(c => (
              <div key={c.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/40">
                <div className="text-sm text-gray-200 whitespace-pre-wrap">{c.comment}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
