'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { getList } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { IActivityLog } from '@pawaacflow/shared/types/activity';
import { ActivityAction } from '@pawaacflow/shared/types/enums';

interface ActivityTimelineProps {
  taskId: string;
  projectId: string;
}

const actionLabels: Record<ActivityAction, string> = {
  [ActivityAction.CREATED]: 'created this task',
  [ActivityAction.UPDATED]: 'updated this task',
  [ActivityAction.DELETED]: 'deleted this task',
  [ActivityAction.STATUS_CHANGED]: 'changed status',
  [ActivityAction.ASSIGNED]: 'assigned this task',
  [ActivityAction.UNASSIGNED]: 'unassigned this task',
  [ActivityAction.COMMENTED]: 'commented',
  [ActivityAction.PRIORITY_CHANGED]: 'changed priority',
  [ActivityAction.LABEL_ADDED]: 'added a label',
  [ActivityAction.LABEL_REMOVED]: 'removed a label',
  [ActivityAction.DUE_DATE_CHANGED]: 'changed due date',
  [ActivityAction.MOVED_TO_EPIC]: 'moved to epic',
};

export function ActivityTimeline({ taskId, projectId }: ActivityTimelineProps) {
  const activities = useQuery({
    queryKey: ['activity', projectId, taskId],
    queryFn: () => getList<IActivityLog>(`/projects/${projectId}/tasks/${taskId}/activity`),
    enabled: !!projectId && !!taskId,
  });

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity</h3>

      <div className="space-y-4">
        {activities.data?.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="h-3 w-3 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">
                  {activity.userId}
                </span>{' '}
                {actionLabels[activity.action]}
                {activity.field && (
                  <span className="text-slate-500">
                    {' '}
                    from{' '}
                    <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                      {activity.oldValue}
                    </span>{' '}
                    to{' '}
                    <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                      {activity.newValue}
                    </span>
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}

        {activities.data?.length === 0 && (
          <p className="text-sm text-slate-400">No activity yet</p>
        )}
      </div>
    </div>
  );
}
