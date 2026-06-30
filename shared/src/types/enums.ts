export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export enum Priority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
}

export enum Role {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum ActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMMENTED = 'commented',
  PRIORITY_CHANGED = 'priority_changed',
  LABEL_ADDED = 'label_added',
  LABEL_REMOVED = 'label_removed',
  DUE_DATE_CHANGED = 'due_date_changed',
  MOVED_TO_EPIC = 'moved_to_epic',
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_COMMENTED = 'task_commented',
  TASK_MENTIONED = 'task_mentioned',
  PROJECT_INVITATION = 'project_invitation',
}
