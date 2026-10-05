# Manual API and WebSocket testing checklist

Status: NOT RUN. This is a test plan, not evidence that the tests passed.
Record the actual status, result, and date as you complete each section. Keep tokens and passwords out of screenshots and exported collections.

## Preparation

- Use a separate disposable database if you do not want test data in your existing database. Deletion tests permanently remove the test records you select.
- Apply the seven schema files in order to an empty database. The seventh file is currently named sql/007_create_notifications (without .sql). Do not rerun CREATE TABLE scripts against tables that already exist.
- Configure your local .env, including a generated JWT_SECRET. Never commit .env.
- Run npm run typecheck, then npm run dev. Keep the server running.
- Base URL: http://localhost:3000. Set Content-Type: application/json for JSON bodies.
- Create fresh accounts: A (submitter/project owner), B (reviewer to add as member), C (reviewer outside the project), D (disposable submitter for deletion).
- Record the returned IDs; do not assume they start at 1. Keep separate tokens for each account.
- Protected HTTP requests use Authorization: Bearer TOKEN. Tokens expire after one hour; log in again for fresh ones.
- Suggested Postman folders: Health, Authentication, Users, Projects, Submissions, Comments, Reviews, Notifications, Analytics.

## 1. Health and authentication

- [ ] GET /api/health returns 200 and the running message.
- [ ] POST /api/auth/register with name, unique email, password of at least 8 characters and at most 72 UTF-8 bytes, and role returns 201. No password or hash is returned.
- [ ] Repeat the same email with otherwise valid input: 409.
- [ ] Missing name, invalid email, password abc, or role as an array: 400.
- [ ] POST /api/auth/login with correct email/password: 200 with token and public user details.
- [ ] Wrong password or unregistered email: 401. Missing password: 400.
- [ ] GET /api/auth/me: valid token gives 200; absent, fake, or expired token gives 401.

## 2. Profiles

- [ ] GET /api/users/A_ID with A's token returns 200 without a password hash.
- [ ] Access another user's profile with A's token: 403.
- [ ] PUT /api/users/A_ID with name, email, and display_picture_url: null returns 200. GET confirms the update.
- [ ] Invalid email or picture URL: 400. Email already belonging to another account: 409.
- [ ] Updating a profile does not change role even if role is supplied.
- [ ] DELETE /api/users/D_ID with D's token: 204 and no body. Reusing D's token on /api/auth/me: 401.
- [ ] Delete A after creating A's project below: 409 because the project references the account.

## 3. Projects and members

- [ ] A creates P using POST /api/projects with name and optional description: 201.
- [ ] Invalid or blank project name: 400.
- [ ] POST /api/projects/P_ID/members as A with user_id set to B's ID: 201. Repeat: 409.
- [ ] Add a submitter as member: 400. Add a nonexistent user with a valid integer ID: 404.
- [ ] B attempts to add or remove members: 403. Only the owner manages membership.
- [ ] GET /api/projects includes P for A and B, but not C.

## 4. Submissions

Use JSON with project_id, title, code, and optional language and filename. Files are represented as text in code plus filename; this API does not accept multipart file uploads.

- [ ] A creates S using POST /api/submissions: 201 with pending status.
- [ ] Supply code containing leading blank lines, indentation, and trailing newline. GET returns exactly the same code.
- [ ] Empty or whitespace-only code: 400. Invalid project_id: 400. C submitting to P: 403.
- [ ] A and B can GET /api/projects/P_ID/submissions and /api/submissions/S_ID. C receives 403.
- [ ] B sends PUT /api/submissions/S_ID/status with status: in_review: 200.
- [ ] A attempts that change: 403. B tries approved, changes_requested, or pending through this endpoint: 400.
- [ ] Missing status body with B's token: 400, not 500.

## 5. WebSocket setup before feedback

Create a plain WebSocket request, not a Socket.IO request, using a client that supports custom handshake headers (for example Postman).

1. URL: ws://localhost:3000/ws
2. Before connecting, set the header Authorization to Bearer followed by A's current token.
3. Connect. Expect a JSON message with type: connected and userId equal to A's ID.
4. Keep it connected while B performs comments and reviews below.

