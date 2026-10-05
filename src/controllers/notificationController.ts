import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
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

    if (req.user.id !== userId) {
      res.status(403).json({
        message: "You may only view your own notifications"
      });
      return;
    }

    const result = await pool.query(
      `SELECT n.id, n.project_id, n.submission_id,
              n.type, n.message, n.is_read, n.created_at
       FROM notifications n
       JOIN projects p ON p.id = n.project_id
       WHERE n.user_id = $1
         AND (
           p.owner_id = $1
           OR EXISTS (
             SELECT 1
             FROM project_members pm
             WHERE pm.project_id = p.id AND pm.user_id = $1
           )
         )
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json({
      notifications: result.rows
    });
  } catch (error) {
    next(error);
  }
}
