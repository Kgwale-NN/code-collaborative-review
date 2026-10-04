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