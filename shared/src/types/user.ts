import { Role } from './enums';

export interface IUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  email: string;
  password: string;
  displayName: string;
  role?: Role;
}

export interface IUpdateUser {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: Role;
  isActive?: boolean;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}
