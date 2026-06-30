-- Tasks table (supports subtasks via parent_task_id self-reference)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    epic_id UUID REFERENCES epics(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    task_key VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date DATE,
    labels TEXT[] DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tasks_key ON tasks(task_key);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_epic ON tasks(epic_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_reporter ON tasks(reporter_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
