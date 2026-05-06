/**
 * LightModeAnnouncement
 *
 * One-time, dismissible coach-mark introducing every signed-in user (admin /
 * instructor / student) to the new light mode.
 *
 * Anchoring strategy:
 *  - The header's theme button MUST carry [data-theme-toggle="true"].
 *  - On reveal we measure that button's bounding rect and position the
 *    callout directly underneath it, with an upward chevron centered on the
 *    button. We re-measure on resize / scroll so it tracks reliably on both
 *    mobile and desktop.
 *  - While mounted we add `announce-light-mode-active` to <body>; the
 *    inline <style> below uses that flag to softly pulse the same button.
 *
 * Persistence:
 *  - localStorage key 'hamarr.announcement.lightMode.v3' (bumped to surface
 *    the redesign to users who already dismissed earlier versions).
 */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Sun, Moon, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/useTheme';

const STORAGE_KEY = 'hamarr.announcement.lightMode.v3';
const BODY_HIGHLIGHT_CLASS = 'announce-light-mode-active';

interface AnchorPos {
  /** viewport top of bubble (px) */
  top: number;
  /** viewport right gap of bubble container (px) */
  right: number;
  /** chevron horizontal offset from bubble's right edge (px) */
  chevronRight: number;
  /** width chosen for this viewport (px) */
  width: number;
}

const FALLBACK_POS: AnchorPos = {
  top: 72,
  right: 12,
  chevronRight: 24,
  width: 360,
};

function computePosition(): AnchorPos {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return FALLBACK_POS;
  }
  const btn = (() => {
    // Two buttons exist (mobile + desktop variants). Pick the first one
    // that is currently rendered with a non-zero rect.
    const all = document.querySelectorAll<HTMLElement>('[data-theme-toggle="true"]');
    for (const el of Array.from(all)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
    return null;
  })();
  const vw = window.innerWidth;
  const isMobile = vw < 640;
  const desiredWidth = isMobile ? Math.min(vw - 24, 340) : 360;
  const sideMargin = isMobile ? 12 : 16;

  if (!btn) return { ...FALLBACK_POS, width: desiredWidth };

  const rect = btn.getBoundingClientRect();

  const top = Math.round(rect.bottom + 12);
  // distance from viewport right to button right edge
  const buttonRightGap = Math.max(sideMargin, vw - rect.right);
  // shift the bubble so the button sits roughly above its right area;
  // keep min margin from the right edge.
  const right = Math.max(sideMargin, buttonRightGap - 8);

  // Make sure bubble fits horizontally; if not, push it left until it does.
  const maxLeftOfBubble = vw - right - desiredWidth;
  let finalRight = right;
  if (maxLeftOfBubble < sideMargin) {
    finalRight = Math.max(sideMargin, vw - desiredWidth - sideMargin);
  }

  // Chevron must sit horizontally above the button center, expressed as an
  // offset from the bubble's right edge.
  const buttonCenterX = rect.left + rect.width / 2;
  const bubbleRightX = vw - finalRight;
  const bubbleLeftX = bubbleRightX - desiredWidth;
  let chevronRight = bubbleRightX - buttonCenterX - 8; // 8 = half chevron
  // clamp inside the bubble (with 12px padding on either edge)
  const minChevron = 12;
  const maxChevron = desiredWidth - 24;
  if (chevronRight < minChevron) chevronRight = minChevron;
  if (chevronRight > maxChevron) chevronRight = maxChevron;
  // (bubbleLeftX kept available for future use; suppress unused warning)
  void bubbleLeftX;

  return {
    top,
    right: finalRight,
    chevronRight: Math.round(chevronRight),
    width: desiredWidth,
  };
}

export function LightModeAnnouncement() {
  const { t } = useTranslation();
  const { resolved, setMode } = useTheme();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<AnchorPos>(FALLBACK_POS);

  // Decide whether to schedule the reveal (first mount only).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'dismissed') return;
    } catch {
      /* localStorage unavailable; show once for this session */
    }
    const handle = window.setTimeout(() => setVisible(true), 1100);
    return () => window.clearTimeout(handle);
  }, []);

  // Measure the toggle button on reveal and keep it in sync with the
  // viewport. useLayoutEffect avoids a one-frame flicker at the wrong spot.
  const reposition = useCallback(() => {
    setPos(computePosition());
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    // Settle re-measure shortly after layout stabilizes (fonts / images).
    const t1 = window.setTimeout(reposition, 80);
    const t2 = window.setTimeout(reposition, 400);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible, reposition]);

  // Toggle the body class that drives the theme-button glow while we're up.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (visible) {
      document.body.classList.add(BODY_HIGHLIGHT_CLASS);
      return () => document.body.classList.remove(BODY_HIGHLIGHT_CLASS);
    }
    return undefined;
  }, [visible]);

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
    setMode(resolved === 'dark' ? 'light' : 'dark');
    dismiss();
  };

  const isDark = resolved === 'dark';
  const oppositeLabel = isDark
    ? t('announce.lightMode.tryLight', 'Try light mode')
    : t('announce.lightMode.tryDark', 'Switch back to dark');

  return (
    <>
      <div
        role="dialog"
        aria-live="polite"
        aria-label={t('announce.lightMode.aria', 'New feature announcement')}
        style={{
          top: pos.top,
          right: pos.right,
          width: pos.width,
        }}
        className="fixed z-[60] animate-[announceFadeDown_400ms_ease-out_both]"
      >
        {/* Upward-pointing chevron tail centered on the theme button. */}
        <div
          aria-hidden="true"
          style={{ right: pos.chevronRight }}
          className="absolute -top-2 h-4 w-4 rotate-45 rounded-sm border-t border-l border-red-500/40 bg-base-100 shadow-md"
        />

        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-base-100 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          {/* Decorative gradient ribbon along the top */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-500 via-amber-400 to-red-500"
          />
          {/* Decorative blurred halo (kept inside overflow-hidden) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-red-500/15 blur-3xl"
          />

          <div className="relative flex items-start gap-3 p-4 sm:p-5">
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
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-base-content/75">
                {t(
                  'announce.lightMode.bodyAnchored',
                  'Tap the highlighted icon above to switch between light and dark. We remember your choice on this device.',
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
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-base-content/70 transition-colors hover:text-base-content hover:bg-base-200"
                >
                  {t('announce.lightMode.dismiss', 'Got it')}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label={t('common.close', 'Close')}
              className="shrink-0 -mr-1 -mt-1 rounded-md p-1.5 text-base-content/50 transition-colors hover:text-base-content hover:bg-base-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/*
        Self-contained styles:
         - announceFadeDown: drop-in matching the chevron direction.
         - body.announce-light-mode-active [data-theme-toggle]: pulsing red
           ring + soft glow that draws the eye to the header theme button.
      */}
      <style>{`
        @keyframes announceFadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes announceTogglePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55), 0 0 18px 4px rgba(239, 68, 68, 0.25); transform: scale(1); }
          50%      { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.0),  0 0 28px 10px rgba(239, 68, 68, 0.45); transform: scale(1.07); }
        }
        body.announce-light-mode-active [data-theme-toggle="true"] {
          position: relative;
          border-radius: 0.6rem;
          color: #fff !important;
          background: linear-gradient(135deg, rgb(239 68 68 / 0.20), rgb(245 158 11 / 0.18)) !important;
          animation: announceTogglePulse 1.8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default LightModeAnnouncement;
