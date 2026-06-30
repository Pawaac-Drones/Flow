import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getList } from '@/lib/api';
import { ITask, ICreateTask, IUpdateTask, ITaskFilter } from '@pawaacflow/shared/types/task';

export function useTasks(
  projectId?: string,
  filters?: ITaskFilter,
  taskId?: string,
  parentTaskId?: string
) {
  const queryClient = useQueryClient();

  const buildQueryString = (params: ITaskFilter = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.assigneeId) searchParams.set('assigneeId', params.assigneeId);
    if (params.search) searchParams.set('search', params.search);
    if (params.epicId) searchParams.set('epicId', params.epicId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  };

  const tasks = useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () =>
      getList<ITask>(`/projects/${projectId}/tasks${buildQueryString(filters)}`),
    enabled: !!projectId,
  });

  const task = useQuery({
    queryKey: ['task', projectId, taskId],
    queryFn: () => {
      // When projectId is available, use the project-scoped route
      if (projectId) {
        return api.get<ITask>(`/projects/${projectId}/tasks/${taskId}`);
      }
      // Otherwise use the convenience lookup route
      return api.get<ITask>(`/tasks/${taskId}`);
    },
    enabled: !!taskId,
  });

  const subtasks = useQuery({
    queryKey: ['subtasks', projectId, parentTaskId],
    queryFn: () => {
      if (projectId) {
        return getList<ITask>(`/projects/${projectId}/tasks/${parentTaskId}/subtasks`);
      }
      return getList<ITask>(`/tasks/${parentTaskId}/subtasks`);
    },
    enabled: !!parentTaskId,
  });

  const createTask = useMutation({
    mutationFn: (data: ICreateTask) =>
      api.post<ITask>(`/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      if (parentTaskId) {
        queryClient.invalidateQueries({ queryKey: ['subtasks', projectId, parentTaskId] });
      }
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId: tid, data }: { taskId: string; data: IUpdateTask }) => {
      if (projectId) {
        return api.patch<ITask>(`/projects/${projectId}/tasks/${tid}`, data);
      }
      return api.patch<ITask>(`/tasks/${tid}`, data);
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', projectId, updatedTask?.id] });
      if (parentTaskId) {
        queryClient.invalidateQueries({ queryKey: ['subtasks', projectId, parentTaskId] });
      }
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskIdToDelete: string) => {
      if (projectId) {
        return api.delete(`/projects/${projectId}/tasks/${taskIdToDelete}`);
      }
      return api.delete(`/tasks/${taskIdToDelete}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  return {
    tasks,
    task,
    subtasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
