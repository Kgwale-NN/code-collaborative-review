import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateRegistration = [
  body("name")
    .isString()
    .withMessage("Name must be text")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must contain 1 to 100 characters"),

  body("email")
    .isString()
    .withMessage("Email must be text")
    .bail()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters")
    .bail()
    .isEmail()
    .withMessage("Provide a valid email address")
    .customSanitizer((email: string) => email.toLowerCase()),

  body("password")
    .isString()
    .withMessage("Password must be text")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters")
    .custom((password: string) => Buffer.byteLength(password, "utf8") <= 72)
    .withMessage("Password must not exceed 72 bytes"),

  body("role")
    .isString()
    .withMessage("Role must be text")
    .bail()
    .isIn(["submitter", "reviewer"])
    .withMessage("Role must be submitter or reviewer"),

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