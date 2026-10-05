import { isDatabaseId } from "./validateId";
import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateProjectMember = [
  body("user_id")
    .custom(isDatabaseId)
    .withMessage("User ID must be a whole number between 1 and 2147483647")
    .bail()
    .toInt(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array().map((error) => ({
          message: error.msg
        }))
      });
      return;
    }

    next();
  }
];