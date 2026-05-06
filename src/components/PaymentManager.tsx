/**
 * PaymentManager
 *
 * Top-level admin/instructor payments page. Hosts three tabs:
 *   - Manage   → existing payment list + add form (PaymentManageView)
 *   - History  → monthly aggregated history (PaymentHistoryView)
 *   - Overdue  → students with pending monthly payments + reminder action
 *
 * SRP: only orchestrates tab selection and badge state. All view-specific
 * logic lives inside the corresponding subcomponents.
 */

import { useCallback, useState } from 'react';
import PaymentTabs, { type PaymentTabId } from './payments/PaymentTabs';
import PaymentManageView from './payments/manage/PaymentManageView';
import PaymentHistoryView from './payments/history/PaymentHistoryView';
import OverdueStudentsView from './payments/overdue/OverdueStudentsView';

export default function PaymentManager() {
  const [activeTab, setActiveTab] = useState<PaymentTabId>('manage');
  const [overdueCount, setOverdueCount] = useState<number>(0);

  const handleOverdueCountChange = useCallback((count: number) => {
    setOverdueCount(count);
  }, []);

  return (
    <div className="space-y-6">
      <PaymentTabs activeTab={activeTab} onChange={setActiveTab} overdueCount={overdueCount} />

      {activeTab === 'manage' && <PaymentManageView />}
      {activeTab === 'history' && <PaymentHistoryView />}
      {activeTab === 'overdue' && <OverdueStudentsView onCountChange={handleOverdueCountChange} />}
    </div>
  );
}
