/**
 * LightModeAnnouncement
 *
 * One-time, dismissible announcement informing every signed-in user (admin
 * + instructor + student) about the new light mode. Stored under a single
 * localStorage key so the same browser only shows it once for the lifetime
 * of this announcement version. Bump the version suffix on the storage key
 * if the copy is materially refreshed.
 *
 * Layout is fully responsive without media-query JS:
 *  - Desktop / md+: floats bottom-right as a compact glass card (max-w-sm).
 *  - Mobile: anchors bottom edge full-width with safe-area padding so it
 *    sits above the bottom navigation bar.
 *
 * Visual language matches the brand red "strike" tokens + new paper canvas;
 * uses a subtle gradient + sun/moon icon swap to telegraph the feature.
 */

import { useEffect, useState } from 'react';
import { Sun, Moon, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/useTheme';

const STORAGE_KEY = 'hamarr.announcement.lightMode.v1';

export function LightModeAnnouncement() {
  const { t } = useTranslation();
  const { resolved, setMode } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'dismissed') return;
    } catch {
      // localStorage may be unavailable (private mode, embedded webview);
      // gracefully fall back to showing once per session.
    }
    // Defer mount so the page renders first — premium reveal, not jarring.
    const handle = window.setTimeout(() => setVisible(true), 1400);
    return () => window.clearTimeout(handle);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      /* no-op */
    }
    setVisible(false);
  };

  const tryLightMode = () => {
    setMode('light');
    dismiss();
  };

  const isDark = resolved === 'dark';
  const oppositeLabel = isDark
    ? t('announce.lightMode.tryLight', 'Try light mode')
    : t('announce.lightMode.tryDark', 'Switch back to dark');

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('announce.lightMode.aria', 'New feature announcement')}
      className={[
        // Position: bottom-edge full-width on mobile, floating card on md+
        'fixed z-[60] left-0 right-0 bottom-0 px-3 pb-[max(env(safe-area-inset-bottom),12px)]',
        'md:left-auto md:right-6 md:bottom-6 md:px-0 md:pb-0 md:max-w-sm',
        // Slide-in / fade-in
        'animate-[fadeInUp_400ms_ease-out_both]',
      ].join(' ')}
    >
      <div
        className={[
          'relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl',
          // Premium gradient: warm ink wash on dark, paper wash on light
          'border-red-500/30 bg-gradient-to-br from-red-600/15 via-base-200/95 to-amber-500/10',
          // Subtle inner ring
          'ring-1 ring-white/10',
        ].join(' ')}
      >
        {/* Decorative blurred halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-red-500/20 blur-3xl"
        />

        <div className="relative flex items-start gap-3 p-4 sm:p-5">
          {/* Icon stack */}
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/40 ring-1 ring-red-400/40">
              {isDark ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </div>
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow-sm"
            >
              <Sparkles className="h-2.5 w-2.5 text-amber-900" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-red-500/90">
              {t('announce.lightMode.eyebrow', 'New')}
            </p>
            <h3 className="mt-0.5 text-sm sm:text-base font-extrabold tracking-tight text-base-content">
              {t('announce.lightMode.title', 'Light mode is here')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-base-content/70">
              {t(
                'announce.lightMode.body',
                'A warm, dojo-inspired light theme is now available. Toggle anytime from the header — your choice is remembered on this device.',
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={tryLightMode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-red-500 to-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/40 active:translate-y-0"
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {oppositeLabel}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-base-content/70 transition-colors hover:text-base-content hover:bg-base-300/60"
              >
                {t('announce.lightMode.dismiss', 'Got it')}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label={t('common.close', 'Close')}
            className="shrink-0 -mr-1 -mt-1 rounded-md p-1.5 text-base-content/50 transition-colors hover:text-base-content hover:bg-base-300/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Local keyframes (kept inline so this component is fully self-contained
          and doesn't pollute global CSS for a one-time announcement). */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default LightModeAnnouncement;
