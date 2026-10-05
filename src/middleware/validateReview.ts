import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateReview = [
  body("notes")
    .optional({ values: "null" })
    .isString()
    .withMessage("Review notes must be text")
    .bail()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Review notes must not exceed 5000 characters"),

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
