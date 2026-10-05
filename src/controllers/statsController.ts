import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function getProjectStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      res.status(400).json({ message: "Project ID must be a positive integer" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }

    const project = await pool.query(
      `SELECT p.id,
              (p.owner_id = $2 OR EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = p.id AND pm.user_id = $2
              )) AS has_access
       FROM projects p WHERE p.id = $1`,
      [projectId, req.user.id]
    );

    if (project.rows.length === 0) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (!project.rows[0].has_access) {
      res.status(403).json({ message: "You must be a member of this project to view statistics" });
      return;
    }

    const [summary, reviewers, mostCommented] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_submissions,
           (COUNT(*) FILTER (WHERE s.status = 'pending'))::int AS pending,
           (COUNT(*) FILTER (WHERE s.status = 'in_review'))::int AS in_review,
           (COUNT(*) FILTER (WHERE s.status = 'approved'))::int AS approved,
           (COUNT(*) FILTER (WHERE s.status = 'changes_requested'))::int AS changes_requested,
           COUNT(first_review.reviewed_at)::int AS reviewed_submissions,
           (AVG(EXTRACT(EPOCH FROM (first_review.reviewed_at - s.created_at))) / 3600)::double precision
             AS average_review_time_hours,
           (100.0 * COUNT(*) FILTER (WHERE s.status = 'approved')
             / NULLIF(COUNT(*) FILTER (WHERE s.status IN ('approved', 'changes_requested')), 0))::double precision
             AS approved_percentage,
           (100.0 * COUNT(*) FILTER (WHERE s.status = 'changes_requested')
             / NULLIF(COUNT(*) FILTER (WHERE s.status IN ('approved', 'changes_requested')), 0))::double precision
             AS changes_requested_percentage
         FROM submissions s
         LEFT JOIN LATERAL (
           SELECT MIN(r.created_at) AS reviewed_at
           FROM reviews r WHERE r.submission_id = s.id
         ) first_review ON TRUE
         WHERE s.project_id = $1`,
        [projectId]
      ),
      pool.query(
        `WITH review_counts AS (
           SELECT r.reviewer_id,
                  COUNT(*)::int AS reviews,
                  (COUNT(*) FILTER (WHERE r.action = 'approved'))::int AS approvals,
                  (COUNT(*) FILTER (WHERE r.action = 'changes_requested'))::int AS change_requests
           FROM reviews r
           JOIN submissions s ON s.id = r.submission_id
           WHERE s.project_id = $1
           GROUP BY r.reviewer_id
         ), comment_counts AS (
           SELECT c.reviewer_id, COUNT(*)::int AS comments
           FROM comments c
           JOIN submissions s ON s.id = c.submission_id
           WHERE s.project_id = $1
           GROUP BY c.reviewer_id
         ), reviewer_ids AS (
           SELECT reviewer_id FROM review_counts
           UNION
           SELECT reviewer_id FROM comment_counts
           UNION
           SELECT u.id FROM users u
           WHERE u.role = 'reviewer' AND (
             EXISTS (SELECT 1 FROM projects p WHERE p.id = $1 AND p.owner_id = u.id)
             OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = u.id)
           )
         )
         SELECT u.id AS reviewer_id, u.name,
                COALESCE(r.reviews, 0) AS reviews,
                COALESCE(r.approvals, 0) AS approvals,
                COALESCE(r.change_requests, 0) AS change_requests,
                COALESCE(c.comments, 0) AS comments,
                (COALESCE(r.reviews, 0)::bigint + COALESCE(c.comments, 0))::double precision AS total_activity
         FROM reviewer_ids ids
         JOIN users u ON u.id = ids.reviewer_id
         LEFT JOIN review_counts r ON r.reviewer_id = u.id
         LEFT JOIN comment_counts c ON c.reviewer_id = u.id
         ORDER BY total_activity DESC, u.id ASC`,
        [projectId]
      ),
      pool.query(
        `WITH comment_totals AS (
           SELECT s.id AS submission_id, s.title, COUNT(c.id)::int AS comment_count
           FROM submissions s
           JOIN comments c ON c.submission_id = s.id
           WHERE s.project_id = $1
           GROUP BY s.id, s.title
         )
         SELECT submission_id, title, comment_count
         FROM comment_totals
         WHERE comment_count = (SELECT MAX(comment_count) FROM comment_totals)
         ORDER BY submission_id ASC`,
        [projectId]
      )
    ]);

    res.status(200).json({
      project_id: projectId,
      summary: summary.rows[0],
      reviewer_activity: reviewers.rows,
      most_commented_submissions: mostCommented.rows
    });
  } catch (error) {
    next(error);
  }
}
