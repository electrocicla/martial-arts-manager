import { useState } from 'react';
import type { Student } from '../../types/index';
import { X, Edit2, Trash2, Mail, Phone, Calendar, User, AlertTriangle, Camera, DollarSign } from 'lucide-react';
import { getBeltColor } from '../../lib/studentUtils';
import { useTranslation } from 'react-i18next';
import StudentPaymentHistory from './StudentPaymentHistory';

interface StudentDetailsModalProps {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onAvatarUpdate?: () => void;
}

export default function StudentDetailsModal({ student, onClose, onEdit, onDelete, onAvatarUpdate }: StudentDetailsModalProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    const confirmWords = ['delete', 'borrar', 'DELETE', 'BORRAR'];
    if (confirmWords.includes(deleteConfirmText.trim())) {
      onDelete(student.id);
      onClose();
    } else {
      alert(t('students.deleteConfirmError') || 'Please type "delete" or "borrar" to confirm');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('students.invalidImageType') || 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('students.imageTooLarge') || 'Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('studentId', student.id);

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Upload to R2 via API
      const response = await fetch('/api/students/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local student object with new avatar URL
        student.avatar_url = data.avatarUrl;
        alert(t('students.avatarUploadSuccess') || 'Profile photo uploaded successfully!');
        
        if (onAvatarUpdate) {
          onAvatarUpdate();
        }
      } else {
        alert(data.error || t('students.avatarUploadError') || 'Failed to upload profile photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(t('students.avatarUploadError') || 'Failed to upload profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 px-6 py-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <User className="w-7 h-7" />
                {t('students.details.title') || 'Student Details'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white dark:border-gray-700">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    student.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                
                {/* Upload Button Overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </label>
              </div>

              {/* Student Info */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {student.name}
                </h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                  {student.disciplines && student.disciplines.length > 0 ? (
                    student.disciplines.map((disc, index) => (
                      <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getBeltColor(disc.belt)}`}>
                        {disc.belt} {t('students.belt') || 'Belt'} - {disc.discipline}
                      </span>
                    ))
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getBeltColor(student.belt)}`}>
                      {student.belt} {t('students.belt') || 'Belt'}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    student.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {student.is_active ? t('students.active') || 'Active' : t('students.inactive') || 'Inactive'}
                  </span>
                </div>
                {(!student.disciplines || student.disciplines.length === 0) && (
                  <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                    {student.discipline}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
                {t('students.details.contactInfo') || 'Contact Information'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white break-words">{student.email}</p>
                  </div>
                </div>
                {student.phone && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.phone') || 'Phone'}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{student.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Training Information */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-green-500 rounded-full mr-3" />
                {t('students.details.trainingInfo') || 'Training Information'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.joinDate') || 'Join Date'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(student.join_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {student.date_of_birth && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.dateOfBirth') || 'Date of Birth'}</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(student.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {(student.emergency_contact_name || student.emergency_contact_phone) && (
              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="w-1 h-6 bg-red-500 rounded-full mr-3" />
                  {t('students.details.emergencyContact') || 'Emergency Contact'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.emergency_contact_name && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.contactName') || 'Name'}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{student.emergency_contact_name}</p>
                      </div>
                    </div>
                  )}
                  {student.emergency_contact_phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.contactPhone') || 'Phone'}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{student.emergency_contact_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {student.notes && (
              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <div className="w-1 h-6 bg-purple-500 rounded-full mr-3" />
                  {t('students.notes') || 'Notes'}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {student.notes}
                </p>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-gray-700 shadow-xl">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-purple-600 rounded-full mr-3" />
                <DollarSign className="w-6 h-6 mr-2 text-red-400" />
                {t('payments.title') || 'Payment History'}
              </h4>
              <StudentPaymentHistory studentId={student.id} />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 rounded-b-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
            >
              {t('common.close') || 'Close'}
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteClick}
                className="px-6 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Trash2 className="w-4 h-4" />
                {t('students.deleteStudent') || 'Delete Student'}
              </button>
              
              <button
                onClick={() => onEdit(student)}
                className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Edit2 className="w-4 h-4" />
                {t('students.editStudent') || 'Edit Student'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteConfirmText('');
            }}
          />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {t('students.deleteConfirmTitle') || 'Delete Student?'}
            </h3>
            
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
              {t('students.deleteConfirmMessage') || 'This action cannot be undone. To confirm, please type'}{' '}
              <span className="font-bold text-red-600 dark:text-red-400">delete</span>{' '}
              {t('common.or') || 'or'}{' '}
              <span className="font-bold text-red-600 dark:text-red-400">borrar</span>
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={t('students.deleteConfirmPlaceholder') || 'Type here...'}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 mb-6"
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              
              <button
                onClick={handleDeleteConfirm}
                disabled={!['delete', 'borrar', 'DELETE', 'BORRAR'].includes(deleteConfirmText.trim())}
                className="flex-1 px-6 py-3 text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg focus:ring-2 focus:ring-red-500 transition-all duration-200 font-medium"
              >
                {t('students.confirmDelete') || 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
