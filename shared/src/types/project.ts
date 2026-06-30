import { Role } from './enums';

export interface IProjectMemberUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface IProject {
  id: string;
  name: string;
  key: string;
  description?: string;
  ownerId: string;
  taskCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateProject {
  name: string;
  key: string;
  description?: string;
}

export interface IUpdateProject {
  name?: string;
  description?: string;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: Role;
  joinedAt: Date;
  // Populated by the backend (relations: ['user']) on the members endpoint.
  user?: IProjectMemberUser;
}

export interface IStatusWorkflow {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  order: number;
  color?: string;
  isDefault: boolean;
}

export interface ICreateStatusWorkflow {
  name: string;
  slug: string;
  order: number;
  color?: string;
  isDefault?: boolean;
}
