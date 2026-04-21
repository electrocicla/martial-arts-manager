// Core UI Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';

export { TabButton } from './TabButton';
export type { TabButtonProps } from './TabButton';

export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
export type { ModalProps } from './Modal';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarGroupProps } from './Avatar';

export { Skeleton, SkeletonText, SkeletonCard, SkeletonProfile, SkeletonList } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// ───────────────────────────────────────────────────────────
// Dashboard v2 primitives — see audit/dashboard-uiux-revamp/
// ───────────────────────────────────────────────────────────
export { Surface } from './Surface';
export type { SurfaceProps, SurfaceVariant, SurfaceTone } from './Surface';

export { Stat } from './Stat';
export type { StatProps } from './Stat';

export { Section } from './Section';
export type { SectionProps } from './Section';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { InlineError } from './InlineError';
export type { InlineErrorProps } from './InlineError';

export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';

export { Kbd } from './Kbd';
export type { KbdProps } from './Kbd';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

// Effects
export { FadeUp, Stagger, PressableMotion } from './effects/Motion';
export { CountUp } from './effects/CountUp';

// Charts
export { Sparkline } from './charts/Sparkline';
export type { SparklineProps } from './charts/Sparkline';
export { BarStack } from './charts/BarStack';
export type { BarStackProps, BarStackSeries } from './charts/BarStack';
export { DonutGauge } from './charts/DonutGauge';
export type { DonutGaugeProps } from './charts/DonutGauge';