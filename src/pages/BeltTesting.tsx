import { useState } from 'react';
import { BeltTestingHeader, UpcomingTests, EligibleStudents } from '../components/belttesting';
import { useUpcomingTests, useEligibleStudents } from '../hooks/useBeltTesting';

export default function BeltTesting() {
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const upcomingTests = useUpcomingTests();
  const eligibleStudents = useEligibleStudents();

  return (
    <div className="min-h-screen bg-gray-900 pb-20 md:pb-8">
      <BeltTestingHeader selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {selectedTab === 'upcoming' && <UpcomingTests tests={upcomingTests} />}

        {selectedTab === 'eligible' && <EligibleStudents students={eligibleStudents} />}

        {selectedTab === 'history' && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Test History</h3>
              <p className="text-base-content/70">Test history functionality coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
