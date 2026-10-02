import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validateRegistration } from "../middleware/validateRegistration";
import { validateLogin } from "../middleware/validateLogin";

const router = Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);

export default router;