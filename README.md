# PawaacFlow

A self-hosted Jira alternative for internal team/task management with an AI-powered WhatsApp integration layer. Built for teams that need unlimited users without per-seat licensing.

## Overview

PawaacFlow provides full project management capabilities (Projects, Epics, Tasks, Subtasks) with configurable workflows, role-based access control, and real-time collaboration. The unique AI + WhatsApp layer allows team members to manage tasks through natural language WhatsApp messages.

## Architecture

```
pawaacflow/
├── backend/          # NestJS API server (REST + WebSocket)
├── frontend/         # Next.js web application
├── shared/           # Shared TypeScript types and interfaces
├── database/         # SQL migration files
├── docker-compose.yml
└── .env.example
```

### System Components

- **Backend (NestJS)** - REST API, WebSocket gateway, business logic
- **Frontend (Next.js)** - Kanban board, sprint/list views, admin dashboard
- **PostgreSQL** - Primary data store
- **OpenWA** - WhatsApp gateway (self-hosted)
- **LLM Service** - Natural language parsing for WhatsApp commands

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js 22, NestJS, TypeORM, PostgreSQL |
| Frontend | Next.js 14, React, TypeScript |
| Auth | JWT with Passport.js, bcrypt |
| Real-time | Socket.IO (WebSocket) |
| WhatsApp | OpenWA (self-hosted gateway) |
| AI/NLP | OpenAI API (or compatible LLM) |
| Container | Docker, Docker Compose |

## Core Features

### Project Management
- **Projects** with configurable status workflows (Backlog, To Do, In Progress, In Review, Done)
- **Epics** for grouping related tasks within a project
- **Tasks** with subtask support, auto-generated keys (e.g., PAWAAC-104)
- **Kanban board** with drag-and-drop
- **Sprint/list view** for linear task management
- Assignees, due dates, priority levels (Lowest to Highest), labels/tags
- Comments on tasks with notifications
- Activity log/audit trail per task, project, and user
- Real-time board updates via WebSocket

### Access Control
- Role-based access: Admin, Member, Viewer
- Per-project membership and roles
- Unlimited users (no per-seat licensing)

### Notifications
- In-app notifications (real-time via WebSocket)
- Email notifications (SMTP integration via nodemailer; gracefully disabled when `SMTP_HOST` is unset)
- Assignment, status change, and comment notifications

### WhatsApp AI Integration
- Parse natural language messages into task actions
- Supported commands:
  - "mark PAWAAC-104 as done"
  - "assign drone calibration bug to Bhavesh"
  - "what's pending for me this week?"
  - "create task: fix EKF2 warning UI, priority high, assign to me"
- Phone number to user account mapping
- Confirmation replies after each action
- Optional daily digest (open tasks sent each morning)

## Self-Hosting Guide

### Prerequisites

- Docker and Docker Compose v2+
- Node.js 22+ (for local development)
- A domain or public IP (for WhatsApp webhook)
- An LLM API key (OpenAI or compatible provider)

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/pawaacflow.git
   cd pawaacflow
   ```

2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/api
   - OpenWA Dashboard: http://localhost:8080

5. Create your first admin account by calling:
   ```bash
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "admin123", "displayName": "Admin"}'
   ```
   > Note: the `register` endpoint always creates a standard `member` account
   > (the `role` field is ignored). To grant admin rights, update the user's
   > role afterwards via `PATCH /api/users/:id/role` from an existing admin,
   > or set it directly in the database for the very first user.
### Database Configuration

PawaacFlow uses plain Postgres via TypeORM, so any Postgres-compatible
provider works, including managed services like **Supabase**, RDS, or Azure
Database for PostgreSQL — not just the bundled `docker-compose` container.

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Postgres host | `postgres` (docker-compose service name) |
| `DB_PORT` | Postgres port | `5432` |
| `DB_USERNAME` | Postgres username | `pawaacflow` |
| `DB_PASSWORD` | Postgres password | `pawaacflow_secret` |
| `DB_DATABASE` | Database name | `pawaacflow` |
| `DB_SSL` | Set to `true` to enable TLS (required by most managed providers, including Supabase) | `false` |
| `DB_SSL_REJECT_UNAUTHORIZED` | Set to `false` only if the provider's cert isn't in Node's default CA store. Ignored unless `DB_SSL=true`. | `true` |
| `DB_POOL_SIZE` | Max connections in the TypeORM/pg connection pool | `10` |

All backend env vars are validated at startup (see `backend/src/config/env.validation.ts`);
missing or malformed values fail fast with a descriptive error instead of a
confusing runtime connection failure.

#### Using Supabase

1. Create a Supabase project and grab the connection details from
   **Settings → Database → Connection string**.
2. Set in `.env`:
   ```env
   DB_HOST=db.<your-project-ref>.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=<your-supabase-db-password>
   DB_DATABASE=postgres
   DB_SSL=true
   ```
3. Run the SQL files in `database/migrations/` (`001` through `009`, in
   order) against the Supabase database via the SQL Editor or `psql` — the
   `docker-entrypoint-initdb.d` auto-run only applies to the bundled
   `postgres` container on first init, not to an external database.
4. `uuid-ossp` (used for UUID primary keys) is enabled by default on Supabase;
   if a migration errors on `CREATE EXTENSION`, enable it under
   **Database → Extensions**.
5. If running the full stack via `docker-compose up`, the bundled `postgres`
   container will still start but sit unused; that's harmless, just an extra
   idle container. To skip it, run the backend/frontend outside compose or
   remove the `postgres` service from `docker-compose.yml`.



### OpenWA Setup

OpenWA is the self-hosted WhatsApp gateway that enables the AI messaging layer.

1. The OpenWA container starts automatically with `docker-compose up`
2. Access the OpenWA dashboard at http://localhost:8080
3. Scan the QR code with your WhatsApp app to link the number
4. The webhook is pre-configured to send `message.received` events to the backend

#### OpenWA Configuration

The following environment variables control OpenWA integration:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENWA_API_URL` | URL of the OpenWA instance | `http://openwa:8080` |
| `OPENWA_API_KEY` | API key for OpenWA authentication | - |
| `OPENWA_WEBHOOK_SECRET` | Shared secret for webhook verification | - |
| `OPENWA_ENABLED` | Set to `true` to mount the WhatsApp/OpenWA module (linking, verification, digest, webhook). When unset, core PM features run without it. | `false` |

