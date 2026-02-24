/**
 * QRScanner Component
 * 
 * Allows students to scan QR codes to record attendance
 * Automatically detects and records the date and time of the scan
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ScanLine,
  Clock,
  Calendar,
  MapPin,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import jsQR from 'jsqr';

interface ScanResult {
  success: boolean;
  message: string;
  location?: string;
  timestamp?: string;
}

const QR_CODE_PATTERN = /HAMARR-[A-Z0-9]{6,}/i;

function extractAttendanceCode(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const directMatch = trimmed.match(QR_CODE_PATTERN);
  if (directMatch) {
    return directMatch[0].toUpperCase();
  }

  try {
    const url = new URL(trimmed);
    const fromParams =
      url.searchParams.get('qr') ||
      url.searchParams.get('qr_code') ||
      url.searchParams.get('code');

    if (fromParams) {
      const decodedParam = decodeURIComponent(fromParams).trim();
      const paramMatch = decodedParam.match(QR_CODE_PATTERN);
      if (paramMatch) {
        return paramMatch[0].toUpperCase();
      }
      return decodedParam || null;
    }

    const pathMatch = decodeURIComponent(url.pathname).match(QR_CODE_PATTERN);
    if (pathMatch) {
      return pathMatch[0].toUpperCase();
    }

    return null;
  } catch {
    // Not a URL, fallback to the raw value.
    return trimmed;
  }
}

export default function QRScanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [scannerMode, setScannerMode] = useState<'barcode-detector' | 'jsqr-fallback' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingScanRef = useRef(false);

  useEffect(() => {
    // Load recent scans from localStorage
    const saved = localStorage.getItem('recentScans');
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent scans:', e);
      }
    }
  }, []);

  const saveToRecentScans = useCallback((scan: ScanResult) => {
    setRecentScans((prev) => {
      const updated = [scan, ...prev].slice(0, 10);
      localStorage.setItem('recentScans', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearScanInterval = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    clearScanInterval();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    processingScanRef.current = false;
    setScannerMode(null);
    setScanning(false);
  }, [clearScanInterval]);

  const submitAttendance = useCallback(async (rawCode: string, fromCamera = false) => {
    const code = extractAttendanceCode(rawCode);
    if (!code) {
      setResult({
        success: false,
        message: t('qr.scanner.invalidCode', 'Invalid QR code format')
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const now = new Date();
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        attendance?: {
          id: string;
          class_id: string;
          class_name: string;
          class_date: string;
          class_time: string;
          discipline: string;
          location: string;
          attended: number;
          check_in_time: string;
          check_in_method: 'qr';
        };
      }>('/api/student/attendance/check-in', {
        qr_code: code,
        timestamp: now.toISOString(),
      });

      const checkInSuccess = Boolean(response.success && response.data?.success);
      const scanResult: ScanResult = {
        success: checkInSuccess,
        message:
          response.data?.message ||
          response.error ||
          (checkInSuccess
            ? t('qr.scanner.success', 'Attendance recorded successfully')
            : t('qr.scanner.failed', 'Failed to record attendance')),
        location: response.data?.attendance?.location,
        timestamp: now.toISOString(),
      };

      setResult(scanResult);

      if (checkInSuccess) {
        saveToRecentScans(scanResult);
        setManualCode('');

        // Clear success message after 5 seconds
        setTimeout(() => setResult(null), 5000);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setResult({
        success: false,
        message: t('qr.scanner.error', 'An error occurred while recording attendance')
      });
    } finally {
      if (fromCamera) {
        stopCamera();
      }
      setSubmitting(false);
      processingScanRef.current = false;
    }
  }, [saveToRecentScans, stopCamera, t]);

  const scanWithBarcodeDetector = useCallback(() => {
    const BarcodeDetectorClass = (window as unknown as Record<string, unknown>)
      .BarcodeDetector as new (options: { formats: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };

    const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });

    clearScanInterval();
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4 || processingScanRef.current) {
        return;
      }

      try {
        const barcodes = await detector.detect(videoRef.current);
        if (!barcodes.length) return;

        const rawValue = barcodes[0].rawValue;
        if (!rawValue) return;

        processingScanRef.current = true;
        await submitAttendance(rawValue, true);
      } catch (error) {
        console.warn('QR detect frame error:', error);
      }
    }, 250);
  }, [clearScanInterval, submitAttendance]);

  const scanWithCanvasFallback = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setResult({
        success: false,
        message: t('qr.scanner.cameraUnavailable', 'Camera scanner is not available on this device/browser.')
      });
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      setResult({
        success: false,
        message: t('qr.scanner.notSupported', 'Unable to start QR camera scanning. Use manual code entry.')
      });
      return;
    }

    clearScanInterval();
    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || processingScanRef.current) {
        return;
      }

      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      if (!sourceWidth || !sourceHeight) {
        return;
      }

      const maxWidth = 960;
      const scale = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1;
      const width = Math.max(1, Math.floor(sourceWidth * scale));
      const height = Math.max(1, Math.floor(sourceHeight * scale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const qrCode = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
      if (!qrCode?.data) {
        return;
      }

      processingScanRef.current = true;
      await submitAttendance(qrCode.data, true);
    }, 300);
  }, [clearScanInterval, submitAttendance, t]);

  const startQRScanning = useCallback(() => {
    if ('BarcodeDetector' in window) {
      setScannerMode('barcode-detector');
      scanWithBarcodeDetector();
    } else {
      setScannerMode('jsqr-fallback');
      scanWithCanvasFallback();
    }
  }, [scanWithBarcodeDetector, scanWithCanvasFallback]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setResult({
          success: false,
          message: t('qr.scanner.cameraUnavailable', 'Camera is not available on this device/browser.')
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      startQRScanning();
    } catch (error) {
      console.error('Camera error:', error);
      setResult({
        success: false,
        message: t('qr.scanner.cameraError', 'Could not access camera. Please allow camera permissions or enter code manually.')
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualCode.trim()) {
      setResult({
        success: false,
        message: t('qr.scanner.codeRequired', 'Please enter a QR code')
      });
      return;
    }

    await submitAttendance(manualCode.trim());
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrFromUrl = params.get('qr') || params.get('qr_code') || params.get('code');

    if (!qrFromUrl) {
      return;
    }

    void submitAttendance(qrFromUrl);

    params.delete('qr');
    params.delete('qr_code');
    params.delete('code');

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [submitAttendance]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (user?.role !== 'student') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-base-300 shadow-2xl rounded-3xl overflow-hidden">
        <div className="card-body p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-lg">
              <QrCode className="w-10 h-10 text-primary-content" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-base-content">
                {t('qr.scanner.title', 'Scan QR Code')}
              </h2>
              <p className="text-base-content/70 mt-1">
                {t('qr.scanner.subtitle', 'Scan to record your attendance')}
              </p>
            </div>
          </div>

          {/* Result Alert */}
          {result && (
            <div className={`alert ${result.success ? 'alert-success' : 'alert-error'} shadow-lg rounded-2xl mb-6`}>
              {result.success ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <div className="flex-1">
                <div className="font-bold">{result.message}</div>
                {result.location && (
                  <div className="text-sm flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {result.location}
                  </div>
                )}
                {result.timestamp && (
                  <div className="text-sm flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
              <button onClick={() => setResult(null)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Scanner Section */}
          <div className="space-y-6">
            {/* Camera Scanner */}
            <div>
              <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6 text-primary" />
                {t('qr.scanner.useCamera', 'Use Camera')}
              </h3>

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge badge-outline rounded-full px-3 py-2 text-xs">
                  {t('qr.scanner.tip1', 'Open camera')}
                </span>
                <span className="badge badge-outline rounded-full px-3 py-2 text-xs">
                  {t('qr.scanner.tip2', 'Align QR in frame')}
                </span>
                <span className="badge badge-outline rounded-full px-3 py-2 text-xs">
                  {t('qr.scanner.tip3', 'Check-in is automatic')}
                </span>
              </div>
              
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="btn btn-primary btn-lg min-h-0 h-12 w-full gap-3 rounded-2xl px-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Camera className="w-6 h-6" />
                  {t('qr.scanner.startCamera', 'Start Camera')}
                </button>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border-4 border-primary shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full aspect-video bg-black"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-4 border-primary/30 rounded-2xl m-20 flex items-center justify-center">
                      <ScanLine className="w-full h-1 text-primary animate-pulse" />
                    </div>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="absolute top-4 right-4 btn btn-error btn-circle shadow-xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  {scannerMode === 'jsqr-fallback' && (
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <span className="inline-flex rounded-full border border-warning/40 bg-warning/20 px-3 py-1 text-xs font-semibold text-warning-content">
                        {t('qr.scanner.compatibilityMode', 'Compatibility mode active')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="divider text-base-content/50">
              {t('common.or', 'OR')}
            </div>

            {/* Manual Entry */}
            <div>
              <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                <QrCode className="w-6 h-6 text-secondary" />
                {t('qr.scanner.enterManually', 'Enter Code Manually')}
              </h3>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="form-control">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder={t('qr.scanner.codePlaceholder', 'Enter QR code here...')}
                    className="input input-bordered input-lg w-full bg-base-300 focus:border-primary rounded-2xl font-mono text-center text-xl"
                    disabled={submitting}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !manualCode.trim()}
                  className="btn btn-secondary btn-lg min-h-0 h-12 w-full gap-3 rounded-2xl px-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {t('qr.scanner.submitting', 'Recording...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      {t('qr.scanner.submit', 'Record Attendance')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="card bg-base-200 border-2 border-base-300 shadow-xl rounded-3xl">
          <div className="card-body p-6">
            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-accent" />
              {t('qr.scanner.recentScans', 'Recent Scans')}
            </h3>
            
            <div className="space-y-3">
              {recentScans.map((scan, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border-2 ${
                    scan.success
                      ? 'bg-success/10 border-success/30'
                      : 'bg-error/10 border-error/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {scan.success ? (
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-error mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-base-content">{scan.message}</div>
                      {scan.location && (
                        <div className="text-sm text-base-content/70 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {scan.location}
                        </div>
                      )}
                      {scan.timestamp && (
                        <div className="text-sm text-base-content/70 flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(scan.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
