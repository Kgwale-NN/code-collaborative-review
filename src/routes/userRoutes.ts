import { Router } from "express";
import { getUserById } from "../controllers/userController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.get("/:id", authenticate, getUserById);

export default router;