'use client';

import Link from 'next/link';
import { Calendar, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { ITask } from '@pawaacflow/shared/types/task';
import { Priority } from '@pawaacflow/shared/types/enums';

interface TaskCardProps {
  task: ITask;
}

const priorityColors: Record<Priority, 'danger' | 'warning' | 'default' | 'info' | 'success'> = {
  [Priority.HIGHEST]: 'danger',
  [Priority.HIGH]: 'danger',
  [Priority.MEDIUM]: 'warning',
  [Priority.LOW]: 'info',
  [Priority.LOWEST]: 'default',
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-mono text-slate-400">{task.taskKey}</span>
          <Badge variant={priorityColors[task.priority]} size="sm">
            {task.priority}
          </Badge>
        </div>

        <h4 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">
          {task.title}
        </h4>

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
          {task.assigneeId && <Avatar size="sm" name={task.assigneeId} />}
        </div>
      </div>
    </Link>
  );
}
