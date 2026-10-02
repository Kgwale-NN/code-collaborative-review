import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({
        message: "User ID must be a positive integer"
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    if (req.user.id !== id) {
      res.status(403).json({
        message: "You may only view your own profile"
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, email, role, display_picture_url, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "User not found"
      });
      return;
    }

    res.status(200).json({
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}