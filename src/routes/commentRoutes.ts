import { Router } from "express";
import { addComment } from "../controllers/commentController";
import { authenticate } from "../middleware/authenticate";
import { validateComment } from "../middleware/validateComment";

const router = Router();

router.post("/:id/comments", authenticate, validateComment, addComment);

export default router;
