import { useState, useMemo } from 'react';
import type { Student } from '../types';
import { Users, Search, Plus, Download, Upload, UserPlus, TrendingUp, Calendar, DollarSign, Mail, Phone, Eye, Edit } from 'lucide-react';
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
        const studentDate = new Date(studentData.created_at || studentData.join_date || Date.now());
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
    <div className="min-h-screen bg-base-100 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-base-content">
                  Student Management
                </h1>
                <p className="text-sm text-base-content/70">
                  {students.length} total students • {students.filter(s => s.is_active).length} active
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="btn btn-ghost btn-sm">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat bg-base-100/50 backdrop-blur rounded-lg p-3">
                <div className="stat-figure">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="stat-title text-xs">{stat.label}</div>
                <div className="stat-value text-xl">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1">
            <div className="input-group">
              <span className="bg-base-200">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search students..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select 
              className="select select-bordered"
              value={filterBelt}
              onChange={(e) => setFilterBelt(e.target.value)}
            >
              <option value="all">All Belts</option>
              {belts.map(belt => (
                <option key={belt} value={belt}>{belt}</option>
              ))}
            </select>

            <select 
              className="select select-bordered"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="btn-group">
              <button 
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
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
                        className="btn btn-ghost btn-xs"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="btn btn-ghost btn-xs">
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
                          className="btn btn-ghost btn-xs"
                          onClick={() => setSelectedStudent(student)}
                        >
                          View
                        </button>
                        <button className="btn btn-ghost btn-xs">Edit</button>
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
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Add New Student</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name *</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email *</span>
                </label>
                <input 
                  type="email" 
                  className="input input-bordered" 
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input 
                  type="tel" 
                  className="input input-bordered" 
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date of Birth</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered" 
                  value={newStudent.date_of_birth}
                  onChange={(e) => setNewStudent({...newStudent, date_of_birth: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Belt Rank</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={newStudent.belt}
                  onChange={(e) => setNewStudent({...newStudent, belt: e.target.value})}
                >
                  {belts.map(belt => (
                    <option key={belt} value={belt}>{belt}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Discipline</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={newStudent.discipline}
                  onChange={(e) => setNewStudent({...newStudent, discipline: e.target.value})}
                >
                  {disciplines.map(disc => (
                    <option key={disc} value={disc}>{disc}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Emergency Contact Name</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={newStudent.emergency_contact_name}
                  onChange={(e) => setNewStudent({...newStudent, emergency_contact_name: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Emergency Contact Phone</span>
                </label>
                <input 
                  type="tel" 
                  className="input input-bordered" 
                  value={newStudent.emergency_contact_phone}
                  onChange={(e) => setNewStudent({...newStudent, emergency_contact_phone: e.target.value})}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered h-24" 
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddStudent}>
                <Plus className="w-4 h-4" />
                Add Student
              </button>
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
              <button className="btn btn-ghost" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
              <button className="btn btn-primary">
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
