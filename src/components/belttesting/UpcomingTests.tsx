import { Calendar, Users, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { label } from '../../lib/i18nUtils';
import type { UpcomingTest } from '../../lib/beltTestingUtils';

interface UpcomingTestsProps {
  tests: UpcomingTest[];
}

export default function UpcomingTests({ tests }: UpcomingTestsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {tests.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center py-12">
            <Calendar className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-base-content mb-2">{label(t, 'beltTesting.upcoming.emptyTitle', 'No Upcoming Tests')}</h3>
            <p className="text-base-content/70">{label(t, 'beltTesting.upcoming.emptyMessage', 'There are no belt tests scheduled at this time.')}</p>
          </div>
        </div>
      ) : (
        tests.map((test) => (
          <div key={test.id} className="card bg-base-200 hover:bg-base-300 transition-all">
            <div className="card-body">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="badge badge-primary badge-lg">
                      {test.belt}
                    </div>
                    <div className={`badge ${
                      test.status === 'scheduled' ? 'badge-info' :
                      test.status === 'completed' ? 'badge-success' : 'badge-error'
                    }`}>
                      {label(t, `beltTesting.status.${test.status}`, test.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{test.date} {label(t, 'beltTesting.at', 'at')} {test.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-secondary" />
                      <span>{test.candidates} {label(t, 'beltTesting.candidates', 'candidates')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-accent" />
                      <span>{test.examiner}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-sm text-base-content/70">
                    <MapPin className="w-4 h-4" />
                    <span>{test.location}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm">
                    {label(t, 'beltTesting.actions.view', 'View Details')}
                  </button>
                  <button className="btn btn-outline btn-sm">
                    {label(t, 'beltTesting.actions.edit', 'Edit Test')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}