import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateComment = [
  body("content")
    .isString()
    .withMessage("Content must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Content cannot be empty"),

  body("line_number")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Line number must be a positive integer"),

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
