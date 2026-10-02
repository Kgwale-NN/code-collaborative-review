import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const validateProfileUpdate = [
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

  body("display_picture_url")
    .optional({ values: "null" })
    .isString()
    .withMessage("Display picture URL must be text")
    .bail()
    .trim()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
      require_valid_protocol: true
    })
    .withMessage("Provide a valid HTTP or HTTPS picture URL"),

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