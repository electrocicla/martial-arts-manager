/**
 * MoneyValue — Renders a monetary value that respects the global privacy
 * preference (see PrivacyContext). When privacy is on, the amount is masked
 * with bullets, similar to bank apps.
 */
import { usePrivacy, MONEY_MASK } from '../../context/PrivacyContext';

interface MoneyValueProps {
  /** Numeric amount. Ignored when `formatted` is provided. */
  amount?: number;
  /** Pre-formatted string (e.g. "$1,234.56"). Used as-is when shown. */
  formatted?: string;
  /** Optional formatter override for `amount`. */
  format?: (n: number) => string;
  /** Currency prefix when no formatter is supplied. Defaults to "$". */
  prefix?: string;
  /** Optional className passed to the wrapper span. */
  className?: string;
  /** Optional title attribute (e.g. for tooltips). Hidden when masked. */
  title?: string;
}

function defaultFormat(amount: number, prefix: string): string {
  return `${prefix}${amount.toLocaleString()}`;
}

export default function MoneyValue({
  amount,
  formatted,
  format,
  prefix = '$',
  className,
  title,
}: MoneyValueProps) {
  const { hidden } = usePrivacy();

  const display = (() => {
    if (typeof formatted === 'string') return formatted;
    if (typeof amount === 'number') {
      return format ? format(amount) : defaultFormat(amount, prefix);
    }
    return '';
  })();

  if (hidden) {
    return (
      <span
        className={className}
        aria-label="hidden"
        title={undefined}
        data-privacy="hidden"
      >
        {MONEY_MASK}
      </span>
    );
  }

  return (
    <span className={className} title={title}>
      {display}
    </span>
  );
}
