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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setScanState('scanning');
      setScanError(null);
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
      setScanError(t('attendance.cameraError', 'No se pudo acceder a la cámara. Verifica los permisos.'));
      setScanState('error');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setShowScanner(false);
    setScanState('idle');
  };

  const startQRScanning = () => {
    // Check if BarcodeDetector is available (modern browsers)
    if ('BarcodeDetector' in window) {
      scanWithBarcodeDetector();
    } else {
      // Fallback: use a polling mechanism that sends frames to backend
      scanWithCanvasFallback();
    }
  };

  const scanWithBarcodeDetector = async () => {
    const BarcodeDetectorClass = (window as unknown as Record<string, unknown>).BarcodeDetector as new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
    const barcodeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
    
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      
      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const qrValue = barcodes[0].rawValue;
          if (qrValue) {
            await processQRCode(qrValue);
          }
        }
      } catch (err) {
        // Silently ignore scan errors
        console.debug('Scan frame error:', err);
      }
    }, 250);
  };

  const scanWithCanvasFallback = () => {
    // Simple fallback that captures frames and could send to server for processing
    // For now, we'll show a message that the browser doesn't support QR scanning
    setScanError(t('attendance.qrNotSupported', 'Tu navegador no soporta escaneo QR. Intenta con Chrome o Edge.'));
    setScanState('error');
    stopCamera();
  };

  const processQRCode = async (qrValue: string) => {
    // Stop scanning while processing
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setScanState('processing');
    
    try {
      const response = await apiClient.post<{ 
        success: boolean; 
        message: string;
        attendance?: AttendanceRecord;
      }>('/api/student/attendance/check-in', {
        qr_code: qrValue,
        timestamp: new Date().toISOString(),
      });
      
      if (response.success && response.data?.success) {
        setScanState('success');
        setScanSuccess(response.data.message || t('attendance.checkInSuccess', '¡Asistencia registrada!'));
        
        // Refresh attendance list
        await fetchAttendance();
        
        // Close scanner after delay
        setTimeout(() => {
          stopCamera();
          setScanSuccess(null);
        }, 2000);
      } else {
        setScanState('error');
        setScanError(response.data?.message || response.error || t('attendance.checkInError', 'Error al registrar asistencia'));
        
        // Resume scanning after error
        setTimeout(() => {
          setScanError(null);
          startQRScanning();
          setScanState('scanning');
        }, 3000);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setScanState('error');
      setScanError(t('attendance.networkError', 'Error de conexión. Intenta nuevamente.'));
      
      setTimeout(() => {
        setScanError(null);
        startQRScanning();
        setScanState('scanning');
      }, 3000);
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
            {t('attendance.studentOnly', 'Solo para estudiantes')}
          </h2>
          <p className="text-gray-400">
            {t('attendance.studentOnlyMessage', 'Esta sección es exclusiva para estudiantes.')}
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
                {t('attendance.myAttendance', 'Mi Asistencia')}
              </h1>
              <p className="text-sm text-gray-400">
                {t('attendance.trackYourProgress', 'Registra tu asistencia y revisa tu historial')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* QR Check-in Button */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-white mb-1">
                {t('attendance.qrCheckIn', 'Check-in con QR')}
              </h2>
              <p className="text-sm text-gray-400">
                {t('attendance.scanQrInstruction', 'Escanea el código QR en tu lugar de entrenamiento')}
              </p>
            </div>
            <button
              onClick={startCamera}
              disabled={scanState === 'scanning' || scanState === 'processing'}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <QrCode className="w-5 h-5" />
              {t('attendance.scanQr', 'Escanear QR')}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 rounded-xl border border-green-500/20 p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.attended', 'Asistidas')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.attended}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 rounded-xl border border-red-500/20 p-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.missed', 'Faltadas')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.missed}</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.rate', 'Porcentaje')}</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.attendance_rate}%</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 rounded-xl border border-yellow-500/20 p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">{t('attendance.streak', 'Racha')}</span>
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
              {t('attendance.history', 'Historial de Asistencia')}
            </h3>
            <span className="text-xs text-gray-500">
              {records.length} {t('attendance.records', 'registros')}
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
                {t('attendance.noRecords', 'Aún no tienes registros de asistencia')}
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
              {t('attendance.scanningQr', 'Escaneando QR...')}
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
            />
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
                    {t('attendance.processing', 'Procesando...')}
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
              {t('attendance.pointAtQr', 'Apunta la cámara hacia el código QR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
