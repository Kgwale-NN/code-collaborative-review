import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const submissionId = Number(req.params.id);

    if (!Number.isSafeInteger(submissionId) || submissionId <= 0) {
      res.status(400).json({
        message: "Submission ID must be a positive integer"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    // Submitters cannot add comments
    if (req.user.role === "submitter") {
      res.status(403).json({
        message: "Only reviewers can add comments"
      });
      return;
    }

    const { content, line_number } = req.body;

    // Get the submission to check project membership
    const submissionCheck = await pool.query(
      "SELECT project_id FROM submissions WHERE id = $1",
      [submissionId]
    );

    if (submissionCheck.rows.length === 0) {
      res.status(404).json({
        message: "Submission not found"
      });
      return;
    }

    const submission = submissionCheck.rows[0];

    // Check if the user is a member of the project
    const memberCheck = await pool.query(
      `SELECT id FROM projects
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [submission.project_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to add comments"
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO comments (submission_id, reviewer_id, content, line_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, submission_id, reviewer_id, content, line_number, created_at`,
      [submissionId, req.user.id, content, line_number ?? null]
    );

    res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function listComments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const submissionId = Number(req.params.id);

    if (!Number.isSafeInteger(submissionId) || submissionId <= 0) {
      res.status(400).json({
        message: "Submission ID must be a positive integer"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    // Get the submission to check project membership
    const submissionCheck = await pool.query(
      "SELECT project_id FROM submissions WHERE id = $1",
      [submissionId]
    );

    if (submissionCheck.rows.length === 0) {
      res.status(404).json({
        message: "Submission not found"
      });
      return;
    }

    const submission = submissionCheck.rows[0];

    // Check if the user is a member of the project
    const memberCheck = await pool.query(
      `SELECT id FROM projects
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [submission.project_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to view comments"
      });
      return;
    }

    const result = await pool.query(
      `SELECT c.id, c.submission_id, c.reviewer_id, c.content, c.line_number, c.created_at, c.updated_at,
              u.name as reviewer_name
       FROM comments c
       JOIN users u ON c.reviewer_id = u.id
       WHERE c.submission_id = $1
       ORDER BY c.created_at ASC`,
      [submissionId]
    );

    res.status(200).json({
      comments: result.rows
    });
  } catch (error) {
    next(error);
  }
}

export async function updateComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const commentId = Number(req.params.id);

    if (!Number.isSafeInteger(commentId) || commentId <= 0) {
      res.status(400).json({
        message: "Comment ID must be a positive integer"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    const { content, line_number } = req.body;

    // Get the comment to check ownership
    const commentCheck = await pool.query(
      `SELECT c.reviewer_id, s.project_id
       FROM comments c
       JOIN submissions s ON s.id = c.submission_id
       WHERE c.id = $1`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      res.status(404).json({
        message: "Comment not found"
      });
      return;
    }

    const comment = commentCheck.rows[0];

    // Only the reviewer who created the comment can update it
    if (req.user.role !== "reviewer" || comment.reviewer_id !== req.user.id) {
      res.status(403).json({
        message: "You can only update your own comments"
      });
      return;
    }

    // Comment ownership does not preserve access after project removal.
    const memberCheck = await pool.query(
      `SELECT id FROM projects
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [comment.project_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to update comments"
      });
      return;
    }

    const result = await pool.query(
      `UPDATE comments
       SET content = $1, line_number = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, submission_id, reviewer_id, content, line_number, created_at, updated_at`,
      [content, line_number ?? null, commentId]
    );

    res.status(200).json({
      message: "Comment updated successfully",
      comment: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const commentId = Number(req.params.id);

    if (!Number.isSafeInteger(commentId) || commentId <= 0) {
      res.status(400).json({
        message: "Comment ID must be a positive integer"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    // Get the comment to check ownership
    const commentCheck = await pool.query(
      `SELECT c.reviewer_id, s.project_id
       FROM comments c
       JOIN submissions s ON s.id = c.submission_id
       WHERE c.id = $1`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      res.status(404).json({
        message: "Comment not found"
      });
      return;
    }

    const comment = commentCheck.rows[0];

    // Only the reviewer who created the comment can delete it
    if (req.user.role !== "reviewer" || comment.reviewer_id !== req.user.id) {
      res.status(403).json({
        message: "You can only delete your own comments"
      });
      return;
    }

    // Comment ownership does not preserve access after project removal.
    const memberCheck = await pool.query(
      `SELECT id FROM projects
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [comment.project_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to delete comments"
      });
      return;
    }

    const result = await pool.query(
      "DELETE FROM comments WHERE id = $1 RETURNING id",
      [commentId]
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
