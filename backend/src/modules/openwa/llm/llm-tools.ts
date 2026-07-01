export interface LlmToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
}

export const llmTools: LlmToolSchema[] = [
  {
    name: 'create_task',
    description:
      'Create a new task in a project. The user must specify a title and optionally a project, priority, assignee, and due date.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title/name of the task to create',
        },
        projectKey: {
          type: 'string',
          description:
            'The project key (e.g., "PROJ") to create the task in. If not specified, uses the user default project.',
        },
        priority: {
          type: 'string',
          description: 'Task priority level',
          enum: ['lowest', 'low', 'medium', 'high', 'highest'],
        },
        assigneeEmail: {
          type: 'string',
          description: 'Email of the user to assign the task to',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format (YYYY-MM-DD)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the task',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task_status',
    description:
      'Update the status of an existing task. The user references the task by its key (e.g., PROJ-123).',
    parameters: {
      type: 'object',
      properties: {
        taskKey: {
          type: 'string',
          description: 'The task key (e.g., "PROJ-123")',
        },
        status: {
          type: 'string',
          description: 'The new status to set',
          enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
        },
      },
      required: ['taskKey', 'status'],
    },
  },
  {
    name: 'assign_task',
    description: 'Assign or reassign a task to a team member.',
    parameters: {
      type: 'object',
      properties: {
        taskKey: {
          type: 'string',
          description: 'The task key (e.g., "PROJ-123")',
        },
        assigneeEmail: {
          type: 'string',
          description: 'Email of the user to assign the task to',
        },
      },
      required: ['taskKey', 'assigneeEmail'],
    },
  },
  {
    name: 'query_tasks',
    description:
      'Search and filter tasks based on criteria like status, priority, assignee, or text search.',
    parameters: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Filter by project key',
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
        },
        priority: {
          type: 'string',
          description: 'Filter by priority',
          enum: ['lowest', 'low', 'medium', 'high', 'highest'],
        },
        assigneeEmail: {
          type: 'string',
          description: 'Filter by assignee email',
        },
        search: {
          type: 'string',
          description: 'Text search in task titles and descriptions',
        },
        limit: {
          type: 'string',
          description: 'Maximum number of results (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_my_pending_tasks',
    description:
      'Get all pending (non-done) tasks assigned to the current user. Use when the user asks about their open tasks, pending work, or what they need to do.',
    parameters: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Optionally filter by project key',
        },
      },
      required: [],
    },
  },
];

export function getToolSchemas() {
  return llmTools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
