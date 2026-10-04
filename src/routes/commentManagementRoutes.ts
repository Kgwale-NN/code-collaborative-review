import { Router } from "express";
import { updateComment } from "../controllers/commentController";
import { authenticate } from "../middleware/authenticate";
import { validateComment } from "../middleware/validateComment";

const router = Router();

router.put("/:id", authenticate, validateComment, updateComment);

export default router;
