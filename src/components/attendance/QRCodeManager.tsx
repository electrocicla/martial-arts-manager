/**
 * QRCodeManager Component - REDESIGNED
 * 
 * Features:
 * - Quick QR creation with preset durations (1 day, 1 week, 1 month, 1 year)
 * - Enhanced UI with proper padding and modern Tailwind design
 * - Display creation date and duration
 * - Download and manage QR codes
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  Plus,
  Download,
  Copy,
  Trash2,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Check,
  X,
  RefreshCw,
  Calendar,
  Zap,
  Timer,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import QRCodeCanvas from './QRCodeCanvas';

interface QRCodeRecord {
  id: string;
  instructor_id: string;
  instructor_name?: string;
  class_id: string | null;
  location: string;
  code: string;
  is_active: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

interface CreateQRForm {
  location: string;
  class_id: string;
  valid_from: string;
  valid_until: string;
}

type QuickDuration = '1day' | '1week' | '1month' | '1year' | 'custom';

export default function QRCodeManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [qrCodes, setQRCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<QuickDuration>('1day');
  
  const [form, setForm] = useState<CreateQRForm>({
    location: '',
    class_id: '',
    valid_from: '',
    valid_until: ''
  });

  const quickDurations = [
    { id: '1day' as QuickDuration, label: t('qr.duration.1day', '1 Day'), icon: Zap, days: 1, color: 'primary' },
    { id: '1week' as QuickDuration, label: t('qr.duration.1week', '1 Week'), icon: Calendar, days: 7, color: 'secondary' },
    { id: '1month' as QuickDuration, label: t('qr.duration.1month', '1 Month'), icon: Timer, days: 30, color: 'accent' },
    { id: '1year' as QuickDuration, label: t('qr.duration.1year', '1 Year'), icon: Clock, days: 365, color: 'info' },
  ];

  const getQuickDates = (duration: QuickDuration) => {
    const now = new Date();
    const validFrom = now.toISOString().slice(0, 16);
    
    let validUntil = '';
    switch (duration) {
      case '1day':
        validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        break;
      case '1week':
        validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        break;
      case '1month':
        validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        break;
      case '1year':
        validUntil = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        break;
      default:
        break;
    }
    
    return { validFrom, validUntil };
  };

  const handleDurationSelect = (duration: QuickDuration) => {
    setSelectedDuration(duration);
    if (duration !== 'custom') {
      const { validFrom, validUntil } = getQuickDates(duration);
      setForm(prev => ({ ...prev, valid_from: validFrom, valid_until: validUntil }));
    } else {
      setForm(prev => ({ ...prev, valid_from: '', valid_until: '' }));
    }
  };

  const fetchQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ qr_codes: QRCodeRecord[] }>('/api/attendance/qr');
      
      if (response.success && response.data) {
        setQRCodes(response.data.qr_codes || []);
      }
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      setError(t('qr.fetchError', 'Failed to load QR codes'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.location.trim()) {
      setError(t('qr.locationRequired', 'Location is required'));
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const response = await apiClient.post<{ success: boolean; qr_code: QRCodeRecord }>('/api/attendance/qr', {
        location: form.location,
        class_id: form.class_id || undefined,
        valid_from: form.valid_from || undefined,
        valid_until: form.valid_until || undefined
      });

      if (response.success && response.data?.qr_code) {
        setQRCodes(prev => [response.data!.qr_code, ...prev]);
        setSuccess(t('qr.created', 'QR code created successfully'));
        setShowCreateModal(false);
        setForm({ location: '', class_id: '', valid_from: '', valid_until: '' });
        setSelectedDuration('1day');
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || t('qr.createError', 'Failed to create the QR code'));
      }
    } catch {
      setError(t('qr.createError', 'Failed to create the QR code'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (qrId: string) => {
    if (!confirm(t('qr.confirmDelete', 'Are you sure you want to delete this QR code?'))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/attendance/qr?id=${qrId}`);
      
      if (response.success) {
        setQRCodes(prev => prev.filter(qr => qr.id !== qrId));
        setSuccess(t('qr.deleted', 'QR code deleted'));
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      setError(t('qr.deleteError', 'Failed to delete the QR code'));
    }
  };

  const handleCopyCode = async (qrCode: QRCodeRecord) => {
    try {
      if (!navigator.clipboard?.writeText) {
        setError(t('qr.copyUnavailable', 'Clipboard access is not available.'));
        return;
      }
      await navigator.clipboard.writeText(qrCode.code);
      setSuccess(t('qr.copied', 'QR code copied to clipboard'));
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Copy QR code error:', err);
      setError(t('qr.copyFailed', 'Failed to copy QR code'));
    }
  };

  const downloadQR = (qrCode: QRCodeRecord) => {
    const canvas = document.getElementById(`qr-canvas-${qrCode.id}`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `QR-${qrCode.location.replace(/\s+/g, '-')}-${qrCode.code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const getDurationLabel = (qr: QRCodeRecord) => {
    if (!qr.valid_from || !qr.valid_until) return t('qr.permanent', 'Permanent');
    
    const from = new Date(qr.valid_from);
    const until = new Date(qr.valid_until);
    const days = Math.ceil((until.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 1) return t('qr.duration.1day', '1 Day');
    if (days === 7) return t('qr.duration.1week', '1 Week');
    if (days >= 28 && days <= 31) return t('qr.duration.1month', '1 Month');
    if (days >= 365) return t('qr.duration.1year', '1 Year');
    return `${days} ${t('qr.days', 'days')}`;
  };

  if (user?.role === 'student') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-base-200 to-base-300 rounded-3xl border-2 border-base-300 shadow-2xl overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm px-6 py-6 border-b-2 border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-lg">
              <QrCode className="w-8 h-8 text-primary-content" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-base-content">
                {t('qr.title', 'Attendance QR codes')}
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                {t('qr.subtitle', 'Students scan to record attendance')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQRCodes}
              className="btn btn-ghost btn-circle btn-lg shadow-md hover:shadow-lg"
              title={t('common.refresh', 'Refresh')}
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6" />
              {t('qr.create', 'Create QR')}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="px-6">
        {error && (
          <div className="alert alert-error shadow-lg mt-6 rounded-2xl">
            <XCircle className="w-6 h-6" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-ghost btn-sm btn-circle">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success shadow-lg mt-6 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl bg-base-200 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/20">
                  <QrCode className="w-7 h-7 text-primary" />
                </div>
                <h4 className="text-2xl font-bold text-base-content">
                  {t('qr.createNew', 'Create new QR code')}
                </h4>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Location */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {t('qr.location', 'Location')}
                    <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                  className="input input-bordered input-lg w-full bg-base-300 focus:border-primary rounded-2xl"
                  placeholder={t('qr.locationPlaceholder', 'Example: Main dojo, North room')}
                  required
                />
              </div>

              {/* Quick Duration Buttons */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    {t('qr.quickDuration', 'Quick Duration')}
                  </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickDurations.map((duration) => {
                    const Icon = duration.icon;
                    return (
                      <button
                        key={duration.id}
                        type="button"
                        onClick={() => handleDurationSelect(duration.id)}
                        className={`btn btn-lg gap-2 ${
                          selectedDuration === duration.id
                            ? `btn-${duration.color} shadow-lg`
                            : 'btn-outline'
                        } rounded-2xl`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-bold">{duration.label}</div>
                          <div className="text-xs opacity-70">{duration.days}d</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Dates */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectedDuration === 'custom'}
                    onChange={(e) => handleDurationSelect(e.target.checked ? 'custom' : '1day')}
                  />
                  <span className="label-text font-semibold text-lg">
                    {t('qr.customDates', 'Custom dates')}
                  </span>
                </label>
                
                {selectedDuration === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">{t('qr.validFrom', 'Valid from')}</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={form.valid_from}
                        onChange={(e) => setForm(prev => ({ ...prev, valid_from: e.target.value }))}
                        className="input input-bordered w-full bg-base-300 focus:border-primary rounded-xl"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">{t('qr.validUntil', 'Valid until')}</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={form.valid_until}
                        onChange={(e) => setForm(prev => ({ ...prev, valid_until: e.target.value }))}
                        className="input input-bordered w-full bg-base-300 focus:border-primary rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedDuration !== 'custom' && form.valid_from && form.valid_until && (
                <div className="alert alert-info rounded-2xl">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{t('qr.validity', 'Validity Period')}</div>
                    <div className="text-sm">
                      {new Date(form.valid_from).toLocaleString()} - {new Date(form.valid_until).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost btn-lg rounded-2xl"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl rounded-2xl"
                >
                  {creating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                  {t('qr.generate', 'Generate QR')}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
            <button>close</button>
          </div>
        </div>
      )}

      {/* QR Codes Grid */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <p className="text-base-content/70 text-lg">{t('common.loading', 'Loading...')}</p>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="card bg-base-300 shadow-xl rounded-3xl">
            <div className="card-body items-center text-center py-20">
              <QrCode className="w-20 h-20 text-base-content/20 mb-4" />
              <h3 className="text-xl font-bold text-base-content mb-2">
                {t('qr.noQRCodes', 'No QR codes created yet')}
              </h3>
              <p className="text-base-content/70">
                {t('qr.createFirst', 'Create one so students can check in')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => {
              const isExpired = qr.valid_until && new Date(qr.valid_until) < new Date();
              const durationLabel = getDurationLabel(qr);
              
              return (
                <div
                  key={qr.id}
                  className={`card bg-base-300 border-2 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 rounded-3xl overflow-hidden ${
                    isExpired ? 'border-error/30 opacity-70' : 'border-base-300'
                  }`}
                >
                  <div className="card-body p-6 space-y-4">
                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div className="bg-white p-5 rounded-2xl shadow-lg">
                        <QRCodeCanvas 
                          id={`qr-canvas-${qr.id}`}
                          value={qr.code} 
                          size={160} 
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-bold text-lg text-base-content">{qr.location}</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="badge badge-lg badge-outline font-mono px-4 py-3">
                          {qr.code}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {qr.is_active && !isExpired ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-success" />
                            <span className="badge badge-success badge-lg">{t('qr.active', 'Active')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-error" />
                            <span className="badge badge-error badge-lg">
                              {isExpired ? t('qr.expired', 'Expired') : t('qr.inactive', 'Inactive')}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Duration Badge */}
                      <div className="flex items-center justify-center gap-2">
                        <Timer className="w-5 h-5 text-accent" />
                        <span className="badge badge-accent badge-lg">{durationLabel}</span>
                      </div>

                      {/* Dates */}
                      <div className="bg-base-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-base-content/70">{t('qr.created', 'Created')}</span>
                          <span className="font-semibold">{new Date(qr.created_at).toLocaleDateString()}</span>
                        </div>
                        {qr.valid_from && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-base-content/70">{t('qr.from', 'From')}</span>
                            <span className="font-semibold">{new Date(qr.valid_from).toLocaleDateString()}</span>
                          </div>
                        )}
                        {qr.valid_until && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-base-content/70">{t('qr.until', 'Until')}</span>
                            <span className="font-semibold">{new Date(qr.valid_until).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadQR(qr)}
                        className="btn btn-primary flex-1 gap-2 shadow-md hover:shadow-lg rounded-xl"
                      >
                        <Download className="w-5 h-5" />
                        {t('qr.download', 'Download')}
                      </button>
                      <button
                        onClick={() => handleCopyCode(qr)}
                        className="btn btn-secondary gap-2 shadow-md hover:shadow-lg rounded-xl"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(qr.id)}
                        className="btn btn-error gap-2 shadow-md hover:shadow-lg rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
