import { useState, useMemo } from 'react';
import type { Student, StudentFormData } from '../types/index';
import { Users, Search, Download, Upload, UserPlus, TrendingUp, Calendar, DollarSign, Eye, Mail, Phone, Edit } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { getBeltColor } from '../lib/studentUtils';
import { StudentFormModal, StudentDetailsModal, StudentEditModal } from './students';
import { useTranslation } from 'react-i18next';

export default function StudentManager() {
  const { t } = useTranslation();
  const {
    students,
    stats: studentStats,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelt, setFilterBelt] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
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
    if (!Array.isArray(students)) {
      return [];
    }
    
    return students.filter((student: Student) => {
      const matchesSearch = (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
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
            <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-2xl hover:shadow-red-500/20 hover:border-red-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 group-hover:text-red-300 transition-colors">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl shadow-lg group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all duration-300">
                  <stat.icon className="w-7 h-7 text-red-400 group-hover:text-red-300 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-2xl mb-6">
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select 
                className="px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={filterBelt}
                onChange={(e) => setFilterBelt(e.target.value)}
              >
                <option value="all">{t('students.filters.allBelts')}</option>
                {belts.map(belt => (
                  <option key={belt} value={belt}>{belt} Belt</option>
                ))}
              </select>

              <select 
                className="px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{t('students.filters.allStatuses')}</option>
                <option value="active">{t('students.filters.active')}</option>
                <option value="inactive">{t('students.filters.inactive')}</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  {t('students.viewModes.grid')}
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' 
                      : 'text-gray-400 hover:text-white'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents.map((student: Student) => (
              <div 
                key={student.id} 
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:scale-105"
              >
                {/* Avatar y Badge de Estado */}
                <div className="relative mb-4">
                  <div className="flex items-start justify-between">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-gray-800 group-hover:ring-red-500/30 transition-all duration-300">
                        {student.avatar_url ? (
                          <img 
                            src={student.avatar_url} 
                            alt={student.name} 
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          student.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      {/* Status Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-gray-800 ${
                        student.is_active ? 'bg-green-500' : 'bg-red-500'
                      } shadow-lg`} />
                    </div>

                    {/* Belt Badge */}
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${getBeltColor(student.belt)}`}>
                      {student.belt || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div className="space-y-3 mb-5">
                  {/* Name */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 truncate group-hover:text-red-400 transition-colors">
                      {student.name || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium truncate">
                      {student.discipline || 'N/A'}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="truncate">{student.email || 'N/A'}</span>
                    </div>
                    
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-green-400" />
                        </div>
                        <span>{student.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </div>
                      <span>{new Date(student.join_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-lg hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                  >
                    <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span>Ver</span>
                  </button>
                  
                  <button 
                    onClick={() => setEditingStudent(student)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                  >
                    <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span>Editar</span>
                  </button>
                </div>

                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-purple-500/0 group-hover:from-red-500/5 group-hover:to-purple-500/5 rounded-2xl pointer-events-none transition-all duration-300" />
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
                            {student.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{student.name || 'N/A'}</div>
                          <div className="text-xs opacity-60">{student.discipline || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${getBeltColor(student.belt)}`}>
                        {student.belt || 'N/A'}
                      </div>
                    </td>
                    <td>{student.discipline || 'N/A'}</td>
                    <td>
                      <div className="text-sm">{student.email || 'N/A'}</div>
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

      {/* View Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={(student) => {
            setSelectedStudent(null);
            setEditingStudent(student);
          }}
          onDelete={async (studentId) => {
            await deleteStudent(studentId);
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <StudentEditModal
          isOpen={true}
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSubmit={async (studentId, data) => {
            const result = await updateStudent(studentId, data as Partial<StudentFormData>);
            if (result) {
              setEditingStudent(null);
              return true;
            }
            return false;
          }}
        />
      )}
    </div>
  );
}
