import { Award, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '../ui/Card';

export interface TrainingDisciplineEntry {
  id: string;
  discipline: string;
  belt: string;
}

interface TrainingSummaryPanelProps {
  disciplines: TrainingDisciplineEntry[];
}

export default function TrainingSummaryPanel({ disciplines }: TrainingSummaryPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-yellow-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">{t('profileV2.training.title', 'Training assignments')}</h2>
            <p className="text-sm text-gray-400">{t('profileV2.training.subtitle', 'Disciplines and ranks are managed by instructors.')}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {disciplines.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {disciplines.map((discipline) => (
              <div key={discipline.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                <div className="text-sm font-semibold text-white">{discipline.discipline || t('profileV2.training.unassignedDiscipline', 'Unassigned discipline')}</div>
                <div className="mt-1 text-sm text-gray-400">{discipline.belt || t('profileV2.training.rankNotAssigned', 'Rank not assigned')}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-400">
            {t('profileV2.training.empty', 'No training assignments have been linked to this account yet.')}
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" />
          <p className="text-sm text-emerald-100">
            {t('profileV2.training.staffControlNote', 'Rank changes stay under instructor control, while contact and emergency details remain editable here.')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}