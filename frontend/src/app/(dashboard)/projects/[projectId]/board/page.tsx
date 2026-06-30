'use client';

import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { useTasks } from '@/hooks/useTasks';
import { useState } from 'react';
import { ITaskFilter } from '@pawaacflow/shared/types/task';

export default function BoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [filters, setFilters] = useState<ITaskFilter>({});
  const { tasks } = useTasks(projectId, filters);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Board</h1>
        <TaskFilters filters={filters} onFilterChange={setFilters} />
      </div>
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard tasks={tasks.data || []} projectId={projectId} />
      </div>
    </div>
  );
}