- [ ] Missing or invalid token is rejected during the handshake with HTTP 401.
- [ ] Wrong WebSocket path is rejected with HTTP 404.
- [ ] A's valid token produces the connected message.
- [ ] A second connection for A also connects; both should receive A's notifications.
- [ ] C may connect with C's valid token but must not receive notifications intended for A.
- [ ] Expired token fails authentication; an existing connection closes with code 1008 when its token expires.

Browser-native WebSocket cannot set this Authorization header. The current interface is intended for a header-capable testing client. It is not a browser-login implementation.

## 6. Comments and notification feed

- [ ] B posts to /api/submissions/S_ID/comments with content and an existing line_number: 201.
- [ ] Omit line_number or send null for a general comment: 201.
- [ ] Zero, fractional, or beyond-last-line numbers: 400. Blank content: 400.
- [ ] A (submitter) cannot comment: 403. C (outside reviewer) cannot comment: 403.
- [ ] A receives a WebSocket event with type: notification and notification.type: comment_added. C receives no copy.
- [ ] GET /api/users/A_ID/notifications as A returns 200 with the saved notification. B requesting A's feed: 403.
- [ ] Disconnect A, add another comment as B, reconnect A. The missed notification exists in the REST feed; reconnect does not automatically replay it.
- [ ] B updates their own comment with PUT /api/comments/COMMENT_ID: 200. Beyond-last-line value: 400.
- [ ] C cannot update or delete B's comment: 403.
- [ ] A removes B from P; B can no longer update or delete their old comment: 403. Re-add B before continuing.
- [ ] B deletes their own comment while a member: 204. GET comments confirms removal.

## 7. Review workflow

- [ ] B approves S with POST /api/submissions/S_ID/approve and optional notes: 200; status becomes approved.
- [ ] GET /api/submissions/S_ID/reviews contains the approval and reviewer ID.
- [ ] A receives review_approved in WebSocket and REST notifications.
- [ ] A and C cannot approve or request changes: 403.
- [ ] notes as a number/object/array or longer than 5000 characters: 400.
- [ ] A review with no body or notes: null succeeds for B without crashing.
- [ ] Create another submission T. B requests changes using POST /api/submissions/T_ID/request-changes: 200, with matching history and changes_requested notification.
- [ ] The status endpoint cannot reset an approved/changes_requested submission to in_review: 409.
- [ ] Submissions with completed reviews cannot be reset through the status endpoint. A code revision/resubmission workflow is not implemented.

## 8. Statistics

- [ ] GET /api/projects/P_ID/stats as A or B: 200. C: 403. Nonexistent valid project ID: 404.
- [ ] With exactly S approved and T changes_requested, percentages are 50 and 50. If you have extra submissions, calculate the expected values from their current statuses.
- [ ] Pending/in_review submissions do not enter that percentage denominator.
- [ ] Reviewer review/comment counts match stored records; joins must not multiply counts.
- [ ] Average review time matches the mean hours from each reviewed submission's creation to its first review record.
- [ ] Tied highest comment counts return all tied submissions.
- [ ] A fresh empty project returns zero counts, null percentages and average review time, and no most-commented submissions.

See project-statistics.md for exact metric definitions.

## 9. Error handling and cleanup

- [ ] URL IDs abc, 1e3, 1.5, 0, -1, and 2147483648 return 400.
- [ ] ID body fields as arrays or objects return 400.
- [ ] Malformed JSON on a JSON endpoint returns JSON 400.
- [ ] Unknown route returns JSON 404.
- [ ] A JSON body larger than Express's default 100 KB limit returns JSON 413.
- [ ] B cannot delete A's submission: 403. A can delete a disposable submission: 204.
- [ ] Deleting that submission removes its related comments, reviews, and notifications through foreign keys.
- [ ] Unexpected failures must not expose stack traces, tokens, passwords, or database details to the client.

There is no project-delete endpoint. Keep any created project data or remove the separate disposable test database manually after testing.

## Results record

| Area | Actual result | Date / evidence |
|---|---|---|
| Authentication | Not run | |
| Profiles | Not run | |
| Projects and membership | Not run | |
| Submissions | Not run | |
| Comments | Not run | |
| Reviews | Not run | |
| REST notifications | Not run | |
| WebSockets | Not run | |
| Statistics | Not run | |
| Error handling | Not run | |

Do not mark Sprint 8 complete until results are recorded and failures fixed. TypeScript compilation alone does not verify SQL execution, access rules, or live delivery.
