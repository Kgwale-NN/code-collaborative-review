import { Router } from "express";
import {
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/userController";

import { authenticate } from "../middleware/authenticate";
import { validateProfileUpdate } from "../middleware/validateProfileUpdate";

const router = Router();

router.get("/:id", authenticate, getUserById);

router.put(
  "/:id",
  authenticate,
  validateProfileUpdate,
  updateUser
);

router.delete("/:id", authenticate, deleteUser);

export default router;