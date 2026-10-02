import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import jwt from "jsonwebtoken";

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

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, name, email, role, password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password"
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password"
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { role: user.role },
      secret,
      {
        subject: String(user.id),
        expiresIn: "1h",
        algorithm: "HS256"
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}