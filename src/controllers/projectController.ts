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