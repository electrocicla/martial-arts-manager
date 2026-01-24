/**
 * QRCodeManager Component
 * 
 * Allows instructors and admins to:
 * - Create new QR codes for their locations
 * - View existing QR codes
 * - Download QR code images
 * - Deactivate/delete QR codes
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
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';

// QR Code generation using a simple library approach
// We'll use a canvas-based approach for QR generation
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

export default function QRCodeManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [qrCodes, setQRCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [form, setForm] = useState<CreateQRForm>({
    location: '',
    class_id: '',
    valid_from: '',
    valid_until: ''
  });

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
        setShowCreateForm(false);
        setForm({ location: '', class_id: '', valid_from: '', valid_until: '' });
        
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
    // Get the canvas element and download it
    const canvas = document.getElementById(`qr-canvas-${qrCode.id}`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `QR-${qrCode.location.replace(/\s+/g, '-')}-${qrCode.code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  if (user?.role === 'student') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <QrCode className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {t('qr.title', 'Attendance QR codes')}
            </h3>
            <p className="text-xs text-gray-500">
              {t('qr.subtitle', 'Students scan to record attendance')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQRCodes}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('qr.create', 'Create QR')}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md">
            <h4 className="text-lg font-bold text-white mb-4">
              {t('qr.createNew', 'Create new QR code')}
            </h4>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="qr-location" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('qr.location', 'Location')} *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="qr-location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Example: Main dojo, North room"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qr-valid-from" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('qr.validFrom', 'Valid from')}
                  </label>
                  <input
                    id="qr-valid-from"
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm(prev => ({ ...prev, valid_from: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="qr-valid-until" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('qr.validUntil', 'Valid until')}
                  </label>
                  <input
                    id="qr-valid-until"
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm(prev => ({ ...prev, valid_until: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {t('qr.validityNote', 'Leave blank to keep the QR code valid indefinitely')}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t('qr.generate', 'Generate QR')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Codes List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            <p className="text-gray-400 mt-2">{t('common.loading', 'Loading...')}</p>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">
              {t('qr.noQRCodes', 'No QR codes created yet')}
            </p>
            <p className="text-sm text-gray-500">
              {t('qr.createFirst', 'Create one so students can check in')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map((qr) => (
              <div
                key={qr.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:border-gray-600 transition-colors"
              >
                {/* QR Code Display */}
                <div className="flex justify-center mb-3">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeCanvas 
                      id={`qr-canvas-${qr.id}`}
                      value={qr.code} 
                      size={120} 
                    />
                  </div>
                </div>

                {/* QR Info */}
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-white font-medium">
                    <MapPin className="w-4 h-4 text-red-400" />
                    {qr.location}
                  </div>
                  
                  <div className="text-xs text-gray-500 font-mono">
                    {qr.code}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    {qr.is_active ? (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span>{qr.is_active ? t('qr.active', 'Active') : t('qr.inactive', 'Inactive')}</span>
                  </div>

                  {(qr.valid_from || qr.valid_until) && (
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {qr.valid_from && new Date(qr.valid_from).toLocaleDateString()}
                      {qr.valid_from && qr.valid_until && ' - '}
                      {qr.valid_until && new Date(qr.valid_until).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => downloadQR(qr)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {t('qr.download', 'Download')}
                  </button>
                  <button
                    onClick={() => handleCopyCode(qr)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {t('qr.copy', 'Copy')}
                  </button>
                  <button
                    onClick={() => handleDelete(qr.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
