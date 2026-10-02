import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, password, role } = req.body;

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        message: "This email is already registered"
      });
      return;
    }

    next(error);
  }
}