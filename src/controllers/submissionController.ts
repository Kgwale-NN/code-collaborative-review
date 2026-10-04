import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function createSubmission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    const { project_id, title, code, language, filename } = req.body;

    // Check if the user is a member of the project
    const memberCheck = await pool.query(
      `SELECT id FROM projects 
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [project_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to submit code"
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO submissions (project_id, submitter_id, title, code, language, filename)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, project_id, submitter_id, title, code, language, filename, status, created_at`,
      [project_id, req.user.id, title, code, language ?? null, filename ?? null]
    );

    res.status(201).json({
      message: "Submission created successfully",
      submission: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function listSubmissionsByProject(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      res.status(400).json({
        message: "Project ID must be a positive integer"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    // Check if the user is a member of the project
    const memberCheck = await pool.query(
      `SELECT id FROM projects 
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [projectId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to view submissions"
      });
      return;
    }

    const result = await pool.query(
      `SELECT s.id, s.project_id, s.submitter_id, s.title, s.code, 
              s.language, s.filename, s.status, s.created_at,
              u.name as submitter_name
       FROM submissions s
       JOIN users u ON s.submitter_id = u.id
       WHERE s.project_id = $1
       ORDER BY s.created_at DESC`,
      [projectId]
    );

    res.status(200).json({
      submissions: result.rows
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionById(
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

    const result = await pool.query(
      `SELECT s.id, s.project_id, s.submitter_id, s.title, s.code, 
              s.language, s.filename, s.status, s.created_at,
              u.name as submitter_name
       FROM submissions s
       JOIN users u ON s.submitter_id = u.id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Submission not found"
      });
      return;
    }

    // Check if the user is a member of the project
    const submission = result.rows[0];
    const memberCheck = await pool.query(
      `SELECT id FROM projects 
       WHERE id = $1 AND (owner_id = $2 OR id IN (
         SELECT project_id FROM project_members WHERE user_id = $2
       ))`,
      [submission.project_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({
        message: "You must be a member of this project to view this submission"
      });
      return;
    }

    res.status(200).json({
      submission: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubmissionStatus(
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

    const { status } = req.body;

    const validStatuses = ["pending", "in_review", "approved", "changes_requested"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        message: "Invalid status. Must be one of: pending, in_review, approved, changes_requested"
      });
      return;
    }

    // Get the submission to check project membership
    const submissionCheck = await pool.query(
      "SELECT project_id, submitter_id FROM submissions WHERE id = $1",
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
        message: "You must be a member of this project to update submission status"
      });
      return;
    }

    const result = await pool.query(
      `UPDATE submissions
       SET status = $1
       WHERE id = $2
       RETURNING id, project_id, submitter_id, title, code, language, filename, status, created_at`,
      [status, submissionId]
    );

    res.status(200).json({
      message: "Submission status updated successfully",
      submission: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}