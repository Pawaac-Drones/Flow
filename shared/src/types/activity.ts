import { ActivityAction } from './enums';

export interface IActivityLog {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  action: ActivityAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IActivityFilter {
  projectId?: string;
  taskId?: string;
  userId?: string;
  action?: ActivityAction;
  page?: number;
  limit?: number;
}
