'use client';

import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { ITask } from '@pawaacflow/shared/types/task';
import { TaskStatus, Priority } from '@pawaacflow/shared/types/enums';
import { useTasks } from '@/hooks/useTasks';

interface TaskDetailPanelProps {
  task: ITask;
}

const statusOptions = Object.values(TaskStatus).map((s) => ({
  value: s,
  label: s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const priorityOptions = Object.values(Priority).map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

export function TaskDetailPanel({ task }: TaskDetailPanelProps) {
  const { updateTask } = useTasks(task.projectId);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);

  const handleSave = async () => {
    await updateTask.mutateAsync({
      taskId: task.id,
      data: { title, description, status, priority },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setIsEditing(false);
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-slate-400">{task.taskKey}</span>
          <Badge variant="default">{task.status.replace('_', ' ')}</Badge>
        </div>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateTask.isPending}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field text-xl font-bold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field min-h-[120px]"
            placeholder="Add a description..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            />
            <Select
              label="Priority"
              options={priorityOptions}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            />
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-3">{task.title}</h1>
          {task.description ? (
            <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-slate-400 italic">No description provided</p>
          )}
        </div>
      )}
    </div>
  );
}
