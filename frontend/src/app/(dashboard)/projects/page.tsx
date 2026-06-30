'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useProjects } from '@/hooks/useProjects';

export default function ProjectsPage() {
  const { projects, createProject } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({ name, key, description });
    setShowCreateModal(false);
    setName('');
    setKey('');
    setDescription('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.data?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {project.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {project.key}
                </p>
                {project.description && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {projects.data?.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No projects yet</h3>
          <p className="text-slate-500 mt-1">Create your first project to get started</p>
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            required
          />
          <Input
            label="Project key"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="PROJ"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
