import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function approveSubmission(
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

    // Only reviewers can approve submissions
    if (req.user.role === "submitter") {
      res.status(403).json({
        message: "Only reviewers can approve submissions"
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
        message: "You must be a member of this project to approve submissions"
      });
      return;
    }

    // Use a transaction to update submission status and add review record
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update submission status
      const result = await client.query(
        `UPDATE submissions
         SET status = 'approved'
         WHERE id = $1
         RETURNING id, project_id, submitter_id, title, code, language, filename, status, created_at`,
        [submissionId]
      );

      // Add review record
      await client.query(
        `INSERT INTO reviews (submission_id, reviewer_id, action, notes)
         VALUES ($1, $2, 'approved', $3)`,
        [submissionId, req.user.id, req.body.notes ?? null]
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: "Submission approved successfully",
        submission: result.rows[0]
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}

export async function requestChanges(
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

    // Only reviewers can request changes
    if (req.user.role === "submitter") {
      res.status(403).json({
        message: "Only reviewers can request changes"
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
        message: "You must be a member of this project to request changes"
      });
      return;
    }

    // Use a transaction to update submission status and add review record
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update submission status
      const result = await client.query(
        `UPDATE submissions
         SET status = 'changes_requested'
         WHERE id = $1
         RETURNING id, project_id, submitter_id, title, code, language, filename, status, created_at`,
        [submissionId]
      );

      // Add review record
      await client.query(
        `INSERT INTO reviews (submission_id, reviewer_id, action, notes)
         VALUES ($1, $2, 'changes_requested', $3)`,
        [submissionId, req.user.id, req.body.notes ?? null]
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: "Changes requested successfully",
        submission: result.rows[0]
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}
