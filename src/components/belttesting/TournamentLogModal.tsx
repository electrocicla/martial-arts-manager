/**
 * TournamentLogModal — instructor form to record a student's tournament participation.
 * Posts to /api/tournaments and triggers progression evaluation server-side.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Save, Loader2 } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { tournamentService } from '../../services/progression.service';
import { useToast } from '../../hooks/useToast';
import { label } from '../../lib/i18nUtils';
import type { Student } from '../../types/index';

const PLACEMENTS: ReadonlyArray<{ value: string; labelText: string }> = [
  { value: '', labelText: 'No placement' },
  { value: '1st', labelText: '1st place' },
  { value: '2nd', labelText: '2nd place' },
  { value: '3rd', labelText: '3rd place' },
  { value: 'finalist', labelText: 'Finalist' },
  { value: 'participant', labelText: 'Participant' },
];

interface TournamentLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  defaultStudentId?: string;
  onLogged?: () => void;
}

export default function TournamentLogModal({
  isOpen,
  onClose,
  students,
  defaultStudentId = '',
  onLogged,
}: TournamentLogModalProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [studentId, setStudentId] = useState<string>(defaultStudentId);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState(today);
  const [placement, setPlacement] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const studentOptions = useMemo(
    () => [
      { value: '', label: label(t, 'tournament.selectStudent', 'Select a student…') },
      ...students.map(s => ({ value: s.id, label: `${s.name} · ${s.belt}` })),
    ],
    [students, t]
  );

  const reset = () => {
    setStudentId(defaultStudentId);
    setTournamentName('');
    setTournamentDate(today);
    setPlacement('');
    setNotes('');
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId || !tournamentName.trim() || !tournamentDate) return;
    setSubmitting(true);
    try {
      const student = students.find(s => s.id === studentId);
      const res = await tournamentService.create({
        student_id: studentId,
        tournament_name: tournamentName.trim(),
        tournament_date: tournamentDate,
        belt_at_time: student?.belt ?? null,
        placement: placement || null,
        notes: notes.trim() || null,
      });
      if (res.success) {
        toast.success(label(t, 'tournament.logged', 'Tournament participation recorded'), tournamentName);
        reset();
        onLogged?.();
        onClose();
      } else {
        toast.error(res.error || label(t, 'tournament.failed', 'Failed to record tournament'));
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={label(t, 'tournament.modalTitle', 'Log tournament participation')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-sm text-base-content/70">
              {label(
                t,
                'tournament.modalDesc',
                'Tournaments contribute toward the student\u2019s belt progression metrics.'
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="tournament-student" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                {label(t, 'tournament.student', 'Student')}
              </label>
              <Select
                id="tournament-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                options={studentOptions}
                required
              />
            </div>
            <div>
              <label htmlFor="tournament-name" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                {label(t, 'tournament.name', 'Tournament name')}
              </label>
              <Input
                id="tournament-name"
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder={label(t, 'tournament.namePlaceholder', 'e.g. Pan Jiu-Jitsu IBJJF 2025')}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tournament-date" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                  {label(t, 'tournament.date', 'Date')}
                </label>
                <Input
                  id="tournament-date"
                  type="date"
                  value={tournamentDate}
                  onChange={(e) => setTournamentDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="tournament-placement" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                  {label(t, 'tournament.placement', 'Placement')}
                </label>
                <Select
                  id="tournament-placement"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  options={PLACEMENTS.map(p => ({ value: p.value, label: p.labelText }))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="tournament-notes" className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2">
                {label(t, 'tournament.notes', 'Notes')}
              </label>
              <textarea
                id="tournament-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-base-200 border border-base-300 px-3 py-2 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder={label(t, 'tournament.notesPlaceholder', 'Optional notes about the performance.')}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            {label(t, 'common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !studentId || !tournamentName.trim()}
            leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {label(t, 'tournament.save', 'Save tournament')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
