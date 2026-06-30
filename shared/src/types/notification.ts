import { NotificationType } from './enums';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface INotificationFilter {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}
