import type { PoolClient } from "pg";

type NotificationType =
  | "comment_added"
  | "review_approved"
  | "changes_requested";

export interface SubmissionNotification {
  id: number;
  user_id: number;
  project_id: number;
  submission_id: number;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: Date;
}

const messages: Record<NotificationType, string> = {
  comment_added: "Someone commented on your submission",
  review_approved: "Your submission was approved",
  changes_requested: "Changes were requested on your submission"
};

export async function createSubmissionNotification(
  client: PoolClient,
  submissionId: number,
  actorId: number,
  type: NotificationType
) {
  const result = await client.query<SubmissionNotification>(
    `INSERT INTO notifications (
       user_id,
       project_id,
       submission_id,
       type,
       message
     )
     SELECT submitter_id, project_id, id, $3, $4
     FROM submissions
     WHERE id = $1 AND submitter_id <> $2
     RETURNING id, user_id, project_id, submission_id,
               type, message, is_read, created_at`,
    [submissionId, actorId, type, messages[type]]
  );

  return result.rows[0] ?? null;
}