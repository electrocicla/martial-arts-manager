import { useState, useMemo } from 'react';
import type { Student } from '../types/index';
import { Users, Search, Download, Upload, UserPlus, TrendingUp, Calendar, DollarSign, Mail, Phone, Eye, Edit } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { getBeltColor } from '../lib/studentUtils';
import { StudentFormModal } from './students';
import { useTranslation } from 'react-i18next';

export default function StudentManager() {
  const { t } = useTranslation();
  const {
    students,
    stats: studentStats,
    createStudent,
  } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelt, setFilterBelt] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const belts = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];

  const stats = [
    { label: t('students.stats.totalStudents'), value: studentStats?.total || students.length, icon: Users, color: 'text-primary' },
    { label: t('students.stats.active'), value: studentStats?.active || students.filter((s: Student) => s.is_active).length, icon: TrendingUp, color: 'text-success' },
    { label: t('students.stats.thisMonth'), value: students.filter((s: Student) => {
      try {
        const studentDate = new Date(s.join_date || Date.now());
        const currentDate = new Date();
        return studentDate.getMonth() === currentDate.getMonth() &&
               studentDate.getFullYear() === currentDate.getFullYear();
      } catch {
        return false;
      }
    }).length, icon: Calendar, color: 'text-info' },
    { label: t('students.stats.inactive'), value: (studentStats?.total || students.length) - (studentStats?.active || students.filter((s: Student) => s.is_active).length), icon: DollarSign, color: 'text-warning' },
  ];  const filteredStudents = useMemo(() => {
    return students.filter((student: Student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBelt = filterBelt === 'all' || student.belt === filterBelt;
      const matchesStatus = filterStatus === 'all' ||
                           (filterStatus === 'active' && student.is_active) ||
                           (filterStatus === 'inactive' && !student.is_active);

      return matchesSearch && matchesBelt && matchesStatus;
    });
  }, [students, searchQuery, filterBelt, filterStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900/10 to-black">
      {/* Professional Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-red-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {t('students.title')}
                </h1>
                <p className="text-red-200 mt-1">
                  {t('students.subtitle')}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-red-300">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    {students.length} {t('students.totalStudents')}
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {students.filter((s: Student) => s.is_active).length} {t('students.active')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">{t('students.actions.exportData')}</span>
              </button>
              <button className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">{t('students.actions.importStudents')}</span>
              </button>
              <button 
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">{t('students.actions.addNewStudent')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('students.filters.search')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select 
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={filterBelt}
                onChange={(e) => setFilterBelt(e.target.value)}
              >
                <option value="all">{t('students.filters.allBelts')}</option>
                {belts.map(belt => (
                  <option key={belt} value={belt}>{belt} Belt</option>
                ))}
              </select>

              <select 
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{t('students.filters.allStatuses')}</option>
                <option value="active">{t('students.filters.active')}</option>
                <option value="inactive">{t('students.filters.inactive')}</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  {t('students.viewModes.grid')}
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  {t('students.viewModes.list')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student: Student) => (
              <div key={student.id} className="card bg-base-200 hover:shadow-xl transition-all duration-300">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-base-content">{student.name}</h3>
                        <p className="text-xs text-base-content/60">{student.discipline}</p>
                      </div>
                    </div>
                    <div className={`badge ${getBeltColor(student.belt)} badge-sm`}>
                      {student.belt}
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2 text-base-content/70">
                        <Phone className="w-3 h-3" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(student.join_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="card-actions justify-between mt-4">
                    <div className={`badge ${student.is_active ? 'badge-success' : 'badge-error'} badge-sm`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-ghost btn-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="btn btn-ghost btn-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Belt</th>
                  <th>Discipline</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student: Student) => (
                  <tr key={student.id} className="hover">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{student.name}</div>
                          <div className="text-xs opacity-60">{student.discipline}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${getBeltColor(student.belt)}`}>
                        {student.belt}
                      </div>
                    </td>
                    <td>{student.discipline}</td>
                    <td>
                      <div className="text-sm">{student.email}</div>
                      {student.phone && <div className="text-xs opacity-60">{student.phone}</div>}
                    </td>
                    <td className="text-sm">
                      {new Date(student.join_date).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={`badge ${student.is_active ? 'badge-success' : 'badge-error'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button 
                          className="btn btn-ghost btn-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                          onClick={() => setSelectedStudent(student)}
                        >
                          View
                        </button>
                        <button className="btn btn-ghost btn-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <p className="text-base-content/60">No students found</p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <StudentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createStudent}
      />

      {/* View Student Modal */}
      {selectedStudent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Student Details</h3>
              <button 
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`badge ${getBeltColor(selectedStudent.belt)}`}>
                    {selectedStudent.belt} Belt
                  </div>
                  <div className={`badge ${selectedStudent.is_active ? 'badge-success' : 'badge-error'}`}>
                    {selectedStudent.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-base-content/60">Email:</span>
                    <p className="font-medium">{selectedStudent.email}</p>
                  </div>
                  {selectedStudent.phone && (
                    <div>
                      <span className="text-base-content/60">Phone:</span>
                      <p className="font-medium">{selectedStudent.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">Training Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-base-content/60">Discipline:</span>
                    <p className="font-medium">{selectedStudent.discipline}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Joined:</span>
                    <p className="font-medium">{new Date(selectedStudent.join_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {(selectedStudent.emergency_contact_name || selectedStudent.emergency_contact_phone) && (
                <div>
                  <h4 className="font-bold mb-2">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {selectedStudent.emergency_contact_name && (
                      <div>
                        <span className="text-base-content/60">Name:</span>
                        <p className="font-medium">{selectedStudent.emergency_contact_name}</p>
                      </div>
                    )}
                    {selectedStudent.emergency_contact_phone && (
                      <div>
                        <span className="text-base-content/60">Phone:</span>
                        <p className="font-medium">{selectedStudent.emergency_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedStudent.notes && (
                <div>
                  <h4 className="font-bold mb-2">Notes</h4>
                  <p className="text-sm text-base-content/70">{selectedStudent.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Classes Attended</div>
                  <div className="stat-value text-xl">45</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Last Payment</div>
                  <div className="stat-value text-xl">Current</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Next Test</div>
                  <div className="stat-value text-xl">Jan 15</div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
              <button className="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <Edit className="w-4 h-4" />
                Edit Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
