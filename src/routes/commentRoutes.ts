import { validateIdParam } from "../middleware/validateId";
import { Router } from "express";
import { addComment, listComments } from "../controllers/commentController";
import { authenticate } from "../middleware/authenticate";
import { validateComment } from "../middleware/validateComment";

const router = Router();

router.param("id", validateIdParam);

router.post("/:id/comments", authenticate, validateComment, addComment);
router.get("/:id/comments", authenticate, listComments);

export default router;
