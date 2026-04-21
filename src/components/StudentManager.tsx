import { useState, useMemo } from 'react';
import type { Student, StudentFormData, Discipline } from '../types/index';
import { Users, Search, Download, Upload, UserPlus, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { BELT_RANKINGS } from '../lib/constants';
import { StudentFormModal, StudentDetailsModal, StudentEditModal } from './students';
import DisciplineFilterChips from './students/DisciplineFilterChips';
import StudentGrid from './students/StudentGrid';
import StudentTable from './students/StudentTable';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

export default function StudentManager() {
  const { t } = useTranslation();
  const {
    students,
    stats: studentStats,
    createStudent,
    updateStudent,
    deleteStudent,
    refresh,
  } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  // Multi-select discipline filter: empty array = All.
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [filterBelt, setFilterBelt] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /** Returns every discipline a student belongs to (legacy + new array). */
  const studentDisciplines = (s: Student): string[] => {
    const arr = s.disciplines?.map(d => d.discipline) ?? [];
    if (s.discipline) arr.push(s.discipline);
    return arr;
  };

  // Calculate student counts by discipline (honors multi-discipline students)
  const disciplineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((student) => {
      const seen = new Set<string>();
      studentDisciplines(student).forEach((d) => {
        if (seen.has(d)) return;
        seen.add(d);
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    return counts;
  }, [students]);

  // Calculate student counts by belt rank (considering all disciplines)
  const beltCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((student) => {
      const belt = student.belt || 'Unknown';
      counts[belt] = (counts[belt] || 0) + 1;
    });
    return counts;
  }, [students]);

  // Get all unique belt ranks from all disciplines
  const allBeltRanks = useMemo(() => {
    const belts = new Set<string>();
    Object.values(BELT_RANKINGS).forEach((ranks) => {
      ranks.forEach((belt) => belts.add(belt));
    });
    return Array.from(belts).sort();
  }, []);

  // Get belt ranks for the currently selected discipline(s), falling back to all.
  const availableBelts = useMemo(() => {
    if (selectedDisciplines.length === 0) return allBeltRanks;
    const belts = new Set<string>();
    selectedDisciplines.forEach((d) => {
      (BELT_RANKINGS[d as Discipline] || []).forEach((b) => belts.add(b));
    });
    return belts.size > 0 ? Array.from(belts) : allBeltRanks;
  }, [selectedDisciplines, allBeltRanks]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchQuery === '' ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const studentDiscs = studentDisciplines(student);
      const matchesDiscipline =
        selectedDisciplines.length === 0 ||
        selectedDisciplines.some((d) => studentDiscs.includes(d));

      const matchesBelt =
        filterBelt === 'all' || student.belt === filterBelt;

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && student.is_active) ||
        (filterStatus === 'inactive' && !student.is_active);

      return matchesSearch && matchesDiscipline && matchesBelt && matchesStatus;
    });
  }, [students, searchQuery, selectedDisciplines, filterBelt, filterStatus]);

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
  ];

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
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                <span className="whitespace-nowrap">{t('students.actions.exportData')}</span>
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                <span className="whitespace-nowrap">{t('students.actions.importStudents')}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                <span className="whitespace-nowrap">{t('students.actions.addNewStudent')}</span>
              </Button>
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
            <div className="flex gap-3 flex-wrap">
              {/* Belt Filter with Counts - Dynamic based on discipline */}
              <select 
                className="px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={filterBelt}
                onChange={(e) => setFilterBelt(e.target.value)}
              >
                <option value="all">
                  {selectedDisciplines.length === 0
                    ? t('students.filters.allBelts')
                    : t('students.filters.allBeltsInDiscipline', { discipline: selectedDisciplines.join(', ') })}
                  {' '}({filteredStudents.length})
                </option>
                {availableBelts.map((belt: string) => (
                  <option key={belt} value={belt}>
                    {belt} ({beltCounts[belt] || 0})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
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
              <div className="flex bg-gray-900/50 border border-gray-700 rounded-xl p-1 gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  {t('students.viewModes.grid')}
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  {t('students.viewModes.list')}
                </Button>
              </div>
            </div>
          </div>

          {/* Discipline quick-filter chip bar */}
          <div className="mt-4">
            <DisciplineFilterChips
              selected={selectedDisciplines}
              counts={disciplineCounts}
              onChange={(next) => {
                setSelectedDisciplines(next);
                setFilterBelt('all');
              }}
            />
          </div>
        </div>

        {/* Students Grid/List */}
        {viewMode === 'grid' ? (
          <StudentGrid
            students={filteredStudents}
            onViewStudent={setSelectedStudent}
            onEditStudent={setEditingStudent}
          />
        ) : (
          <StudentTable
            students={filteredStudents}
            onViewStudent={setSelectedStudent}
            onEditStudent={setEditingStudent}
          />
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
          onAvatarUpdate={() => {
            refresh();
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
