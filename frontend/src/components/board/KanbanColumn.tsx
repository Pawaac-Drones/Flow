'use client';

import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { ITask } from '@pawaacflow/shared/types/task';
import { TaskStatus } from '@pawaacflow/shared/types/enums';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: ITask[];
  onDrop?: (taskId: string, status: TaskStatus) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.IN_REVIEW]: 'In Review',
  [TaskStatus.DONE]: 'Done',
};

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'bg-slate-400',
  [TaskStatus.TODO]: 'bg-blue-400',
  [TaskStatus.IN_PROGRESS]: 'bg-yellow-400',
  [TaskStatus.IN_REVIEW]: 'bg-purple-400',
  [TaskStatus.DONE]: 'bg-green-400',
};

export function KanbanColumn({ status, tasks, onDrop }: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-slate-100');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-slate-100');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-100');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDrop) {
      onDrop(taskId, status);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col rounded-lg bg-slate-50 border border-slate-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-3 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <h3 className="text-sm font-semibold text-slate-700">
            {statusLabels[status]}
          </h3>
          <span className="text-xs text-slate-400 ml-auto">{tasks.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
            }}
          >
            <TaskCard task={task} />
          </div>
        ))}
      </div>
    </div>
  );
}
