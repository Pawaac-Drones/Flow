'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, List, Settings, Users } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/common/Badge';

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { project } = useProjects(projectId);

  if (!project.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const views = [
    {
      name: 'Board',
      description: 'Kanban board view with drag-and-drop',
      icon: LayoutGrid,
      href: `/projects/${projectId}/board`,
    },
    {
      name: 'List',
      description: 'Sprint/list view of all tasks',
      icon: List,
      href: `/projects/${projectId}/list`,
    },
    {
      name: 'Settings',
      description: 'Project settings and workflows',
      icon: Settings,
      href: `/projects/${projectId}/settings`,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {project.data.name}
          </h1>
          <Badge variant="default">{project.data.key}</Badge>
        </div>
        {project.data.description && (
          <p className="text-slate-600">{project.data.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {views.map((view) => (
          <Link
            key={view.name}
            href={view.href}
            className="card p-5 hover:shadow-md transition-shadow"
          >
            <view.icon className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-slate-900">{view.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{view.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