#### Email (SMTP) Configuration

Email notifications are sent via SMTP using nodemailer. If `SMTP_HOST` is not
set, email delivery is silently skipped (a warning is logged once) and only
in-app + WebSocket notifications are delivered.

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host. Leave empty to disable email. | - |
| `SMTP_PORT` | SMTP server port (`465` uses TLS) | `587` |
| `SMTP_USER` | SMTP username (optional) | - |
| `SMTP_PASSWORD` | SMTP password (optional) | - |
| `SMTP_FROM` | From address for outgoing mail | `PawaacFlow <noreply@pawaacflow.local>` |

### Webhook Configuration

The backend exposes a webhook endpoint at `POST /api/openwa/webhook` that receives incoming WhatsApp messages from OpenWA.

Webhook flow:
1. User sends a WhatsApp message to the registered number
2. OpenWA forwards the `message.received` event to the backend webhook
3. Backend verifies the sender's phone number against registered users
4. The message is sent to the configured LLM with function-calling tools
5. The LLM returns structured actions (create task, update status, etc.)
6. Backend executes the action via internal services
7. A confirmation message is sent back via OpenWA's send-text API

### LLM API Key Setup

PawaacFlow uses an LLM (Large Language Model) to parse natural language WhatsApp messages into structured task operations.

1. Get an API key from your LLM provider:
   - OpenAI: https://platform.openai.com/api-keys
   - Or any OpenAI-compatible API (Azure OpenAI, Anthropic via proxy, local LLM)

2. Configure in `.env`:
   ```env
   LLM_PROVIDER=openai
   LLM_API_KEY=sk-your-api-key-here
   LLM_MODEL=gpt-4o-mini
   LLM_BASE_URL=https://api.openai.com/v1
   ```

3. For self-hosted LLMs (e.g., Ollama, vLLM), point `LLM_BASE_URL` to your local endpoint:
   ```env
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_MODEL=llama3
   ```

The LLM is called with function-calling/tool-use definitions that map to task operations. No training data leaves your infrastructure - only the current message and available function definitions are sent to the LLM.

## Development

### Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start PostgreSQL (via Docker):
   ```bash
   docker-compose up -d postgres
   ```

3. Run the backend in development mode:
   ```bash
   npm run dev:backend
   ```

4. Run the frontend in development mode:
   ```bash
   npm run dev:frontend
   ```

### Project Structure

