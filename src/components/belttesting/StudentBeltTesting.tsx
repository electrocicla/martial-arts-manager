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
  /** When provided, overrides the tone stroke (e.g. paint the 'classes' arc
   *  with the next belt color so the main metric matches the goal belt). */
  strokeOverride?: string;
}

const TONE_STYLES: Record<RadialProps['tone'], { stroke: string; bg: string; text: string }> = {
  classes:    { stroke: '#3b82f6', bg: 'bg-blue-500/10',  text: 'text-blue-400' },
  sparring:   { stroke: '#ef4444', bg: 'bg-red-500/10',   text: 'text-red-400' },
  tournament: { stroke: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

/**
 * Belt-aware visual theming. Each belt gets a hex (for SVG strokes / inline
 * styles) and matching Tailwind utility classes for backgrounds + text. The
 * 'Blue belt rendered in green' bug came from the hero hardcoding
 * `text-emerald-400` on the next-goal label regardless of which belt was
 * actually next — this map is the single source of truth.
 */
interface BeltTheme {
  hex: string;
  text: string;
  ring: string;
  glow: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
}

const BELT_THEMES: Record<string, BeltTheme> = {
  white:  { hex: '#e5e7eb', text: 'text-zinc-700',    ring: 'ring-zinc-300',    glow: 'shadow-zinc-300/30',    pillBg: 'bg-zinc-100',     pillText: 'text-zinc-900',    pillBorder: 'border-zinc-300' },
  yellow: { hex: '#facc15', text: 'text-yellow-600',  ring: 'ring-yellow-400',  glow: 'shadow-yellow-400/40',  pillBg: 'bg-yellow-100',   pillText: 'text-yellow-900',  pillBorder: 'border-yellow-400' },
  orange: { hex: '#fb923c', text: 'text-orange-600',  ring: 'ring-orange-400',  glow: 'shadow-orange-400/40',  pillBg: 'bg-orange-100',   pillText: 'text-orange-900',  pillBorder: 'border-orange-400' },
  green:  { hex: '#22c55e', text: 'text-emerald-600', ring: 'ring-emerald-400', glow: 'shadow-emerald-400/40', pillBg: 'bg-emerald-100',  pillText: 'text-emerald-900', pillBorder: 'border-emerald-400' },
  blue:   { hex: '#3b82f6', text: 'text-blue-600',    ring: 'ring-blue-400',    glow: 'shadow-blue-400/40',    pillBg: 'bg-blue-100',     pillText: 'text-blue-900',    pillBorder: 'border-blue-400' },
  purple: { hex: '#a855f7', text: 'text-purple-600',  ring: 'ring-purple-400',  glow: 'shadow-purple-400/40',  pillBg: 'bg-purple-100',   pillText: 'text-purple-900',  pillBorder: 'border-purple-400' },
  brown:  { hex: '#92400e', text: 'text-amber-800',   ring: 'ring-amber-700',   glow: 'shadow-amber-700/40',   pillBg: 'bg-amber-100',    pillText: 'text-amber-900',   pillBorder: 'border-amber-700' },
  black:  { hex: '#111827', text: 'text-zinc-900',    ring: 'ring-zinc-800',    glow: 'shadow-zinc-900/40',    pillBg: 'bg-zinc-200',     pillText: 'text-zinc-900',    pillBorder: 'border-zinc-800' },
  red:    { hex: '#dc2626', text: 'text-red-600',     ring: 'ring-red-500',     glow: 'shadow-red-500/40',     pillBg: 'bg-red-100',      pillText: 'text-red-900',     pillBorder: 'border-red-500' },
};

function beltTheme(belt: string | null | undefined): BeltTheme {
  if (!belt) return BELT_THEMES.white;
  const key = belt.trim().toLowerCase().split(/[\s\-/]/)[0];
  return BELT_THEMES[key] ?? BELT_THEMES.white;
}

function RadialGauge({ percent, label: gaugeLabel, current, required, icon, tone, strokeOverride }: RadialProps) {
  const safe = Math.max(0, Math.min(100, percent));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const styles = TONE_STYLES[tone];
  const stroke = strokeOverride ?? styles.stroke;

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-base-300/40 border border-base-300 transition-shadow hover:shadow-md">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-base-300" />
          <circle
            cx="60" cy="60" r={radius}
            stroke={stroke}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}
            aria-hidden="true"
            style={strokeOverride ? { color: stroke, backgroundColor: `${stroke}1f` } : undefined}
          >
            {icon}
          </div>
          <span className="text-2xl font-black text-base-content mt-1 tabular-nums">{safe}%</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/60 font-bold">{gaugeLabel}</p>
        <p className="text-base text-base-content font-bold tabular-nums">
          {current.toLocaleString()} <span className="text-base-content/50 font-medium">/</span> {required.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

interface RoadmapChipProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'red' | 'amber';
  subLabel?: string;
}

const ROADMAP_CHIP_TONES: Record<RoadmapChipProps['tone'], string> = {
  blue:  'bg-blue-500/10  text-blue-600   ring-blue-500/30',
  red:   'bg-red-500/10   text-red-600    ring-red-500/30',
  amber: 'bg-amber-500/10 text-amber-700  ring-amber-500/30',
};

function RoadmapChip({ icon, label: chipLabel, value, tone, subLabel }: RoadmapChipProps) {
  return (
    <div className={`rounded-xl ring-1 px-3 py-2.5 ${ROADMAP_CHIP_TONES[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold opacity-80">
        {icon}
        <span className="truncate">{chipLabel}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-lg md:text-xl font-black tabular-nums">{value.toLocaleString()}</span>
        {subLabel && (
          <span className="text-[10px] font-semibold opacity-70 tracking-wide">({subLabel})</span>
        )}
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
  const currentTheme = beltTheme(progression.currentBelt);
  const nextTheme = beltTheme(progression.nextBelt);

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
              <Surface variant="raised" radius="lg" className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-base-content/60 font-bold">
                        {label(t, 'beltTesting.student.currentBelt', 'Current Belt')}
                      </span>
                      <span
                        className={`mt-2 inline-flex items-center self-start rounded-xl border-2 px-4 py-1.5 text-3xl md:text-4xl font-black tracking-tight ${currentTheme.pillBg} ${currentTheme.pillText} ${currentTheme.pillBorder} shadow-md ${currentTheme.glow}`}
                      >
                        {progression.currentBelt}
                      </span>
                    </div>
                    <div className="hidden md:flex items-center text-base-content/30" aria-hidden="true">
                      <TrendingUp className="w-9 h-9" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-base-content/60 font-bold">
                        {label(t, 'beltTesting.student.nextGoal', 'Next Goal')}
                      </span>
                      <span
                        className={`mt-2 inline-flex items-center self-start rounded-xl border-2 px-4 py-1.5 text-3xl md:text-4xl font-black tracking-tight ${nextTheme.pillBg} ${nextTheme.pillText} ${nextTheme.pillBorder} shadow-md ${nextTheme.glow}`}
                      >
                        {progression.nextBelt ?? label(t, 'beltTesting.student.topRank', 'Top rank')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 md:pl-6 md:border-l md:border-base-300">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-base-content/60 font-bold">
                      {label(t, 'beltTesting.student.overallProgress', 'Overall progress')}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-black tabular-nums ${nextTheme.text}`}>{progression.percent.overall}%</span>
                      <span className="text-sm text-base-content/60">
                        {label(t, 'beltTesting.student.toNextBelt', 'to next belt')}
                      </span>
                    </div>
                    <div className="w-full md:w-56 h-2 rounded-full bg-base-300/70 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(2, Math.min(100, progression.percent.overall))}%`, backgroundColor: nextTheme.hex }}
                      />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <RadialGauge
              percent={progression.percent.classes}
              label={label(t, 'beltTesting.student.classes', 'Classes')}
              current={progression.attended.classes}
              required={progression.requirements.classes}
              icon={<GraduationCap className="w-5 h-5" />}
              tone="classes"
              strokeOverride={nextTheme.hex}
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

        {/* Roadmap — vertical stepper, far more legible than the
            zebra table that had no padding and no current-row emphasis. */}
        <Section
          title={label(t, 'beltTesting.student.roadmapTitle', 'Progression roadmap')}
          description={label(t, 'beltTesting.student.roadmapDesc', 'Preview of upcoming requirements as you advance.')}
        >
          <ol className="relative space-y-4 md:space-y-5 pl-6 md:pl-8 border-l-2 border-dashed border-base-300">
            {roadmap.map((tier, idx) => {
              const isCurrent = tier.index === progression.tierIndex;
              const isFirst = idx === 0;
              return (
                <li key={tier.index} className="relative">
                  {/* Step marker bubble on the timeline */}
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute -left-[35px] md:-left-[41px] top-5 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full text-sm font-black shadow-md ring-4 ring-base-100 transition-transform',
                      isCurrent
                        ? 'bg-gradient-to-br from-red-500 to-red-700 text-white scale-110'
                        : 'bg-base-200 text-base-content/60 border border-base-300',
                    ].join(' ')}
                  >
                    {tier.index + 1}
                  </span>

                  <Surface
                    variant="raised"
                    radius="lg"
                    className={[
                      'p-5 md:p-6 transition-all duration-300',
                      isCurrent
                        ? 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/10 bg-red-500/5'
                        : 'hover:shadow-md hover:-translate-y-0.5',
                    ].join(' ')}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {isCurrent && (
                          <Flame className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-base md:text-lg font-extrabold tracking-tight truncate ${isCurrent ? 'text-red-600' : 'text-base-content'}`}>
                            {isFirst
                              ? label(t, 'beltTesting.student.roadmapCurrent', 'Current rank-up')
                              : `${label(t, 'beltTesting.student.roadmapNext', 'Rank-up')} #${idx + 1}`}
                          </p>
                          <p className="text-xs text-base-content/60 mt-0.5">
                            {label(t, 'beltTesting.student.tier', 'Tier')} #{tier.index + 1}
                          </p>
                        </div>
                      </div>

                      {/* Three metric chips */}
                      <div className="grid grid-cols-3 gap-2 md:gap-3 md:min-w-[420px]">
                        <RoadmapChip
                          icon={<GraduationCap className="w-4 h-4" />}
                          label={label(t, 'beltTesting.student.classes', 'Classes')}
                          value={tier.classes}
                          tone="blue"
                        />
                        <RoadmapChip
                          icon={<Swords className="w-4 h-4" />}
                          label={label(t, 'beltTesting.student.sparring', 'Sparring')}
                          value={tier.sparrings}
                          tone="red"
                        />
                        <RoadmapChip
                          icon={<Trophy className="w-4 h-4" />}
                          label={label(t, 'beltTesting.student.tournaments', 'Tournaments')}
                          value={tier.tournaments}
                          tone="amber"
                          subLabel={label(t, 'beltTesting.student.optional', 'optional')}
                        />
                      </div>
                    </div>
                  </Surface>
                </li>
              );
            })}
          </ol>
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
