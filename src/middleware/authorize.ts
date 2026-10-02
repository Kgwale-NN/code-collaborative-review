import type { Request, Response, NextFunction } from "express";

type Role = "submitter" | "reviewer";

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication is required"
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "You do not have permission to perform this action"
      });
      return;
    }

    next();
  };
}