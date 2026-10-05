# Code Collaborative Review API

A Node.js, TypeScript, and PostgreSQL project for managing collaborative code review workflows. The application allows teams to create projects, invite members, submit code for review, comment on submissions, approve or request changes, and monitor project activity through project statistics and notifications.

## Features

- User registration and login with JWT-based authentication
- Create and manage projects
- Add and remove project members
- Submit code for review with metadata such as title, language, and filename
- Track submission status: pending, in review, approved, and changes requested
- Add comments to submissions and review discussion threads
- Request changes or approve a submission
- Receive notifications for comments and review decisions
- View project-level statistics and reviewer activity
- Get real-time updates through a WebSocket notification server

## Technologies

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- pg (PostgreSQL client)
- JWT authentication
- WebSocket server (`ws`)

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or later
- PostgreSQL 14+ installed and running
- pgAdmin 4 or `psql` for database management

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd code-collaborative-review
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a PostgreSQL database

Create an empty PostgreSQL database, for example:

```sql
CREATE DATABASE code_review_db;
```

### 4. Configure environment variables

Create a `.env` file in the project root with values similar to:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=code_review_db
JWT_SECRET=your_secret_key
```

> The app reads PostgreSQL connection values from the standard PostgreSQL environment variables and uses `JWT_SECRET` for authentication.

### 5. Create the database schema

Run the SQL files in this repository in order from the `sql/` folder:

```bash
psql -U postgres -d code_review_db -f sql/001_create_users.sql
psql -U postgres -d code_review_db -f sql/002_create_projects.sql
psql -U postgres -d code_review_db -f sql/003_create_submissions.sql
psql -U postgres -d code_review_db -f sql/004_create_comments.sql
psql -U postgres -d code_review_db -f sql/005_create_project_members.sql
psql -U postgres -d code_review_db -f sql/006_create_reviews.sql
psql -U postgres -d code_review_db -f sql/007_create_notifications
```

## Run the Project

Start the server in development mode:

```bash
npm run dev
```

Or run it directly:

```bash
npm start
```

The API will be available at:

```text
http://localhost:3000
```

## Project Structure

```text
code-collaborative-review/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── server.ts
├── sql/
│   ├── 001_create_users.sql
│   ├── 002_create_projects.sql
│   ├── 003_create_submissions.sql
│   ├── 004_create_comments.sql
│   ├── 005_create_project_members.sql
│   ├── 006_create_reviews.sql
│   └── 007_create_notifications
├── docs/
│   └── project-statistics.md
├── package.json
├── tsconfig.json
├── README.md
└── .env
```

## Database Schema

### Users

Stores user account details and role information.

- `id`
- `name`
- `email`
- `password_hash`
- `role` (`submitter` or `reviewer`)
- `display_picture_url`
- `created_at`

### Projects

Stores project metadata and the owner relationship.

- `id`
- `name`
- `description`
- `owner_id`
- `created_at`

### Project Members

Links users to projects as members.

- `id`
- `project_id`
- `user_id`
- `joined_at`

### Submissions

Represents code submitted for review.

- `id`
- `project_id`
- `submitter_id`
- `title`
- `code`
- `language`
- `filename`
- `status`
- `created_at`

### Comments

Stores feedback left on a submission.

- `id`
- `submission_id`
- `reviewer_id`
- `content`
- `line_number`
- `created_at`
- `updated_at`

### Reviews

Stores the final review decision for a submission.

- `id`
- `submission_id`
- `reviewer_id`
- `action` (`approved` or `changes_requested`)
- `notes`
- `created_at`

### Notifications

Tracks user notifications for project activity.

- `id`
- `user_id`
- `project_id`
- `submission_id`
- `type`
- `message`
- `is_read`
- `created_at`

## API Overview

The application exposes REST endpoints for authentication, project management, submissions, comments, reviews, and statistics.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### User Profiles

All profile routes require an Authorization header containing Bearer followed by a valid login token. The URL ID must match the logged-in user's ID.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/users/:id | Read your own profile |
| PUT | /api/users/:id | Update your name, email, and display picture URL |
| DELETE | /api/users/:id | Delete your own account |

Registration creates accounts through POST /api/auth/register. Profile responses never include passwords or password hashes.

PUT requires name and email. The optional display_picture_url must be an HTTP/HTTPS URL; null or omission clears the picture. This route does not change roles or passwords.

Successful deletion returns 204 with no body. Deletion returns 409 when other records still reference the account. Tokens for a deleted account are rejected on subsequent authenticated HTTP requests.

### Notification Feed

- GET /api/users/:id/notifications

Requires the recipient's Bearer token. Returns the latest 50 notifications, newest first, in a notifications array. Users can read only their own feed, and activity from projects they can no longer access is excluded.

Notifications are saved for the submission's author when another user comments, approves, or requests changes. Users are not notified about their own actions. The is_read field is stored, but a mark-as-read endpoint is not implemented.

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`
- `GET /api/projects/:id/submissions`
- `GET /api/projects/:id/stats`

