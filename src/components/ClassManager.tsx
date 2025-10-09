import { useState, useMemo } from 'react';
import { BookOpen, Plus, Calendar, Users, Copy, TrendingUp, List, Clock, MapPin, User, Edit, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function ClassManager() {
  const { classes, addClass } = useApp();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  // ...existing code...
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [viewMode, setViewMode] = useState<'schedule' | 'list'>('schedule');

  const [newClass, setNewClass] = useState({
    name: '',
    discipline: 'Brazilian Jiu-Jitsu',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: 'Main Dojo',
    instructor: 'Sensei Yamamoto',
    max_students: 20,
    description: '',
    is_recurring: false,
    recurrence_pattern: {
      frequency: 'weekly',
      days: [1, 3, 5],
      endDate: '',
    },
  });

  const disciplines = ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'];
  const locations = ['Main Dojo', 'Training Hall', 'Outdoor Area', 'Gym Floor'];
  const instructors = ['Sensei Yamamoto', 'Coach Miller', 'Master Chen', 'Sensei Johnson'];
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // ...existing code...

  const stats = [
    { label: 'Total Classes', value: classes.length, icon: BookOpen, color: 'text-primary' },
    { label: 'This Week', value: 24, icon: Calendar, color: 'text-info' },
  { label: 'Total Capacity', value: classes.reduce((acc, c) => acc + c.maxStudents, 0), icon: Users, color: 'text-success' },
    { label: 'Avg. Attendance', value: '89%', icon: TrendingUp, color: 'text-warning' },
  ];

  const getDisciplineColor = (discipline: string) => {
    const colors: Record<string, string> = {
      'Brazilian Jiu-Jitsu': 'badge-primary',
      'Kickboxing': 'badge-secondary',
      'Muay Thai': 'badge-accent',
      'MMA': 'badge-info',
      'Karate': 'badge-warning',
    };
    return colors[discipline] || 'badge-ghost';
  };

  const getClassStatus = (date: string, time: string) => {
    const classDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffHours = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { status: 'completed', label: 'Completed', color: 'badge-ghost' };
    if (diffHours < 1) return { status: 'ongoing', label: 'In Progress', color: 'badge-success' };
    if (diffHours < 24) return { status: 'upcoming', label: 'Today', color: 'badge-warning' };
    return { status: 'scheduled', label: 'Scheduled', color: 'badge-info' };
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesDiscipline = filterDiscipline === 'all' || cls.discipline === filterDiscipline;
      const classDay = new Date(cls.date).getDay();
      const matchesDay = filterDay === 'all' || parseInt(filterDay) === classDay;
      
      return matchesDiscipline && matchesDay;
    });
  }, [classes, filterDiscipline, filterDay]);

  const groupedByDay = useMemo(() => {
    const grouped: Record<string, typeof classes> = {};
    filteredClasses.forEach((cls) => {
      const day = new Date(cls.date).toLocaleDateString();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(cls);
    });
    return grouped;
  }, [filteredClasses]);

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.date || !newClass.time) {
      alert('Please fill in required fields');
      return;
    }

    await addClass({
      id: `${Date.now()}`,
      name: newClass.name,
      discipline: newClass.discipline,
      date: newClass.date,
      time: newClass.time,
      location: newClass.location,
      instructor: newClass.instructor,
      maxStudents: newClass.max_students,
      description: newClass.description,
      is_active: 1,
      recurrence_pattern: newClass.is_recurring ? JSON.stringify(newClass.recurrence_pattern) : null,
    });

    setShowAddModal(false);
    setNewClass({
      name: '',
      discipline: 'Brazilian Jiu-Jitsu',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      location: 'Main Dojo',
      instructor: 'Sensei Yamamoto',
      max_students: 20,
      description: '',
      is_recurring: false,
      recurrence_pattern: {
        frequency: 'weekly',
        days: [1, 3, 5],
        endDate: '',
      },
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
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-base-content">
                  Class Management
                </h1>
                <p className="text-sm text-base-content/70">
                  {classes.length} classes scheduled this week
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm">
                <Copy className="w-4 h-4" />
                Duplicate Week
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Class
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
        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 flex gap-2">
            <select 
              className="select select-bordered"
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
            >
              <option value="all">All Disciplines</option>
              {disciplines.map(disc => (
                <option key={disc} value={disc}>{disc}</option>
              ))}
            </select>

            <select 
              className="select select-bordered"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="all">All Days</option>
              {daysOfWeek.map((day, idx) => (
                <option key={day} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="btn-group">
            <button 
              className={`btn btn-sm ${viewMode === 'schedule' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('schedule')}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        {/* Classes View */}
        {viewMode === 'schedule' ? (
          <div className="space-y-6">
            {Object.entries(groupedByDay).map(([day, dayClasses]) => (
              <div key={day}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">
                    {new Date(day).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <span className="badge badge-ghost">{dayClasses.length} classes</span>
                </div>
                
                <div className="grid gap-3">
                  {dayClasses.sort((a, b) => a.time.localeCompare(b.time)).map((cls) => {
                    const status = getClassStatus(cls.date, cls.time);
                    return (
                      <div key={cls.id} className="card bg-base-200 hover:bg-base-300 transition-all">
                        <div className="card-body p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-base-content">{cls.name}</h4>
                                <div className={`badge ${getDisciplineColor(cls.discipline)} badge-sm`}>
                                  {cls.discipline}
                                </div>
                                <div className={`badge ${status.color} badge-sm`}>
                                  {status.label}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-base-content/70">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{cls.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{cls.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{cls.instructor}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>15/{cls.maxStudents}</span>
                                </div>
                              </div>

                              {cls.description && (
                                <p className="text-xs text-base-content/60 mt-2">{cls.description}</p>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/attendance/${cls.id}`)}
                              >
                                Attendance
                              </button>
                              <button className="btn btn-ghost btn-sm">
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {Object.keys(groupedByDay).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                <p className="text-base-content/60">No classes scheduled</p>
                <button 
                  className="btn btn-primary btn-sm mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  Schedule First Class
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Date & Time</th>
                  <th>Location</th>
                  <th>Instructor</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => {
                  const status = getClassStatus(cls.date, cls.time);
                  return (
                    <tr key={cls.id} className="hover">
                      <td>
                        <div>
                          <div className="font-bold">{cls.name}</div>
                          <div className={`badge ${getDisciplineColor(cls.discipline)} badge-sm mt-1`}>
                            {cls.discipline}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {new Date(cls.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs opacity-60">{cls.time}</div>
                      </td>
                      <td>{cls.location}</td>
                      <td>{cls.instructor}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          15/{cls.maxStudents}
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${status.color}`}>
                          {status.label}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={() => navigate(`/attendance/${cls.id}`)}
                          >
                            Attendance
                          </button>
                          <button className="btn btn-ghost btn-xs">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Schedule New Class</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Class Name *</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    placeholder="e.g., Adult BJJ"
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Discipline *</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={newClass.discipline}
                    onChange={(e) => setNewClass({...newClass, discipline: e.target.value})}
                  >
                    {disciplines.map(disc => (
                      <option key={disc} value={disc}>{disc}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date *</span>
                  </label>
                  <input 
                    type="date" 
                    className="input input-bordered" 
                    value={newClass.date}
                    onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Time *</span>
                  </label>
                  <input 
                    type="time" 
                    className="input input-bordered" 
                    value={newClass.time}
                    onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Location</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={newClass.location}
                    onChange={(e) => setNewClass({...newClass, location: e.target.value})}
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Instructor</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={newClass.instructor}
                    onChange={(e) => setNewClass({...newClass, instructor: e.target.value})}
                  >
                    {instructors.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Students</span>
                  </label>
                  <input 
                    type="number" 
                    className="input input-bordered" 
                    value={newClass.max_students}
                    onChange={(e) => setNewClass({...newClass, max_students: parseInt(e.target.value)})}
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Recurring Class</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={newClass.is_recurring}
                      onChange={(e) => setNewClass({...newClass, is_recurring: e.target.checked})}
                    />
                  </label>
                </div>
              </div>

              {newClass.is_recurring && (
                <div className="alert alert-info">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Set up recurring schedule for this class</span>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered h-24" 
                  placeholder="Class description..."
                  value={newClass.description}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddClass}>
                <Plus className="w-4 h-4" />
                Schedule Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
