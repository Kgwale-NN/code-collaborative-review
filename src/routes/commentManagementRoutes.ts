import { Router } from "express";
import { updateComment, deleteComment } from "../controllers/commentController";
import { authenticate } from "../middleware/authenticate";
import { validateComment } from "../middleware/validateComment";

const router = Router();

router.put("/:id", authenticate, validateComment, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;
