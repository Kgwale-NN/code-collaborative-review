import { Router } from "express";
import { register } from "../controllers/authController";
import { validateRegistration } from "../middleware/validateRegistration";

const router = Router();

router.post("/register", validateRegistration, register);

export default router;