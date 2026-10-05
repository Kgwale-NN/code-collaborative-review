import jwt from "jsonwebtoken";
import { pool } from "../config/db";

export async function authenticateWebSocket(
  authorization: string | undefined
) {
  const parts = authorization?.trim().split(/\s+/);

  if (
    !parts ||
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer"
  ) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  let payload;

  try {
    payload = jwt.verify(parts[1], secret, {
      algorithms: ["HS256"]
    });
  } catch {
    return null;
  }

  if (
    typeof payload === "string" ||
    !payload.sub ||
    !/^[1-9]\d*$/.test(payload.sub) ||
    !Number.isSafeInteger(Number(payload.sub)) ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  const result = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE id = $1",
    [Number(payload.sub)]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    userId: result.rows[0].id,
    expiresAt: payload.exp * 1000
  };
}
