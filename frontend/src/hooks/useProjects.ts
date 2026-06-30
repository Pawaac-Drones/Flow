import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getList } from '@/lib/api';
import {
  IProject,
  ICreateProject,
  IUpdateProject,
  IProjectMember,
  IStatusWorkflow,
  ICreateStatusWorkflow,
} from '@pawaacflow/shared/types/project';

export function useProjects(projectId?: string) {
  const queryClient = useQueryClient();

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => getList<IProject>('/projects'),
  });

  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<IProject>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const createProject = useMutation({
    mutationFn: (data: ICreateProject) =>
      api.post<IProject>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: IUpdateProject }) =>
      api.put<IProject>(`/projects/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // --- Members ---
  const members = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getList<IProjectMember>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });

  const addMember = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      api.post(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

  // --- Status workflows ---
  const workflows = useQuery({
    queryKey: ['project-workflows', projectId],
    queryFn: () => getList<IStatusWorkflow>(`/projects/${projectId}/workflows`),
    enabled: !!projectId,
  });

  const addWorkflow = useMutation({
    mutationFn: (data: ICreateStatusWorkflow) =>
      api.post(`/projects/${projectId}/workflows`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows', projectId] });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: (workflowId: string) =>
      api.delete(`/projects/${projectId}/workflows/${workflowId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-workflows', projectId] });
    },
  });

  return {
    projects,
    project,
    createProject,
    updateProject,
    deleteProject,
    members,
    addMember,
    removeMember,
    workflows,
    addWorkflow,
    deleteWorkflow,
  };
}
