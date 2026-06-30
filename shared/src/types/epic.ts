export interface IEpic {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateEpic {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface IUpdateEpic {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}
