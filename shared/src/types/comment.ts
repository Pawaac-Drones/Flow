export interface ICommentAuthor {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface IComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  // Populated by the backend (relations: ['author']) on list endpoints.
  author?: ICommentAuthor;
}

export interface ICreateComment {
  content: string;
}

export interface IUpdateComment {
  content: string;
}
