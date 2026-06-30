'use client';

import { useParams } from 'next/navigation';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { CommentSection } from '@/components/tasks/CommentSection';
import { ActivityTimeline } from '@/components/tasks/ActivityTimeline';
import { SubtaskList } from '@/components/tasks/SubtaskList';
import { useTasks } from '@/hooks/useTasks';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const { task } = useTasks(undefined, undefined, taskId);

  if (!task.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TaskDetailPanel task={task.data} />
          <SubtaskList parentTaskId={taskId} projectId={task.data.projectId} />
          <CommentSection taskId={taskId} projectId={task.data.projectId} />
          <ActivityTimeline taskId={taskId} projectId={task.data.projectId} />
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-slate-400">Status</dt>
                <dd className="text-sm font-medium text-slate-900 capitalize">
                  {task.data.status.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Priority</dt>
                <dd className="text-sm font-medium text-slate-900 capitalize">
                  {task.data.priority}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Assignee</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {task.data.assigneeId || 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Due Date</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {task.data.dueDate
                    ? new Date(task.data.dueDate).toLocaleDateString()
                    : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Labels</dt>
                <dd className="text-sm text-slate-900">
                  {task.data.labels?.length > 0
                    ? task.data.labels.join(', ')
                    : 'None'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Created</dt>
                <dd className="text-sm text-slate-600">
                  {new Date(task.data.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
