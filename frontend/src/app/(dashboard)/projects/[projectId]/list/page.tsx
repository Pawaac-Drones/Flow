'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ITaskFilter } from '@pawaacflow/shared/types/task';
import { TaskStatus, Priority } from '@pawaacflow/shared/types/enums';

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'default',
  [TaskStatus.TODO]: 'info',
  [TaskStatus.IN_PROGRESS]: 'warning',
  [TaskStatus.IN_REVIEW]: 'purple',
  [TaskStatus.DONE]: 'success',
};

const priorityLabels: Record<Priority, string> = {
  [Priority.LOWEST]: 'Lowest',
  [Priority.LOW]: 'Low',
  [Priority.MEDIUM]: 'Medium',
  [Priority.HIGH]: 'High',
  [Priority.HIGHEST]: 'Highest',
};

export default function ListPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [filters, setFilters] = useState<ITaskFilter>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { tasks } = useTasks(projectId, filters);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">List View</h1>
        <div className="flex items-center gap-3">
          <TaskFilters filters={filters} onFilterChange={setFilters} />
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                Key
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                Priority
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                Assignee
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tasks.data?.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono text-slate-500">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="hover:text-primary-600"
                  >
                    {task.taskKey}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="hover:text-primary-600"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusColors[task.status] as 'default' | 'success' | 'warning' | 'info'}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {priorityLabels[task.priority]}
                </td>
                <td className="px-4 py-3">
                  {task.assigneeId ? (
                    <Avatar size="sm" name={task.assigneeId} />
                  ) : (
                    <span className="text-sm text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.data?.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No tasks found. Create your first task to get started.
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Task"
      >
        <TaskForm
          projectId={projectId}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}