### Submissions

- `POST /api/submissions`
- `GET /api/submissions/:id`
- `PUT /api/submissions/:id/status`
- `DELETE /api/submissions/:id`

### Comments

- `POST /api/submissions/:id/comments`
- `GET /api/submissions/:id/comments`
- `PUT /api/comments/:id`
- `DELETE /api/comments/:id`

### Reviews

- `POST /api/submissions/:id/approve`
- `POST /api/submissions/:id/request-changes`
- `GET /api/submissions/:id/reviews`

## WebSocket Notifications

Connect a plain WebSocket client to:

```text
ws://localhost:3000/ws
```

1. Log in through POST /api/auth/login and copy the returned token without quotation marks.
2. Create a WebSocket request in a client that supports custom handshake headers, such as Postman. Do not select Socket.IO.
3. Before connecting, add the Authorization header with the value Bearer YOUR_TOKEN.
4. Connect. A successful connection receives a JSON message containing type: connected and the authenticated userId.
5. Keep that connection open while a reviewer comments on or reviews that user's submission.

A live notification has this structure (illustrative values):

```json
{
  "type": "notification",
  "notification": {
    "id": 12,
    "user_id": 3,
    "project_id": 1,
    "submission_id": 4,
    "type": "comment_added",
    "message": "Someone commented on your submission",
    "is_read": false,
    "created_at": "2026-10-05T10:00:00.000Z"
  }
}
```

Event notification types are comment_added, review_approved, and changes_requested. Delivery occurs only after the database transaction commits and checks the recipient's current project access. Multiple connections belonging to that recipient can receive the event.

Missing or invalid tokens are rejected with HTTP 401 during the handshake. Login tokens expire after one hour; an established connection closes with code 1008 when its token expires. Log in again and reconnect with the new token.

Live delivery is best effort. Offline users can retrieve saved notifications from the REST feed; reconnecting does not replay missed events automatically. Connection tracking is in memory for one server process.

The browser-native WebSocket API cannot set the required Authorization header. Use a header-capable client for the current implementation. Keep tokens private and remove them from shared screenshots or exported collections.

## Testing

Run the TypeScript check:

```bash
npm run typecheck
```

Follow the [manual API and WebSocket testing checklist](docs/testing-checklist.md) and record the actual results. A passing type check does not prove that database queries, permissions, or notification delivery work. The checklist starts with tests marked not run.

See [project statistics definitions](docs/project-statistics.md) for how averages, percentages, and reviewer activity are calculated.

## Example Workflow

1. Register or log in as a user.
2. Create a project.
3. Add team members to the project.
4. Submit code for review.
5. Reviewers leave comments and approve or request changes.
6. Notifications are generated for the submission author when someone else provides feedback.
7. Use project statistics to view review metrics and activity.

## Health Check

The server exposes a simple health endpoint:

```bash
GET /api/health
```

Example response:

```json
{
  "message": "Code review API is running"
}
```

## Notes

- The project uses PostgreSQL foreign keys and cascading deletion rules to keep related records consistent.
- Project statistics are computed from the current database state and are exposed through the project stats endpoint.
- The app includes a real-time notification layer using WebSockets.

## Author

Created for a collaborative review and project management workflow.
