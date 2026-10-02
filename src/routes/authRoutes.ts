import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validateRegistration } from "../middleware/validateRegistration";
import { validateLogin } from "../middleware/validateLogin";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);

router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    user: req.user
  });
});

export default router;