import { useState } from 'react';
import React from 'react';
import { BookOpen, Plus, Calendar, Users, Copy, List, Clock, MapPin, User, Edit, TrendingUp } from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { useNavigate } from 'react-router-dom';
import { useClassFilters } from '../hooks/useClassFilters';
import { useClassStats } from '../hooks/useClassStats';
import { getDisciplineColor, getClassStatus } from '../lib/classUtils';
import { ClassFormModal } from './classes';

export default function ClassManager() {
  const {
    classes,
    createClass,
  } = useClasses();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [viewMode, setViewMode] = useState<'schedule' | 'list'>('schedule');

  const { filteredClasses, groupedByDay } = useClassFilters(classes, filterDiscipline, filterDay);
  const stats = useClassStats(classes);

  const disciplines = ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const iconMap = {
    BookOpen,
    Calendar,
    Users,
    TrendingUp,
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20 md:pb-8">
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
              <div key={idx} className="stat bg-gray-800/80 backdrop-blur rounded-lg p-3 border border-gray-700/50">
                <div className="stat-figure">
                  {React.createElement(iconMap[stat.iconName as keyof typeof iconMap], { className: `w-5 h-5 ${stat.color}` })}
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
                                  <span>15/{cls.max_students}</span>
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
                          15/{cls.max_students}
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

      <ClassFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createClass}
      />
    </div>
  );
}
