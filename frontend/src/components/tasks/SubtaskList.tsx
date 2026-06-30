'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus } from '@pawaacflow/shared/types/enums';
import Link from 'next/link';

interface SubtaskListProps {
  parentTaskId: string;
  projectId: string;
}

export function SubtaskList({ parentTaskId, projectId }: SubtaskListProps) {
  const { subtasks, createTask, updateTask } = useTasks(projectId, undefined, undefined, parentTaskId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTitle.trim(),
      parentTaskId,
    });
    setNewTitle('');
    setShowAddForm(false);
  };

  const toggleSubtask = (subtaskId: string, currentStatus: TaskStatus) => {
    const newStatus =
      currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    updateTask.mutate({ taskId: subtaskId, data: { status: newStatus } });
  };

  const completedCount = subtasks.data?.filter(
    (s) => s.status === TaskStatus.DONE
  ).length || 0;
  const totalCount = subtasks.data?.length || 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Subtasks</h3>
          {totalCount > 0 && (
            <span className="text-sm text-slate-400">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4">
          <div
            className="h-1.5 bg-green-500 rounded-full transition-all"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {subtasks.data?.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            <button onClick={() => toggleSubtask(subtask.id, subtask.status)}>
              {subtask.status === TaskStatus.DONE ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
            </button>
            <Link
              href={`/tasks/${subtask.id}`}
              className={`flex-1 text-sm ${
                subtask.status === TaskStatus.DONE
                  ? 'text-slate-400 line-through'
                  : 'text-slate-700'
              } hover:text-primary-600`}
            >
              {subtask.title}
            </Link>
          </div>
        ))}

        {totalCount === 0 && !showAddForm && (
          <p className="text-sm text-slate-400">No subtasks</p>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="flex gap-2 mt-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={createTask.isPending}>
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}
