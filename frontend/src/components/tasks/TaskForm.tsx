'use client';

import { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { TaskStatus, Priority } from '@pawaacflow/shared/types/enums';
import { useTasks } from '@/hooks/useTasks';

interface TaskFormProps {
  projectId: string;
  onSuccess?: () => void;
}

const statusOptions = Object.values(TaskStatus).map((s) => ({
  value: s,
  label: s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const priorityOptions = Object.values(Priority).map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

export function TaskForm({ projectId, onSuccess }: TaskFormProps) {
  const { createTask } = useTasks(projectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask.mutateAsync({
      title,
      description: description || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
      labels: labels ? labels.split(',').map((l) => l.trim()) : undefined,
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field min-h-[80px]"
          placeholder="Describe the task..."
        />
      </div>
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
      <Input
        label="Due date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <Input
        label="Labels (comma-separated)"
        value={labels}
        onChange={(e) => setLabels(e.target.value)}
        placeholder="bug, frontend, urgent"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={createTask.isPending}>
          {createTask.isPending ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
