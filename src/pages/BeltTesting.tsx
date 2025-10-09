import { useState, useEffect } from 'react';
import { 
  Award, Calendar, Users, Check, X, 
  AlertCircle, Clock, TrendingUp
} from 'lucide-react';
import type { Student } from '../types';

interface EligibleStudent {
  id: string;
  name: string;
  currentBelt: string;
  targetBelt: string;
  classesAttended: number;
  requiredClasses: number;
  lastPromotion: string;
  readyStatus: string;
}

interface TestHistoryRecord {
  id: string;
  belt: string;
  date: string;
  examiner: string; 
  passed: number;
  failed: number;
  total: number;
}

export default function BeltTesting() {
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const upcomingTests = [
    {
      id: 1,
      date: 'January 15, 2025',
      time: '10:00 AM',
      belt: 'Yellow Belt',
      candidates: 12,
      examiner: 'Sensei Yamamoto',
      location: 'Main Dojo',
      status: 'scheduled'
    },
    {
      id: 2,
      date: 'January 22, 2025',
      time: '2:00 PM',
      belt: 'Green Belt',
      candidates: 8,
      examiner: 'Master Chen',
      location: 'Training Hall',
      status: 'scheduled'
    },
    {
      id: 3,
      date: 'February 5, 2025',
      time: '11:00 AM',
      belt: 'Brown Belt',
      candidates: 5,
      examiner: 'Sensei Yamamoto',
      location: 'Main Dojo',
      status: 'scheduled'
    },
  ];

  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  
  useEffect(() => {
    const fetchEligibleStudents = async () => {
      try {
        const response = await fetch('/api/students');
        if (response.ok) {
          const students = await response.json();
          // Calculate eligibility based on real student data
          const eligible = students.map((student: Student) => ({
            id: student.id,
            name: student.name,
            currentBelt: student.belt,
            targetBelt: getNextBelt(student.belt),
            classesAttended: 0, // Would need attendance data
            requiredClasses: getRequiredClasses(student.belt),
            lastPromotion: 'Unknown',
            readyStatus: 'needs-evaluation'
          }));
          setEligibleStudents(eligible);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setEligibleStudents([]);
      }
    };
    
    fetchEligibleStudents();
  }, []);
  
  const getNextBelt = (currentBelt: string) => {
    const beltProgression = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'];
    const currentIndex = beltProgression.indexOf(currentBelt);
    return currentIndex < beltProgression.length - 1 ? beltProgression[currentIndex + 1] : 'Black';
  };
  
  const getRequiredClasses = (belt: string) => {
    const requirements: Record<string, number> = {
      'White': 40, 'Yellow': 50, 'Orange': 60, 'Green': 80, 'Blue': 100
    };
    return requirements[belt] || 40;
  };

  const [testHistory, setTestHistory] = useState<TestHistoryRecord[]>([]);
  
  useEffect(() => {
    // In a real app, this would fetch from database
    // For now, show empty state until real belt testing records are implemented
    setTestHistory([]);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-base-200 to-base-300 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-base-content">
                Belt Testing Management
              </h1>
              <p className="text-sm text-base-content/70">
                Schedule tests, track eligibility, and manage promotions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-figure text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="stat-title text-xs">Upcoming Tests</div>
            <div className="stat-value text-2xl">{upcomingTests.length}</div>
            <div className="stat-desc text-xs">Next: Jan 15</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-figure text-secondary">
              <Users className="w-6 h-6" />
            </div>
            <div className="stat-title text-xs">Eligible Students</div>
            <div className="stat-value text-2xl">
              {eligibleStudents.filter(s => s.readyStatus === 'ready').length}
            </div>
            <div className="stat-desc text-xs">Ready for testing</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-figure text-success">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="stat-title text-xs">Pass Rate</div>
            <div className="stat-value text-2xl">92%</div>
            <div className="stat-desc text-xs">Last 3 months</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-figure text-warning">
              <Clock className="w-6 h-6" />
            </div>
            <div className="stat-title text-xs">Avg. Time</div>
            <div className="stat-value text-2xl">4.5</div>
            <div className="stat-desc text-xs">Months between belts</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button 
            className={`tab ${selectedTab === 'upcoming' ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab('upcoming')}
          >
            Upcoming Tests
          </button>
          <button 
            className={`tab ${selectedTab === 'eligible' ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab('eligible')}
          >
            Eligible Students
          </button>
          <button 
            className={`tab ${selectedTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab('history')}
          >
            Test History
          </button>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'upcoming' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Scheduled Belt Tests</h2>
              <button className="btn btn-primary btn-sm">
                Schedule New Test
              </button>
            </div>
            
            {upcomingTests.map((test) => (
              <div key={test.id} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-2">{test.belt} Test</h3>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {test.date} at {test.time}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {test.candidates} candidates registered
                        </p>
                        <p className="text-base-content/60">
                          Examiner: {test.examiner} • {test.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm">Edit</button>
                      <button className="btn btn-primary btn-sm">View Details</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'eligible' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Students Ready for Promotion</h2>
              <button className="btn btn-primary btn-sm">
                Check All Eligibility
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Current/Target</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudents.map((student) => (
                    <tr key={student.id} className="hover">
                      <td>
                        <div className="font-bold">{student.name}</div>
                        <div className="text-xs opacity-60">
                          Last promotion: {student.lastPromotion}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`badge ${getBeltColor(student.currentBelt)}`}>
                            {student.currentBelt}
                          </div>
                          <span>→</span>
                          <div className={`badge ${getBeltColor(student.targetBelt)}`}>
                            {student.targetBelt}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <progress 
                            className="progress progress-primary w-20" 
                            value={student.classesAttended} 
                            max={student.requiredClasses}
                          ></progress>
                          <span className="text-xs">
                            {student.classesAttended}/{student.requiredClasses}
                          </span>
                        </div>
                      </td>
                      <td>
                        {student.readyStatus === 'ready' && (
                          <div className="badge badge-success gap-1">
                            <Check className="w-3 h-3" /> Ready
                          </div>
                        )}
                        {student.readyStatus === 'almost-ready' && (
                          <div className="badge badge-warning gap-1">
                            <AlertCircle className="w-3 h-3" /> Almost
                          </div>
                        )}
                        {student.readyStatus === 'needs-classes' && (
                          <div className="badge badge-error gap-1">
                            <X className="w-3 h-3" /> Not Ready
                          </div>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-xs">Schedule Test</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Past Belt Tests</h2>
              <button className="btn btn-ghost btn-sm">
                Export History
              </button>
            </div>
            
            {testHistory.map((test) => (
              <div key={test.id} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{test.belt}</h3>
                      <p className="text-sm text-base-content/60 mt-1">
                        {test.date} • Examiner: {test.examiner}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-4 mb-2">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-success">{test.passed}</p>
                          <p className="text-xs">Passed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-error">{test.failed}</p>
                          <p className="text-xs">Failed</p>
                        </div>
                      </div>
                      <div className="text-xs text-base-content/60">
                        Success Rate: {Math.round((test.passed / test.total) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
