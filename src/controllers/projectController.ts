import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function createProject(
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

    const { name, description } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, owner_id, created_at`,
      [name, description ?? null, req.user.id]
    );

    res.status(201).json({
      message: "Project created successfully",
      project: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function listProjects(
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

    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.owner_id, p.created_at,
              u.name as owner_name
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = $1 OR p.id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       )
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      projects: result.rows
    });
  } catch (error) {
    next(error);
  }
}