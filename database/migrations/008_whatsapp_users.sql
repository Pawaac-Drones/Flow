-- WhatsApp user mapping table
CREATE TABLE whatsapp_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
    daily_digest_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_users_user ON whatsapp_users(user_id);
CREATE UNIQUE INDEX idx_whatsapp_users_phone ON whatsapp_users(phone_number);
CREATE INDEX idx_whatsapp_users_digest ON whatsapp_users(daily_digest_enabled) WHERE daily_digest_enabled = true;

-- Labels table for reusable labels per project
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labels_project ON labels(project_id);
CREATE UNIQUE INDEX idx_labels_project_name ON labels(project_id, name);
