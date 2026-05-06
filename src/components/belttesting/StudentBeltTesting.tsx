/**
 * Student Belt Testing — premium revamped view
 *
 * Powered by /api/student/progression. Displays:
 *   - Hero ribbon with current → target belt + readiness state
 *   - Three radial requirement gauges (Classes, Sparring, Tournaments)
 *   - Tier roadmap (per-belt class/sparring/tournament targets)
 *   - Upcoming exams + exam history
 */

import { useMemo } from 'react';
import {
  Award, Calendar, Clock, MapPin, Sparkles, Swords, Trophy,
  TrendingUp, CheckCircle2, AlertCircle, GraduationCap, Flame,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import { Surface } from '../ui/Surface';
import { Stat } from '../ui/Stat';
import { Section } from '../ui/Section';
import { EmptyState } from '../ui/EmptyState';
import { FadeUp, Stagger } from '../ui/effects/Motion';
import {
  type ProgressionEvaluation,
  getRequirementsForTier,
} from '../../lib/beltProgression';

interface ExamAssignment {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  result?: string;
  score?: number;
  feedback?: string;
  assigned_at: string;
  completed_at?: string;
  target_belt: string;
  exam_date: string;
  exam_time: string;
  location: string;
  current_belt: string;
}

export interface StudentBeltTestingProps {
  studentName?: string;
  discipline?: string;
  assignments: ExamAssignment[];
  progression: ProgressionEvaluation | null;
}

interface RadialProps {
  percent: number;
  label: string;
  current: number;
  required: number;
  icon: React.ReactNode;
  tone: 'classes' | 'sparring' | 'tournament';
}

const TONE_STYLES: Record<RadialProps['tone'], { stroke: string; bg: string; text: string }> = {
  classes:    { stroke: '#3b82f6', bg: 'bg-blue-500/10',  text: 'text-blue-400' },
  sparring:   { stroke: '#ef4444', bg: 'bg-red-500/10',   text: 'text-red-400' },
  tournament: { stroke: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

function RadialGauge({ percent, label: gaugeLabel, current, required, icon, tone }: RadialProps) {
  const safe = Math.max(0, Math.min(100, percent));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const styles = TONE_STYLES[tone];

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-base-300/40 border border-base-300">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-base-300" />
          <circle
            cx="60" cy="60" r={radius}
            stroke={styles.stroke}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`p-1.5 rounded-lg ${styles.bg} ${styles.text}`} aria-hidden="true">{icon}</div>
          <span className="text-2xl font-black text-base-content mt-1 tabular-nums">{safe}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">{gaugeLabel}</p>
        <p className="text-sm text-base-content font-bold tabular-nums">
          {current.toLocaleString()} / {required.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProgressionEvaluation['status'] }) {
  const config: Record<ProgressionEvaluation['status'], { tone: string; icon: React.ReactNode; text: string }> = {
    'on-track':       { tone: 'bg-blue-500/15 text-blue-400 border-blue-500/40',           icon: <TrendingUp className="w-4 h-4" />,   text: 'On track' },
    'almost-there':   { tone: 'bg-amber-500/15 text-amber-400 border-amber-500/40',        icon: <Flame className="w-4 h-4" />,        text: 'Almost there' },
    'ready-for-exam': { tone: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',  icon: <CheckCircle2 className="w-4 h-4" />, text: 'Ready for exam' },
    'final-belt':     { tone: 'bg-purple-500/15 text-purple-400 border-purple-500/40',     icon: <Sparkles className="w-4 h-4" />,     text: 'Top of the ladder' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.tone}`}>
      {c.icon}
      {c.text}
    </span>
  );
}

interface RoadmapTier {
  index: number;
  label: string;
  classes: number;
  sparrings: number;
  tournaments: number;
}

function buildRoadmap(currentTierIndex: number): RoadmapTier[] {
  const tiers: RoadmapTier[] = [];
  const start = Math.max(0, currentTierIndex);
  for (let i = start; i < start + 4; i++) {
    const req = getRequirementsForTier(i);
    tiers.push({
      index: i,
      label: i === currentTierIndex ? 'Current rank-up' : `Rank-up #${i - start + 1}`,
      classes: req.classes,
      sparrings: req.sparrings,
      tournaments: req.tournaments,
    });
  }
  return tiers;
}

export default function StudentBeltTesting({
  studentName,
  discipline,
  assignments,
  progression,
}: StudentBeltTestingProps) {
  const { t } = useTranslation();

  const upcomingExams = useMemo(
    () => assignments.filter(a => a.status === 'assigned' && new Date(a.exam_date) >= new Date()),
    [assignments]
  );
  const completedExams = useMemo(
    () => assignments.filter(a => a.status === 'completed' || a.result),
    [assignments]
  );

  if (!progression) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <EmptyState
          icon={<Award className="w-10 h-10" />}
          title={label(t, 'beltTesting.student.noProgression', 'Progression unavailable')}
          description={label(t, 'beltTesting.student.noProgressionDesc', 'We could not load your belt progression. Please refresh the page.')}
        />
      </div>
    );
  }

  const roadmap = buildRoadmap(progression.tierIndex);
  const tournamentsPercent = Math.min(
    100,
    Math.round((progression.attended.tournaments / Math.max(1, progression.requirements.tournaments)) * 100)
  );

  return (
    <div className="min-h-screen bg-base-100 pb-24 md:pb-10">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-base-300">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-red-600/15 via-transparent to-amber-600/10" />
        <div aria-hidden="true" className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-red-500/10 blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
          <FadeUp>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 ring-1 ring-red-500/30">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight text-base-content">
                    {label(t, 'beltTesting.student.title', 'My Belt Progress')}
                  </h1>
                  <p className="text-sm md:text-base text-base-content/60 mt-1">
                    {studentName
                      ? `${studentName}${discipline ? ` · ${discipline}` : ''}`
                      : label(t, 'beltTesting.student.subtitle', 'Track your journey to the next belt')}
                  </p>
                </div>
                <StatusBadge status={progression.status} />
              </div>

              {/* Current → Next belt ribbon */}
              <Surface variant="raised" radius="lg" className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.18em] text-base-content/60 font-semibold">
                        {label(t, 'beltTesting.student.currentBelt', 'Current Belt')}
                      </span>
                      <span className="text-3xl md:text-4xl font-black text-base-content mt-1">{progression.currentBelt}</span>
                    </div>
                    <div className="hidden md:flex items-center text-base-content/40" aria-hidden="true">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.18em] text-base-content/60 font-semibold">
                        {label(t, 'beltTesting.student.nextGoal', 'Next Goal')}
                      </span>
                      <span className="text-3xl md:text-4xl font-black text-emerald-400 mt-1">
                        {progression.nextBelt ?? label(t, 'beltTesting.student.topRank', 'Top rank')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-base-content/60 font-semibold">
                      {label(t, 'beltTesting.student.overallProgress', 'Overall progress')}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-base-content tabular-nums">{progression.percent.overall}%</span>
                      <span className="text-sm text-base-content/60">
                        {label(t, 'beltTesting.student.toNextBelt', 'to next belt')}
                      </span>
                    </div>
                  </div>
                </div>

                {progression.status === 'ready-for-exam' && progression.nextBelt && (
                  <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-emerald-300">
                        {label(t, 'beltTesting.student.readyTitle', 'You are ready to test!')}
                      </p>
                      <p className="text-sm text-emerald-200/80 mt-0.5">
                        {label(
                          t,
                          'beltTesting.student.readyMessage',
                          'Your instructor has been notified. They will assign you to the next available exam.'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </Surface>

              {/* Stat tiles */}
              <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Stat
                  label={label(t, 'beltTesting.student.classesAttended', 'Classes attended')}
                  value={progression.attended.classes}
                  icon={<GraduationCap className="w-5 h-5" />}
                />
                <Stat
                  label={label(t, 'beltTesting.student.sparringSessions', 'Sparring sessions')}
                  value={progression.attended.sparrings}
                  icon={<Swords className="w-5 h-5" />}
                />
                <Stat
                  label={label(t, 'beltTesting.student.tournaments', 'Tournaments')}
                  value={progression.attended.tournaments}
                  icon={<Trophy className="w-5 h-5" />}
                />
                <Stat
                  label={label(t, 'beltTesting.student.tier', 'Current tier')}
                  value={progression.tierIndex + 1}
                  icon={<Award className="w-5 h-5" />}
                  staticValue
                />
              </Stagger>
            </div>
          </FadeUp>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-10">
        {/* Radial gauges */}
        <Section
          title={label(t, 'beltTesting.student.requirementsTitle', 'Belt-up requirements')}
          description={label(
            t,
            'beltTesting.student.requirementsDesc',
            'Each rank doubles the requirements of the previous one. Tournament participation is encouraged but optional.'
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RadialGauge
              percent={progression.percent.classes}
              label={label(t, 'beltTesting.student.classes', 'Classes')}
              current={progression.attended.classes}
              required={progression.requirements.classes}
              icon={<GraduationCap className="w-5 h-5" />}
              tone="classes"
            />
            <RadialGauge
              percent={progression.percent.sparrings}
              label={label(t, 'beltTesting.student.sparring', 'Sparring')}
              current={progression.attended.sparrings}
              required={progression.requirements.sparrings}
              icon={<Swords className="w-5 h-5" />}
              tone="sparring"
            />
            <RadialGauge
              percent={tournamentsPercent}
              label={`${label(t, 'beltTesting.student.tournaments', 'Tournaments')} (${label(t, 'beltTesting.student.optional', 'optional')})`}
              current={progression.attended.tournaments}
              required={progression.requirements.tournaments}
              icon={<Trophy className="w-5 h-5" />}
              tone="tournament"
            />
          </div>
        </Section>

        {/* Roadmap */}
        <Section
          title={label(t, 'beltTesting.student.roadmapTitle', 'Progression roadmap')}
          description={label(t, 'beltTesting.student.roadmapDesc', 'Preview of upcoming requirements as you advance.')}
        >
          <Surface variant="raised" radius="lg" className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="text-base-content/70">
                    <th>{label(t, 'beltTesting.student.tier', 'Tier')}</th>
                    <th>{label(t, 'beltTesting.student.classes', 'Classes')}</th>
                    <th>{label(t, 'beltTesting.student.sparring', 'Sparring')}</th>
                    <th>{label(t, 'beltTesting.student.tournaments', 'Tournaments')}</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.map((tier) => {
                    const isCurrent = tier.index === progression.tierIndex;
                    return (
                      <tr key={tier.index} className={isCurrent ? 'bg-primary/10' : ''}>
                        <td className="font-bold text-base-content">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-outline">#{tier.index + 1}</span>
                            <span>{tier.label}</span>
                          </div>
                        </td>
                        <td className="tabular-nums">{tier.classes.toLocaleString()}</td>
                        <td className="tabular-nums">{tier.sparrings.toLocaleString()}</td>
                        <td className="tabular-nums text-base-content/70">
                          {tier.tournaments.toLocaleString()}{' '}
                          <span className="text-xs">({label(t, 'beltTesting.student.optional', 'optional')})</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Surface>
        </Section>

        {/* Upcoming exams */}
        <Section
          title={label(t, 'beltTesting.student.upcomingExams', 'Upcoming exams')}
          icon={<Calendar className="w-5 h-5" />}
        >
          {upcomingExams.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title={label(t, 'beltTesting.student.noUpcoming', 'No upcoming exams')}
              description={
                progression.readyForExam
                  ? label(t, 'beltTesting.student.waitingAssignment', 'You are ready! Wait for your instructor to assign you to an exam.')
                  : `${label(t, 'beltTesting.student.keepTraining', 'Keep training! You need')} ${
                      progression.remaining.classes
                    } ${label(t, 'beltTesting.student.moreClasses', 'more classes.')}`
              }
            />
          ) : (
            <div className="space-y-4">
              {upcomingExams.map((exam) => (
                <Surface key={exam.id} variant="raised" radius="md" className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        <span className="text-lg font-bold text-base-content">
                          {exam.target_belt} {label(t, 'beltTesting.student.examination', 'examination')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-base-content/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{exam.exam_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{exam.location}</span>
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-primary badge-lg">
                      {label(t, 'beltTesting.student.scheduled', 'Scheduled')}
                    </span>
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </Section>

        {/* Exam history */}
        {completedExams.length > 0 && (
          <Section
            title={label(t, 'beltTesting.student.examHistory', 'Exam history')}
            icon={<TrendingUp className="w-5 h-5" />}
          >
            <div className="space-y-3">
              {completedExams.map((exam) => {
                const passed = exam.result === 'pass';
                return (
                  <Surface
                    key={exam.id}
                    variant="raised"
                    radius="md"
                    className={`p-5 border ${passed ? 'border-emerald-500/30' : 'border-red-500/30'}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {passed
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : <AlertCircle className="w-5 h-5 text-red-400" />}
                          <span className="font-bold text-base-content">
                            {exam.current_belt} → {exam.target_belt}
                          </span>
                        </div>
                        <div className="text-sm text-base-content/70 mt-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(exam.exam_date).toLocaleDateString()}
                        </div>
                        {exam.feedback && (
                          <p className="mt-2 text-sm text-base-content/70 italic">
                            &ldquo;{exam.feedback}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`badge badge-lg ${passed ? 'badge-success' : 'badge-error'}`}>
                          {passed
                            ? label(t, 'beltTesting.student.passed', 'Passed')
                            : label(t, 'beltTesting.student.failed', 'Failed')}
                        </span>
                        {exam.score !== undefined && (
                          <span className="text-lg font-bold text-base-content tabular-nums">
                            {label(t, 'beltTesting.student.score', 'Score')}: {exam.score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </Surface>
                );
              })}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}
