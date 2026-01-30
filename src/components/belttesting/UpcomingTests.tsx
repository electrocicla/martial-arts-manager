import { Calendar, Users, MapPin, User, Clock, Award, Eye, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import type { UpcomingTest } from '../../lib/beltTestingUtils';

interface UpcomingTestsProps {
  tests: UpcomingTest[];
}

export default function UpcomingTests({ tests }: UpcomingTestsProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'badge-info';
      case 'completed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <Award className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {tests.length === 0 ? (
        <div className="card bg-gradient-to-br from-base-200 to-base-300 border border-base-300 shadow-2xl">
          <div className="card-body items-center text-center py-20">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <Calendar className="w-20 h-20 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-3">
              {label(t, 'beltTesting.upcoming.emptyTitle', 'No Upcoming Tests')}
            </h3>
            <p className="text-base-content/70 max-w-md">
              {label(t, 'beltTesting.upcoming.emptyMessage', 'There are no belt tests scheduled at this time.')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {tests.map((test) => {
            const isUpcoming = test.status === 'scheduled';
            const cardClass = isUpcoming
              ? 'from-primary/5 to-secondary/5'
              : test.status === 'completed'
              ? 'from-success/5 to-success/10'
              : 'from-error/5 to-error/10';

            return (
              <div
                key={test.id}
                className={`card bg-gradient-to-br ${cardClass} border-2 ${
                  isUpcoming ? 'border-primary/30' : 'border-base-300'
                } shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="card-body p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Section - Main Info */}
                    <div className="flex-1 space-y-5">
                      {/* Title and Badges */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="badge badge-primary badge-lg gap-2 px-4 py-4 text-base font-bold shadow-md">
                          <Award className="w-5 h-5" />
                          {test.belt}
                        </div>
                        <div className={`badge ${getStatusColor(test.status)} badge-lg gap-2 px-4 py-4 font-semibold shadow-md`}>
                          {getStatusIcon(test.status)}
                          {label(t, `beltTesting.status.${test.status}`, test.status)}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-base-content/60 font-medium uppercase tracking-wide">
                              {label(t, 'beltTesting.date', 'Date')}
                            </div>
                            <div className="font-bold text-base-content">
                              {test.date}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                          <div className="p-2 rounded-lg bg-secondary/20">
                            <Clock className="w-5 h-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-base-content/60 font-medium uppercase tracking-wide">
                              {label(t, 'beltTesting.time', 'Time')}
                            </div>
                            <div className="font-bold text-base-content">
                              {test.time}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                          <div className="p-2 rounded-lg bg-accent/20">
                            <Users className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-base-content/60 font-medium uppercase tracking-wide">
                              {label(t, 'beltTesting.candidates', 'Candidates')}
                            </div>
                            <div className="font-bold text-base-content">
                              {test.candidates} {label(t, 'beltTesting.students', 'students')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                          <div className="p-2 rounded-lg bg-info/20">
                            <User className="w-5 h-5 text-info" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-base-content/60 font-medium uppercase tracking-wide">
                              {label(t, 'beltTesting.examiner', 'Examiner')}
                            </div>
                            <div className="font-bold text-base-content">
                              {test.examiner}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300">
                        <MapPin className="w-5 h-5 text-warning flex-shrink-0" />
                        <div>
                          <div className="text-xs text-base-content/60 font-medium uppercase tracking-wide mb-1">
                            {label(t, 'beltTesting.location', 'Location')}
                          </div>
                          <div className="font-semibold text-base-content">{test.location}</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex lg:flex-col gap-3 justify-end lg:justify-start lg:min-w-[140px]">
                      <button className="btn btn-primary gap-2 flex-1 lg:flex-none shadow-lg hover:shadow-xl">
                        <Eye className="w-5 h-5" />
                        {label(t, 'beltTesting.actions.view', 'View Details')}
                      </button>
                      {isUpcoming && (
                        <button className="btn btn-outline gap-2 flex-1 lg:flex-none shadow-md hover:shadow-lg">
                          <Edit2 className="w-5 h-5" />
                          {label(t, 'beltTesting.actions.edit', 'Edit Test')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator for upcoming tests */}
                  {isUpcoming && (
                    <div className="mt-6 pt-6 border-t border-base-300">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-base-content/70 font-medium">
                          {label(t, 'beltTesting.daysUntilTest', 'Days until test')}
                        </span>
                        <span className="font-bold text-primary">
                          {Math.ceil((new Date(test.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} {label(t, 'beltTesting.days', 'days')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
