import { useState } from 'react';
import type { Student, StudentFormData, Discipline } from '../../types/index';
import { UserPlus, Mail, Phone, Calendar } from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<Student | null>;
}

const belts = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];
const disciplines = ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'];

export default function StudentFormModal({ isOpen, onClose, onSubmit }: StudentFormModalProps) {
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    belt: 'White',
    discipline: 'Brazilian Jiu-Jitsu',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!newStudent.name || !newStudent.email) {
      alert('Please fill in required fields');
      return;
    }

    const studentData: StudentFormData = {
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone || undefined,
      belt: newStudent.belt,
      discipline: newStudent.discipline as Discipline,
      dateOfBirth: newStudent.date_of_birth || undefined,
      emergencyContactName: newStudent.emergency_contact_name || undefined,
      emergencyContactPhone: newStudent.emergency_contact_phone || undefined,
      notes: newStudent.notes || undefined,
    };

    const result = await onSubmit(studentData);
    if (result) {
      onClose();
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        belt: 'White',
        discipline: 'Brazilian Jiu-Jitsu',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
      });
    } else {
      alert('Failed to add student');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Student</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new student profile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter student's full name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="student@example.com"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={newStudent.date_of_birth}
                      onChange={(e) => setNewStudent({...newStudent, date_of_birth: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Martial Arts Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                Martial Arts Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Belt Rank
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={newStudent.belt}
                    onChange={(e) => setNewStudent({...newStudent, belt: e.target.value})}
                  >
                    {belts.map(belt => (
                      <option key={belt} value={belt} className="bg-white dark:bg-gray-700">
                        {belt} Belt
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discipline
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={newStudent.discipline}
                    onChange={(e) => setNewStudent({...newStudent, discipline: e.target.value})}
                  >
                    {disciplines.map(disc => (
                      <option key={disc} value={disc} className="bg-white dark:bg-gray-700">
                        {disc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-red-500 rounded-full mr-3"></div>
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Emergency contact name"
                    value={newStudent.emergency_contact_name}
                    onChange={(e) => setNewStudent({...newStudent, emergency_contact_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="+1 (555) 987-6543"
                      value={newStudent.emergency_contact_phone}
                      onChange={(e) => setNewStudent({...newStudent, emergency_contact_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
                Additional Information
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                  placeholder="Any additional notes about the student..."
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 rounded-b-2xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium flex items-center space-x-2"
              onClick={handleSubmit}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}