```
backend/src/
├── main.ts                  # App bootstrap
├── app.module.ts            # Root module
├── config/                  # Configuration (DB, JWT, App)
├── entities/                # TypeORM entities
├── modules/
│   ├── auth/               # Authentication (JWT, guards, decorators)
│   ├── users/              # User management
│   ├── projects/           # Project CRUD, members, workflows
│   ├── epics/              # Epic CRUD
│   ├── tasks/              # Task CRUD, filters, subtasks
│   ├── comments/           # Task comments
│   ├── activity/           # Activity log / audit trail
│   ├── notifications/      # In-app + email notifications
│   └── realtime/           # WebSocket gateway
└── common/                 # Shared DTOs, filters, interceptors
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Public health check (`{ status, timestamp, database }`); no auth required |
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh JWT token |
| GET | /api/users | List users |
| GET | /api/users/me | Get current user |
| POST | /api/projects | Create project |
| GET | /api/projects | List projects |
| POST | /api/projects/:id/members | Add project member |
| POST | /api/projects/:id/workflows | Create status workflow |
| POST | /api/projects/:projectId/epics | Create epic |
| GET | /api/projects/:projectId/tasks | List tasks (with filters) |
| POST | /api/projects/:projectId/tasks | Create task |
| PUT | /api/projects/:projectId/tasks/:taskId | Update task |
| POST | /api/projects/:projectId/tasks/:taskId/comments | Add comment |
| GET | /api/notifications | Get notifications |
| PATCH | /api/notifications/:id/read | Mark notification as read |
| POST | /api/openwa/whatsapp-users | Link a WhatsApp number to the current user (starts unverified, returns a verification code) |
| GET | /api/openwa/whatsapp-users/me | List the current user's linked WhatsApp numbers |
| DELETE | /api/openwa/whatsapp-users/:id | Unlink a WhatsApp number |
| POST | /api/openwa/digest/opt-in | Enable the daily WhatsApp digest |
| DELETE | /api/openwa/digest/opt-out | Disable the daily WhatsApp digest |
| POST | /api/openwa/webhook | OpenWA inbound message webhook (HMAC-verified) |

> The `/api/openwa/*` routes are only available when `OPENWA_ENABLED=true`.

### WhatsApp Number Linking & Verification

1. A signed-in user links their number from the web app (WhatsApp settings):
   `POST /api/openwa/whatsapp-users` with `{ "phoneNumber": "+919876543210" }`.
   The number is stored normalized (digits only) and starts **unverified** with
   a generated verification code.
2. The user sends that verification code to the PawaacFlow WhatsApp bot.
3. The webhook handler matches the code against the pending number and marks it
   **verified**, replying with a confirmation. Only verified numbers can run
   task commands or receive the daily digest.

### WebSocket Events

Connect to `/ws` namespace:

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | Client -> Server | Authenticate with userId |
| `join-project` | Client -> Server | Subscribe to project updates |
| `task-created` | Server -> Client | New task created in project |
| `task-updated` | Server -> Client | Task updated in project |
| `task-deleted` | Server -> Client | Task deleted from project |
| `board-update` | Server -> Client | Board state changed |
| `notification` | Server -> Client | New notification for user |

## Operations, Security & Quality

### Health Check

A public, unauthenticated endpoint is available at `GET /api/health`. It returns
the service status, a timestamp, and a database connectivity indicator:

```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z", "database": "up" }
```

The `backend` service in `docker-compose.yml` defines a healthcheck against this
endpoint, and the `frontend` service waits for the backend to become healthy
(`depends_on: { backend: { condition: service_healthy } }`) before starting.

### Rate Limiting & Security Headers

- **Security headers** are applied globally via [`helmet`](https://github.com/helmetjs/helmet) (`app.use(helmet())` in `main.ts`).
- **Rate limiting** uses `@nestjs/throttler`, registered globally with a default
  of **100 requests/minute per client** and enforced by a global `ThrottlerGuard`.
- Credential endpoints are throttled more aggressively (`/api/auth/login` and
  `/api/auth/register`: 10/min; `/api/auth/refresh`: 20/min).
- The `/api/health` endpoint is excluded from throttling so healthchecks are not
  rate-limited.

### Configurable Per-Project Statuses

Task statuses are no longer hardcoded. Each project owns a set of
`StatusWorkflow` rows (managed via `GET/POST/DELETE /api/projects/:id/workflows`)
and new projects are seeded with five defaults (Backlog, To Do, In Progress, In
Review, Done).

- On task create/update, the backend validates the supplied `status` against the
  project's workflow slugs and returns `400 Bad Request` for an unknown status.
  When no status is supplied on create, the project's default status is used.
- The Kanban board renders its columns dynamically from the project's workflows
  (ordered by `order`), falling back to the five defaults when none are returned.

### Role Enforcement (Viewer = Read-Only)

Project membership roles are `admin`, `member`, and `viewer`. Viewers have
**read-only** access: any mutating, project-scoped action (task create/update/
delete, comment create/update/delete) is rejected with `403 Forbidden`. Read
operations remain available to viewers, and existing admin-only checks are
unchanged.

### Authentication Token Auto-Refresh (Frontend)

The frontend API client transparently recovers from expired access tokens: on a
`401` it makes a single `POST /auth/refresh` with the stored refresh token,
stores the new tokens, and retries the original request once. Only if the
refresh fails are tokens cleared and the user redirected to `/login`. The
refresh call itself is never retried, preventing infinite loops.

### Running Tests & Linting

```bash
# Backend unit tests (Jest)
npm run test --workspace=backend

# Lint (ESLint + Prettier rules)
npm run lint --workspace=backend
npm run lint --workspace=frontend

# Builds
npm run build --workspace=shared
npm run build --workspace=backend
npm run build --workspace=frontend
```

Backend unit tests cover the auth service (password hashing, duplicate-email
rejection, credential validation), the tasks service (task-key generation,
status validation against workflows, viewer write rejection), and the OpenWA
message handler (tool-call mapping and the unregistered-number path).

### Continuous Integration

A GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and
pull request using **Node 22**. It builds the shared package, then lints,
builds, and tests the backend, and lints and builds the frontend.

## License

MIT
