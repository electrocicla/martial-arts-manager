/**
 * Cloudflare Turnstile CAPTCHA widget component
 * Loads the Turnstile script and renders the challenge widget.
 * Calls onVerify with the token on success, onError/onExpire on failure.
 */

import { useEffect, useRef, useCallback, useId } from 'react';
import { getCspNonce } from '../../lib/csp';
import { isTurnstileConfigured, TURNSTILE_SITE_KEY } from '../../lib/turnstile';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: TurnstileParams
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileParams {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  language?: string;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  className?: string;
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  language,
  className,
}: TurnstileProps) {
  const containerId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  const turnstileConfigured = isTurnstileConfigured();

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  const renderWidget = useCallback(() => {
    if (!turnstileConfigured || !mountedRef.current || !containerRef.current || !window.turnstile) return;

    // Remove previous widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => {
        if (mountedRef.current) onVerifyRef.current(token);
      },
      'error-callback': () => {
        if (mountedRef.current) onErrorRef.current?.();
      },
      'expired-callback': () => {
        if (mountedRef.current) onExpireRef.current?.();
      },
      theme,
      ...(language ? { language } : {}),
    });
  }, [turnstileConfigured, theme, language]);

  useEffect(() => {
    if (!turnstileConfigured) return;

    mountedRef.current = true;

    if (window.turnstile) {
      renderWidget();
    } else {
      // Register load callback (may already exist from another instance)
      const previousOnLoad = window.onTurnstileLoad;
      window.onTurnstileLoad = () => {
        previousOnLoad?.();
        renderWidget();
      };

      // Inject script only once
      if (!document.getElementById(TURNSTILE_SCRIPT_ID)) {
        const script = document.createElement('script');
        const nonce = getCspNonce();
        script.id = TURNSTILE_SCRIPT_ID;
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
        if (nonce) {
          script.nonce = nonce;
        }
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      mountedRef.current = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [turnstileConfigured, renderWidget]);

  if (!turnstileConfigured) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={className}
    />
  );
}
