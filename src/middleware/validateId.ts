import type { RequestParamHandler } from "express";

// The schema uses PostgreSQL INTEGER IDs, whose maximum is 2147483647.
export function isDatabaseId(value: unknown): boolean {
  if (typeof value !== "string" && typeof value !== "number") return false;
  if (!/^[1-9]\d*$/.test(String(value))) return false;

  const number = Number(value);
  return Number.isInteger(number) && number <= 2147483647;
}

export const validateIdParam: RequestParamHandler = (
  _req,
  res,
  next,
  value: unknown,
  name: string
) => {
  if (!isDatabaseId(value)) {
    res.status(400).json({
      message: name + " must be a whole number between 1 and 2147483647"
    });
    return;
  }

  next();
};
