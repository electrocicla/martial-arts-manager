/**
 * QRScanner Component
 * 
 * Allows students to scan QR codes to record attendance
 * Automatically detects and records the date and time of the scan
 */

import { useState, useRef, useEffect } from 'react';
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

interface ScanResult {
  success: boolean;
  message: string;
  location?: string;
  timestamp?: string;
}

export default function QRScanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const saveToRecentScans = (scan: ScanResult) => {
    const updated = [scan, ...recentScans].slice(0, 10);
    setRecentScans(updated);
    localStorage.setItem('recentScans', JSON.stringify(updated));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setScanning(true);
    } catch (error) {
      console.error('Camera error:', error);
      setResult({
        success: false,
        message: t('qr.scanner.cameraError', 'Could not access camera. Please allow camera permissions or enter code manually.')
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
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

  const submitAttendance = async (code: string) => {
    setSubmitting(true);
    setResult(null);

    try {
      const now = new Date();
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        location?: string;
        attendance?: {
          id: string;
          student_id: string;
          class_id: string;
          attendance_date: string;
          scan_time: string;
        };
      }>('/api/attendance/scan', {
        qr_code: code,
        scan_time: now.toISOString(),
      });

      const scanResult: ScanResult = {
        success: response.success,
        message: response.data?.message || (response.success 
          ? t('qr.scanner.success', 'Attendance recorded successfully') 
          : t('qr.scanner.failed', 'Failed to record attendance')),
        location: response.data?.location,
        timestamp: now.toISOString(),
      };

      setResult(scanResult);
      
      if (response.success) {
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
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
              
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="btn btn-primary btn-lg w-full gap-3 shadow-lg hover:shadow-xl rounded-2xl"
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
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder={t('qr.scanner.codePlaceholder', 'Enter QR code here...')}
                    className="input input-bordered input-lg w-full bg-base-300 focus:border-primary rounded-2xl font-mono text-center text-xl"
                    disabled={submitting}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !manualCode.trim()}
                  className="btn btn-secondary btn-lg w-full gap-3 shadow-lg hover:shadow-xl rounded-2xl"
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
