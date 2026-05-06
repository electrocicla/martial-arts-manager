/**
 * ReadyStudentsPanel — surfaces students whose progression evaluator marks
 * them as ready for the next belt exam. Lets the instructor jump to assign
 * them or log a tournament participation.
 */

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Trophy, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Surface } from '../ui/Surface';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { progressionService, type ReadyStudentRow as ApiReadyStudentRow } from '../../services/progression.service';
import { label } from '../../lib/i18nUtils';
import TournamentLogModal from './TournamentLogModal';
import type { Student } from '../../types/index';

interface ReadyStudentsPanelProps {
  students: Student[];
}

export default function ReadyStudentsPanel({ students }: ReadyStudentsPanelProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ApiReadyStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentModalOpen, setTournamentModalOpen] = useState(false);
  const [defaultStudentId, setDefaultStudentId] = useState<string>('');

  const evaluate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await progressionService.getReadyStudents({ includeAlmost: true });
      if (res.success && res.data) {
        setRows(res.data.students);
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  const openTournamentFor = (studentId: string) => {
    setDefaultStudentId(studentId);
    setTournamentModalOpen(true);
  };

  return (
    <>
      <Section
        title={label(t, 'beltTesting.admin.readyTitle', 'Students approaching next belt')}
        description={label(
          t,
          'beltTesting.admin.readyDesc',
          'Live evaluation across classes, sparring sessions and tournament participations.'
        )}
        icon={<Sparkles className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => evaluate()}
              disabled={loading}
              leftIcon={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            >
              {label(t, 'common.refresh', 'Refresh')}
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={() => openTournamentFor('')}
              leftIcon={<Trophy className="w-3.5 h-3.5" />}
            >
              {label(t, 'tournament.log', 'Log tournament')}
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8" />}
            title={label(t, 'beltTesting.admin.noReady', 'No students close to a promotion yet')}
            description={label(t, 'beltTesting.admin.noReadyDesc', 'Keep tracking attendance and sparring \u2014 the system will surface candidates automatically.')}
          />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map(row => {
              const { progression } = row;
              const isReady = progression.readyForExam;
              return (
                <li key={row.id}>
                  <Surface
                    variant="raised"
                    radius="md"
                    className={`p-4 border ${isReady ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/30'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={row.avatar_url ?? undefined} alt={row.name} fallback={(row.name?.[0] ?? '?').toUpperCase()} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base-content truncate">{row.name}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                            isReady
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isReady
                              ? label(t, 'beltTesting.admin.ready', 'Ready')
                              : label(t, 'beltTesting.admin.almost', 'Almost')}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/60 mt-0.5">
                          {progression.currentBelt}
                          {progression.nextBelt && (
                            <>
                              {' → '}
                              <span className="text-emerald-400 font-semibold">{progression.nextBelt}</span>
                            </>
                          )}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-base-content/50">
                              {label(t, 'beltTesting.student.classes', 'Classes')}
                            </p>
                            <p className="tabular-nums font-bold text-base-content">
                              {progression.attended.classes}/{progression.requirements.classes}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-base-content/50">
                              {label(t, 'beltTesting.student.sparring', 'Sparring')}
                            </p>
                            <p className="tabular-nums font-bold text-base-content">
                              {progression.attended.sparrings}/{progression.requirements.sparrings}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-base-content/50">
                              {label(t, 'beltTesting.student.tournaments', 'Tournaments')}
                            </p>
                            <p className="tabular-nums font-bold text-base-content/80">
                              {progression.attended.tournaments}/{progression.requirements.tournaments}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-3">
                          <span className="text-2xl font-black text-amber-300 tabular-nums leading-none">
                            {progression.percent.overall}%
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTournamentFor(row.id)}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {label(t, 'tournament.add', 'Add tournament')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Surface>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <TournamentLogModal
        isOpen={tournamentModalOpen}
        onClose={() => setTournamentModalOpen(false)}
        students={students}
        defaultStudentId={defaultStudentId}
        onLogged={() => void evaluate()}
      />
    </>
  );
}
