import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateLogin = [
  body("email")
    .isString()
    .withMessage("Email must be text")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Provide a valid email address")
    .customSanitizer((email: string) => email.toLowerCase()),

  body("password")
    .isString()
    .withMessage("Password must be text")
    .bail()
    .notEmpty()
    .withMessage("Password is required"),

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