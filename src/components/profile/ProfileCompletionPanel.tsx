import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

export interface ProfileCompletionItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  icon: LucideIcon;
}

interface ProfileCompletionPanelProps {
  items: ProfileCompletionItem[];
}

export default function ProfileCompletionPanel({ items }: ProfileCompletionPanelProps) {
  const completedCount = items.filter((item) => item.complete).length;
  const completionPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Profile readiness</h2>
            <p className="text-sm text-gray-400">Keep the essentials ready for class operations.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
            <div className="text-xs text-gray-400">complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-2 overflow-hidden rounded-full bg-gray-700" aria-hidden="true">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-gray-700/70 bg-gray-900/40 p-3">
                <Icon className="mt-0.5 h-4 w-4 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
                {item.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-label="Complete" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-500" aria-label="Incomplete" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}