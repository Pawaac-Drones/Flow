'use client';

import { KanbanColumn } from './KanbanColumn';
import { ITask } from '@pawaacflow/shared/types/task';
import { TaskStatus } from '@pawaacflow/shared/types/enums';
import { useTasks } from '@/hooks/useTasks';

interface KanbanBoardProps {
  tasks: ITask[];
  projectId: string;
}

const columns: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

export function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const { updateTask } = useTasks(projectId);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    updateTask.mutate({ taskId, data: { status: newStatus } });
  };

  return (
    <div className="flex gap-4 h-full pb-4">
      {columns.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={getTasksByStatus(status)}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
