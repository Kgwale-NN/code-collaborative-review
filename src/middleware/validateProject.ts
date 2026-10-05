import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateProject = [
  body("name")
    .isString()
    .withMessage("Project name must be text")
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage("Project name must contain 1 to 150 characters"),

  body("description")
    .optional({ values: "null" })
    .isString()
    .withMessage("Description must be text")
    .bail()
    .trim(),

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