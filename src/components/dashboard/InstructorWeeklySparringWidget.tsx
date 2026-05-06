/**
 * InstructorWeeklySparringWidget
 *
 * Compact card for the main Dashboard (admin/instructor).
 * Aggregates sparring sessions from the last 7 days, shows the totals and the
 * top contributors, and links to the Sparring Tracker.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swords, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { sparringService, type SparringSession } from '../../services/progression.service';
import { label } from '../../lib/i18nUtils';

interface AggregatedRow {
  student_id: string;
  student_name: string;
  total: number;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function InstructorWeeklySparringWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SparringSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const dateFrom = formatIsoDate(since);
    (async () => {
      const res = await sparringService.list({ dateFrom });
      if (cancelled) return;
      if (res.success && res.data) {
        setSessions(res.data.sessions);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { totalSessions, activeStudents, topRows } = useMemo(() => {
    const map = new Map<string, AggregatedRow>();
    let total = 0;
    for (const s of sessions) {
      const count = Math.max(1, Math.floor(s.sessions_count));
      total += count;
      const row = map.get(s.student_id) ?? {
        student_id: s.student_id,
        student_name: s.student_name ?? label(t, 'common.unknownStudent', 'Unknown student'),
        total: 0,
      };
      row.total += count;
      map.set(s.student_id, row);
    }
    const rows = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 3);
    return { totalSessions: total, activeStudents: map.size, topRows: rows };
  }, [sessions, t]);

  return (
    <div className="card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-base-300 shadow-lg">
      <div className="card-body p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/20 p-2.5">
              <Swords className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-content">
                {label(t, 'dashboard.sparring.weeklyTitle', 'Sparring this week')}
              </h3>
              <p className="text-sm text-base-content/70">
                {label(t, 'dashboard.sparring.weeklyDesc', 'Last 7 days of recorded sessions across your students.')}
              </p>
            </div>
          </div>
          <Button
            variant="warning"
            size="md"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate('/sparring-tracker')}
          >
            {label(t, 'dashboard.sparring.openTracker', 'Open tracker')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg border border-amber-500/20 bg-base-300/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-base-content/60">
                {label(t, 'dashboard.sparring.totalSessions', 'Total sessions')}
              </p>
              <p className="text-2xl font-black text-amber-300 tabular-nums">{totalSessions}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-base-300/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-base-content/60">
                {label(t, 'dashboard.sparring.activeStudents', 'Active students')}
              </p>
              <p className="text-2xl font-black text-base-content tabular-nums">{activeStudents}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-base-300/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-base-content/60">
                {label(t, 'dashboard.sparring.topPerformers', 'Top performers')}
              </p>
              {topRows.length === 0 ? (
                <p className="text-sm text-base-content/50 mt-1">
                  {label(t, 'dashboard.sparring.noData', 'No sessions yet')}
                </p>
              ) : (
                <ul className="space-y-1 mt-1">
                  {topRows.map(row => (
                    <li key={row.student_id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-base-content/80">{row.student_name}</span>
                      <span className="tabular-nums font-bold text-amber-300">{row.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
