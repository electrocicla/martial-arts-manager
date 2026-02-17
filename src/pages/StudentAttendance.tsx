/**
 * StudentAttendance - Personal Attendance Page for Students
 * 
 * Features:
 * - View personal attendance history
 * - Scan QR codes for check-in
 * - See attendance statistics
 * - Simple and cohesive UI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  QrCode, 
  Camera,
  Keyboard,
  AlertCircle,
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  X,
  Loader2,
  MapPin,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import jsQR from 'jsqr';

interface AttendanceRecord {
  id: string;
  class_id: string;
  class_name: string;
  class_date: string;
  class_time: string;
  discipline: string;
  location: string;
  attended: number;
  check_in_time: string | null;
  check_in_method: 'manual' | 'qr' | 'geofence';
  created_at: string;
}

interface AttendanceStats {
  total_classes: number;
  attended: number;
  missed: number;
  attendance_rate: number;
  current_streak: number;
  best_streak: number;
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

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
    return trimmed;
  }
}

export default function StudentAttendance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [scannerMode, setScannerMode] = useState<'barcode-detector' | 'jsqr-fallback' | null>(null);
  const isProcessing = scanState === 'processing' || manualSubmitting;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingScanRef = useRef(false);

  // Fetch attendance history
  const fetchAttendance = useCallback(async () => {
    if (!user?.student_id) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get<{ 
        records: AttendanceRecord[]; 
        stats: AttendanceStats 
      }>('/api/student/attendance');
      
      if (response.success && response.data) {
        setRecords(response.data.records || []);
        setStats(response.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const clearScanInterval = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState('error');
      setScanError(t('attendance.cameraUnavailable', 'Camera is not available on this device/browser.'));
      return;
    }

    try {
      clearScanInterval();
      processingScanRef.current = false;
      setScanState('scanning');
      setScanError(null);
      setScanSuccess(null);
      setShowScanner(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start scanning for QR codes
        startQRScanning();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setScanError(t('attendance.cameraError', 'Unable to access the camera. Please check permissions.'));
      setScanState('error');
      setShowScanner(false);
    }
  };

  const stopCamera = useCallback(() => {
    clearScanInterval();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    processingScanRef.current = false;
    setShowScanner(false);
    setScanState('idle');
    setScannerMode(null);
  }, [clearScanInterval]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startQRScanning = () => {
    clearScanInterval();

    // Check if BarcodeDetector is available (modern browsers)
    if ('BarcodeDetector' in window) {
      setScannerMode('barcode-detector');
      scanWithBarcodeDetector();
    } else {
      setScannerMode('jsqr-fallback');
      scanWithCanvasFallback();
    }
  };

  const scanWithBarcodeDetector = () => {
    const BarcodeDetectorClass = (window as unknown as Record<string, unknown>).BarcodeDetector as new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
    const barcodeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
    
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4 || processingScanRef.current) return;
      
      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const qrValue = barcodes[0].rawValue;
          if (qrValue) {
            processingScanRef.current = true;
            await processQRCode(qrValue, 'camera');
          }
        }
      } catch (err) {
        console.warn('Scan frame error:', err);
      }
    }, 250);
  };

  const scanWithCanvasFallback = () => {
    if (!videoRef.current || !canvasRef.current) {
      setScanError(t('attendance.cameraUnavailable', 'Camera is not available on this device/browser.'));
      setScanState('error');
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      setScanError(t('attendance.qrNotSupported', 'Unable to start QR scanner. Try manual code entry.'));
      setScanState('error');
      return;
    }

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || processingScanRef.current) return;

      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      if (!sourceWidth || !sourceHeight) return;

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

      if (!qrCode?.data) return;

      processingScanRef.current = true;
      await processQRCode(qrCode.data, 'camera');
    }, 300);
  };

  const processQRCode = async (qrValue: string, source: 'camera' | 'manual' = 'camera') => {
    const normalizedCode = extractAttendanceCode(qrValue);
    if (!normalizedCode) {
      setScanState('error');
      setScanError(t('attendance.invalidQrCode', 'Invalid QR code format'));

      if (source === 'camera') {
        setTimeout(() => {
          processingScanRef.current = false;
          if (!streamRef.current || !videoRef.current) return;
          setScanError(null);
          startQRScanning();
          setScanState('scanning');
        }, 2000);
      } else {
        processingScanRef.current = false;
      }

      return;
    }

    // Stop scanning while processing
    if (source === 'camera') {
      clearScanInterval();
    }
    
    setScanState('processing');
    setScanError(null);
    
    try {
      const response = await apiClient.post<{ 
        success: boolean; 
        message: string;
        attendance?: AttendanceRecord;
      }>('/api/student/attendance/check-in', {
        qr_code: normalizedCode,
        timestamp: new Date().toISOString(),
      });
      
      if (response.success && response.data?.success) {
        setScanState('success');
        setScanSuccess(response.data.message || t('attendance.checkInSuccess', 'Attendance recorded.'));
        setManualCode('');
        
        // Refresh attendance list
        await fetchAttendance();
        
        if (source === 'camera') {
          // Close scanner after short confirmation
          setTimeout(() => {
            stopCamera();
            setScanSuccess(null);
          }, 1600);
        } else {
          processingScanRef.current = false;
          setTimeout(() => {
            setScanSuccess(null);
            setScanState('idle');
          }, 2500);
        }
      } else {
        setScanState('error');
        setScanError(response.data?.message || response.error || t('attendance.checkInError', 'Failed to record attendance.'));

        if (source === 'camera') {
          // Resume scanning after error
          setTimeout(() => {
            processingScanRef.current = false;
            if (!streamRef.current || !videoRef.current) return;
            setScanError(null);
            startQRScanning();
            setScanState('scanning');
          }, 3000);
        } else {
          processingScanRef.current = false;
        }
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setScanState('error');
      setScanError(t('attendance.networkError', 'Network error. Please try again.'));

      if (source === 'camera') {
        setTimeout(() => {
          processingScanRef.current = false;
          if (!streamRef.current || !videoRef.current) return;
          setScanError(null);
          startQRScanning();
          setScanState('scanning');
        }, 3000);
      } else {
        processingScanRef.current = false;
      }
    }
  };

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!manualCode.trim()) {
      setScanState('error');
      setScanError(t('attendance.codeRequired', 'Please enter a code first.'));
      return;
    }

    if (manualSubmitting) {
      return;
    }

    setManualSubmitting(true);
    processingScanRef.current = true;

    try {
      await processQRCode(manualCode.trim(), 'manual');
    } finally {
      setManualSubmitting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {t('attendance.studentOnly', 'Students only')}
          </h2>
          <p className="text-gray-400">
            {t('attendance.studentOnlyMessage', 'This section is only available to students.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-black to-red-900/20 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/30 to-red-800/30 border border-red-500/20">
              <History className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                {t('attendance.myAttendance', 'My attendance')}
              </h1>
              <p className="text-sm text-gray-400">
                {t('attendance.trackYourProgress', 'Check in and review your attendance history')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* QR Check-in Button */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 rounded-2xl border border-gray-700/50 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="flex-1 text-left">
              <h2 className="text-lg font-bold text-white mb-1">
                {t('attendance.qrCheckIn', 'QR check-in')}
              </h2>
              <p className="text-sm text-gray-300">
                {t('attendance.scanQrInstruction', 'Scan the QR code at your training location')}
              </p>
            </div>
            <button
              onClick={startCamera}
              disabled={scanState === 'scanning' || isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              {t('attendance.scanQr', 'Scan QR')}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] border border-red-500/25 bg-red-900/30 text-red-200">
              {t('attendance.tipOpenCamera', '1. Open camera')}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] border border-red-500/25 bg-red-900/30 text-red-200">
              {t('attendance.tipAlignQr', '2. Align QR inside frame')}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] border border-red-500/25 bg-red-900/30 text-red-200">
              {t('attendance.tipAutoCheckin', '3. Automatic check-in')}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            {t('attendance.scannerCompatibilityHint', 'If camera scan is unstable on your device, use manual code entry below.')}
          </p>
        </div>

        {/* Inline feedback for manual flow */}
        {!showScanner && (scanError || scanSuccess) && (
          <div
            className={`rounded-2xl border p-4 shadow-lg ${
              scanSuccess
                ? 'border-green-500/30 bg-green-900/20'
                : 'border-red-500/30 bg-red-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {scanSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-green-300 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {scanSuccess || scanError}
                </p>
              </div>
              <button
                onClick={() => {
                  setScanError(null);
                  setScanSuccess(null);
                  if (scanState !== 'idle') setScanState('idle');
                }}
                className="text-gray-300 hover:text-white transition-colors"
                aria-label={t('common.close', 'Close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Manual code fallback */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 rounded-2xl border border-gray-700/50 p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-red-400" />
            {t('attendance.manualCode', 'Manual code entry')}
          </h2>

          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value.toUpperCase())}
              placeholder={t('attendance.manualCodePlaceholder', 'Example: HAMARR-ABC123')}
              className="flex-1 px-4 py-3.5 bg-gray-900 border border-gray-700 text-white rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 font-mono"
              disabled={isProcessing}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />

            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {manualSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('attendance.processing', 'Processing...')}
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  {t('attendance.recordNow', 'Record now')}
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            {t('attendance.manualCodeHelp', 'Use the exact code shared by your instructor. Most codes start with HAMARR-.')}
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 rounded-xl border border-green-500/20 p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.attended', 'Attended')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.attended}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 rounded-xl border border-red-500/20 p-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.missed', 'Missed')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.missed}</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.rate', 'Rate')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.attendance_rate}%</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 rounded-xl border border-yellow-500/20 p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.streak', 'Streak')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.current_streak}</div>
            </div>
          </div>
        )}

        {/* Attendance History */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {t('attendance.history', 'Attendance history')}
            </h3>
            <span className="text-xs text-gray-500">
              {records.length} {t('attendance.records', 'records')}
            </span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
              <p className="text-gray-400 mt-2">{t('common.loading', 'Cargando...')}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {t('attendance.noRecords', 'You do not have any attendance records yet')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {records.map((record) => (
                <div 
                  key={record.id}
                  className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      record.attended 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {record.attended ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {record.class_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                          {record.discipline}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(record.class_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.class_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {record.location}
                        </span>
                      </div>
                    </div>
                    
                    {record.check_in_method === 'qr' && (
                      <div className="flex-shrink-0" title="QR Check-in">
                        <QrCode className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
          {/* Scanner Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">
              {t('attendance.scanningQr', 'Scanning QR...')}
            </h3>
            <button
              onClick={stopCamera}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Camera View */}
          <div className="flex-1 relative flex items-center justify-center">
            <video
              ref={videoRef}
              className="max-w-full max-h-full object-contain"
              playsInline
              muted
            >
              <track kind="captions" src="/empty.vtt" srcLang="en" label="Captions" />
            </video>
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scan Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-red-500 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-xl" />
                
                {/* Scanning line animation */}
                {scanState === 'scanning' && (
                  <div className="absolute inset-x-0 h-0.5 bg-red-500 animate-scan-line" />
                )}
              </div>
            </div>
            
            {/* Status Overlay */}
            {scanState === 'processing' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
                  <p className="text-white mt-3 font-medium">
                    {t('attendance.processing', 'Processing...')}
                  </p>
                </div>
              </div>
            )}
            
            {scanState === 'success' && scanSuccess && (
              <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                  <p className="text-white mt-3 font-medium text-lg">{scanSuccess}</p>
                </div>
              </div>
            )}
            
            {scanState === 'error' && scanError && (
              <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                <div className="text-center px-4">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <p className="text-white mt-3 font-medium">{scanError}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Scanner Footer */}
          <div className="p-4 bg-black/50 backdrop-blur-sm text-center">
            <p className="text-gray-400 text-sm">
              {t('attendance.pointAtQr', 'Point your camera at the QR code')}
            </p>
            {scannerMode === 'jsqr-fallback' && (
              <p className="text-xs text-amber-300 mt-1">
                {t('attendance.compatibilityMode', 'Compatibility mode active')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
