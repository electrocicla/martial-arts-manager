import { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const JUST_LOGGED_IN_KEY = 'hamarr:just-logged-in';
const APK_PROMPT_DISMISSED_UNTIL_KEY = 'hamarr:apk-prompt-dismissed-until';
const DEFAULT_ANDROID_APK_URL = '/downloads/hamarr-app-latest.apk';
const LATER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const DOWNLOAD_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30d

const ALLOWED_HOSTS = new Set(['hamarr.cl', 'www.hamarr.cl']);

function isAndroidDevice(): boolean {
  return /android/i.test(navigator.userAgent || '');
}

function isStandaloneDisplayMode(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  const matchMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  return Boolean(matchMedia || nav.standalone);
}

function safeGetNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDismissedUntil(): number | null {
  try {
    return safeGetNumber(localStorage.getItem(APK_PROMPT_DISMISSED_UNTIL_KEY));
  } catch {
    return null;
  }
}

function setDismissedUntil(timestamp: number): void {
  try {
    localStorage.setItem(APK_PROMPT_DISMISSED_UNTIL_KEY, String(timestamp));
  } catch {
    // ignore storage errors
  }
}

export default function AndroidApkInstallPrompt() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const apkUrl = useMemo(() => {
    const configured = (import.meta.env.VITE_ANDROID_APK_URL as string | undefined)?.trim();
    return configured && configured.length > 0 ? configured : DEFAULT_ANDROID_APK_URL;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Only show after a successful login in this session
    let hasRecentLoginMarker = false;
    try {
      hasRecentLoginMarker = Boolean(sessionStorage.getItem(JUST_LOGGED_IN_KEY));
      sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
    } catch {
      hasRecentLoginMarker = false;
    }

    if (!hasRecentLoginMarker) return;
    if (!isAndroidDevice()) return;
    if (!ALLOWED_HOSTS.has(window.location.hostname)) return;
    if (isStandaloneDisplayMode()) return;

    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && dismissedUntil > Date.now()) return;

    setIsOpen(true);
  }, [isAuthenticated]);

  const closeForLater = () => {
    setDismissedUntil(Date.now() + LATER_COOLDOWN_MS);
    setIsOpen(false);
  };

  const handleDownload = () => {
    setDismissedUntil(Date.now() + DOWNLOAD_COOLDOWN_MS);
    setIsOpen(false);
    window.open(apkUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeForLater}
      title="Install HAMARR on your Android"
      size="md"
      showCloseButton
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-4">
          <Smartphone className="mt-0.5 h-5 w-5 text-emerald-400" />
          <div className="text-sm text-gray-200">
            <p className="font-semibold text-white">Get the Android app (.apk)</p>
            <p className="mt-1 text-gray-300">
              You can install the HAMARR app directly on Android for quick access from your home screen.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 p-4 text-sm text-yellow-100">
          If this is your first manual install, Android may ask you to allow installations from this source.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={closeForLater}>
            Maybe later
          </Button>
          <Button variant="primary" leftIcon={<Download className="h-4 w-4" />} onClick={handleDownload}>
            Download APK
          </Button>
        </div>
      </div>
    </Modal>
  );
}
