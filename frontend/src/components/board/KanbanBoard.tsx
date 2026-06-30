'use client';

import { useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { ITask } from '@pawaacflow/shared/types/task';
import { TaskStatus } from '@pawaacflow/shared/types/enums';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';

interface KanbanBoardProps {
  tasks: ITask[];
  projectId: string;
}

interface BoardColumn {
  slug: string;
  name: string;
  color?: string | null;
  order: number;
}

// Fallback columns used when a project has no configured status workflows yet.
const DEFAULT_COLUMNS: BoardColumn[] = [
  { slug: 'backlog', name: 'Backlog', color: '#94a3b8', order: 0 },
  { slug: 'todo', name: 'To Do', color: '#60a5fa', order: 1 },
  { slug: 'in_progress', name: 'In Progress', color: '#facc15', order: 2 },
  { slug: 'in_review', name: 'In Review', color: '#c084fc', order: 3 },
  { slug: 'done', name: 'Done', color: '#4ade80', order: 4 },
];

export function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const { updateTask } = useTasks(projectId);
  const { workflows } = useProjects(projectId);

  // Render columns dynamically from the project's configurable status
  // workflows (ordered by `order`), falling back to the default 5 columns
  // when none are configured.
  const columns = useMemo<BoardColumn[]>(() => {
    const data = workflows.data ?? [];
    if (data.length === 0) {
      return DEFAULT_COLUMNS;
    }
    return [...data]
      .sort((a, b) => a.order - b.order)
      .map((workflow) => ({
        slug: workflow.slug,
        name: workflow.name,
        color: workflow.color,
        order: workflow.order,
      }));
  }, [workflows.data]);

  const getTasksByStatus = (slug: string) => {
    return tasks.filter((task) => task.status === slug);
  };

  const handleDrop = (taskId: string, newStatus: string) => {
    updateTask.mutate({ taskId, data: { status: newStatus as TaskStatus } });
  };

  return (
    <div className="flex gap-4 h-full pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.slug}
          slug={column.slug}
          name={column.name}
          color={column.color}
          tasks={getTasksByStatus(column.slug)}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
