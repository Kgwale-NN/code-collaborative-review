import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateSubmission = [
  body("project_id")
    .isInt({ min: 1 })
    .withMessage("Project ID must be a positive integer"),

  body("title")
    .isString()
    .withMessage("Title must be text")
    .bail()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must contain 1 to 200 characters"),

  body("code")
    .isString()
    .withMessage("Code must be text")
    .bail()
    // Inspect a trimmed copy while preserving the original code and line numbers.
    .custom((code: string) => code.trim().length > 0)
    .withMessage("Code cannot be empty"),

  body("language")
    .optional()
    .isString()
    .withMessage("Language must be text")
    .bail()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Language must not exceed 50 characters"),

  body("filename")
    .optional()
    .isString()
    .withMessage("Filename must be text")
    .bail()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Filename must not exceed 255 characters"),

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