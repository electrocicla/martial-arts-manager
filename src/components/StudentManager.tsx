import { useState, useMemo } from 'react';
import type { Student } from '../types';
import { Users, Search, Download, Upload, UserPlus, TrendingUp, Calendar, DollarSign, Mail, Phone, Eye, Edit } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function StudentManager() {
  const { students, addStudent } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelt, setFilterBelt] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const belts = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];
  const disciplines = ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'];

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      'White': 'badge-ghost',
      'Yellow': 'badge-warning',
      'Orange': 'badge-secondary',
      'Green': 'badge-success',
      'Blue': 'badge-info',
      'Brown': 'badge-neutral',
      'Black': 'badge-neutral'
    };
    return colors[belt] || 'badge-ghost';
  };

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-primary' },
    { label: 'Active', value: students.filter(s => s.is_active).length, icon: TrendingUp, color: 'text-success' },
    { label: 'This Month', value: students.filter(s => {
      try {
        // Cast to Student type
        const studentData = s as Student;
        const studentDate = new Date(studentData.joinDate || Date.now());
        const currentDate = new Date();
        return studentDate.getMonth() === currentDate.getMonth() && 
               studentDate.getFullYear() === currentDate.getFullYear();
      } catch {
        return false;
      }
    }).length, icon: Calendar, color: 'text-info' },
    { label: 'Inactive', value: students.filter(s => !s.is_active).length, icon: DollarSign, color: 'text-warning' },
  ];

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBelt = filterBelt === 'all' || student.belt === filterBelt;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && student.is_active) ||
                           (filterStatus === 'inactive' && !student.is_active);
      
      return matchesSearch && matchesBelt && matchesStatus;
    });
  }, [students, searchQuery, filterBelt, filterStatus]);

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email) {
      alert('Please fill in required fields');
      return;
    }

    await addStudent({
      id: `${Date.now()}`,
      ...newStudent,
      joinDate: new Date().toISOString().split('T')[0],
      is_active: 1,
    });

    setShowAddModal(false);
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Professional Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Student Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage your dojo's student roster and profiles
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {students.length} total students
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {students.filter(s => s.is_active).length} active
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Export Data</span>
              </button>
              <button className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Import Students</span>
              </button>
              <button 
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Add New Student</span>
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
                  placeholder="Search students by name, email, or belt..."
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
                <option value="all">All Belts</option>
                {belts.map(belt => (
                  <option key={belt} value={belt}>{belt} Belt</option>
                ))}
              </select>

              <select 
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                  Grid
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
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
                      <span>Joined {new Date(student.joinDate).toLocaleDateString()}</span>
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
                {filteredStudents.map((student) => (
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
                      {new Date(student.joinDate).toLocaleDateString()}
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

      {/* Add Student Modal - Professional Design */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
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
                  onClick={() => setShowAddModal(false)}
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
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium flex items-center space-x-2"
                  onClick={handleAddStudent}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <p className="font-medium">{new Date(selectedStudent.joinDate).toLocaleDateString()}</p>
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
