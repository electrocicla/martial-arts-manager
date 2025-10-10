import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Loader2, ChevronRight } from 'lucide-react';
import { getClassStatus } from '../../lib/dashboardUtils';

interface Class {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  max_students: number;
  instructor: string;
}

interface DashboardScheduleProps {
  todayClasses: Class[];
  isLoading: boolean;
}

export default function DashboardSchedule({ todayClasses, isLoading }: DashboardScheduleProps) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today's Schedule
        </h2>
        <button className="btn btn-ghost btn-sm text-xs sm:text-sm hover:bg-primary/10 rounded-lg transition-all duration-200" onClick={() => navigate('/calendar')}>
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-base-content/70">Loading today's classes...</span>
          </div>
        ) : todayClasses.length === 0 ? (
          <div className="card bg-base-200/50 backdrop-blur-sm border border-base-300/20 rounded-xl shadow-lg">
            <div className="card-body p-6 text-center">
              <Calendar className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
              <h3 className="font-bold text-base-content mb-2">No Classes Today</h3>
              <p className="text-sm text-base-content/60 mb-4">There are no classes scheduled for today.</p>
              <button
                onClick={() => navigate('/classes')}
                className="btn btn-primary btn-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Schedule a Class
              </button>
            </div>
          </div>
        ) : (
          todayClasses.map((cls) => {
            const status = getClassStatus(cls.date, cls.time);

            return (
              <div key={cls.id} className="card bg-base-200/50 backdrop-blur-sm border border-base-300/20 hover:bg-base-300/60 hover:border-primary/30 transition-all duration-300 active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-base-content truncate">{cls.name}</h3>
                        <div className="badge badge-sm sm:badge-md badge-primary">
                          {cls.discipline}
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-base-content/70 mb-3 font-medium">
                        {new Date(`${cls.date}T${cls.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1.5 text-base-content/60">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium">{cls.max_students}</span> max students
                        </span>
                        <span className="text-base-content/50 font-medium">
                          👨‍🏫 {cls.instructor}
                        </span>
                        <span className="text-base-content/50 font-medium">
                          📍 Main Studio
                        </span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2">
                      <div className={`badge badge-lg sm:badge-md ${
                        status === 'ongoing' ? 'badge-success' :
                        status === 'upcoming' ? 'badge-warning' :
                        'badge-ghost'
                      }`}>
                        {status === 'ongoing' ? '🔴 Live' :
                         status === 'upcoming' ? '⏰ Soon' : status}
                      </div>
                      <button
                        onClick={() => navigate(`/classes/${cls.id}`)}
                        className="btn btn-ghost btn-xs sm:btn-sm text-primary hover:bg-primary/10"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Add Class Button */}
        <div className="pt-2">
          <button className="btn btn-outline btn-primary w-full sm:w-auto rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <Calendar className="w-4 h-4" />
            Schedule New Class
          </button>
        </div>
      </div>
    </section>
  );
}