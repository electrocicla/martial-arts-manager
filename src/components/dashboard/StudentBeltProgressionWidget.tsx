/**
 * StudentBeltProgressionWidget — compact card for the student dashboard.
 * Fetches `/api/student/progression` and shows current/next belt with the
 * three requirement progress bars.
 */

import { useEffect, useState } from 'react';
import { Award, ArrowRight, GraduationCap, Swords, Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { progressionService } from '../../services/progression.service';
import { label } from '../../lib/i18nUtils';
import type { ProgressionEvaluation } from '../../lib/beltProgression';

interface BarRowProps {
  icon: React.ReactNode;
  text: string;
  current: number;
  required: number;
  color: string;
}

function BarRow({ icon, text, current, required, color }: BarRowProps) {
  const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(1, required)) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-gray-400" aria-hidden="true">{icon}</span>
          {text}
        </span>
        <span className="tabular-nums font-semibold text-gray-200">
          {current.toLocaleString()} / {required.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%`, transition: 'width 600ms ease-out' }}
        />
      </div>
    </div>
  );
}

export default function StudentBeltProgressionWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progression, setProgression] = useState<ProgressionEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await progressionService.getMyProgression();
      if (cancelled) return;
      if (res.success && res.data) {
        setProgression(res.data.progression);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-5 animate-pulse">
        <div className="h-6 w-40 bg-gray-700/50 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-2 bg-gray-700/50 rounded" />
          <div className="h-2 bg-gray-700/50 rounded" />
          <div className="h-2 bg-gray-700/50 rounded" />
        </div>
      </div>
    );
  }

  if (!progression) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/belt-testing')}
      className="w-full text-left rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 via-gray-800/40 to-red-900/20 p-5 transition-all duration-200 hover:border-amber-500/60 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {label(t, 'dashboard.student.beltProgression', 'Belt progression')}
            </h3>
            <p className="text-xs text-gray-400">
              {progression.currentBelt}
              {progression.nextBelt && (
                <>
                  {' → '}
                  <span className="text-emerald-400 font-semibold">{progression.nextBelt}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-300 tabular-nums leading-none">
            {progression.percent.overall}%
          </p>
          {progression.status === 'ready-for-exam' && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <Sparkles className="w-3 h-3" />
              {label(t, 'dashboard.student.ready', 'Ready')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <BarRow
          icon={<GraduationCap className="w-3.5 h-3.5" />}
          text={label(t, 'beltTesting.student.classes', 'Classes')}
          current={progression.attended.classes}
          required={progression.requirements.classes}
          color="bg-blue-500"
        />
        <BarRow
          icon={<Swords className="w-3.5 h-3.5" />}
          text={label(t, 'beltTesting.student.sparring', 'Sparring')}
          current={progression.attended.sparrings}
          required={progression.requirements.sparrings}
          color="bg-red-500"
        />
        <BarRow
          icon={<Trophy className="w-3.5 h-3.5" />}
          text={`${label(t, 'beltTesting.student.tournaments', 'Tournaments')} (${label(t, 'beltTesting.student.optional', 'optional')})`}
          current={progression.attended.tournaments}
          required={progression.requirements.tournaments}
          color="bg-amber-500"
        />
      </div>

      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-400/90">
        {label(t, 'dashboard.student.viewBeltTesting', 'View belt testing')}
        <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}
