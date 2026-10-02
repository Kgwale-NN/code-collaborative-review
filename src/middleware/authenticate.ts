import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  const parts = authorization?.trim().split(/\s+/);

  if (
    !parts ||
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer"
  ) {
    res.status(401).json({
      message: "A Bearer token is required"
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    next(new Error("JWT_SECRET is not configured"));
    return;
  }

  try {
    const payload = jwt.verify(parts[1], secret, {
      algorithms: ["HS256"]
    });

    if (
      typeof payload === "string" ||
      !payload.sub ||
      !/^[1-9]\d*$/.test(payload.sub) ||
      !Number.isSafeInteger(Number(payload.sub)) ||
      (payload.role !== "submitter" && payload.role !== "reviewer")
    ) {
      res.status(401).json({
        message: "Invalid token"
      });
      return;
    }

    req.user = {
      id: Number(payload.sub),
      role: payload.role
    };
  } catch {
    res.status(401).json({
      message: "Invalid or expired token"
    });
    return;
  }

  next();
}