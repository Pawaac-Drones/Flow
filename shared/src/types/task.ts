import { Priority, TaskStatus } from './enums';

export interface ITask {
  id: string;
  projectId: string;
  epicId?: string;
  parentTaskId?: string;
  taskKey: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  labels: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  epicId?: string;
  parentTaskId?: string;
  dueDate?: string;
  labels?: string[];
}

export interface IUpdateTask {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  epicId?: string;
  parentTaskId?: string;
  dueDate?: string;
  labels?: string[];
  order?: number;
}

export interface ITaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  epicId?: string;
  labels?: string[];
  search?: string;
  page?: number;
  limit?: number;
}
