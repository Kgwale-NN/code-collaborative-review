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
